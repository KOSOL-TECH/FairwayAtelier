import { SignJWT, createLocalJWKSet, exportJWK, exportPKCS8, generateKeyPair, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { accountsDb } from '../test/d1';
import {
  beginOAuth, completeOAuth, enabledProviders, exchangeCode, isProvider, oauthCookieOptions, oauthErrorMessage, resolveOAuthAccount,
  type OAuthEnv, type OAuthState, type ProviderProfile,
} from './oauth';
import { readSession } from './session';
import { b64url, unseal } from './signed';
import {
  addIdentity, answersOf, createAccount, findIdentity, getAccount, getAnswers, markEmailVerified, providersOf, saveAnswers, sessionAccount, setRole,
} from './store';

const secret = 'test-secret-0123456789';
const origin = 'https://fairwayatelier.com';
const now = new Date('2026-11-10T12:00:00.000Z');
const later = (ms: number) => new Date(now.getTime() + ms);

const GOOGLE: OAuthEnv = { GOOGLE_CLIENT_ID: 'google-client', GOOGLE_CLIENT_SECRET: 'google-secret' };
let APPLE: OAuthEnv;
let applePublicKey: CryptoKey;

/** A stand-in for the provider: its signing key, the matching published keys, and a way to mint ID tokens. */
let keys: JWTVerifyGetKey;
let otherKeys: JWTVerifyGetKey;
let mint: (claims: Record<string, unknown>, opts?: { issuer?: string; audience?: string; expires?: Date }) => Promise<string>;
let mintWithOtherKey: typeof mint;

beforeAll(async () => {
  const makeIssuer = async (kid: string) => {
    const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
    const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' }] });
    const sign: typeof mint = (claims, opts = {}) =>
      new SignJWT(claims)
        .setProtectedHeader({ alg: 'RS256', kid })
        .setIssuer(opts.issuer ?? 'https://accounts.google.com')
        .setAudience(opts.audience ?? 'google-client')
        .setIssuedAt(Math.floor(now.getTime() / 1000))
        .setExpirationTime(Math.floor((opts.expires ?? later(3_600_000)).getTime() / 1000))
        .sign(privateKey);
    return { jwks, sign };
  };
  const real = await makeIssuer('key-1');
  const other = await makeIssuer('key-1');
  keys = real.jwks;
  mint = real.sign;
  otherKeys = other.jwks;
  mintWithOtherKey = other.sign;

  const apple = await generateKeyPair('ES256', { extractable: true });
  applePublicKey = apple.publicKey as CryptoKey;
  APPLE = { APPLE_CLIENT_ID: 'com.fairwayatelier.web', APPLE_TEAM_ID: 'TEAM123456', APPLE_KEY_ID: 'KEY1234567', APPLE_PRIVATE_KEY: await exportPKCS8(apple.privateKey) };
});

/** A fetch that answers the token request with the given body and remembers what it was sent. */
function tokenEndpoint(body: unknown, status = 200) {
  const calls: { url: string; form: URLSearchParams }[] = [];
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), form: new URLSearchParams(String(init?.body)) });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

const state = (extra: Partial<OAuthState> = {}): OAuthState => ({
  provider: 'google', state: 'state-1', nonce: 'nonce-1', verifier: 'verifier-1', next: '/account', answers: {}, marketing: false, ...extra,
});

const profile = (extra: Partial<ProviderProfile> = {}): ProviderProfile => ({
  provider: 'google', subject: 'sub-1', email: 'anne@example.com', emailVerified: true, firstName: 'Anne', lastName: 'Martin', ...extra,
});

describe('enabledProviders', () => {
  it('offers nothing until the secrets are set', () => {
    expect(enabledProviders({})).toEqual([]);
  });

  it('offers a provider only when all of its secrets exist', () => {
    expect(enabledProviders(GOOGLE)).toEqual(['google']);
    expect(enabledProviders({ GOOGLE_CLIENT_ID: 'x' })).toEqual([]);
    expect(enabledProviders({ ...GOOGLE, ...APPLE })).toEqual(['google', 'apple']);
    expect(enabledProviders({ ...APPLE, APPLE_PRIVATE_KEY: '' })).toEqual([]);
  });

  it('recognises provider names', () => {
    expect(isProvider('google')).toBe(true);
    expect(isProvider('apple')).toBe(true);
    expect(isProvider('facebook')).toBe(false);
    expect(isProvider(undefined)).toBe(false);
  });
});

