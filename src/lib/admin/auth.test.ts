import { describe, expect, it } from 'vitest';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';
import { SESSION_HOURS, createSession, readSession } from './session';
import { safeNext } from './login';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(stored).toMatch(/^pbkdf2-sha256\$100000\$[\w-]{22}\$[\w-]{43}$/);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('correct horse batterY', stored)).toBe(false);
  });

  it('salts every hash differently', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });

  it('rejects malformed or tampered stored values', async () => {
    const stored = await hashPassword('correct horse battery');
    for (const bad of ['', 'plain-text', stored.replace('100000', '9999999'), stored.replace('pbkdf2-sha256', 'md5')]) {
      expect(await verifyPassword('correct horse battery', bad)).toBe(false);
    }
  });

  it('never matches the dummy hash used for unknown emails', async () => {
    expect(await verifyPassword('', DUMMY_HASH)).toBe(false);
    expect(await verifyPassword('anything at all', DUMMY_HASH)).toBe(false);
  });
});

describe('sessions', () => {
  const secret = 'test-secret-0123456789';
  const now = Date.UTC(2026, 10, 3, 12);

  it('round-trips the email until it expires', async () => {
    const token = await createSession('atelier@fairwayatelier.com', secret, now);
    expect(await readSession(token, secret, now + 1000)).toBe('atelier@fairwayatelier.com');
    expect(await readSession(token, secret, now + SESSION_HOURS * 3600_000 + 1)).toBeNull();
  });

  it('rejects a cookie signed with another secret, or with an altered payload', async () => {
    const token = await createSession('atelier@fairwayatelier.com', secret, now);
    expect(await readSession(token, 'another-secret', now)).toBeNull();
    const [, sig] = token.split('.');
    const forged = btoa(JSON.stringify({ email: 'intruder@example.com', exp: now + 1e9 })).replace(/=+$/, '');
    expect(await readSession(`${forged}.${sig}`, secret, now)).toBeNull();
  });

  it('rejects everything without a secret or a cookie', async () => {
    const token = await createSession('a@b.co', secret, now);
    expect(await readSession(token, undefined, now)).toBeNull();
    expect(await readSession(undefined, secret, now)).toBeNull();
    expect(await readSession('garbage', secret, now)).toBeNull();
  });
});

describe('safeNext', () => {
  it.each([
    ['/admin/weeks', '/admin/weeks'],
    ['/admin?tab=1', '/admin?tab=1'],
    ['/admin', '/admin'],
    [null, '/admin'],
    ['https://evil.example', '/admin'],
    ['//evil.example/admin', '/admin'],
    ['/administrator', '/admin'],
    ['/', '/admin'],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
