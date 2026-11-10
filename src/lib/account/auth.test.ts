import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../admin/password';
import { accountsDb } from '../test/d1';
import { changePassword, confirmEmail, passwordProblem, requestPasswordReset, resetPassword, signIn, signUp } from './auth';
import {
  addIdentity, answersOf, createAccount, getAccount, getAccountByEmail, getAnswers, issueToken, markEmailVerified, sessionAccount, setRole,
} from './store';

const now = new Date('2026-11-10T12:00:00.000Z');
const later = (ms: number) => new Date(now.getTime() + ms);
const GOOD = 'a-good-password';

const form = (extra: Record<string, unknown> = {}) => ({
  name: 'Anne Martin', email: 'Anne@Example.com', password: GOOD, answers: { golf_level: 'mid', party: 'friends' }, marketing: false, ...extra,
});

async function signedUp(db: D1Database, extra: Record<string, unknown> = {}) {
  const result = await signUp(db, form(extra), now);
  if (!result.ok || !('account' in result)) throw new Error('sign-up failed');
  return result.account;
}

describe('passwordProblem', () => {
  it('asks guests for 8 characters and admins for 12', () => {
    expect(passwordProblem('1234567')).toMatch(/8/);
    expect(passwordProblem('12345678')).toBeNull();
    expect(passwordProblem('12345678901', 'admin')).toMatch(/12/);
    expect(passwordProblem('123456789012', 'admin')).toBeNull();
  });

  it('refuses nothing, non-text and absurdly long values', () => {
    expect(passwordProblem('')).not.toBeNull();
    expect(passwordProblem(undefined)).not.toBeNull();
    expect(passwordProblem(12345678)).not.toBeNull();
    expect(passwordProblem('x'.repeat(201))).not.toBeNull();
  });
});

describe('signUp', () => {
  it('creates a signed-in guest with their onboarding answers', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1, { marketing: true });
    expect(account).toMatchObject({
      email: 'anne@example.com', first_name: 'Anne', last_name: 'Martin', role: 'customer', email_verified: 0,
      marketing_opt_in: 1, last_seen_at: now.toISOString(),
    });
    expect(await verifyPassword(GOOD, account.password_hash!)).toBe(true);
    const answers = await getAnswers(d1, account.id);
    expect(answersOf(answers)).toEqual({ golf_level: 'mid', party: 'friends' });
    expect(answers.every((a) => a.source === 'onboarding')).toBe(true);
  });

  it('works with no answers at all (every question skipped)', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1, { answers: undefined });
    expect(await getAnswers(d1, account.id)).toEqual([]);
  });

  it('drops answers it does not recognise', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1, { answers: { golf_level: 'wizard', made_up: 'x', tier: 'signature' } });
    expect(answersOf(await getAnswers(d1, account.id))).toEqual({ tier: 'signature' });
  });

  it('says which fields need attention, and creates nothing', async () => {
    const { d1 } = accountsDb();
    const result = await signUp(d1, form({ name: '  ', email: 'not-an-email', password: 'short' }), now);
    expect(result).toEqual({ ok: false, errors: { name: expect.any(String), email: expect.any(String), password: expect.any(String) } });
    expect(await getAccountByEmail(d1, 'anne@example.com')).toBeNull();
  });

  it('survives input that is not a form at all', async () => {
    const { d1 } = accountsDb();
    for (const bad of [null, 'x', 7, []]) expect((await signUp(d1, bad, now)).ok).toBe(false);
  });

  it('never changes an account that already exists', async () => {
    const { d1 } = accountsDb();
    const first = await signedUp(d1);
    const result = await signUp(d1, form({ name: 'Mallory', password: 'another-password', answers: { tier: 'standard' } }), later(1000));
    expect(result).toEqual({ ok: false, exists: true });
    expect(await getAccount(d1, first.id)).toEqual(first);
    expect(answersOf(await getAnswers(d1, first.id))).toEqual({ golf_level: 'mid', party: 'friends' });
  });

  it('never adds a password to an account that signs in with Google or Apple', async () => {
    const { d1 } = accountsDb();
    const google = (await createAccount(d1, { email: 'anne@example.com', emailVerified: true, signedIn: true }, now))!;
    await addIdentity(d1, 'google', 'sub-1', google.id, 'anne@example.com');
    expect(await signUp(d1, form(), later(1000))).toEqual({ ok: false, exists: true });
    expect((await getAccount(d1, google.id))?.password_hash).toBeNull();
  });

  it('does not hand over a sheet the team started: the guest claims it by email instead', async () => {
    const { d1 } = accountsDb();
    const sheet = (await createAccount(d1, { email: 'anne@example.com', firstName: 'Anne' }, now))!;
    const result = await signUp(d1, form(), later(1000));
    expect(result).toEqual({ ok: true, claim: sheet });
    expect((await getAccount(d1, sheet.id))?.password_hash).toBeNull();
    expect(await getAnswers(d1, sheet.id)).toEqual([]);
    expect(await signIn(d1, 'anne@example.com', GOOD)).toBeNull();
  });
});