describe('beginOAuth', () => {
  it('sends the guest to Google with a state, a nonce and a PKCE challenge', async () => {
    const { url, cookie } = await beginOAuth('google', GOOGLE, origin, { next: '/account' }, secret, now);
    const u = new URL(url);
    const saved = (await unseal('oauth', cookie, secret, now.getTime())) as unknown as OAuthState;

    expect(u.origin + u.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      client_id: 'google-client', redirect_uri: 'https://fairwayatelier.com/auth/google/callback', response_type: 'code',
      scope: 'openid email profile', state: saved.state, nonce: saved.nonce, code_challenge_method: 'S256',
    });
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(saved.verifier)));
    expect(u.searchParams.get('code_challenge')).toBe(b64url(digest));
    expect(saved.state.length).toBeGreaterThanOrEqual(22);
    expect(saved.nonce).not.toBe(saved.state);
  });

  it('sends the guest to Apple asking for a form post back, with name and email', async () => {
    const { url, cookie } = await beginOAuth('apple', APPLE, origin, {}, secret, now);
    const u = new URL(url);
    const saved = (await unseal('oauth', cookie, secret, now.getTime())) as unknown as OAuthState;
    expect(u.origin + u.pathname).toBe('https://appleid.apple.com/auth/authorize');
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      client_id: 'com.fairwayatelier.web', redirect_uri: 'https://fairwayatelier.com/auth/apple/callback', response_type: 'code',
      response_mode: 'form_post', scope: 'name email', state: saved.state, nonce: saved.nonce,
    });
  });

  it('keeps the onboarding answers and the destination in the cookie, cleaned up', async () => {
    const { cookie } = await beginOAuth(
      'google', GOOGLE, origin,
      { next: 'https://evil.example/', answers: { golf_level: 'mid', made_up: 'x', tier: 'platinum' }, marketing: 'yes' },
      secret, now,
    );
    expect(await unseal('oauth', cookie, secret, now.getTime())).toMatchObject({ provider: 'google', next: '/account', answers: { golf_level: 'mid' }, marketing: false });
  });

  it('lasts ten minutes and can never be read as a session', async () => {
    const { cookie } = await beginOAuth('google', GOOGLE, origin, {}, secret, now);
    expect(await unseal('oauth', cookie, secret, now.getTime() + 599_000)).not.toBeNull();
    expect(await unseal('oauth', cookie, secret, now.getTime() + 601_000)).toBeNull();
    expect(await readSession(cookie, secret, now.getTime())).toBeNull();
  });

  it('refuses a provider that is not set up', async () => {
    await expect(beginOAuth('apple', GOOGLE, origin, {}, secret, now)).rejects.toThrow();
  });

  it('uses a cross-site cookie for Apple only, since Apple comes back with a form post', () => {
    expect(oauthCookieOptions('google')).toMatchObject({ sameSite: 'lax', httpOnly: true, secure: true, path: '/', maxAge: 600 });
    expect(oauthCookieOptions('apple')).toMatchObject({ sameSite: 'none', httpOnly: true, secure: true, path: '/', maxAge: 600 });
  });
});

