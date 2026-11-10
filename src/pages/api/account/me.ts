import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json } from '../../../lib/account/http';
import { getAccount } from '../../../lib/account/store';

export const prerender = false;

/** The signed-in guest's contact details, to fill in the enquiry form for them. */
export const GET: APIRoute = async ({ locals }) => {
  const account = await getAccount(env.DB, locals.account!.id);
  if (!account) return json(401, { ok: false, error: 'signed_out' });
  return json(200, {
    ok: true,
    name: [account.first_name, account.last_name].filter(Boolean).join(' '),
    email: account.email,
    phone: account.phone,
  });
};
