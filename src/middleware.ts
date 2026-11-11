import type { APIContext, MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { APPLE_CALLBACK, accessFor, areaOf, isCrossSiteWrite, isPublicPage } from './lib/account/guard';
import { KNOWN_COOKIE, SESSION_COOKIE, isFreshForAdmin, knownCookieOptions, readSession } from './lib/account/session';
import { sessionAccount, type SessionAccount } from './lib/account/store';

/**
 * Public pages are cached at the edge (the Worker cache, `cache` in
 * wrangler.jsonc) for an hour, then served stale for up to a day while they
 * refresh. Every content change in the admin purges them by this tag, so edits
 * still show at once. Weeks drop off within the hour after their first day has
 * passed.
 */
export const CONTENT_TAG = 'content';
const PAGE_CACHE = { maxAge: 3600, swr: 86400, tags: [CONTENT_TAG] };

/**
 * Security headers on every Worker response (static files get the same from
 * public/_headers). The CSP only restricts framing, <base>, form targets and
 * plugins; a script-src policy can follow once the analytics provider (D-03)
 * is known, since Astro islands and the JSON-LD use inline scripts.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

/** For everything outside the public pages: kept out of every cache and out of search engines. */
const PRIVATE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
};

function withHeaders(res: Response, headers: Record<string, string>): Response {
  try {
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
    return res;
  } catch {
    // Some responses (e.g. from fetch) have immutable headers: copy them first.
    const copy = new Response(res.body, res);
    for (const [k, v] of Object.entries(headers)) copy.headers.set(k, v);
    return copy;
  }
}

/**
 * The signed-in account, or null. Besides the cookie's signature and expiry,
 * its session key must still match the account in D1: a password change, a
 * role change, "sign out everywhere" or a deleted account ends every session.
 * If D1 cannot be read (or the accounts tables are missing), nobody is signed
 * in; the public pages do not depend on this.
 */
async function signedIn(context: APIContext): Promise<{ account: SessionAccount; fresh: boolean } | null> {
  const session = await readSession(context.cookies.get(SESSION_COOKIE)?.value, env.SESSION_SECRET);
  if (!session) return null;
  try {
    const account = await sessionAccount(env.DB, session.aid, session.key);
    return account ? { account, fresh: isFreshForAdmin(session) } : null;
  } catch (err) {
    console.error('[account] session check failed', err);
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => withHeaders(await handle(context, next), SECURITY_HEADERS));

async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const path = context.url.pathname;
  const method = context.request.method;

  // A write must come from this site's own pages. Apple's sign-in callback is
  // the one exception: Apple posts it from appleid.apple.com, and the handler
  // checks the `state` value it issued instead.
  if (!(method === 'POST' && path === APPLE_CALLBACK) && isCrossSiteWrite(context.request, context.url)) {
    return new Response(`Cross-site ${method} requests are forbidden`, { status: 403, headers: PRIVATE_HEADERS });
  }

  const area = areaOf(path);

  if (area === 'site') {
    const cacheable = !import.meta.env.DEV && (method === 'GET' || method === 'HEAD') && isPublicPage(path);
    if (cacheable) context.cache.set(PAGE_CACHE);
    const res = await next();
    // Never keep an error page in the edge cache, nor a response that sets a
    // cookie. The cache intent has to be withdrawn: Astro applies its cache
    // headers after this middleware returns and would overwrite a header set here.
    if (cacheable && (res.status >= 500 || res.headers.has('set-cookie') || !context.cookies.headers().next().done)) {
      context.cache.set(false);
      res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    }
    return res;
  }

  // Sign-in pages, a guest's own account, and the admin: personal, never cached.
  const who = await signedIn(context);
  const known = context.cookies.get(KNOWN_COOKIE)?.value === '1';
  if (who) {
    context.locals.account = who.account;
    context.locals.signInFresh = who.fresh;
    // A browser that signed in before this cookie existed gets it now.
    if (!known) context.cookies.set(KNOWN_COOKIE, '1', knownCookieOptions);
  }

  if (area === 'admin' && import.meta.env.DEV) {
    // In `astro dev` the admin opens without signing in, as a fixed local identity.
    context.locals.adminEmail = who?.account.role === 'admin' ? who.account.email : 'dev@localhost';
  } else {
    const access = accessFor(area, path, context.url.search, who?.account ?? null, who?.fresh ?? false, known);
    if (access.kind === 'deny') {
      return new Response(access.status === 401 ? 'Unauthorized' : 'Forbidden', { status: access.status, headers: PRIVATE_HEADERS });
    }
    if (access.kind === 'redirect') return withHeaders(context.redirect(access.to, 303), PRIVATE_HEADERS);
    if (area === 'admin' && who) context.locals.adminEmail = who.account.email;
  }

  const res = await next();

  // A content change saved in the admin may show on a public page: purge them
  // all. Customer sheets never do, so saving one leaves the cache alone.
  if (area === 'admin' && method === 'POST' && res.status < 500 && !import.meta.env.DEV && !path.startsWith('/admin/customers')) {
    try {
      await context.cache.invalidate({ tags: CONTENT_TAG });
    } catch (err) {
      console.error('[cache] purge after admin change failed', err);
    }
  }

  return withHeaders(res, PRIVATE_HEADERS);
}
