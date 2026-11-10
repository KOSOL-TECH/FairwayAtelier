import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json } from '../../../lib/account/http';
import { nextPrompt, promptView } from '../../../lib/account/questions';
import { answersOf, getAnswers } from '../../../lib/account/store';

export const prerender = false;

/**
 * The next later question for the signed-in guest (ProfilePrompt), or none.
 * Public pages are cached and identical for everyone, so the browser asks for
 * this after the page has loaded.
 */
export const GET: APIRoute = async ({ locals }) => {
  const me = locals.account!;
  const answers = answersOf(await getAnswers(env.DB, me.id));
  return json(200, { ok: true, firstName: me.first_name, question: promptView(nextPrompt(answers)) });
};
