import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accountsDb, testDb } from '../test/d1';
import {
  DAILY_EMAIL_TOTAL, EMAILS_PER_ACCOUNT_PER_DAY, addIdentity, answersOf, consumeToken, countByRole, createAccount, deleteAccount,
  deleteProblem, enquiriesFor, exportAccount, findIdentity, getAccount, getAccountByEmail, getAnswers, issueToken, listAccounts,
  markEmailVerified, peekToken, providersOf, publicProfile, purgeInactiveAccounts, recordSignIn, roleChangeProblem, rotateSessionKey, saveAnswers, saveInternalNotes,
  sessionAccount, setMarketing, setPassword, setRole, skipQuestions, teamCanFill, updateCore, type AccountRow,
} from './store';

const now = new Date('2026-11-10T12:00:00.000Z');
const later = (ms: number) => new Date(now.getTime() + ms);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

async function guest(db: D1Database, email = 'anne@example.com', extra: Partial<Parameters<typeof createAccount>[1]> = {}) {
  const account = await createAccount(db, { email, passwordHash: 'hash-1', firstName: 'Anne', lastName: 'Martin', signedIn: true, ...extra }, now);
  if (!account) throw new Error('account not created');
  return account;
}

const addEnquiry = (sqlite: ReturnType<typeof accountsDb>['sqlite'], id: string, email: string, status = 'new') =>
  sqlite
    .prepare(`INSERT INTO enquiries (id, received_at, name, email, dates, party, tier, message, status, internal_notes, last_contact_at)
      VALUES (?, ?, 'Anne Martin', ?, '10–17 May 2027', 'Two travellers', 'Signature', 'Handicap 12', ?, 'team only', ?)`)
    .run(id, now.toISOString(), email, status, now.toISOString());

describe('migration 0008', () => {
  it('turns today’s admins into admin accounts with the same password, and keeps admin_users', () => {
    const { sqlite } = testDb('0002_admin_users.sql', '0004_enquiries.sql');
    sqlite.prepare("INSERT INTO admin_users (email, password_hash) VALUES ('Atelier@FairwayAtelier.com', 'pbkdf2-hash')").run();

    sqlite.exec(readFileSync('migrations/0008_accounts.sql', 'utf8'));
    const rows = sqlite.prepare('SELECT email, email_verified, password_hash, role, length(id) AS id_len, length(session_key) AS key_len FROM accounts').all();
    expect(rows).toEqual([{ email: 'atelier@fairwayatelier.com', email_verified: 1, password_hash: 'pbkdf2-hash', role: 'admin', id_len: 32, key_len: 32 }]);
    expect(sqlite.prepare('SELECT count(*) AS n FROM admin_users').get()).toEqual({ n: 1 });
  });

  it('starts with no accounts when there are no admins', () => {
    const { sqlite } = accountsDb();
    expect(sqlite.prepare('SELECT count(*) AS n FROM accounts').get()).toEqual({ n: 0 });
  });
});

describe('createAccount', () => {
  it('stores a guest with a lower-case email, the guest role and an unconfirmed address', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1, 'Anne@Example.com');
    expect(account).toMatchObject({
      email: 'anne@example.com', role: 'customer', email_verified: 0, password_hash: 'hash-1',
      first_name: 'Anne', last_name: 'Martin', marketing_opt_in: 0, last_seen_at: now.toISOString(),
    });
    expect(account.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(account.session_key).toMatch(/^[\w-]{22}$/);
  });

  it('never touches an existing account with the same email', async () => {
    const { d1 } = accountsDb();
    const first = await guest(d1);
    const second = await createAccount(d1, { email: 'ANNE@example.com', passwordHash: 'attacker-hash', firstName: 'Mallory', signedIn: true }, now);
    expect(second).toBeNull();
    expect(await getAccount(d1, first.id)).toEqual(first);
  });

  it('records when a guest opted in to emails, and leaves a team-made sheet unclaimed', async () => {
    const { d1 } = accountsDb();
    const optedIn = await guest(d1, 'a@example.com', { marketing: true });
    const sheet = await createAccount(d1, { email: 'b@example.com', firstName: 'Ben' }, now);
    expect(optedIn).toMatchObject({ marketing_opt_in: 1, marketing_opt_in_at: now.toISOString() });
    expect(sheet).toMatchObject({ password_hash: null, last_seen_at: null, marketing_opt_in: 0, marketing_opt_in_at: null });
  });

  it('finds an account by email whatever the case', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    expect((await getAccountByEmail(d1, ' Anne@EXAMPLE.com '))?.id).toBe(account.id);
    expect(await getAccountByEmail(d1, 'nobody@example.com')).toBeNull();
  });
});

