import type { APIRoute } from 'astro';
import { endSession } from '../lib/account/http';

export const prerender = false;

/** POST only, so a link on another site cannot sign anyone out. Clears the cookies in this browser. */
export const POST: APIRoute = ({ cookies, redirect }) => {
  endSession(cookies);
  return redirect('/sign-in?notice=out', 303);
};

export const GET: APIRoute = ({ redirect }) => redirect('/account', 303);
