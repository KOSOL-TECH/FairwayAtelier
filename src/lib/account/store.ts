/**
 * Accounts in D1 (migrations/0008_accounts.sql): guests and the team, their
 * answers, Google/Apple identities and emailed links. Design: docs/accounts.md.
 *
 * Rows of `accounts` hold the password hash and the session key, so pages and
 * APIs pass on only what they need (see `SessionAccount`, `exportAccount`).
 */
import { retentionCutoff, type StoredEnquiry } from '../enquiry/store';
import { CORE_FIELDS, normaliseEmail, type Core } from './profile';
import { answerLabel, questionById, type Answers } from './questions';
import { newSessionKey } from './session';
import { randomToken, sha256 } from './signed';

export const ROLES = ['customer', 'admin'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = { customer: 'Guest', admin: 'Admin' };

export type AnswerSource = 'onboarding' | 'profile' | 'prompt' | 'team';
export const SOURCE_LABEL: Record<AnswerSource, string> = {
  onboarding: 'Onboarding',
  profile: 'Their profile',
  prompt: 'A later question',
  team: 'The team',
};

export type Provider = 'google' | 'apple';
export type TokenPurpose = 'confirm_email' | 'reset_password';

export interface AccountRow {
  id: string;
  email: string;
  email_verified: number;
  password_hash: string | null;
  role: Role;
  session_key: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  marketing_opt_in: number;
  marketing_opt_in_at: string | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
  /** null for a sheet the team started that the guest has not claimed */
  last_seen_at: string | null;
}

/** What a session resolves to on each request: enough to greet and to gate, nothing secret. */
export interface SessionAccount {
  id: string;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  email_verified: boolean;
}

export interface NewAccount {
  email: string;
  passwordHash?: string | null;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketing?: boolean;
  /** true when the guest creates it themself (they are signed in at once); false for a sheet started by the team */
  signedIn?: boolean;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * Creates a guest account. Accounts are never created as admins: the role is
 * granted afterwards (`setRole`, or scripts/set-admin-password.mjs).
 * @returns the new account, or null if the email is invalid or already has one
 *   (the existing account is left exactly as it is).
 */
export async function createAccount(db: D1Database, input: NewAccount, now = new Date()): Promise<AccountRow | null> {
  const email = normaliseEmail(input.email);
  if (!email) return null;
  const at = now.toISOString();
  return db
    .prepare(
      `INSERT INTO accounts (id, email, email_verified, password_hash, session_key, first_name, last_name, phone,
         marketing_opt_in, marketing_opt_in_at, created_at, updated_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (email) DO NOTHING RETURNING *`,
    )
    .bind(
      crypto.randomUUID(), email, input.emailVerified ? 1 : 0, input.passwordHash ?? null, newSessionKey(),
      input.firstName ?? '', input.lastName ?? '', input.phone ?? '',
      input.marketing ? 1 : 0, input.marketing ? at : null, at, at, input.signedIn ? at : null,
    )
    .first<AccountRow>();
}

export function getAccount(db: D1Database, id: string): Promise<AccountRow | null> {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).first<AccountRow>();
}

export async function getAccountByEmail(db: D1Database, email: string): Promise<AccountRow | null> {
  const normalised = normaliseEmail(email);
  return normalised ? db.prepare('SELECT * FROM accounts WHERE email = ?').bind(normalised).first<AccountRow>() : null;
}

/** The account a session belongs to, or null once the account's session key has changed or the account is gone. */
export async function sessionAccount(db: D1Database, accountId: string, key: string): Promise<SessionAccount | null> {
  const row = await db
    .prepare('SELECT id, email, role, first_name, last_name, email_verified, session_key FROM accounts WHERE id = ?')
    .bind(accountId)
    .first<Pick<AccountRow, 'id' | 'email' | 'role' | 'first_name' | 'last_name' | 'email_verified' | 'session_key'>>();
  if (!row || row.session_key !== key) return null;
  return { id: row.id, email: row.email, role: row.role, first_name: row.first_name, last_name: row.last_name, email_verified: row.email_verified === 1 };
}

export async function recordSignIn(db: D1Database, id: string, now = new Date()) {
  await db.prepare('UPDATE accounts SET last_seen_at = ? WHERE id = ?').bind(now.toISOString(), id).run();
}

/** Sets or removes the password and gives the account a new session key, ending every session. @returns the new key */
export async function setPassword(db: D1Database, id: string, passwordHash: string | null, now = new Date()): Promise<string> {
  const key = newSessionKey();
  const at = now.toISOString();
  await db.batch([
    db.prepare('UPDATE accounts SET password_hash = ?, session_key = ?, updated_at = ? WHERE id = ?').bind(passwordHash, key, at, id),
    // A reset link sent before this change must not be able to undo it.
    db.prepare("UPDATE account_tokens SET used_at = ? WHERE account_id = ? AND purpose = 'reset_password' AND used_at IS NULL").bind(at, id),
  ]);
  return key;
}

/** "Sign out everywhere". @returns the new key */
export async function rotateSessionKey(db: D1Database, id: string): Promise<string> {
  const key = newSessionKey();
  await db.prepare('UPDATE accounts SET session_key = ? WHERE id = ?').bind(key, id).run();
  return key;
}

export async function markEmailVerified(db: D1Database, id: string, now = new Date()) {
  await db.prepare('UPDATE accounts SET email_verified = 1, updated_at = ? WHERE id = ?').bind(now.toISOString(), id).run();
}

/** Updates name, phone and country. Any other key in `core` is ignored. */
export async function updateCore(db: D1Database, id: string, core: Partial<Core>, now = new Date()) {
  const fields = CORE_FIELDS.filter((f) => typeof core[f] === 'string');
  if (!fields.length) return;
  await db
    .prepare(`UPDATE accounts SET ${fields.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .bind(...fields.map((f) => core[f]), now.toISOString(), id)
    .run();
}

export async function setMarketing(db: D1Database, id: string, optIn: boolean, now = new Date()) {
  const at = now.toISOString();
  await db
    .prepare('UPDATE accounts SET marketing_opt_in = ?, marketing_opt_in_at = ?, updated_at = ? WHERE id = ?')
    .bind(optIn ? 1 : 0, optIn ? at : null, at, id)
    .run();
}

export interface StoredAnswer {
  question: string;
  value: string;
  source: AnswerSource;
  updated_at: string;
}

/**
 * Stores answers that have already been through `normaliseAnswers`. An answer
 * whose value has not changed keeps its original source and date.
 */
export async function saveAnswers(db: D1Database, id: string, answers: Answers, source: AnswerSource, now = new Date()) {
  const entries = Object.entries(answers).filter(([question]) => questionById(question));
  if (!entries.length) return;
  const at = now.toISOString();
  await db.batch([
    ...entries.map(([question, value]) =>
      db
        .prepare(
          `INSERT INTO account_answers (account_id, question, value, source, updated_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (account_id, question) DO UPDATE SET value = excluded.value, source = excluded.source, updated_at = excluded.updated_at
           WHERE account_answers.value != excluded.value`,
        )
        .bind(id, question, value, source, at),
    ),
    db.prepare('UPDATE accounts SET updated_at = ? WHERE id = ?').bind(at, id),
  ]);
}

export async function getAnswers(db: D1Database, id: string): Promise<StoredAnswer[]> {
  const { results } = await db
    .prepare('SELECT question, value, source, updated_at FROM account_answers WHERE account_id = ? ORDER BY question')
    .bind(id)
    .all<StoredAnswer>();
  return results;
}

export const answersOf = (rows: StoredAnswer[]): Answers => Object.fromEntries(rows.map((r) => [r.question, r.value]));

// ---- Google and Apple identities ----

/** @returns the id of the account this identity signs in to, or null */
export function findIdentity(db: D1Database, provider: Provider, subject: string): Promise<string | null> {
  return db.prepare('SELECT account_id FROM account_identities WHERE provider = ? AND subject = ?').bind(provider, subject).first<string>('account_id');
}

export async function addIdentity(db: D1Database, provider: Provider, subject: string, accountId: string, email: string) {
  await db
    .prepare('INSERT OR IGNORE INTO account_identities (provider, subject, account_id, email) VALUES (?, ?, ?, ?)')
    .bind(provider, subject, accountId, email)
    .run();
}

export async function providersOf(db: D1Database, accountId: string): Promise<Provider[]> {
  const { results } = await db
    .prepare('SELECT DISTINCT provider FROM account_identities WHERE account_id = ? ORDER BY provider')
    .bind(accountId)
    .all<{ provider: Provider }>();
  return results.map((r) => r.provider);
}

// ---- Emailed links ----

export const TOKEN_TTL_MS: Record<TokenPurpose, number> = { confirm_email: 7 * DAY, reset_password: HOUR };
/** Brakes on outgoing account email, so the site cannot be used to flood an inbox or to burn the sending domain's reputation. */
export const EMAILS_PER_ACCOUNT_PER_DAY = 3;
export const DAILY_EMAIL_TOTAL = 200;

/**
 * Creates a single-use link token for an email.
 *
 * Anyone can ask for an email to someone else's address, so the limits are
 * built not to be turned against a guest: earlier links keep working (asking
 * for more cannot cancel the one in their inbox), a reset is refused only while
 * an earlier reset link is still usable (so they always have one or can get
 * one), and each kind of email has its own daily total (a flood of sign-ups
 * cannot stop password resets).
 * @returns the token (put it in the email, never store or log it), or null when
 *   the limits are reached and no email should be sent.
 */
export async function issueToken(db: D1Database, accountId: string, purpose: TokenPurpose, now = new Date()): Promise<string | null> {
  const at = now.toISOString();
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  await db.prepare('DELETE FROM account_tokens WHERE created_at < ?').bind(ago(8 * DAY)).run();
  const sent = await db
    .prepare(
      `SELECT count(*) AS total,
         coalesce(sum(account_id = ?1), 0) AS mine,
         coalesce(sum(account_id = ?1 AND used_at IS NULL AND expires_at > ?4), 0) AS usable
       FROM account_tokens WHERE purpose = ?2 AND created_at > ?3`,
    )
    .bind(accountId, purpose, ago(DAY), at)
    .first<{ total: number; mine: number; usable: number }>();
  if (!sent || sent.total >= DAILY_EMAIL_TOTAL) return null;
  const overPerAccount = sent.mine >= EMAILS_PER_ACCOUNT_PER_DAY;
  if (overPerAccount && (purpose !== 'reset_password' || sent.usable > 0)) return null;

  const token = randomToken();
  await db
    .prepare('INSERT INTO account_tokens (token_hash, account_id, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256(token), accountId, purpose, new Date(now.getTime() + TOKEN_TTL_MS[purpose]).toISOString(), at)
    .run();
  return token;
}

/** @returns the account a link token belongs to if it could still be used, without using it. */
export async function peekToken(db: D1Database, token: string, purpose: TokenPurpose, now = new Date()): Promise<string | null> {
  return db
    .prepare('SELECT account_id FROM account_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?')
    .bind(await sha256(token), purpose, now.toISOString())
    .first<string>('account_id');
}

/** Uses a link token up. @returns its account id, or null if it is unknown, expired, already used or for another purpose. */
export async function consumeToken(db: D1Database, token: string, purpose: TokenPurpose, now = new Date()): Promise<string | null> {
  const at = now.toISOString();
  return db
    .prepare('UPDATE account_tokens SET used_at = ? WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ? RETURNING account_id')
    .bind(at, await sha256(token), purpose, at)
    .first<string>('account_id');
}

// ---- The team's view (admin CRM) ----

export interface AccountListItem {
  id: string;
  email: string;
  email_verified: number;
  role: Role;
  first_name: string;
  last_name: string;
  created_at: string;
  last_seen_at: string | null;
  has_password: number;
  /** comma-separated, e.g. "google" or "apple,google"; null when the account has none */
  providers: string | null;
  /** enquiries sent from the same email */
  enquiries: number;
  /** questions with an answer */
  answered: number;
}

export async function listAccounts(db: D1Database, opts: { q?: string; role?: Role; limit?: number } = {}): Promise<AccountListItem[]> {
  const q = (opts.q ?? '').trim().toLowerCase().slice(0, 100);
  const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  const { results } = await db
    .prepare(
      `SELECT a.id, a.email, a.email_verified, a.role, a.first_name, a.last_name, a.created_at, a.last_seen_at,
         (a.password_hash IS NOT NULL) AS has_password,
         (SELECT group_concat(DISTINCT i.provider) FROM account_identities i WHERE i.account_id = a.id) AS providers,
         (SELECT count(*) FROM enquiries e WHERE lower(e.email) = a.email) AS enquiries,
         (SELECT count(*) FROM account_answers w WHERE w.account_id = a.id AND w.value != '') AS answered
       FROM accounts a
       WHERE (?1 = '' OR a.role = ?1)
         AND (?2 = '' OR a.email LIKE ?3 ESCAPE '\\' OR lower(a.first_name || ' ' || a.last_name) LIKE ?3 ESCAPE '\\')
       ORDER BY a.created_at DESC, a.email
       LIMIT ?4`,
    )
    .bind(opts.role ?? '', q, like, opts.limit ?? 200)
    .all<AccountListItem>();
  return results;
}

export async function countByRole(db: D1Database): Promise<Record<Role, number>> {
  const { results } = await db.prepare('SELECT role, count(*) AS n FROM accounts GROUP BY role').all<{ role: Role; n: number }>();
  const counts: Record<Role, number> = { customer: 0, admin: 0 };
  for (const r of results) counts[r.role] = r.n;
  return counts;
}

/**
 * Why `actor` may not give `target` this role, or null if they may.
 * - Nobody changes their own role, so the last admin can never remove themself.
 * - The admin role needs a confirmed email (otherwise whoever registered the
 *   address first would get the admin) and a password (admins never sign in
 *   with Google or Apple).
 */
export function roleChangeProblem(actorId: string, target: Pick<AccountRow, 'id' | 'role' | 'email_verified' | 'password_hash'>, role: Role): string | null {
  if (!ROLES.includes(role)) return 'Choose Guest or Admin.';
  if (target.id === actorId) return 'You cannot change your own role. Another admin can do it.';
  if (role === 'admin' && target.role !== 'admin') {
    if (!target.email_verified) return 'This email address is not confirmed yet. They need to confirm it from their profile before becoming an admin.';
    if (!target.password_hash) return 'This profile has no password. Admins sign in with a password: ask them to set one in their profile first.';
  }
  return null;
}

/**
 * Changes the role and gives the account a new session key, so sessions opened
 * before the change end. Becoming an admin also removes Google/Apple sign-ins.
 * Check `roleChangeProblem` first.
 */
export async function setRole(db: D1Database, id: string, role: Role, now = new Date()) {
  const statements = [
    db.prepare('UPDATE accounts SET role = ?, session_key = ?, updated_at = ? WHERE id = ?').bind(role, newSessionKey(), now.toISOString(), id),
  ];
  if (role === 'admin') statements.push(db.prepare('DELETE FROM account_identities WHERE account_id = ?').bind(id));
  await db.batch(statements);
}

/**
 * Whether the team may record details (name, phone, answers) on this sheet.
 * Whatever is recorded there is shown to whoever holds the profile, so it is
 * allowed only when that can be nobody but the guest: the email is confirmed,
 * or the team started the sheet and nobody can sign in to it yet. A profile
 * someone registered without confirming the address may not be the guest's;
 * until it is confirmed, the team keeps what it learns in the team notes.
 */
export function teamCanFill(account: Pick<AccountRow, 'email_verified' | 'password_hash' | 'last_seen_at'>, providers: readonly Provider[]): boolean {
  return account.email_verified === 1 || (!account.password_hash && !account.last_seen_at && providers.length === 0);
}

export async function saveInternalNotes(db: D1Database, id: string, notes: string, now = new Date()) {
  await db.prepare('UPDATE accounts SET internal_notes = ?, updated_at = ? WHERE id = ?').bind(notes, now.toISOString(), id).run();
}

/** Why `actor` may not delete `target` from the admin, or null if they may. */
export function deleteProblem(actorId: string, target: Pick<AccountRow, 'id' | 'role'>): string | null {
  if (target.id === actorId) return 'You cannot delete your own account here.';
  if (target.role === 'admin') return 'Remove the admin role first, then delete the account.';
  return null;
}

/** Deletes an account with its answers, identities and link tokens. Enquiries are separate records and stay. */
export async function deleteAccount(db: D1Database, id: string) {
  await db.batch([
    db.prepare('DELETE FROM account_tokens WHERE account_id = ?').bind(id),
    db.prepare('DELETE FROM account_answers WHERE account_id = ?').bind(id),
    db.prepare('DELETE FROM account_identities WHERE account_id = ?').bind(id),
    db.prepare('DELETE FROM accounts WHERE id = ?').bind(id),
  ]);
}

export async function enquiriesFor(db: D1Database, email: string): Promise<StoredEnquiry[]> {
  const { results } = await db
    .prepare('SELECT * FROM enquiries WHERE lower(email) = ? ORDER BY received_at DESC')
    .bind(email.trim().toLowerCase())
    .all<StoredEnquiry>();
  return results;
}

/**
 * Deletes guest accounts three years after the last contact: the last sign-in,
 * or the last change to the profile or sheet, whichever is later (BACKLOG
 * D-13, the same period as enquiries). Admins and guests with a booked enquiry
 * are kept. Cheap; runs when the customer list opens.
 */
export async function purgeInactiveAccounts(db: D1Database, now = new Date()): Promise<number> {
  const { results } = await db
    .prepare(
      `SELECT id FROM accounts
       WHERE role = 'customer' AND max(coalesce(last_seen_at, ''), updated_at) < ?
         AND NOT EXISTS (SELECT 1 FROM enquiries e WHERE lower(e.email) = accounts.email AND e.status = 'booked')`,
    )
    .bind(retentionCutoff(now))
    .all<{ id: string }>();
  for (const { id } of results) await deleteAccount(db, id);
  return results.length;
}

/**
 * The guest's own copy of their data (GDPR access and portability). A fixed
 * list of fields: never the password hash, the session key, provider ids or the
 * team's notes. Past enquiries are included only once the email is confirmed.
 */
export async function exportAccount(db: D1Database, id: string, now = new Date()) {
  const account = await getAccount(db, id);
  if (!account) return null;
  const [answers, providers, enquiries] = await Promise.all([
    getAnswers(db, id),
    providersOf(db, id),
    account.email_verified ? enquiriesFor(db, account.email) : Promise.resolve([]),
  ]);
  return {
    exported_at: now.toISOString(),
    profile: {
      email: account.email,
      email_confirmed: account.email_verified === 1,
      first_name: account.first_name,
      last_name: account.last_name,
      phone: account.phone,
      country: account.country,
      emails_from_us: account.marketing_opt_in === 1,
      created_at: account.created_at,
      last_sign_in: account.last_seen_at,
    },
    sign_in_methods: [...(account.password_hash ? ['password'] : []), ...providers],
    answers: answers.flatMap((a) => {
      const question = questionById(a.question);
      return question && a.value ? [{ question: question.ask, answer: answerLabel(question, a.value), updated_at: a.updated_at }] : [];
    }),
    enquiries: enquiries.map((e) => ({ received_at: e.received_at, dates: e.dates, party: e.party, tier: e.tier, message: e.message })),
  };
}

/** What a guest's own profile page is given about their account: no hash, no key, no id, no team notes. */
export interface PublicProfile extends Core {
  email: string;
  emailVerified: boolean;
  /** Journal and newly opened weeks by email */
  marketing: boolean;
  isAdmin: boolean;
  hasPassword: boolean;
}

export function publicProfile(account: AccountRow): PublicProfile {
  return {
    email: account.email,
    emailVerified: account.email_verified === 1,
    first_name: account.first_name,
    last_name: account.last_name,
    phone: account.phone,
    country: account.country,
    marketing: account.marketing_opt_in === 1,
    isAdmin: account.role === 'admin',
    hasPassword: account.password_hash !== null,
  };
}

/** Marks later questions as skipped, without touching any that already have an answer. */
export async function skipQuestions(db: D1Database, id: string, questions: string[], now = new Date()) {
  const known = questions.filter((q) => questionById(q));
  if (!known.length) return;
  const at = now.toISOString();
  await db.batch(
    known.map((q) =>
      db.prepare("INSERT OR IGNORE INTO account_answers (account_id, question, value, source, updated_at) VALUES (?, ?, '', 'prompt', ?)").bind(id, q, at),
    ),
  );
}