describe('sessionAccount', () => {
  it('resolves a session whose key is current, without secrets', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const found = await sessionAccount(d1, account.id, account.session_key);
    expect(found).toEqual({ id: account.id, email: 'anne@example.com', role: 'customer', first_name: 'Anne', last_name: 'Martin', email_verified: false });
  });

  it('refuses a stale key and an unknown account', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    expect(await sessionAccount(d1, account.id, 'stale-key')).toBeNull();
    expect(await sessionAccount(d1, 'no-such-id', account.session_key)).toBeNull();
  });
});

describe('passwords and session keys', () => {
  it('gives the account a new session key whenever the password changes', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const key = await setPassword(d1, account.id, 'hash-2');
    expect(key).not.toBe(account.session_key);
    expect(await sessionAccount(d1, account.id, account.session_key)).toBeNull();
    expect(await sessionAccount(d1, account.id, key)).not.toBeNull();
    expect((await getAccount(d1, account.id))?.password_hash).toBe('hash-2');
  });

  it('also ends sessions when the password is removed', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const key = await setPassword(d1, account.id, null);
    expect(key).not.toBe(account.session_key);
    expect((await getAccount(d1, account.id))?.password_hash).toBeNull();
  });
});

describe('profile fields', () => {
  it('updates only the fields it is given', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await updateCore(d1, account.id, { phone: '+33 6 00 00 00 00', country: 'France' }, later(HOUR));
    expect(await getAccount(d1, account.id)).toMatchObject({
      first_name: 'Anne', last_name: 'Martin', phone: '+33 6 00 00 00 00', country: 'France', updated_at: later(HOUR).toISOString(),
    });
  });

  it('cannot be used to change anything else', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await updateCore(d1, account.id, { role: 'admin', email_verified: 1, session_key: 'x', internal_notes: 'x' } as never, later(HOUR));
    expect(await getAccount(d1, account.id)).toEqual(account);
  });

  it('records the moment a guest opts in to emails, and clears it when they opt out', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await setMarketing(d1, account.id, true, later(HOUR));
    expect(await getAccount(d1, account.id)).toMatchObject({ marketing_opt_in: 1, marketing_opt_in_at: later(HOUR).toISOString() });
    await setMarketing(d1, account.id, false, later(2 * HOUR));
    expect(await getAccount(d1, account.id)).toMatchObject({ marketing_opt_in: 0, marketing_opt_in_at: null });
  });

  it('notes the last sign-in', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await recordSignIn(d1, account.id, later(DAY));
    expect((await getAccount(d1, account.id))?.last_seen_at).toBe(later(DAY).toISOString());
  });
});

