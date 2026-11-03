/**
 * Creates an admin user or changes their password.
 *
 *   node scripts/set-admin-password.mjs <email>           # live database
 *   node scripts/set-admin-password.mjs <email> --local   # local dev database
 *
 * Asks for the password twice (not shown on screen), hashes it here, and
 * sends only the hash to D1. The password itself never leaves this machine.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { MIN_PASSWORD_LENGTH, hashPassword } from '../src/lib/admin/password.ts';

const [email, flag] = process.argv.slice(2).map((a) => a.trim());
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

const hash = await hashPassword(password);
const sql =
  `INSERT INTO admin_users (email, password_hash) VALUES ('${email.toLowerCase()}', '${hash}') ` +
  `ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

// Run the SQL from a temporary file: passing it as an argument breaks on Windows shell quoting.
const dir = mkdtempSync(join(tmpdir(), 'fa-admin-'));
const file = join(dir, 'set-password.sql');
writeFileSync(file, sql + ';\n');
try {
  execSync(`npx wrangler d1 execute DB ${flag === '--local' ? '--local' : '--remote'} --yes --file "${file}"`, {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`Password set for ${email} (${flag === '--local' ? 'local' : 'live'} database).`);
