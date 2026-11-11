import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, limited } from '../../../lib/account/http';
import { privateJourneyEnquiry } from '../../../lib/account/private';
import { answersOf, getAccount, getAnswers } from '../../../lib/account/store';
import { getTeamSinks, processEnquiry } from '../../../lib/enquiry/handler';

export const prerender = false;

/**
 * A signed-in guest asks for a private journey from the Private Journeys page:
 * one tap, no form. The request goes to the team's inbox with what their
 * profile already says.
 */
export const POST: APIRoute = async ({ locals }) => {
  const me = locals.account!;
  // One request is enough; this stops a stuck button or a script from filling the inbox.
  if (await limited(env.ENQUIRY_LIMITER, `private:${me.id}`)) return json(429, { ok: false, error: 'rate_limited' });
  const account = await getAccount(env.DB, me.id);
  if (!account) return json(401, { ok: false, error: 'signed_out' });
  try {
    await processEnquiry(privateJourneyEnquiry(account, answersOf(await getAnswers(env.DB, me.id))), getTeamSinks());
  } catch (err) {
    console.error('[account] private journey request failed', err);
    return json(502, { ok: false, error: 'delivery' });
  }
  return json(200, { ok: true });
};
