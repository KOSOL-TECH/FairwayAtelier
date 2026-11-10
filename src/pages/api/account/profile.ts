import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, readJsonObject } from '../../../lib/account/http';
import { completeness, normaliseCore } from '../../../lib/account/profile';
import { nextPrompt, normaliseAnswers, promptView } from '../../../lib/account/questions';
import { answersOf, getAccount, getAnswers, saveAnswers, setMarketing, skipQuestions, updateCore } from '../../../lib/account/store';

export const prerender = false;

/**
 * Saves part of the signed-in guest's own profile:
 * `{ core?, answers?, skipped?, marketing?, source? }`.
 *
 * Only what is listed here can change. `core` is cut down to name, phone and
 * country; `answers` to known questions and options. The role, the email, the
 * confirmed flag and the team's notes are out of reach of this endpoint.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const me = locals.account!;
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;

  const now = new Date();
  // A later-question card says so; everything else is the profile page. Never "team" or "onboarding".
  const source = body.source === 'prompt' ? 'prompt' : 'profile';
  await updateCore(env.DB, me.id, normaliseCore(body.core), now);
  await saveAnswers(env.DB, me.id, normaliseAnswers(body.answers), source, now);
  if (Array.isArray(body.skipped)) {
    await skipQuestions(env.DB, me.id, body.skipped.filter((q): q is string => typeof q === 'string').slice(0, 50), now);
  }
  if (typeof body.marketing === 'boolean') await setMarketing(env.DB, me.id, body.marketing, now);

  const account = await getAccount(env.DB, me.id);
  if (!account) return json(401, { ok: false, error: 'signed_out' });
  const answers = answersOf(await getAnswers(env.DB, me.id));
  return json(200, { ok: true, completeness: completeness(account, answers), next: promptView(nextPrompt(answers)) });
};
