/**
 * Small helpers shared by the account pages and APIs: JSON in and out, the
 * session cookies, and the rate-limit bindings.
 */
import type { AstroCookies } from 'astro';
import { HINT_COOKIE, SESSION_COOKIE, createSession, hintCookieOptions, sessionCookieOptions } from './session';

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** A profile save is a few hundred bytes; anything far larger is refused before it is parsed. */
export const MAX_BODY = 16 * 1024;

/**
 * Reads a small JSON object from a request body.
 * @returns the object, or the error response to send back instead
 */
export async function readJsonObject(request: Request, max = MAX_BODY): Promise<Record<string, unknown> | Response> {
  if (!request.headers.get('content-type')?.includes('application/json')) return json(415, { ok: false, error: 'unsupported' });
  if (Number(request.headers.get('content-length') ?? 0) > max) return json(413, { ok: false, error: 'too_large' });
  let text: string;
  try {
    text = await request.text();
  } catch {
    return json(400, { ok: false, error: 'invalid' });
  }
  if (text.length > max) return json(413, { ok: false, error: 'too_large' });
  try {
    const body: unknown = JSON.parse(text);
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  return json(400, { ok: false, error: 'invalid' });
}

/** Signs the guest in on this browser: the session cookie, plus the readable sign that cached pages look for. */
export async function startSession(cookies: AstroCookies, account: { id: string; session_key: string }, secret: string, now = Date.now()) {
  cookies.set(SESSION_COOKIE, await createSession(account.id, account.session_key, secret, now), sessionCookieOptions);
  cookies.set(HINT_COOKIE, '1', hintCookieOptions);
}

/** Clears both cookies. Same attributes as when they were set: browsers ignore a `__Host-` cookie without Secure. */
export function endSession(cookies: AstroCookies) {
  const { maxAge: _session, ...session } = sessionCookieOptions;
  const { maxAge: _hint, ...hint } = hintCookieOptions;
  cookies.delete(SESSION_COOKIE, session);
  cookies.delete(HINT_COOKIE, hint);
}

/**
 * Checks one or more keys against a Workers rate-limit binding.
 * @returns true when any key is over its limit. Without the binding (local
 *   development) nothing is limited.
 */
export async function limited(limiter: RateLimit | undefined, ...keys: string[]): Promise<boolean> {
  if (!limiter) return false;
  for (const key of keys) {
    if (!(await limiter.limit({ key })).success) return true;
  }
  return false;
}

export const clientIp = (request: Request): string => request.headers.get('CF-Connecting-IP') ?? 'unknown';

/**
 * Runs work that the response should not wait for (sending an email), keeping
 * the Worker alive until it is done. Without a Workers context it is awaited.
 */
export async function background(locals: App.Locals, work: Promise<unknown>): Promise<void> {
  const ctx = (locals as { cfContext?: ExecutionContext }).cfContext;
  if (ctx) ctx.waitUntil(work);
  else await work;
}

/** Whether this request is to a developer's machine, where emailed links may be printed to the console instead. */
export const isLocal = (url: URL): boolean => url.hostname === 'localhost' || url.hostname === '127.0.0.1';
