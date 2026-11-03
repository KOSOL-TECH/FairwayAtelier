/**
 * Admin password hashing with PBKDF2-SHA256 (Web Crypto, so it runs in the
 * Worker and in Node for scripts/set-admin-password.ts). No imports, so the
 * script can load this file directly.
 *
 * Stored format: pbkdf2-sha256$<iterations>$<salt b64url>$<hash b64url>
 * 100,000 iterations is the most the Workers runtime allows.
 */
const ITERATIONS = 100_000;
const PREFIX = 'pbkdf2-sha256';

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** Compares in constant time, so the response time does not leak how much matched. */
export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${PREFIX}$${ITERATIONS}$${b64url(salt)}$${b64url(await derive(password, salt, ITERATIONS))}`;
}

/** A hash of a random password, for checking unknown emails in the same time as known ones. */
export const DUMMY_HASH = `${PREFIX}$${ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, iter, salt, hash] = stored.split('$');
  const iterations = Number(iter);
  if (prefix !== PREFIX || !Number.isInteger(iterations) || iterations < 1 || iterations > ITERATIONS || !salt || !hash) return false;
  try {
    return equalBytes(await derive(password, unb64url(salt), iterations), unb64url(hash));
  } catch {
    return false;
  }
}

/** Minimum bar for a password chosen in the set-password script. */
export const MIN_PASSWORD_LENGTH = 12;