describe('answers', () => {
  it('saves answers with where they came from, and replaces them later', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, { golf_level: 'mid', party: 'friends' }, 'onboarding', now);
    await saveAnswers(d1, account.id, { golf_level: 'low', tier: '' }, 'team', later(HOUR));
    const rows = await getAnswers(d1, account.id);
    expect(rows).toEqual(expect.arrayContaining([
      { question: 'golf_level', value: 'low', source: 'team', updated_at: later(HOUR).toISOString() },
      { question: 'party', value: 'friends', source: 'onboarding', updated_at: now.toISOString() },
      { question: 'tier', value: '', source: 'team', updated_at: later(HOUR).toISOString() },
    ]));
    expect(answersOf(rows)).toEqual({ golf_level: 'low', party: 'friends', tier: '' });
  });

  it('counts as contact: saving answers moves the account’s updated time', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, { golf_level: 'mid' }, 'profile', later(DAY));
    expect((await getAccount(d1, account.id))?.updated_at).toBe(later(DAY).toISOString());
  });

  it('does nothing for an empty set', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, {}, 'profile', later(DAY));
    expect(await getAnswers(d1, account.id)).toEqual([]);
    expect((await getAccount(d1, account.id))?.updated_at).toBe(account.updated_at);
  });
});

describe('Google and Apple identities', () => {
  it('finds the account an identity opens', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await addIdentity(d1, 'google', 'sub-123', account.id, 'anne@example.com');
    expect(await findIdentity(d1, 'google', 'sub-123')).toBe(account.id);
    expect(await findIdentity(d1, 'apple', 'sub-123')).toBeNull();
    expect(await providersOf(d1, account.id)).toEqual(['google']);
  });
});

describe('emailed links', () => {
  it('works once, for its own purpose, and stores only a hash', async () => {
    const { d1, sqlite } = accountsDb();
    const account = await guest(d1);
    const token = (await issueToken(d1, account.id, 'reset_password', now))!;
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(JSON.stringify(sqlite.prepare('SELECT * FROM account_tokens').all())).not.toContain(token);

    expect(await peekToken(d1, token, 'confirm_email', later(1000))).toBeNull();
    expect(await consumeToken(d1, token, 'confirm_email', later(1000))).toBeNull();
    expect(await peekToken(d1, token, 'reset_password', later(1000))).toBe(account.id);
    expect(await consumeToken(d1, token, 'reset_password', later(1000))).toBe(account.id);
    expect(await consumeToken(d1, token, 'reset_password', later(2000))).toBeNull();
    expect(await peekToken(d1, token, 'reset_password', later(2000))).toBeNull();
  });

  it('expires: a reset link after an hour, a confirmation link after a week', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const reset = (await issueToken(d1, account.id, 'reset_password', now))!;
    const confirm = (await issueToken(d1, account.id, 'confirm_email', now))!;
    expect(await consumeToken(d1, reset, 'reset_password', later(HOUR + 1))).toBeNull();
    expect(await peekToken(d1, confirm, 'confirm_email', later(6 * DAY))).toBe(account.id);
    expect(await consumeToken(d1, confirm, 'confirm_email', later(7 * DAY + 1))).toBeNull();
  });

  it('keeps an earlier link working when another is sent, so nobody can cancel a link by asking for more', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const first = (await issueToken(d1, account.id, 'reset_password', now))!;
    const second = (await issueToken(d1, account.id, 'reset_password', later(1000)))!;
    expect(await consumeToken(d1, first, 'reset_password', later(2000))).toBe(account.id);
    expect(await consumeToken(d1, second, 'reset_password', later(2000))).toBe(account.id);
  });

  it('cancels every outstanding reset link once the password changes', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const reset = (await issueToken(d1, account.id, 'reset_password', now))!;
    const confirm = (await issueToken(d1, account.id, 'confirm_email', now))!;
    await setPassword(d1, account.id, 'hash-2', later(1000));
    expect(await consumeToken(d1, reset, 'reset_password', later(2000))).toBeNull();
    expect(await peekToken(d1, confirm, 'confirm_email', later(2000))).toBe(account.id);
  });

  it('rejects made-up tokens', async () => {
    const { d1 } = accountsDb();
    await guest(d1);
    for (const bad of ['', 'nope', 'a'.repeat(43)]) expect(await consumeToken(d1, bad, 'reset_password', now)).toBeNull();
  });

  it('stops sending to one account after a few emails in a day', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    for (let i = 0; i < EMAILS_PER_ACCOUNT_PER_DAY; i++) expect(await issueToken(d1, account.id, 'reset_password', later(i * 1000))).not.toBeNull();
    expect(await issueToken(d1, account.id, 'reset_password', later(HOUR))).toBeNull();
    expect(await issueToken(d1, account.id, 'confirm_email', later(HOUR))).not.toBeNull();
    expect(await issueToken(d1, account.id, 'reset_password', later(DAY + HOUR))).not.toBeNull();
  });

  it('stops emails of one kind once its daily total is reached, without holding back the other kind', async () => {
    const { d1, sqlite } = accountsDb();
    const account = await guest(d1);
    const insert = sqlite.prepare("INSERT INTO account_tokens (token_hash, account_id, purpose, expires_at, created_at) VALUES (?, ?, 'confirm_email', ?, ?)");
    for (let i = 0; i < DAILY_EMAIL_TOTAL; i++) insert.run(`h${i}`, account.id, later(DAY).toISOString(), now.toISOString());
    const other = await guest(d1, 'ben@example.com');
    expect(await issueToken(d1, other.id, 'confirm_email', later(HOUR))).toBeNull();
    // A flood of sign-ups must not stop guests from resetting their passwords.
    expect(await issueToken(d1, other.id, 'reset_password', later(HOUR))).not.toBeNull();
    expect(await issueToken(d1, other.id, 'confirm_email', later(DAY + HOUR))).not.toBeNull();
  });
});

