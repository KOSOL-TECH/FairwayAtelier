import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { signUp } from '../../lib/account/auth';
import { claimEmail, confirmUrl, resetUrl, sendAccountEmail, welcomeEmail } from '../../lib/account/email';
import { siteOrigin } from '../../lib/account/guard';
import { background, clientIp, isLocal, json, limited, readJsonObject, startSession } from '../../lib/account/http';
import { privateJourneyEnquiry } from '../../lib/account/private';
import { normaliseAnswers } from '../../lib/account/questions';
import { issueToken } from '../../lib/account/store';
import { getTeamSinks, processEnquiry } from '../../lib/enquiry/handler';

export const prerender = false;

const WELCOME = '/account?welcome=1';

/**
 * Creates a guest account from the last onboarding frame (JoinFlow):
 * `{ name, email, password, answers, marketing }`. The guest is signed in at
 * once; confirming the email is a link in the welcome email and blocks nothing.
 */
export const POST: APIRoute = async ({ request, cookies, url, locals }) => {
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;

  // Honeypot: a hidden field real guests never fill. Pretend success so bots learn nothing.
  if (typeof body.company === 'string' && body.company.trim() !== '') return json(200, { ok: true, next: WELCOME });

  if (await limited(env.SIGNUP_LIMITER, `signup:${clientIp(request)}`)) return json(429, { ok: false, error: 'rate_limited' });
  if (!env.SESSION_SECRET) return json(503, { ok: false, error: 'unavailable' });

  const result = await signUp(env.DB, body);
  if (!result.ok) {
    return 'errors' in result ? json(422, { ok: false, error: 'validation', errors: result.errors }) : json(409, { ok: false, error: 'exists' });
  }

  const origin = siteOrigin(url);
  const send = (to: string, message: Parameters<typeof sendAccountEmail>[2]) =>
    background(locals, sendAccountEmail(env.EMAIL, to, message, { local: isLocal(url) }));

  // The team already started a sheet for this address. Only the owner of the
  // mailbox may open it, so nobody is signed in: they get a link to set a password.
  if ('claim' in result) {
    const token = await issueToken(env.DB, result.claim.id, 'reset_password');
    if (token) await send(result.claim.email, claimEmail(resetUrl(origin, token)));
    return json(200, { ok: true, claim: true });
  }

  await startSession(cookies, result.account, env.SESSION_SECRET);
  // The account exists and the guest is signed in. A welcome email that cannot be
  // sent must not turn that into an error: they can ask for the link from their profile.
  try {
    const token = await issueToken(env.DB, result.account.id, 'confirm_email');
    if (token) await send(result.account.email, welcomeEmail(confirmUrl(origin, token)));
  } catch (err) {
    console.error('[account] welcome email was not sent', err instanceof Error ? err.message : err);
  }
  // On the Private Journeys page, creating the profile is the enquiry: tell the team at once.
  // The profile only says "your request is with our team" if it really is.
  let requested = false;
  if (body.interest === 'private') {
    try {
      await processEnquiry(privateJourneyEnquiry(result.account, normaliseAnswers(body.answers)), getTeamSinks());
      requested = true;
    } catch (err) {
      console.error('[account] private journey request failed', err);
    }
  }
  return json(200, { ok: true, next: requested ? `${WELCOME}&private=1` : WELCOME });
};
