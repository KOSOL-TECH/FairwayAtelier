import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, startSession } from '../../../lib/account/http';
import { rotateSessionKey } from '../../../lib/account/store';

export const prerender = false;

/**
 * "Sign out everywhere else": gives the account a new session key, which ends
 * every session, then signs this browser back in.
 *
 * The new session keeps the time of this request as its sign-in time. For an
 * admin that would reopen the 12-hour window without a password, so admins are
 * signed out here too and sign in again.
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  const me = locals.account!;
  if (!env.SESSION_SECRET) return json(401, { ok: false, error: 'signed_out' });
  const key = await rotateSessionKey(env.DB, me.id);
  if (me.role === 'admin') return json(200, { ok: true, signedOut: true });
  await startSession(cookies, { id: me.id, session_key: key }, env.SESSION_SECRET);
  return json(200, { ok: true });
};
