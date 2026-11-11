/**
 * Sign-in sessions for guests and the team alike: one cookie holding the
 * account id, the account's session key and the sign-in time (./signed.ts).
 *
 * The middleware compares the key with `accounts.session_key` on every account
 * or admin request. Giving an account a new key (password change or reset,
 * "sign out everywhere", a role change) therefore ends all of its sessions.
 */
import { randomToken, seal, unseal } from './signed';

export const SESSION_COOKIE = '__Host-fa_session';
/** Readable by scripts and holds nothing personal: it only lets cached pages show "Profile" instead of "Sign in". */
export const HINT_COOKIE = 'fa_in';
/**
 * Readable too, holds only "1", and outlives signing out: it says this browser has held a profile, so the
 * site offers it the sign-in page. A browser without it is offered a new profile instead.
 */
export const KNOWN_COOKIE = 'fa_known';
export const SESSION_DAYS = 30;
/** The admin needs a sign-in this recent, as its own sessions did before accounts existed. */
export const ADMIN_FRESH_HOURS = 12;

const PURPOSE = 'session';
const DAY_MS = 86_400_000;

export interface Session {
  /** accounts.id */
  aid: string;
  /** accounts.session_key when the session was created */
  key: string;
  /** When the guest signed in (ms) */
  iat: number;
}

export const newSessionKey = (): string => randomToken(16);

export function createSession(accountId: string, key: string, secret: string, now = Date.now()): Promise<string> {
  return seal(PURPOSE, { aid: accountId, key, iat: now }, secret, SESSION_DAYS * DAY_MS, now);
}

/**
 * @returns the session, or null if the cookie is missing, forged or expired.
 * The caller must still check `key` against the account in D1.
 */
export async function readSession(token: string | undefined, secret: string | undefined, now = Date.now()): Promise<Session | null> {
  const data = await unseal(PURPOSE, token, secret, now);
  if (!data) return null;
  const { aid, key, iat } = data;
  return typeof aid === 'string' && aid && typeof key === 'string' && key && typeof iat === 'number' ? { aid, key, iat } : null;
}

export function isFreshForAdmin(session: Session, now = Date.now()): boolean {
  const age = now - session.iat;
  return age >= 0 && age < ADMIN_FRESH_HOURS * 3_600_000;
}

const MAX_AGE = SESSION_DAYS * 86_400;

/** Lax, not Strict: the cookie must survive the redirect back from Google or Apple. */
export const sessionCookieOptions = { path: '/', httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: MAX_AGE };
export const hintCookieOptions = { path: '/', httpOnly: false, secure: true, sameSite: 'lax' as const, maxAge: MAX_AGE };
export const knownCookieOptions = { path: '/', httpOnly: false, secure: true, sameSite: 'lax' as const, maxAge: 365 * 86_400 };
