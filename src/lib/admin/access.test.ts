import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearKeyCache, verifyAccessJwt } from './access';

const config = { teamDomain: 'fairway.cloudflareaccess.com', aud: 'aud-123' };
const NOW = Date.UTC(2026, 10, 3, 12);
const secs = NOW / 1000;

const b64url = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (o: object) => b64url(new TextEncoder().encode(JSON.stringify(o)));

let key: CryptoKeyPair;
let other: CryptoKeyPair;
let jwks: { keys: (JsonWebKey & { kid: string })[] };

const algo = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };

async function sign(claims: object, { pair = key, kid = 'k1' } = {}) {
  const head = `${enc({ alg: 'RS256', kid })}.${enc(claims)}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(head));
  return `${head}.${b64url(sig)}`;
}

const good = {
  aud: [config.aud],
  iss: `https://${config.teamDomain}`,
  email: 'Atelier@FairwayAtelier.com',
  exp: secs + 3600,
  nbf: secs - 10,
};

beforeAll(async () => {
  key = (await crypto.subtle.generateKey(algo, true, ['sign', 'verify'])) as CryptoKeyPair;
  other = (await crypto.subtle.generateKey(algo, true, ['sign', 'verify'])) as CryptoKeyPair;
  jwks = { keys: [{ ...(await crypto.subtle.exportKey('jwk', key.publicKey)), kid: 'k1' }] };
});

beforeEach(() => clearKeyCache());

const verify = (token: string | null, load = vi.fn().mockResolvedValue(jwks), cfg = config) =>
  verifyAccessJwt(token, cfg, { now: NOW, load });

describe('verifyAccessJwt', () => {
  it('accepts a valid token and returns the lower-cased email', async () => {
    const load = vi.fn().mockResolvedValue(jwks);
    expect(await verify(await sign(good), load)).toBe('atelier@fairwayatelier.com');
    expect(load).toHaveBeenCalledWith('https://fairway.cloudflareaccess.com/cdn-cgi/access/certs');
  });

  it('refuses everything while Access is not configured', async () => {
    expect(await verify(await sign(good), undefined, { teamDomain: '', aud: '' })).toBeNull();
  });

  it('refuses a missing or malformed token', async () => {
    expect(await verify(null)).toBeNull();
    expect(await verify('not-a-jwt')).toBeNull();
    expect(await verify('a.b.c')).toBeNull();
  });

  it('refuses a token signed with another key', async () => {
    expect(await verify(await sign(good, { pair: other }))).toBeNull();
  });

  it('refuses a token whose claims were altered after signing', async () => {
    const [h, , s] = (await sign(good)).split('.');
    expect(await verify(`${h}.${enc({ ...good, email: 'intruder@example.com' })}.${s}`)).toBeNull();
  });

  it.each([
    ['expired', { exp: secs - 1 }],
    ['not yet valid', { nbf: secs + 600 }],
    ['for another application', { aud: ['other-app'] }],
    ['from another team', { iss: 'https://evil.cloudflareaccess.com' }],
    ['without an email', { email: '' }],
  ])('refuses a token that is %s', async (_, override) => {
    expect(await verify(await sign({ ...good, ...override }))).toBeNull();
  });

  it('reloads the keys when it sees an unknown key id (rotation)', async () => {
    const load = vi.fn().mockResolvedValue(jwks);
    await verify(await sign(good), load);
    const rotated = { keys: [{ ...(await crypto.subtle.exportKey('jwk', other.publicKey)), kid: 'k2' }] };
    load.mockResolvedValue(rotated);
    expect(await verify(await sign(good, { pair: other, kid: 'k2' }), load)).toBe('atelier@fairwayatelier.com');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
