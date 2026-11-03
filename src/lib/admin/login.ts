import { DUMMY_HASH, verifyPassword } from './password';

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
