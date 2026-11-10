/**
 * Admin sessions: a cookie holding the email, an expiry and a key derived from
 * the user's current password hash, signed with HMAC-SHA256 using the
 * `SESSION_SECRET` Worker secret. The middleware checks the key against
 * `admin_users` on every admin request, so changing a user's password (or
 * removing the user) signs out all of that user's sessions. Rotating the
 * secret signs everyone out.
 */
import { equalBytes } from './password';

export const SESSION_COOKIE = '__Host-fa_admin';
export const SESSION_HOURS = 12;

const enc = new TextEncoder();
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function sign(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

/**
 * A short, one-way key for a stored password hash. It changes whenever the
 * password does, and reveals nothing about the hash (the cookie is readable).
 */
export async function sessionKeyFor(passwordHash: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`fa-session:${passwordHash}`)));
  return b64url(digest.slice(0, 12));
}

export interface Session {
  email: string;
  /** `sessionKeyFor(password_hash)` when the session was created */
  key: string;
}

export async function createSession(email: string, key: string, secret: string, now = Date.now()): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ email, key, exp: now + SESSION_HOURS * 3600_000 })));
  return `${payload}.${b64url(await sign(payload, secret))}`;
}

/**
 * @returns the session, or null if the cookie is missing, forged, expired or
 * from before keys were added (or no secret is set). The caller must still
 * check `key` against the user's current password hash.
 */
export async function readSession(token: string | undefined, secret: string | undefined, now = Date.now()): Promise<Session | null> {
  if (!token || !secret) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    if (!equalBytes(await sign(payload, secret), unb64url(sig))) return null;
    const { email, key, exp } = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    return typeof email === 'string' && typeof key === 'string' && typeof exp === 'number' && exp > now ? { email, key } : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: SESSION_HOURS * 3600,
};
