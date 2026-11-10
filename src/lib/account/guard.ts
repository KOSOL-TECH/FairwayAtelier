/**
 * Request rules used by src/middleware.ts, kept free of Worker bindings so they can be
 * tested on their own: which part of the site a path belongs to, what the edge
 * may cache, where a sign-in may send someone, and which writes to refuse.
 */
import { SITE_URL } from '../site';

/**
 * admin: the team's tools, admin role only · account: a signed-in guest's own
 * pages and APIs · auth: sign-in and sign-up, open to anyone but never cached ·
 * site: everything else.
 */
export type Area = 'admin' | 'account' | 'auth' | 'site';

const ADMIN = /^\/(admin|api\/admin)(\/|$)/;
const ACCOUNT = /^\/(account|api\/account)(\/|$)/;
const AUTH = /^\/(join|sign-in|sign-out|forgot-password|reset-password|auth)(\/|$)/;

export function areaOf(path: string): Area {
  if (ADMIN.test(path)) return 'admin';
  if (ACCOUNT.test(path)) return 'account';
  if (AUTH.test(path)) return 'auth';
  return 'site';
}

/**
 * Rendered pages that are identical for every visitor, so the edge may cache
 * them. Never the admin, anything about an account, an API, media (cached by
 * its own route) or Astro internals.
 */
export function isPublicPage(path: string): boolean {
  return areaOf(path) === 'site' && !/^\/(api|media)(\/|$)/.test(path) && !path.startsWith('/_');
}

/**
 * Where to go after signing in. Only a path inside the account area or the
 * admin is accepted; anything else (another site, `//host`, `/\host`, control
 * characters, `..`) falls back.
 */
export function safeNext(next: string | null | undefined, fallback = '/account'): string {
  if (!next || next.length > 500) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000- \u007F\\]/.test(next) || next.includes('//') || next.includes('..')) return fallback;
  return /^\/(account|admin)(\/|\?|$)/.test(next) ? next : fallback;
}

/** Apple returns from sign-in with a form post from appleid.apple.com; its `state` value is checked instead. */
export const APPLE_CALLBACK = '/auth/apple/callback';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * True when a state-changing request did not come from this site's own pages.
 * Replaces Astro's `security.checkOrigin` (which only looks at form posts) so
 * the middleware can exempt APPLE_CALLBACK. Browsers always send
 * `Sec-Fetch-Site` or `Origin` on a write; a request with neither is not a
 * browser and carries no cookies to abuse.
 */
export function isCrossSiteWrite(request: Request, url: URL): boolean {
  if (SAFE_METHODS.has(request.method)) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite !== 'same-origin' && fetchSite !== 'none';
  const origin = request.headers.get('origin');
  return origin !== null && origin !== url.origin;
}

/**
 * The origin to build links and redirect URIs from: the production site,
 * whatever host a request claims, or the local server while developing.
 */
export function siteOrigin(url: URL): string {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1' ? url.origin : SITE_URL;
}

export type Access = { kind: 'allow' } | { kind: 'redirect'; to: string } | { kind: 'deny'; status: 401 | 403 };

/**
 * Who may open a path.
 * @param who the signed-in account, or null
 * @param fresh whether the sign-in is recent enough for the admin (`isFreshForAdmin`)
 */
export function accessFor(area: Area, path: string, search: string, who: { role: 'customer' | 'admin' } | null, fresh: boolean): Access {
  if (area === 'site' || area === 'auth') return { kind: 'allow' };
  // APIs answer with a status; pages send the visitor to sign in and bring them back.
  const api = path.startsWith('/api/');
  const signIn = (extra = ''): Access => ({ kind: 'redirect', to: `/sign-in?next=${encodeURIComponent(path + search)}${extra}` });

  if (!who) return api ? { kind: 'deny', status: 401 } : signIn();
  if (area === 'account') return { kind: 'allow' };
  if (who.role !== 'admin') return api ? { kind: 'deny', status: 403 } : { kind: 'redirect', to: '/account' };
  if (!fresh) return api ? { kind: 'deny', status: 401 } : signIn('&again=1');
  return { kind: 'allow' };
}
