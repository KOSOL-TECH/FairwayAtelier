/**
 * Creates an admin account, or sets the password of an existing account and
 * makes it an admin. Admins sign in at /sign-in with their email and password
 * (docs/accounts.md); this script is the only way to reset an admin's password.
 *
 *   node scripts/set-admin-password.mjs <email>           # live database
 *   node scripts/set-admin-password.mjs <email> --local   # local dev database
 *
 * Asks for the password twice (not shown on screen), hashes it here, and
 * sends only the hash to D1. The password itself never leaves this machine.
 *
 * Whoever runs this controls the database, so it takes the account over
 * completely: the email is marked confirmed, every existing session ends, and
 * any Google or Apple sign-in on the account is removed.
 */
import { execSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { MIN_PASSWORD_LENGTH, hashPassword } from '../src/lib/admin/password.ts';

const [rawEmail, flag] = process.argv.slice(2).map((a) => a.trim());
const email = (rawEmail ?? '').toLowerCase();
if (!email || !/^[^\s@']+@[^\s@']+\.[^\s@']+$/.test(email) || (flag && flag !== '--local')) {
  console.error('Usage: node scripts/set-admin-password.mjs <email> [--local]');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
// Hide what is typed: readline echoes keystrokes through this, so drop them.
rl._writeToOutput = () => {};
// The iterator buffers lines, so piped input works as well as typing.
const lines = rl[Symbol.asyncIterator]();

async function ask(prompt) {
  process.stdout.write(prompt);
  const { value = '' } = await lines.next();
  process.stdout.write('\n');
  return value;
}

const password = await ask(`New password for ${email}: `);
const again = await ask('Type it again: ');
rl.close();
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
if (again !== password) {
  console.error('The passwords do not match. Nothing was changed.');
  process.exit(1);
}

// The values put into the SQL below are the validated email (no quotes or
// spaces), the hash and two random tokens: all from a known alphabet.
const hash = await hashPassword(password);
const sessionKey = randomBytes(16).toString('base64url');
const now = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const sql = [
  `INSERT INTO accounts (id, email, email_verified, password_hash, role, session_key)
     VALUES ('${randomUUID()}', '${email}', 1, '${hash}', 'admin', '${sessionKey}')
   ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin', email_verified = 1,
     session_key = excluded.session_key, updated_at = ${now}`,
  `DELETE FROM account_identities WHERE account_id = (SELECT id FROM accounts WHERE email = '${email}')`,
].join(';\n');

// Run the SQL from a temporary file: passing it as an argument breaks on Windows shell quoting.
const dir = mkdtempSync(join(tmpdir(), 'fa-admin-'));
const file = join(dir, 'set-password.sql');
writeFileSync(file, sql + ';\n');
try {
  execSync(`npx wrangler d1 execute DB ${flag === '--local' ? '--local' : '--remote'} --yes --file "${file}"`, {
    // Inherit the terminal: Wrangler only uses the saved `wrangler login` when it runs interactively.
    stdio: 'inherit',
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`${email} is an admin with the new password (${flag === '--local' ? 'local' : 'live'} database). They are signed out everywhere.`);