describe('the team’s view', () => {
  it('lists accounts newest first with their enquiries, answers and sign-in methods, and no secrets', async () => {
    const { d1, sqlite } = accountsDb();
    const anne = await guest(d1);
    const ben = await createAccount(d1, { email: 'ben@example.com', firstName: 'Ben', lastName: 'Ward' }, later(HOUR));
    await addIdentity(d1, 'google', 'sub-1', anne.id, 'anne@example.com');
    await saveAnswers(d1, anne.id, { golf_level: 'mid', tier: '' }, 'profile', now);
    addEnquiry(sqlite, 'e1', 'Anne@Example.com');
    addEnquiry(sqlite, 'e2', 'anne@example.com');

    const list = await listAccounts(d1);
    expect(list.map((a) => a.email)).toEqual(['ben@example.com', 'anne@example.com']);
    expect(list[1]).toMatchObject({ id: anne.id, first_name: 'Anne', enquiries: 2, answered: 1, has_password: 1, providers: 'google' });
    expect(list[0]).toMatchObject({ id: ben!.id, enquiries: 0, answered: 0, has_password: 0, providers: null, last_seen_at: null });
    for (const row of list) {
      expect(row).not.toHaveProperty('password_hash');
      expect(row).not.toHaveProperty('session_key');
    }
  });

  it('searches names and emails, treating % and _ as plain characters', async () => {
    const { d1 } = accountsDb();
    await guest(d1);
    await guest(d1, 'ben_ward@example.com', { firstName: 'Ben', lastName: 'Ward' });
    expect((await listAccounts(d1, { q: 'martin' })).map((a) => a.first_name)).toEqual(['Anne']);
    expect((await listAccounts(d1, { q: 'anne mar' })).map((a) => a.first_name)).toEqual(['Anne']);
    expect((await listAccounts(d1, { q: 'BEN_W' })).map((a) => a.first_name)).toEqual(['Ben']);
    expect(await listAccounts(d1, { q: '%' })).toEqual([]);
    expect(await listAccounts(d1, { q: 'anne_' })).toEqual([]);
  });

  it('filters and counts by role', async () => {
    const { d1 } = accountsDb();
    const anne = await guest(d1);
    await guest(d1, 'ben@example.com');
    await markEmailVerified(d1, anne.id);
    await setRole(d1, anne.id, 'admin');
    expect((await listAccounts(d1, { role: 'admin' })).map((a) => a.email)).toEqual(['anne@example.com']);
    expect(await countByRole(d1)).toEqual({ customer: 1, admin: 1 });
  });

  it('finds a guest’s enquiries by email, whatever the case', async () => {
    const { d1, sqlite } = accountsDb();
    addEnquiry(sqlite, 'e1', 'Anne@Example.com');
    addEnquiry(sqlite, 'e2', 'someone-else@example.com');
    expect((await enquiriesFor(d1, 'anne@example.com')).map((e) => e.id)).toEqual(['e1']);
  });

  it('keeps team notes on the sheet', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await saveInternalNotes(d1, account.id, 'Prefers a morning call', later(HOUR));
    expect(await getAccount(d1, account.id)).toMatchObject({ internal_notes: 'Prefers a morning call', updated_at: later(HOUR).toISOString() });
  });
});

