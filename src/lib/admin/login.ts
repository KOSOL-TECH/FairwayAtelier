import { DUMMY_HASH, verifyPassword } from './password';
import { sessionKeyFor } from './session';

/**
 * The session key for a user's current password, or null if the user no
 * longer exists. A session whose key differs was created before the password
 * last changed, so it is no longer valid.
 */
export async function currentSessionKey(db: D1Database, email: string): Promise<string | null> {
  const row = await db.prepare('SELECT password_hash FROM admin_users WHERE email = ?').bind(email).first<{ password_hash: string }>();
  return row ? sessionKeyFor(row.password_hash) : null;
}

/**
 * Checks an email and password against `admin_users`.
 * Unknown emails are checked against a dummy hash, so they take as long as
 * known ones and the response does not reveal which emails exist.
 * @returns the normalised email on success, otherwise null.
 */
export async function authenticate(db: D1Database, email: string, password: string): Promise<string | null> {
  const normalised = email.trim().toLowerCase();
  if (!normalised || !password) return null;
  const row = await db.prepare('SELECT password_hash FROM admin_users WHERE email = ?').bind(normalised).first<{ password_hash: string }>();
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  return ok && row ? normalised : null;
}

/** Only same-site admin paths are allowed as the post-login destination. */
export function safeNext(next: string | null): string {
  return next && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith('//') ? next : '/admin';
}
