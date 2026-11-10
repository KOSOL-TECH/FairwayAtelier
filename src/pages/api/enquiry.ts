import type { APIRoute } from 'astro';
import { normaliseEnquiry, submissionId, validateEnquiry } from '../../lib/enquiry/validate';
import { getDateOptions } from '../../lib/enquiry/date-options';
import { processEnquiry } from '../../lib/enquiry/handler';
import { rateLimited } from '../../lib/enquiry/rate-limit';

export const prerender = false;

const MAX_BODY = 16 * 1024;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json(415, { ok: false, error: 'unsupported' });
  }
  // A real enquiry is a few KB at most; refuse anything far larger before parsing it.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
    return json(413, { ok: false, error: 'too_large' });
  }
  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return json(413, { ok: false, error: 'too_large' });
    raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not an object');
  } catch {
    return json(400, { ok: false, error: 'invalid' });
  }

  // Honeypot: a hidden field real guests never fill. Pretend success so bots learn nothing.
  if (typeof raw.company === 'string' && raw.company.trim() !== '') {
    return json(200, { ok: true });
  }

  if (await rateLimited(clientAddress ?? 'unknown')) {
    return json(429, { ok: false, error: 'rate_limited' });
  }

  const fields = normaliseEnquiry(raw);
  const errors = validateEnquiry(fields, await getDateOptions());
  if (Object.keys(errors).length > 0) {
    return json(422, { ok: false, error: 'validation', errors });
  }

  try {
    await processEnquiry(fields, undefined, submissionId(raw));
  } catch (err) {
    console.error('[enquiry] processing failed', err);
    return json(502, { ok: false, error: 'delivery' });
  }
  return json(200, { ok: true });
};