describe('signIn', () => {
  it('accepts the right password, whatever the case of the email', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    expect((await signIn(d1, ' ANNE@example.com', GOOD))?.id).toBe(account.id);
  });

  it('refuses a wrong password and an unknown email alike', async () => {
    const { d1 } = accountsDb();
    await signedUp(d1);
    expect(await signIn(d1, 'anne@example.com', 'wrong-password')).toBeNull();
    expect(await signIn(d1, 'nobody@example.com', GOOD)).toBeNull();
    expect(await signIn(d1, 'anne@example.com', '')).toBeNull();
    expect(await signIn(d1, undefined, undefined)).toBeNull();
  });

  it('never signs in to an account that has no password', async () => {
    const { d1 } = accountsDb();
    await createAccount(d1, { email: 'google-only@example.com', emailVerified: true, signedIn: true }, now);
    for (const guess of ['', 'null', 'undefined', GOOD]) expect(await signIn(d1, 'google-only@example.com', guess)).toBeNull();
  });
});

describe('password reset', () => {
  it('sets a new password, confirms the email and ends every earlier session', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    const request = (await requestPasswordReset(d1, 'Anne@example.com', later(1000)))!;
    expect(request.account.id).toBe(account.id);

    const result = await resetPassword(d1, request.token, 'a-brand-new-password', later(2000));
    if (!result.ok) throw new Error(result.message);
    expect(result.account).toMatchObject({ id: account.id, email_verified: 1, last_seen_at: later(2000).toISOString() });
    expect(await sessionAccount(d1, account.id, account.session_key)).toBeNull();
    expect(await signIn(d1, 'anne@example.com', GOOD)).toBeNull();
    expect((await signIn(d1, 'anne@example.com', 'a-brand-new-password'))?.id).toBe(account.id);
  });

  it('works only once', async () => {
    const { d1 } = accountsDb();
    await signedUp(d1);
    const { token } = (await requestPasswordReset(d1, 'anne@example.com', now))!;
    expect((await resetPassword(d1, token, 'a-brand-new-password', later(1000))).ok).toBe(true);
    expect(await resetPassword(d1, token, 'yet-another-password', later(2000))).toMatchObject({ ok: false, error: 'token' });
  });

  it('keeps the link usable when the new password is too short', async () => {
    const { d1 } = accountsDb();
    await signedUp(d1);
    const { token } = (await requestPasswordReset(d1, 'anne@example.com', now))!;
    expect(await resetPassword(d1, token, 'short', later(1000))).toMatchObject({ ok: false, error: 'password' });
    expect((await resetPassword(d1, token, 'a-brand-new-password', later(2000))).ok).toBe(true);
  });

  it('refuses a made-up or expired link', async () => {
    const { d1 } = accountsDb();
    await signedUp(d1);
    const { token } = (await requestPasswordReset(d1, 'anne@example.com', now))!;
    expect(await resetPassword(d1, 'made-up', 'a-brand-new-password', now)).toMatchObject({ ok: false, error: 'token' });
    expect(await resetPassword(d1, token, 'a-brand-new-password', later(3_600_001))).toMatchObject({ ok: false, error: 'token' });
  });

  it('sends nothing for an unknown email', async () => {
    const { d1 } = accountsDb();
    expect(await requestPasswordReset(d1, 'nobody@example.com', now)).toBeNull();
    expect(await requestPasswordReset(d1, 'not-an-email', now)).toBeNull();
  });

  it('is how a guest claims a sheet the team started', async () => {
    const { d1 } = accountsDb();
    const sheet = (await createAccount(d1, { email: 'anne@example.com', firstName: 'Anne' }, now))!;
    const { token } = (await requestPasswordReset(d1, 'anne@example.com', later(1000)))!;
    const result = await resetPassword(d1, token, GOOD, later(2000));
    expect(result.ok).toBe(true);
    expect((await signIn(d1, 'anne@example.com', GOOD))?.id).toBe(sheet.id);
  });

  it('is never offered to an admin: their password is set with the script', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    const { token } = (await requestPasswordReset(d1, 'anne@example.com', now))!;
    await markEmailVerified(d1, account.id);
    await setRole(d1, account.id, 'admin');

    expect(await requestPasswordReset(d1, 'anne@example.com', later(1000))).toBeNull();
    expect(await resetPassword(d1, token, 'a-brand-new-password', later(2000))).toMatchObject({ ok: false, error: 'token' });
    expect((await signIn(d1, 'anne@example.com', GOOD))?.id).toBe(account.id);
  });
});

