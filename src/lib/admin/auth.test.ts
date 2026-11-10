import { describe, expect, it } from 'vitest';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';

// Sessions, redirect targets and the sign-in rules are tested in src/lib/account/ (session, guard, auth).
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