describe('exchangeCode', () => {
  const claims = { sub: 'sub-1', email: 'Anne@Example.com', email_verified: true, given_name: 'Anne', family_name: 'Martin', nonce: 'nonce-1' };

  it('swaps the code for a verified Google identity', async () => {
    const { fetcher, calls } = tokenEndpoint({ id_token: await mint(claims) });
    const found = await exchangeCode('google', GOOGLE, origin, 'code-1', state(), { fetch: fetcher, keys, now });
    expect(found).toEqual({ provider: 'google', subject: 'sub-1', email: 'anne@example.com', emailVerified: true, firstName: 'Anne', lastName: 'Martin' });
    expect(calls[0].url).toBe('https://oauth2.googleapis.com/token');
    expect(Object.fromEntries(calls[0].form)).toEqual({
      grant_type: 'authorization_code', code: 'code-1', client_id: 'google-client', client_secret: 'google-secret',
      redirect_uri: 'https://fairwayatelier.com/auth/google/callback', code_verifier: 'verifier-1',
    });
  });

  it('refuses an ID token that was not signed by the provider', async () => {
    const { fetcher } = tokenEndpoint({ id_token: await mintWithOtherKey(claims) });
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: fetcher, keys, now })).rejects.toThrow();
    const { fetcher: f2 } = tokenEndpoint({ id_token: await mint(claims) });
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: f2, keys: otherKeys, now })).rejects.toThrow();
  });

  it('refuses an unsigned token', async () => {
    const part = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
    const unsigned = `${part({ alg: 'none' })}.${part({ ...claims, iss: 'https://accounts.google.com', aud: 'google-client', exp: later(3_600_000).getTime() / 1000 })}.`;
    const { fetcher } = tokenEndpoint({ id_token: unsigned });
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: fetcher, keys, now })).rejects.toThrow();
  });

  it('refuses a token for another app, from another issuer, or past its expiry', async () => {
    for (const opts of [{ audience: 'someone-elses-client' }, { issuer: 'https://evil.example' }, { expires: later(-1000) }]) {
      const { fetcher } = tokenEndpoint({ id_token: await mint(claims, opts) });
      await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: fetcher, keys, now }), JSON.stringify(opts)).rejects.toThrow();
    }
  });

  it('refuses a token minted for another sign-in attempt (nonce)', async () => {
    const { fetcher } = tokenEndpoint({ id_token: await mint({ ...claims, nonce: 'someone-elses-nonce' }) });
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: fetcher, keys, now })).rejects.toThrow();
    const { fetcher: f2 } = tokenEndpoint({ id_token: await mint({ ...claims, nonce: undefined }) });
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: f2, keys, now })).rejects.toThrow();
  });

  it('fails when the provider refuses the code or sends no ID token', async () => {
    const refused = tokenEndpoint({ error: 'invalid_grant' }, 400);
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: refused.fetcher, keys, now })).rejects.toThrow();
    const empty = tokenEndpoint({ access_token: 'x' });
    await expect(exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: empty.fetcher, keys, now })).rejects.toThrow();
  });

  it('treats a missing or false email_verified as unconfirmed', async () => {
    for (const email_verified of [false, undefined, 'false']) {
      const { fetcher } = tokenEndpoint({ id_token: await mint({ ...claims, email_verified }) });
      const found = await exchangeCode('google', GOOGLE, origin, 'c', state(), { fetch: fetcher, keys, now });
      expect(found.emailVerified, String(email_verified)).toBe(false);
    }
  });

  it('signs its own short-lived client secret for Apple, and reads Apple’s claims', async () => {
    const idToken = await mint(
      { sub: 'apple-sub', email: 'relay@privaterelay.appleid.com', email_verified: 'true', nonce: 'nonce-1' },
      { issuer: 'https://appleid.apple.com', audience: 'com.fairwayatelier.web' },
    );
    const { fetcher, calls } = tokenEndpoint({ id_token: idToken });
    const found = await exchangeCode('apple', APPLE, origin, 'code-9', state({ provider: 'apple', verifier: '' }), { fetch: fetcher, keys, now });
    expect(found).toEqual({ provider: 'apple', subject: 'apple-sub', email: 'relay@privaterelay.appleid.com', emailVerified: true, firstName: '', lastName: '' });

    const form = Object.fromEntries(calls[0].form);
    expect(calls[0].url).toBe('https://appleid.apple.com/auth/token');
    expect(form).toMatchObject({ grant_type: 'authorization_code', code: 'code-9', client_id: 'com.fairwayatelier.web', redirect_uri: 'https://fairwayatelier.com/auth/apple/callback' });
    expect(form).not.toHaveProperty('code_verifier');
    const { payload, protectedHeader } = await jwtVerify(form.client_secret, applePublicKey, {
      issuer: 'TEAM123456', subject: 'com.fairwayatelier.web', audience: 'https://appleid.apple.com', currentDate: now,
    });
    expect(protectedHeader).toMatchObject({ alg: 'ES256', kid: 'KEY1234567' });
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(600);
  });
});

