/**
 * Email and password: sign-up, sign-in, reset, email confirmation. No second
 * factor and no emailed codes (client decision, docs/accounts.md).
 */
import { DUMMY_HASH, MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from '../admin/password';
import { MIN_PASSWORD, normaliseEmail, splitName } from './profile';
import { normaliseAnswers } from './questions';
import {
  consumeToken, createAccount, getAccount, getAccountByEmail, issueToken, markEmailVerified, peekToken, providersOf, recordSignIn,
  saveAnswers, setPassword, type AccountRow, type Role,
} from './store';

export { MIN_PASSWORD };
const MAX_PASSWORD = 200;

/** Why a password is not acceptable, or null if it is. Admins keep the longer minimum they have always had. */
export function passwordProblem(password: unknown, role: Role = 'customer'): string | null {
  const min = role === 'admin' ? MIN_PASSWORD_LENGTH : MIN_PASSWORD;
  if (typeof password !== 'string' || !password) return 'Please choose a password.';
  if (password.length < min) return `Please use at least ${min} characters.`;
  if (password.length > MAX_PASSWORD) return `Please use at most ${MAX_PASSWORD} characters.`;
  return null;
}

export type SignUpErrors = Partial<Record<'name' | 'email' | 'password', string>>;

export type SignUpResult =
  /** created; the guest is signed in */
  | { ok: true; account: AccountRow }
  /** the team already started a sheet for this address: email a link to claim it, sign nobody in */
  | { ok: true; claim: AccountRow }
  | { ok: false; errors: SignUpErrors }
  /** the address already has an account, which is left untouched */
  | { ok: false; exists: true };

/**
 * Creates a guest account from the last onboarding frame.
 * @param raw untrusted `{ name, email, password, answers, marketing }`
 */
export async function signUp(db: D1Database, raw: unknown, now = new Date()): Promise<SignUpResult> {
  const body = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const name = splitName(typeof body.name === 'string' ? body.name : '');
  const email = normaliseEmail(body.email);
  const errors: SignUpErrors = {};
  if (!name.first_name) errors.name = 'Please tell us your name.';
  if (!email) errors.email = 'Please check this email address.';
  const weak = passwordProblem(body.password);
  if (weak) errors.password = weak;
  if (Object.keys(errors).length) return { ok: false, errors };

  const existing = await getAccountByEmail(db, email);
  if (existing) {
    const unclaimed = !existing.password_hash && !existing.last_seen_at && (await providersOf(db, existing.id)).length === 0;
    return unclaimed ? { ok: true, claim: existing } : { ok: false, exists: true };
  }

  const account = await createAccount(
    db,
    {
      email,
      passwordHash: await hashPassword(body.password as string),
      firstName: name.first_name,
      lastName: name.last_name,
      marketing: body.marketing === true,
      signedIn: true,
    },
    now,
  );
  // Lost a race with another sign-up for the same address.
  if (!account) return { ok: false, exists: true };
  // The account exists from here on. If the answers cannot be saved, the guest
  // still gets their profile (a retry would only be told the address is taken).
  try {
    await saveAnswers(db, account.id, normaliseAnswers(body.answers), 'onboarding', now);
  } catch (err) {
    console.error('[account] onboarding answers were not saved', err);
  }
  return { ok: true, account };
}

/**
 * Checks an email and password. Unknown emails and accounts without a password
 * are checked against a dummy hash, so they take as long as real ones and the
 * answer does not reveal which addresses have an account.
 */
export async function signIn(db: D1Database, email: unknown, password: unknown): Promise<AccountRow | null> {
  const normalised = normaliseEmail(email);
  if (!normalised || typeof password !== 'string' || !password) return null;
  const account = await getAccountByEmail(db, normalised);
  const ok = await verifyPassword(password.slice(0, 1024), account?.password_hash ?? DUMMY_HASH);
  return ok && account?.password_hash ? account : null;
}

/**
 * Starts a password reset: the caller emails the token to the account's
 * address and tells the visitor the same thing whether or not anything was
 * sent. Admins are left out: their password is only set with
 * scripts/set-admin-password.mjs, so a taken-over mailbox cannot open the admin.
 * @returns null when no email should go out (unknown address, an admin, or the daily limits)
 */
export async function requestPasswordReset(db: D1Database, email: unknown, now = new Date()): Promise<{ account: AccountRow; token: string } | null> {
  const account = await getAccountByEmail(db, normaliseEmail(email));
  if (!account || account.role === 'admin') return null;
  const token = await issueToken(db, account.id, 'reset_password', now);
  return token ? { account, token } : null;
}

export type ResetResult = { ok: true; account: AccountRow } | { ok: false; error: 'token' | 'password'; message: string };

const BAD_LINK = 'This link has expired or was already used. Please ask for a new one.';

/**
 * Completes a reset. Opening the link proves control of the mailbox, so the
 * email is confirmed too; every earlier session ends.
 */
export async function resetPassword(db: D1Database, token: unknown, password: unknown, now = new Date()): Promise<ResetResult> {
  const value = typeof token === 'string' ? token : '';
  const accountId = await peekToken(db, value, 'reset_password', now);
  const account = accountId ? await getAccount(db, accountId) : null;
  if (!account || account.role === 'admin') return { ok: false, error: 'token', message: BAD_LINK };

  // Checked before the link is used up, so a too-short password does not cost the guest their link.
  const weak = passwordProblem(password);
  if (weak) return { ok: false, error: 'password', message: weak };
  // Hashed before the link is used up, so a failure here does not cost the guest their link either.
  const hash = await hashPassword(password as string);
  if ((await consumeToken(db, value, 'reset_password', now)) !== account.id) return { ok: false, error: 'token', message: BAD_LINK };

  await setPassword(db, account.id, hash, now);
  await markEmailVerified(db, account.id, now);
  await recordSignIn(db, account.id, now);
  return { ok: true, account: (await getAccount(db, account.id))! };
}

/**
 * Confirms an email address. The link only counts for the account it was sent
 * to, and only while that account is signed in: a stranger who registered
 * someone else's address cannot get it confirmed by the real owner's click.
 */
export async function confirmEmail(db: D1Database, token: unknown, signedInAccountId: string, now = new Date()): Promise<boolean> {
  const value = typeof token === 'string' ? token : '';
  if ((await peekToken(db, value, 'confirm_email', now)) !== signedInAccountId) return false;
  if ((await consumeToken(db, value, 'confirm_email', now)) !== signedInAccountId) return false;
  await markEmailVerified(db, signedInAccountId, now);
  return true;
}

export type ChangePasswordResult = { ok: true; key: string } | { ok: false; field: 'current' | 'next'; message: string };

/**
 * Changes the password from the profile. An account with no password yet
 * (Google or Apple) may set its first one without a current password.
 * @returns the account's new session key: re-issue the caller's own session with it.
 */
export async function changePassword(db: D1Database, account: AccountRow, current: unknown, next: unknown, now = new Date()): Promise<ChangePasswordResult> {
  if (account.password_hash) {
    const ok = typeof current === 'string' && current !== '' && (await verifyPassword(current.slice(0, 1024), account.password_hash));
    if (!ok) return { ok: false, field: 'current', message: 'That is not your current password.' };
  }
  const weak = passwordProblem(next, account.role);
  if (weak) return { ok: false, field: 'next', message: weak };
  return { ok: true, key: await setPassword(db, account.id, await hashPassword(next as string), now) };
}
