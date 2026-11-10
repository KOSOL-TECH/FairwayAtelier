import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { changePassword } from '../../../lib/account/auth';
import { json, limited, readJsonObject, startSession } from '../../../lib/account/http';
import { getAccount } from '../../../lib/account/store';

export const prerender = false;

/**
 * Changes the signed-in guest's password, or sets a first one for a guest who
 * signed up with Google or Apple: `{ current, next }`. Every other session of
 * the account ends; this browser gets a new one.
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const me = locals.account!;
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;
  // A brake on guessing the current password from a browser left signed in.
  if (await limited(env.LOGIN_LIMITER, `password:${me.id}`)) return json(429, { ok: false, error: 'rate_limited' });

  const account = await getAccount(env.DB, me.id);
  if (!account || !env.SESSION_SECRET) return json(401, { ok: false, error: 'signed_out' });

  const result = await changePassword(env.DB, account, body.current, body.next);
  if (!result.ok) return json(422, { ok: false, error: 'validation', field: result.field, message: result.message });

  await startSession(cookies, { id: account.id, session_key: result.key }, env.SESSION_SECRET);
  return json(200, { ok: true });
};
