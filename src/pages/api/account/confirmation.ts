import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { confirmUrl, sendAccountEmail, welcomeEmail } from '../../../lib/account/email';
import { siteOrigin } from '../../../lib/account/guard';
import { background, clientIp, isLocal, json, limited } from '../../../lib/account/http';
import { issueToken } from '../../../lib/account/store';

export const prerender = false;

/**
 * Sends the signed-in guest a new link to confirm their email address. Only
 * ever to the account's own address; `issueToken` stops after a few a day.
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
  const me = locals.account!;
  if (me.email_verified) return json(200, { ok: true });
  if (await limited(env.SIGNUP_LIMITER, `confirm:${clientIp(request)}`, `confirm-account:${me.id}`)) {
    return json(429, { ok: false, error: 'rate_limited' });
  }
  const token = await issueToken(env.DB, me.id, 'confirm_email');
  if (!token) return json(429, { ok: false, error: 'rate_limited' });
  const message = welcomeEmail(confirmUrl(siteOrigin(url), token));
  await background(locals, sendAccountEmail(env.EMAIL, me.email, message, { local: isLocal(url) }));
  return json(200, { ok: true });
};
