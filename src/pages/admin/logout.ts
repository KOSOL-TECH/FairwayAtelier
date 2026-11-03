import type { APIRoute } from 'astro';
import { SESSION_COOKIE, sessionCookieOptions } from '../../lib/admin/session';

export const prerender = false;

/** POST only, so a link on another site cannot sign the user out. */
export const POST: APIRoute = ({ cookies, redirect }) => {
  // Same attributes as when it was set: browsers ignore a __Host- cookie without Secure.
  const { maxAge: _, ...attrs } = sessionCookieOptions;
  cookies.delete(SESSION_COOKIE, attrs);
  return redirect('/admin/login', 303);
};