describe('resolveOAuthAccount', () => {
  const extras = { answers: { golf_level: 'mid' }, marketing: false };

  it('creates a confirmed account with no password for a new guest', async () => {
    const { d1 } = accountsDb();
    const result = await resolveOAuthAccount(d1, profile(), { ...extras, marketing: true }, now);
    if (!result.ok) throw new Error(result.error);
    expect(result.created).toBe(true);
    expect(result.account).toMatchObject({
      email: 'anne@example.com', email_verified: 1, password_hash: null, role: 'customer', first_name: 'Anne', last_name: 'Martin',
      marketing_opt_in: 1, last_seen_at: now.toISOString(),
    });
    expect(await findIdentity(d1, 'google', 'sub-1')).toBe(result.account.id);
    const answers = await getAnswers(d1, result.account.id);
    expect(answers).toMatchObject([{ question: 'golf_level', value: 'mid', source: 'onboarding' }]);
  });

  it('signs a returning guest in by their provider id, even if their email there has changed', async () => {
    const { d1 } = accountsDb();
    const first = await resolveOAuthAccount(d1, profile(), extras, now);
    const again = await resolveOAuthAccount(d1, profile({ email: 'new-address@example.com' }), { answers: {}, marketing: false }, later(86_400_000));
    if (!first.ok || !again.ok) throw new Error('sign-in failed');
    expect(again.created).toBe(false);
    expect(again.account.id).toBe(first.account.id);
    expect(again.account).toMatchObject({ email: 'anne@example.com', last_seen_at: later(86_400_000).toISOString() });
  });

  it('links to a guest who confirmed the same email, keeping their password and sessions', async () => {
    const { d1 } = accountsDb();
    const existing = (await createAccount(d1, { email: 'anne@example.com', passwordHash: 'hash-1', emailVerified: true, signedIn: true }, now))!;
    const result = await resolveOAuthAccount(d1, profile(), extras, later(1000));
    if (!result.ok) throw new Error(result.error);
    expect(result).toMatchObject({ created: false, account: { id: existing.id, password_hash: 'hash-1', session_key: existing.session_key } });
    expect(await providersOf(d1, existing.id)).toEqual(['google']);
  });

  it('takes over an account whose email was never confirmed: the earlier password and sessions stop working', async () => {
    const { d1 } = accountsDb();
    const squatter = (await createAccount(d1, { email: 'anne@example.com', passwordHash: 'attacker-hash', firstName: 'Mallory', signedIn: true }, now))!;
    const result = await resolveOAuthAccount(d1, profile(), extras, later(1000));
    if (!result.ok) throw new Error(result.error);
    expect(result.account).toMatchObject({ id: squatter.id, password_hash: null, email_verified: 1 });
    expect(result.account.session_key).not.toBe(squatter.session_key);
    expect(await sessionAccount(d1, squatter.id, squatter.session_key)).toBeNull();
  });

  it('lets a guest claim the sheet the team started, keeping what the team recorded', async () => {
    const { d1 } = accountsDb();
    const sheet = (await createAccount(d1, { email: 'anne@example.com' }, now))!;
    await saveAnswers(d1, sheet.id, { tier: 'signature' }, 'team', now);
    const result = await resolveOAuthAccount(d1, profile(), extras, later(1000));
    if (!result.ok) throw new Error(result.error);
    expect(result).toMatchObject({ created: false, account: { id: sheet.id, email_verified: 1, first_name: 'Anne', last_name: 'Martin' } });
    expect(answersOf(await getAnswers(d1, sheet.id))).toEqual({ tier: 'signature', golf_level: 'mid' });
  });

  it('does not overwrite a name the guest already gave', async () => {
    const { d1 } = accountsDb();
    await createAccount(d1, { email: 'anne@example.com', emailVerified: true, firstName: 'Annie', signedIn: true }, now);
    const result = await resolveOAuthAccount(d1, profile(), extras, later(1000));
    expect(result.ok && result.account.first_name).toBe('Annie');
  });

  it('never turns the email opt-in off, and turns it on only when asked', async () => {
    const { d1 } = accountsDb();
    await createAccount(d1, { email: 'anne@example.com', emailVerified: true, marketing: true, signedIn: true }, now);
    const result = await resolveOAuthAccount(d1, profile(), { answers: {}, marketing: false }, later(1000));
    expect(result.ok && result.account.marketing_opt_in).toBe(1);
  });

  it('refuses an email the provider has not confirmed, creating and linking nothing', async () => {
    const { d1 } = accountsDb();
    const existing = (await createAccount(d1, { email: 'anne@example.com', passwordHash: 'hash-1', signedIn: true }, now))!;
    for (const p of [profile({ emailVerified: false }), profile({ email: '' }), profile({ email: 'other@example.com', emailVerified: false })]) {
      expect(await resolveOAuthAccount(d1, p, extras, later(1000))).toEqual({ ok: false, error: 'unverified' });
    }
    expect(await findIdentity(d1, 'google', 'sub-1')).toBeNull();
    expect(await getAccount(d1, existing.id)).toEqual(existing);
  });

  it('never opens an admin account, whatever Google or Apple say', async () => {
    const { d1 } = accountsDb();
    const account = (await createAccount(d1, { email: 'atelier@fairwayatelier.com', passwordHash: 'admin-hash', emailVerified: true, signedIn: true }, now))!;
    await setRole(d1, account.id, 'admin');
    const admin = (await getAccount(d1, account.id))!;

    expect(await resolveOAuthAccount(d1, profile({ email: 'atelier@fairwayatelier.com' }), extras, later(1000))).toEqual({ ok: false, error: 'admin' });
    expect(await providersOf(d1, admin.id)).toEqual([]);
    expect(await getAccount(d1, admin.id)).toEqual(admin);

    // Even an identity that somehow stayed linked does not sign an admin in.
    await addIdentity(d1, 'google', 'sub-1', admin.id, 'atelier@fairwayatelier.com');
    expect(await resolveOAuthAccount(d1, profile({ email: 'atelier@fairwayatelier.com' }), extras, later(2000))).toEqual({ ok: false, error: 'admin' });
  });
});

