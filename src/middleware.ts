import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { SESSION_COOKIE, readSession } from './lib/admin/session';

const isAdminPath = (path: string) => /^\/(admin|api\/admin)(\/|$)/.test(path);
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login']);

/**
 * Guards /admin and /api/admin with the password session (src/lib/admin/session.ts).
 * Public pages are prerendered and never reach this at request time. In
 * `astro dev` a fixed local identity is used, so no password is needed.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (!isAdminPath(path)) return next();

  const email = import.meta.env.DEV
    ? 'dev@localhost'
    : await readSession(context.cookies.get(SESSION_COOKIE)?.value, env.SESSION_SECRET);

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
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
});