describe('the admin role', () => {
  const admin = { id: 'admin-1', role: 'admin', email_verified: 1, password_hash: 'h' } as AccountRow;
  const confirmed = { id: 'guest-1', role: 'customer', email_verified: 1, password_hash: 'h' } as AccountRow;

  it('can be given to a confirmed account that has a password', () => {
    expect(roleChangeProblem(admin.id, confirmed, 'admin')).toBeNull();
  });

  it('is refused for an unconfirmed email: someone else may have registered the address', () => {
    expect(roleChangeProblem(admin.id, { ...confirmed, email_verified: 0 }, 'admin')).toMatch(/confirm/i);
  });

  it('is refused without a password: admins never sign in with Google or Apple', () => {
    expect(roleChangeProblem(admin.id, { ...confirmed, password_hash: null }, 'admin')).toMatch(/password/i);
  });

  it('cannot be removed from yourself, so there is always an admin', () => {
    expect(roleChangeProblem(admin.id, admin, 'customer')).toMatch(/own/i);
    expect(roleChangeProblem(admin.id, { ...admin, id: 'admin-2' }, 'customer')).toBeNull();
  });

  it('refuses an unknown role', () => {
    expect(roleChangeProblem(admin.id, confirmed, 'owner' as never)).not.toBeNull();
  });

  it('ends the account’s sessions and drops its Google/Apple sign-ins when granted', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await addIdentity(d1, 'google', 'sub-1', account.id, 'anne@example.com');
    await setRole(d1, account.id, 'admin');
    expect(await sessionAccount(d1, account.id, account.session_key)).toBeNull();
    expect(await providersOf(d1, account.id)).toEqual([]);
    expect((await getAccount(d1, account.id))?.role).toBe('admin');
  });

  it('ends the account’s sessions when removed, and keeps its sign-ins', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await setRole(d1, account.id, 'admin');
    const asAdmin = (await getAccount(d1, account.id))!;
    await setRole(d1, account.id, 'customer');
    expect(await sessionAccount(d1, account.id, asAdmin.session_key)).toBeNull();
    expect((await getAccount(d1, account.id))?.role).toBe('customer');
  });

  it('must be removed before an account is deleted, and nobody deletes themselves from the admin', () => {
    expect(deleteProblem(admin.id, { ...admin, id: 'admin-2' })).toMatch(/admin role/i);
    expect(deleteProblem(admin.id, admin)).not.toBeNull();
    expect(deleteProblem(admin.id, confirmed)).toBeNull();
  });
});

describe('deleteAccount', () => {
  it('removes the account with its answers, identities and links, and leaves enquiries alone', async () => {
    const { d1, sqlite } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, { golf_level: 'mid' }, 'profile', now);
    await addIdentity(d1, 'apple', 'sub-9', account.id, 'relay@privaterelay.appleid.com');
    await issueToken(d1, account.id, 'confirm_email', now);
    addEnquiry(sqlite, 'e1', 'anne@example.com');

    await deleteAccount(d1, account.id);
    for (const table of ['accounts', 'account_answers', 'account_identities', 'account_tokens']) {
      expect(sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get(), table).toEqual({ n: 0 });
    }
    expect(sqlite.prepare('SELECT count(*) AS n FROM enquiries').get()).toEqual({ n: 1 });
  });
});