describe('completeOAuth', () => {
  const claims = { sub: 'sub-1', email: 'anne@example.com', email_verified: true, given_name: 'Anne', family_name: 'Martin' };

  async function started(provider: 'google' | 'apple' = 'google', input: Parameters<typeof beginOAuth>[3] = {}) {
    const env = { ...GOOGLE, ...APPLE };
    const { cookie } = await beginOAuth(provider, env, origin, input, secret, now);
    const saved = (await unseal('oauth', cookie, secret, now.getTime())) as unknown as OAuthState;
    return { env, cookie, saved };
  }

  it('signs a new guest in and sends them to their new profile', async () => {
    const { d1 } = accountsDb();
    const { env, cookie, saved } = await started('google', { answers: { party: 'friends' }, next: '/admin' });
    const { fetcher } = tokenEndpoint({ id_token: await mint({ ...claims, nonce: saved.nonce }) });
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now: later(5000) }, 'google', { code: 'c', state: saved.state }, cookie);
    if (!result.outcome.ok) throw new Error(result.outcome.error);
    expect(result.next).toBe('/account?welcome=1');
    expect(result.outcome.created).toBe(true);
    expect(answersOf(await getAnswers(d1, result.outcome.account.id))).toEqual({ party: 'friends' });
  });

  it('sends a returning guest where they were going', async () => {
    const { d1 } = accountsDb();
    const existing = (await createAccount(d1, { email: 'anne@example.com', emailVerified: true, signedIn: true }, now))!;
    await addIdentity(d1, 'google', 'sub-1', existing.id, 'anne@example.com');
    const { env, cookie, saved } = await started('google', { next: '/account/export' });
    const { fetcher } = tokenEndpoint({ id_token: await mint({ ...claims, nonce: saved.nonce }) });
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now: later(5000) }, 'google', { code: 'c', state: saved.state }, cookie);
    expect(result).toMatchObject({ next: '/account/export', outcome: { ok: true, created: false, account: { id: existing.id } } });
  });

  it('stops when the state does not match, without calling the provider', async () => {
    const { d1 } = accountsDb();
    const { env, cookie, saved } = await started();
    const { fetcher } = tokenEndpoint({});
    const deps = { db: d1, env, origin, secret, fetch: fetcher, keys, now: later(5000) };
    for (const [params, c] of [
      [{ code: 'c', state: 'forged' }, cookie],
      [{ code: 'c' }, cookie],
      [{ code: 'c', state: saved.state }, undefined],
      [{ code: 'c', state: saved.state }, 'garbage'],
    ] as const) {
      expect((await completeOAuth(deps, 'google', params, c)).outcome).toEqual({ ok: false, error: 'expired' });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not accept a Google sign-in cookie on the Apple callback', async () => {
    const { d1 } = accountsDb();
    const { env, cookie, saved } = await started('google');
    const { fetcher } = tokenEndpoint({});
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now }, 'apple', { code: 'c', state: saved.state }, cookie);
    expect(result.outcome).toEqual({ ok: false, error: 'expired' });
  });

  it('stops once the ten minutes are up', async () => {
    const { d1 } = accountsDb();
    const { env, cookie, saved } = await started();
    const { fetcher } = tokenEndpoint({});
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now: later(601_000) }, 'google', { code: 'c', state: saved.state }, cookie);
    expect(result.outcome).toEqual({ ok: false, error: 'expired' });
  });

  it('reports a cancelled sign-in as such', async () => {
    const { d1 } = accountsDb();
    const { env, cookie, saved } = await started();
    const { fetcher } = tokenEndpoint({});
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now }, 'google', { error: 'access_denied', state: saved.state }, cookie);
    expect(result.outcome).toEqual({ ok: false, error: 'cancelled' });
  });

  it('fails quietly when the provider rejects the code, logging why', async () => {
    const { d1 } = accountsDb();
    const { env, cookie, saved } = await started();
    const { fetcher } = tokenEndpoint({ error: 'invalid_grant' }, 400);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now }, 'google', { code: 'c', state: saved.state }, cookie);
    expect(result.outcome).toEqual({ ok: false, error: 'failed' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('uses the name Apple sends with the first sign-in, and ignores a malformed one', async () => {
    const appleClaims = { sub: 'apple-sub', email: 'anne@example.com', email_verified: 'true' };
    const opts = { issuer: 'https://appleid.apple.com', audience: 'com.fairwayatelier.web' };
    for (const [user, first, last] of [
      [JSON.stringify({ name: { firstName: ' Anne ', lastName: 'Martin' }, email: 'anne@example.com' }), 'Anne', 'Martin'],
      ['{not json', '', ''],
      [JSON.stringify({ name: 'Anne' }), '', ''],
      [undefined, '', ''],
    ] as const) {
      const { d1 } = accountsDb();
      const { env, cookie, saved } = await started('apple');
      const { fetcher } = tokenEndpoint({ id_token: await mint({ ...appleClaims, nonce: saved.nonce }, opts) });
      const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now }, 'apple', { code: 'c', state: saved.state, user }, cookie);
      if (!result.outcome.ok) throw new Error(result.outcome.error);
      expect(result.outcome.account).toMatchObject({ first_name: first, last_name: last });
    }
  });

  it('keeps an admin out even after a successful Google sign-in', async () => {
    const { d1 } = accountsDb();
    const account = (await createAccount(d1, { email: 'anne@example.com', passwordHash: 'h', signedIn: true }, now))!;
    await markEmailVerified(d1, account.id);
    await setRole(d1, account.id, 'admin');
    const { env, cookie, saved } = await started();
    const { fetcher } = tokenEndpoint({ id_token: await mint({ ...claims, nonce: saved.nonce }) });
    const result = await completeOAuth({ db: d1, env, origin, secret, fetch: fetcher, keys, now }, 'google', { code: 'c', state: saved.state }, cookie);
    expect(result.outcome).toEqual({ ok: false, error: 'admin' });
  });
});

