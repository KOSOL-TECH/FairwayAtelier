import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { siteOrigin } from '../../../lib/account/guard';
import { json, readJsonObject } from '../../../lib/account/http';
import { OAUTH_COOKIE, beginOAuth, enabledProviders, isProvider, oauthCookieOptions } from '../../../lib/account/oauth';

export const prerender = false;

/** The provider named in the URL, if it is one we offer and its secrets are set. */
const available = (provider: string | undefined) =>
  isProvider(provider) && env.SESSION_SECRET && enabledProviders(env).includes(provider) ? provider : null;

/**
 * Starts a Google or Apple sign-in from a plain link (the sign-in page):
 * remembers the sign-in in a signed cookie and sends the guest to the provider.
 */
export const GET: APIRoute = async ({ params, url, cookies }) => {
  const provider = available(params.provider);
  if (!provider) {
    const name = isProvider(params.provider) ? params.provider : '';
    return new Response(null, { status: 303, headers: { Location: `/sign-in?error=unavailable&provider=${name}` } });
  }
  const started = await beginOAuth(provider, env, siteOrigin(url), { next: url.searchParams.get('next') }, env.SESSION_SECRET);
  cookies.set(OAUTH_COOKIE, started.cookie, oauthCookieOptions(provider));
  return new Response(null, { status: 303, headers: { Location: started.url } });
};

/**
 * The same from onboarding (JoinFlow), which also sends the answers given so
 * far: `{ answers, marketing, next }`. They travel in the cookie, not in a URL.
 * Answers with the provider URL for the page to go to (a form post that
 * redirected off-site would be stopped by the `form-action` policy).
 */
export const POST: APIRoute = async ({ params, request, url, cookies }) => {
  const provider = available(params.provider);
  if (!provider) return json(404, { ok: false, error: 'unavailable' });
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;
  const started = await beginOAuth(provider, env, siteOrigin(url), body, env.SESSION_SECRET);
  cookies.set(OAUTH_COOKIE, started.cookie, oauthCookieOptions(provider));
  return json(200, { ok: true, url: started.url });
};