describe('retention', () => {
  const YEARS_3 = new Date('2029-11-10T12:00:01.000Z');

  it('deletes guest accounts three years after the last sign-in or change', async () => {
    const { d1 } = accountsDb();
    await guest(d1, 'old@example.com');
    const active = await guest(d1, 'active@example.com');
    await recordSignIn(d1, active.id, later(30 * DAY));
    const edited = await createAccount(d1, { email: 'sheet@example.com' }, now);
    await saveInternalNotes(d1, edited!.id, 'Called in December', later(40 * DAY));

    expect(await purgeInactiveAccounts(d1, YEARS_3)).toBe(1);
    expect((await listAccounts(d1)).map((a) => a.email).sort()).toEqual(['active@example.com', 'sheet@example.com']);
  });

  it('keeps admins, and guests who have booked', async () => {
    const { d1, sqlite } = accountsDb();
    const admin = await guest(d1, 'atelier@fairwayatelier.com');
    await markEmailVerified(d1, admin.id);
    await setRole(d1, admin.id, 'admin');
    sqlite.prepare('UPDATE accounts SET updated_at = ? WHERE id = ?').run(now.toISOString(), admin.id);
    await guest(d1, 'booked@example.com');
    addEnquiry(sqlite, 'e1', 'Booked@Example.com', 'booked');
    await guest(d1, 'enquired@example.com');
    addEnquiry(sqlite, 'e2', 'enquired@example.com', 'replied');

    expect(await purgeInactiveAccounts(d1, YEARS_3)).toBe(1);
    expect((await listAccounts(d1)).map((a) => a.email).sort()).toEqual(['atelier@fairwayatelier.com', 'booked@example.com']);
  });
});

describe('exportAccount (the guest’s own copy of their data)', () => {
  it('holds the profile, readable answers and sign-in methods, and nothing internal', async () => {
    const { d1, sqlite } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, { golf_level: 'mid', season: '["spring","autumn"]', tier: '' }, 'profile', now);
    await addIdentity(d1, 'google', 'sub-1', account.id, 'anne@example.com');
    await saveInternalNotes(d1, account.id, 'TEAM-ONLY-NOTE', now);
    addEnquiry(sqlite, 'e1', 'anne@example.com');

    const data = await exportAccount(d1, account.id, later(HOUR));
    const text = JSON.stringify(data);
    expect(data).toMatchObject({
      exported_at: later(HOUR).toISOString(),
      profile: { email: 'anne@example.com', first_name: 'Anne', last_name: 'Martin', email_confirmed: false },
      sign_in_methods: ['password', 'google'],
    });
    expect(data!.answers).toEqual(expect.arrayContaining([
      { question: 'How would you describe your golf?', answer: 'Handicap 10 to 18', updated_at: now.toISOString() },
      { question: 'When do you like to travel?', answer: 'Spring, Autumn', updated_at: now.toISOString() },
    ]));
    expect(data!.answers).toHaveLength(2);
    for (const secret of ['hash-1', account.session_key, 'TEAM-ONLY-NOTE', 'team only', 'sub-1']) expect(text).not.toContain(secret);
  });

  it('includes past enquiries only once the email is confirmed', async () => {
    const { d1, sqlite } = accountsDb();
    const account = await guest(d1);
    addEnquiry(sqlite, 'e1', 'anne@example.com');
    expect((await exportAccount(d1, account.id, now))!.enquiries).toEqual([]);
    await markEmailVerified(d1, account.id);
    expect((await exportAccount(d1, account.id, now))!.enquiries).toEqual([
      { received_at: now.toISOString(), dates: '10–17 May 2027', party: 'Two travellers', tier: 'Signature', message: 'Handicap 12' },
    ]);
  });

  it('returns nothing for an unknown account', async () => {
    const { d1 } = accountsDb();
    expect(await exportAccount(d1, 'missing', now)).toBeNull();
  });
});

