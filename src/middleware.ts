import type { APIContext, MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { SESSION_COOKIE, readSession } from './lib/admin/session';
import { currentSessionKey } from './lib/admin/login';

const isAdminPath = (path: string) => /^\/(admin|api\/admin)(\/|$)/.test(path);
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login']);

/**
 * Public pages are cached at the edge (the Worker cache, `cache` in
 * wrangler.jsonc) for an hour, then served stale for up to a day while they
 * refresh. Every admin change purges them by this tag, so edits still show at
 * once. Weeks drop off within the hour after their first day has passed.
 */
export const CONTENT_TAG = 'content';
const PAGE_CACHE = { maxAge: 3600, swr: 86400, tags: [CONTENT_TAG] };

/** Rendered pages anyone can see: not the admin, the APIs, media (cached by its own route) or Astro internals. */
const isPublicPage = (path: string) => !/^\/(admin|api|media)(\/|$)/.test(path) && !path.startsWith('/_');

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

function secure(res: Response): Response {
  try {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  } catch {
    // Some responses (e.g. from fetch) have immutable headers: copy them first.
    const copy = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) copy.headers.set(k, v);
    return copy;
  }
}

/**
 * The signed-in admin, or null. Besides the signature and expiry, the session's
 * key must still match the user's password in D1: a password change or a removed
 * user ends every existing session.
 */
async function signedInEmail(token: string | undefined): Promise<string | null> {
  const session = await readSession(token, env.SESSION_SECRET);
  if (!session) return null;
  try {
    return (await currentSessionKey(env.DB, session.email)) === session.key ? session.email : null;
  } catch (err) {
    console.error('[admin] session check failed', err);
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => secure(await handle(context, next)));

async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  const path = context.url.pathname;
  const method = context.request.method;

  if (!isAdminPath(path)) {
    const cacheable = !import.meta.env.DEV && (method === 'GET' || method === 'HEAD') && isPublicPage(path);
    if (cacheable) context.cache.set(PAGE_CACHE);
    const res = await next();
    // Never keep an error page in the edge cache.
    if (cacheable && res.status >= 500) res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    return res;
  }

  // /admin and /api/admin: password session (src/lib/admin/session.ts). In
  // `astro dev` a fixed local identity is used, so no password is needed.
  const email = import.meta.env.DEV ? 'dev@localhost' : await signedInEmail(context.cookies.get(SESSION_COOKIE)?.value);

  if (!email && !PUBLIC_ADMIN_PATHS.has(path)) {
    if (path.startsWith('/api/')) {
      return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    }
    const login = new URL('/admin/login', context.url);
    login.searchParams.set('next', path + context.url.search);
    return context.redirect(login.pathname + login.search, 303);
  }

  if (email) context.locals.adminEmail = email;
  const res = await next();

  // Any change saved in the admin may show on a public page: purge them all.
  if (email && method === 'POST' && res.status < 500 && !import.meta.env.DEV) {
    try {
      await context.cache.invalidate({ tags: CONTENT_TAG });
    } catch (err) {
      console.error('[cache] purge after admin change failed', err);
    }
  }

  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}
