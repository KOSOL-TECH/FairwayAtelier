import type { APIRoute } from 'astro';
import { normaliseEnquiry, validateEnquiry } from '../../lib/enquiry/validate';
import { getDateOptions } from '../../lib/enquiry/date-options';
import { processEnquiry } from '../../lib/enquiry/handler';
import { rateLimited } from '../../lib/enquiry/rate-limit';

export const prerender = false;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json(415, { ok: false, error: 'unsupported' });
  }
  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid' });
  }

  // Honeypot: a hidden field real guests never fill. Pretend success so bots learn nothing.
  if (typeof raw.company === 'string' && raw.company.trim() !== '') {
    return json(200, { ok: true });
  }

  if (rateLimited(clientAddress ?? 'unknown')) {
    return json(429, { ok: false, error: 'rate_limited' });
  }

  const fields = normaliseEnquiry(raw);
  const errors = validateEnquiry(fields, await getDateOptions());
  if (Object.keys(errors).length > 0) {
    return json(422, { ok: false, error: 'validation', errors });
  }

  try {
    await processEnquiry(fields);
  } catch (err) {
    console.error('[enquiry] processing failed', err);
    return json(502, { ok: false, error: 'delivery' });
  }
  return json(200, { ok: true });
};