describe('publicProfile (what a guest’s own page is given)', () => {
  it('holds the profile fields and nothing secret or internal', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1, 'anne@example.com', { marketing: true });
    await saveInternalNotes(d1, account.id, 'TEAM-ONLY-NOTE', now);
    const row = (await getAccount(d1, account.id))!;
    const view = publicProfile(row);
    expect(view).toEqual({
      email: 'anne@example.com', emailVerified: false, first_name: 'Anne', last_name: 'Martin', phone: '', country: '',
      marketing: true, isAdmin: false, hasPassword: true,
    });
    const text = JSON.stringify(view);
    for (const secret of ['hash-1', row.session_key, 'TEAM-ONLY-NOTE', row.id]) expect(text).not.toContain(secret);
  });
});

describe('skipQuestions', () => {
  it('records a skip so the question is not asked again, and never clears a real answer', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, { tier: 'signature' }, 'profile', now);
    await skipQuestions(d1, account.id, ['tier', 'season', 'made_up'], later(HOUR));
    expect(await getAnswers(d1, account.id)).toEqual([
      { question: 'season', value: '', source: 'prompt', updated_at: later(HOUR).toISOString() },
      { question: 'tier', value: 'signature', source: 'profile', updated_at: now.toISOString() },
    ]);
  });
});

describe('rotateSessionKey ("sign out on my other devices")', () => {
  it('ends every session and returns the key for a new one', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    const key = await rotateSessionKey(d1, account.id);
    expect(await sessionAccount(d1, account.id, account.session_key)).toBeNull();
    expect((await sessionAccount(d1, account.id, key))?.id).toBe(account.id);
  });
});

describe('teamCanFill (may the team record details on this sheet?)', () => {
  const base = { email_verified: 0, password_hash: null, last_seen_at: null } as AccountRow;

  it('yes for a confirmed profile, and for a sheet the team started that nobody can sign in to yet', () => {
    expect(teamCanFill({ ...base, email_verified: 1, password_hash: 'h', last_seen_at: 'x' }, [])).toBe(true);
    expect(teamCanFill(base, [])).toBe(true);
  });

  it('no while someone holds the profile without having confirmed the address: they may not be the guest', () => {
    expect(teamCanFill({ ...base, password_hash: 'h', last_seen_at: 'x' }, [])).toBe(false);
    expect(teamCanFill({ ...base, last_seen_at: 'x' }, [])).toBe(false);
    expect(teamCanFill(base, ['google'])).toBe(false);
  });
});

describe('saveAnswers and unchanged values', () => {
  it('leaves the source and date of an answer alone when the same value is saved again', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    await saveAnswers(d1, account.id, { tier: 'signature' }, 'profile', now);
    await saveAnswers(d1, account.id, { tier: 'signature' }, 'team', later(HOUR));
    expect(await getAnswers(d1, account.id)).toEqual([{ question: 'tier', value: 'signature', source: 'profile', updated_at: now.toISOString() }]);
  });
});

describe('reset links and the per-account limit', () => {
  it('still sends a link once the earlier ones have expired, so nobody can lock a guest out by asking first', async () => {
    const { d1 } = accountsDb();
    const account = await guest(d1);
    for (let i = 0; i < EMAILS_PER_ACCOUNT_PER_DAY; i++) await issueToken(d1, account.id, 'reset_password', later(i * 1000));
    // While those links still work, no more are sent...
    expect(await issueToken(d1, account.id, 'reset_password', later(30 * 60_000))).toBeNull();
    // ...but once they have expired (an hour), the guest can get a fresh one.
    expect(await issueToken(d1, account.id, 'reset_password', later(HOUR + 5000))).not.toBeNull();
    expect(await issueToken(d1, account.id, 'reset_password', later(HOUR + 6000))).toBeNull();
  });
});
