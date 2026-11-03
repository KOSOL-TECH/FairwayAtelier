/**
 * Admin sessions: a cookie holding the email and an expiry, signed with
 * HMAC-SHA256 using the `SESSION_SECRET` Worker secret. Nothing is stored
 * server-side; rotating the secret signs everyone out.
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

export async function createSession(email: string, secret: string, now = Date.now()): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ email, exp: now + SESSION_HOURS * 3600_000 })));
  return `${payload}.${b64url(await sign(payload, secret))}`;
}

/** @returns the session's email, or null if the cookie is missing, forged or expired (or no secret is set). */
export async function readSession(token: string | undefined, secret: string | undefined, now = Date.now()): Promise<string | null> {
  if (!token || !secret) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    if (!equalBytes(await sign(payload, secret), unb64url(sig))) return null;
    const { email, exp } = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    return typeof email === 'string' && typeof exp === 'number' && exp > now ? email : null;
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
