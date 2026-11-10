import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { endSession, json, readJsonObject } from '../../../lib/account/http';
import { deleteAccount } from '../../../lib/account/store';

export const prerender = false;

/**
 * Deletes the signed-in guest's own profile: `{ confirm: "DELETE" }`. Their
 * answers and sign-ins go with it. Enquiries they have sent are separate
 * records, kept as the privacy policy describes.
 *
 * An admin cannot delete their own account, so there is always one left to
 * manage the others; another admin removes the role first.
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const me = locals.account!;
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;
  if (body.confirm !== 'DELETE') return json(422, { ok: false, error: 'validation' });
  if (me.role === 'admin') return json(403, { ok: false, error: 'admin' });
  await deleteAccount(env.DB, me.id);
  endSession(cookies);
  return json(200, { ok: true });
};
