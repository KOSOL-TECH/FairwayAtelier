import { describe, expect, it } from 'vitest';
import { seal, unseal } from './signed';
import { ADMIN_FRESH_HOURS, SESSION_DAYS, createSession, isFreshForAdmin, newSessionKey, readSession } from './session';

const secret = 'test-secret-0123456789';
const now = Date.UTC(2026, 10, 10, 12);
const DAY = 86_400_000;

describe('signed payloads', () => {
  it('round-trips data, including accented text, until it expires', async () => {
    const token = await seal('demo', { club: 'Pléneuf-Val-André', n: 3 }, secret, 60_000, now);
    expect(await unseal('demo', token, secret, now + 59_000)).toMatchObject({ club: 'Pléneuf-Val-André', n: 3 });
    expect(await unseal('demo', token, secret, now + 60_001)).toBeNull();
  });

  it('never accepts a token made for another purpose', async () => {
    const token = await seal('oauth', { aid: 'a1', key: 'k1', iat: now }, secret, 60_000, now);
    expect(await unseal('session', token, secret, now)).toBeNull();
    expect(await readSession(token, secret, now)).toBeNull();
  });

  it('rejects another secret, an altered payload and a swapped signature', async () => {
    const token = await seal('demo', { role: 'customer' }, secret, 60_000, now);
    const other = await seal('demo', { role: 'admin' }, secret, 60_000, now);
    const [payload, sig] = token.split('.');
    expect(await unseal('demo', token, 'another-secret', now)).toBeNull();
    expect(await unseal('demo', `${other.split('.')[0]}.${sig}`, secret, now)).toBeNull();
    expect(await unseal('demo', `${payload}.${other.split('.')[1]}`, secret, now)).toBeNull();
  });

  it('rejects anything malformed, and everything without a secret', async () => {
    const token = await seal('demo', { a: 1 }, secret, 60_000, now);
    for (const bad of [undefined, '', 'garbage', 'a.b.c', '.', `${token}x`, '%%%.%%%']) {
      expect(await unseal('demo', bad, secret, now), String(bad)).toBeNull();
    }
    expect(await unseal('demo', token, undefined, now)).toBeNull();
    expect(await unseal('demo', token, '', now)).toBeNull();
  });
});

describe('account sessions', () => {
  it('carries the account, its session key and the sign-in time for 30 days', async () => {
    const token = await createSession('acc-1', 'key-1', secret, now);
    expect(await readSession(token, secret, now + 1000)).toEqual({ aid: 'acc-1', key: 'key-1', iat: now });
    expect(await readSession(token, secret, now + SESSION_DAYS * DAY - 1)).not.toBeNull();
    expect(await readSession(token, secret, now + SESSION_DAYS * DAY + 1)).toBeNull();
  });

  it('rejects a signed token whose fields are missing or of the wrong type', async () => {
    for (const data of [{ aid: 'a' }, { aid: 'a', key: 'k' }, { aid: 1, key: 'k', iat: now }, { aid: 'a', key: 'k', iat: 'x' }, { aid: '', key: 'k', iat: now }]) {
      const token = await seal('session', data, secret, DAY, now);
      expect(await readSession(token, secret, now), JSON.stringify(data)).toBeNull();
    }
  });

  it('does not accept the old admin cookie format', async () => {
    const token = await seal('session', { email: 'atelier@fairwayatelier.com', key: 'k' }, secret, DAY, now);
    expect(await readSession(token, secret, now)).toBeNull();
  });

  it('opens the admin only for 12 hours after signing in', () => {
    const session = { aid: 'a', key: 'k', iat: now };
    expect(isFreshForAdmin(session, now)).toBe(true);
    expect(isFreshForAdmin(session, now + ADMIN_FRESH_HOURS * 3_600_000 - 1)).toBe(true);
    expect(isFreshForAdmin(session, now + ADMIN_FRESH_HOURS * 3_600_000)).toBe(false);
  });

  it('does not treat a sign-in time in the future as fresh', () => {
    expect(isFreshForAdmin({ aid: 'a', key: 'k', iat: now + 3_600_000 }, now)).toBe(false);
  });

  it('makes a new, unguessable session key every time', () => {
    const keys = new Set(Array.from({ length: 50 }, newSessionKey));
    expect(keys.size).toBe(50);
    for (const k of keys) expect(k).toMatch(/^[\w-]{22}$/);
  });
});
