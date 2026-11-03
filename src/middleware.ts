import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { verifyAccessJwt } from './lib/admin/access';

const isAdminPath = (path: string) => /^\/(admin|api\/admin)(\/|$)/.test(path);

/**
 * Guards /admin and /api/admin. Public pages are prerendered and never reach
 * this at request time. In `astro dev` there is no Access in front of the
 * site, so a fixed local identity is used instead.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  if (!isAdminPath(context.url.pathname)) return next();

  const email = import.meta.env.DEV
    ? 'dev@localhost'
    : await verifyAccessJwt(context.request.headers.get('Cf-Access-Jwt-Assertion'), {
        teamDomain: env.ACCESS_TEAM_DOMAIN,
        aud: env.ACCESS_AUD,
      });
  if (!email) {
    return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }

  context.locals.adminEmail = email;
  const res = await next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
});