describe('confirmEmail', () => {
  it('confirms the address for the signed-in account the link was sent to, once', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    const token = (await issueToken(d1, account.id, 'confirm_email', now))!;
    expect(await confirmEmail(d1, token, account.id, later(1000))).toBe(true);
    expect((await getAccount(d1, account.id))?.email_verified).toBe(1);
    expect(await confirmEmail(d1, token, account.id, later(2000))).toBe(false);
  });

  it('does nothing for someone signed in to another account, and leaves the link usable', async () => {
    const { d1 } = accountsDb();
    const victim = await signedUp(d1);
    const other = await signedUp(d1, { email: 'mallory@example.com' });
    const token = (await issueToken(d1, victim.id, 'confirm_email', now))!;
    expect(await confirmEmail(d1, token, other.id, later(1000))).toBe(false);
    expect((await getAccount(d1, victim.id))?.email_verified).toBe(0);
    expect((await getAccount(d1, other.id))?.email_verified).toBe(0);
    expect(await confirmEmail(d1, token, victim.id, later(2000))).toBe(true);
  });

  it('does not accept a password-reset link', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    const { token } = (await requestPasswordReset(d1, 'anne@example.com', now))!;
    expect(await confirmEmail(d1, token, account.id, later(1000))).toBe(false);
  });
});

describe('changePassword', () => {
  it('needs the current password', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    expect(await changePassword(d1, account, 'wrong-password', 'a-brand-new-password')).toMatchObject({ ok: false, field: 'current' });
    expect(await changePassword(d1, account, undefined, 'a-brand-new-password')).toMatchObject({ ok: false, field: 'current' });
    expect((await signIn(d1, 'anne@example.com', GOOD))?.id).toBe(account.id);
  });

  it('refuses a weak new password', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    expect(await changePassword(d1, account, GOOD, 'short')).toMatchObject({ ok: false, field: 'next' });
  });

  it('changes the password and returns the new session key, ending other sessions', async () => {
    const { d1 } = accountsDb();
    const account = await signedUp(d1);
    const result = await changePassword(d1, account, GOOD, 'a-brand-new-password');
    if (!result.ok) throw new Error(result.message);
    expect(await sessionAccount(d1, account.id, account.session_key)).toBeNull();
    expect(await sessionAccount(d1, account.id, result.key)).not.toBeNull();
    expect((await signIn(d1, 'anne@example.com', 'a-brand-new-password'))?.id).toBe(account.id);
  });

  it('lets a Google or Apple guest add a first password without a current one', async () => {
    const { d1 } = accountsDb();
    const account = (await createAccount(d1, { email: 'anne@example.com', emailVerified: true, signedIn: true }, now))!;
    expect((await changePassword(d1, account, undefined, GOOD)).ok).toBe(true);
    expect((await signIn(d1, 'anne@example.com', GOOD))?.id).toBe(account.id);
  });

  it('holds admins to the longer minimum', async () => {
    const { d1 } = accountsDb();
    const hash = await hashPassword('the-admin-password');
    const account = (await createAccount(d1, { email: 'atelier@fairwayatelier.com', passwordHash: hash, emailVerified: true, signedIn: true }, now))!;
    await setRole(d1, account.id, 'admin');
    const admin = (await getAccount(d1, account.id))!;
    expect(await changePassword(d1, admin, 'the-admin-password', 'only10char')).toMatchObject({ ok: false, field: 'next' });
    expect((await changePassword(d1, admin, 'the-admin-password', 'twelve-chars')).ok).toBe(true);
  });
});