describe('oauthErrorMessage', () => {
  it('has a plain sentence for every way a quick sign-in can end', () => {
    for (const code of ['expired', 'cancelled', 'failed', 'unverified', 'admin', 'unavailable']) {
      expect(oauthErrorMessage(code, 'google'), code).toMatch(/\.$/);
    }
    expect(oauthErrorMessage('cancelled', 'apple')).toContain('Apple');
  });

  it('says nothing for no error or an unknown code, and never echoes what was in the address', () => {
    expect(oauthErrorMessage(null, null)).toBe('');
    expect(oauthErrorMessage('<script>alert(1)</script>', 'google')).toBe('');
    expect(oauthErrorMessage('failed', '<b>evil</b>')).not.toContain('evil');
  });
});

describe('completeOAuth when the database fails', () => {
  it('sends the guest back to sign in instead of failing the request', async () => {
    const env = { ...GOOGLE };
    const { cookie } = await beginOAuth('google', env, origin, {}, secret, now);
    const saved = (await unseal('oauth', cookie, secret, now.getTime())) as unknown as OAuthState;
    const { fetcher } = tokenEndpoint({ id_token: await mint({ sub: 's', email: 'anne@example.com', email_verified: true, nonce: saved.nonce }) });
    const broken = { prepare: () => { throw new Error('D1 unavailable'); } } as unknown as D1Database;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await completeOAuth({ db: broken, env, origin, secret, fetch: fetcher, keys, now }, 'google', { code: 'c', state: saved.state }, cookie);
    expect(result.outcome).toEqual({ ok: false, error: 'failed' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
