import type { APIContext, APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { siteOrigin } from '../../../lib/account/guard';
import { clientIp, limited, startSession } from '../../../lib/account/http';
import { OAUTH_COOKIE, completeOAuth, enabledProviders, isProvider, oauthCookieOptions } from '../../../lib/account/oauth';

export const prerender = false;

const to = (location: string) => new Response(null, { status: 303, headers: { Location: location } });

/**
 * Where Google and Apple send the guest back after a sign-in. All the checks
 * are in `completeOAuth` (src/lib/account/oauth.ts): the state must match the
 * signed cookie this browser was given, the code is swapped for an ID token,
 * and the token is verified before any account is opened.
 */
async function finish(context: APIContext, params: { code?: string; state?: string; error?: string; user?: string }): Promise<Response> {
  const provider = context.params.provider;
  const fail = (code: string) => to(`/sign-in?error=${code}&provider=${isProvider(provider) ? provider : ''}`);
  if (!isProvider(provider) || !env.SESSION_SECRET || !enabledProviders(env).includes(provider)) return fail('unavailable');

  // The sign-in cookie is used once, whatever the outcome.
  const cookie = context.cookies.get(OAUTH_COOKIE)?.value;
  const { maxAge: _maxAge, ...attributes } = oauthCookieOptions(provider);
  context.cookies.delete(OAUTH_COOKIE, attributes);

  if (await limited(env.LOGIN_LIMITER, `oauth:${clientIp(context.request)}`)) return fail('failed');

  const { outcome, next } = await completeOAuth(
    // Wrapped so the Workers runtime sees `fetch` called on the global, not on this object.
    { db: env.DB, env, origin: siteOrigin(context.url), secret: env.SESSION_SECRET, fetch: (input, init) => fetch(input, init) },
    provider,
    params,
    cookie,
  );
  if (!outcome.ok) return fail(outcome.error);

  await startSession(context.cookies, outcome.account, env.SESSION_SECRET);
  return to(next);
}

/** Google returns with a redirect, its answer in the query. */
export const GET: APIRoute = (context) => {
  const query = context.url.searchParams;
  const value = (name: string) => query.get(name)?.slice(0, 4000) || undefined;
  return finish(context, { code: value('code'), state: value('state'), error: value('error') });
};

/**
 * Apple returns with a form posted from appleid.apple.com, which is why the
 * middleware lets this one cross-site post through. The `user` field (the
 * guest's name) is sent only the first time they sign in.
 */
export const POST: APIRoute = async (context) => {
  if (context.params.provider !== 'apple') return new Response('Not found', { status: 404 });
  const form = await context.request.formData().catch(() => null);
  const value = (name: string) => {
    const field = form?.get(name);
    return typeof field === 'string' && field ? field.slice(0, 4000) : undefined;
  };
  return finish(context, { code: value('code'), state: value('state'), error: value('error'), user: value('user') });
};
