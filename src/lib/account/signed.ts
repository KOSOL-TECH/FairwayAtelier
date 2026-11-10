/**
 * Small signed tokens for cookies: `<payload>.<signature>`, where the payload
 * is base64url JSON with an expiry and the signature is HMAC-SHA256 with the
 * `SESSION_SECRET` Worker secret. The cookie is readable by its owner but
 * cannot be altered.
 *
 * The purpose ("session", "oauth") is part of what is signed, so a token made
 * for one use never verifies for another.
 */
import { equalBytes } from '../admin/password';

const enc = new TextEncoder();

export const b64url = (b: Uint8Array): string =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const unb64url = (s: string): Uint8Array =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmac(message: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/** Signs `data` for one purpose, valid for `ttlMs`. */
export async function seal(purpose: string, data: Record<string, unknown>, secret: string, ttlMs: number, now = Date.now()): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ ...data, exp: now + ttlMs })));
  return `${payload}.${b64url(await hmac(`${purpose}.${payload}`, secret))}`;
}

/**
 * @returns the signed data, or null if the token is missing, malformed, forged,
 * expired, made for another purpose, or no secret is set.
 */
export async function unseal(
  purpose: string,
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<Record<string, unknown> | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, sig] = parts;
  try {
    if (!equalBytes(await hmac(`${purpose}.${payload}`, secret), unb64url(sig))) return null;
    const data: unknown = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const { exp } = data as { exp?: unknown };
    return typeof exp === 'number' && exp > now ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** SHA-256 of a string, base64url. Used to store single-use link tokens without keeping the token itself. */
export async function sha256(text: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));
}

/** A random, URL-safe token of `bytes` bytes of entropy. */
export function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
