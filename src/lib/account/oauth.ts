/**
 * Quick sign-in with Google and Apple: the OpenID Connect authorization-code
 * flow against each provider's standard endpoints (PKCE for Google). Design and
 * the client's setup steps: docs/accounts.md.
 *
 * Between leaving for the provider and coming back, the state, nonce, PKCE
 * verifier, destination and onboarding answers sit in a signed ten-minute
 * cookie. ID tokens are verified against the provider's published keys.
 */
import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { safeNext } from './guard';
import { normaliseCore, normaliseEmail } from './profile';
import { normaliseAnswers, type Answers } from './questions';
import { b64url, randomToken, seal, unseal } from './signed';
import {
  addIdentity, createAccount, findIdentity, getAccount, getAccountByEmail, markEmailVerified, recordSignIn, saveAnswers, setMarketing,
  setPassword, updateCore, type AccountRow, type Provider,
} from './store';

export const PROVIDERS = ['google', 'apple'] as const satisfies readonly Provider[];
export const PROVIDER_LABEL: Record<Provider, string> = { google: 'Google', apple: 'Apple' };

export const isProvider = (value: unknown): value is Provider => value === 'google' || value === 'apple';

/** The Worker secrets each provider needs (docs/accounts.md). All optional: a provider is offered only once its secrets exist. */
export interface OAuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Apple "Services ID" */
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  /** Contents of the Sign in with Apple .p8 key */
  APPLE_PRIVATE_KEY?: string;
}

export function enabledProviders(env: OAuthEnv): Provider[] {
  const google = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET;
  const apple = env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY;
  return PROVIDERS.filter((p) => (p === 'google' ? google : apple));
}

const ENDPOINTS = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    keys: 'https://www.googleapis.com/oauth2/v3/certs',
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
    scope: 'openid email profile',
  },
  apple: {
    authorize: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    keys: 'https://appleid.apple.com/auth/keys',
    issuers: ['https://appleid.apple.com'],
    scope: 'name email',
  },
} as const;

const clientId = (provider: Provider, env: OAuthEnv) => (provider === 'google' ? env.GOOGLE_CLIENT_ID : env.APPLE_CLIENT_ID) ?? '';
const redirectUri = (provider: Provider, origin: string) => `${origin}/auth/${provider}/callback`;

export const OAUTH_COOKIE = '__Host-fa_oauth';
const OAUTH_SECONDS = 600;
const PURPOSE = 'oauth';

/**
 * Apple comes back with a form post from appleid.apple.com, and a browser does
 * not send a SameSite=Lax cookie with a cross-site post, so Apple's needs None.
 */
export const oauthCookieOptions = (provider: Provider) => ({
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: provider === 'apple' ? ('none' as const) : ('lax' as const),
  maxAge: OAUTH_SECONDS,
});

/** What the cookie remembers while the guest is at the provider. */
export interface OAuthState {
  provider: Provider;
  state: string;
  nonce: string;
  /** PKCE verifier (Google); '' for Apple */
  verifier: string;
  /** Where to go after signing in */
  next: string;
  /** Onboarding answers from /join, applied when the account is created or signed in to */
  answers: Answers;
  marketing: boolean;
}

/**
 * Starts a sign-in.
 * @param input untrusted `{ next, answers, marketing }` from the page that started it
 * @returns the provider URL to send the guest to, and the value for OAUTH_COOKIE
 */
export async function beginOAuth(
  provider: Provider,
  env: OAuthEnv,
  origin: string,
  input: { next?: unknown; answers?: unknown; marketing?: unknown },
  secret: string,
  now = new Date(),
): Promise<{ url: string; cookie: string }> {
  if (!enabledProviders(env).includes(provider)) throw new Error(`${provider} sign-in is not set up`);
  const saved: OAuthState = {
    provider,
    state: randomToken(24),
    nonce: randomToken(24),
    verifier: provider === 'google' ? randomToken(48) : '',
    next: safeNext(typeof input.next === 'string' ? input.next : null),
    answers: normaliseAnswers(input.answers),
    marketing: input.marketing === true,
  };

  const url = new URL(ENDPOINTS[provider].authorize);
  url.searchParams.set('client_id', clientId(provider, env));
  url.searchParams.set('redirect_uri', redirectUri(provider, origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', ENDPOINTS[provider].scope);
  url.searchParams.set('state', saved.state);
  url.searchParams.set('nonce', saved.nonce);
  if (provider === 'google') {
    const challenge = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(saved.verifier)));
    url.searchParams.set('code_challenge', b64url(challenge));
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('prompt', 'select_account');
  } else {
    // Apple only returns the name and email when it posts the result back as a form.
    url.searchParams.set('response_mode', 'form_post');
  }
  return { url: url.href, cookie: await seal(PURPOSE, { ...saved }, secret, OAUTH_SECONDS * 1000, now.getTime()) };
}

async function readState(cookie: string | undefined, secret: string | undefined, now: Date): Promise<OAuthState | null> {
  const data = await unseal(PURPOSE, cookie, secret, now.getTime());
  if (!data || !isProvider(data.provider)) return null;
  const { provider, state, nonce, verifier, next, answers, marketing } = data;
  if (typeof state !== 'string' || !state || typeof nonce !== 'string' || !nonce || typeof verifier !== 'string') return null;
  return { provider, state, nonce, verifier, next: safeNext(typeof next === 'string' ? next : null), answers: normaliseAnswers(answers), marketing: marketing === true };
}

/** What a provider vouches for after a sign-in. */
export interface ProviderProfile {
  provider: Provider;
  /** The provider's permanent id for this person */
  subject: string;
  /** Lower case; '' if the provider gave none */
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
}

/** Apple wants a client secret signed with the developer key, valid for minutes rather than a stored password. */
async function appleClientSecret(env: OAuthEnv, now: Date): Promise<string> {
  const pem = (env.APPLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n').trim();
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_KEY_ID })
    .setIssuer(env.APPLE_TEAM_ID ?? '')
    .setSubject(env.APPLE_CLIENT_ID ?? '')
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 300)
    .sign(await importPKCS8(pem, 'ES256'));
}

/** Each provider's published signing keys, fetched once per Worker instance and refreshed by jose when a new key id appears. */
const remoteKeys = new Map<Provider, JWTVerifyGetKey>();
function providerKeys(provider: Provider): JWTVerifyGetKey {
  let keys = remoteKeys.get(provider);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(ENDPOINTS[provider].keys));
    remoteKeys.set(provider, keys);
  }
  return keys;
}

export interface ExchangeDeps {
  fetch: typeof fetch;
  /** The provider's signing keys; the provider's published set by default */
  keys?: JWTVerifyGetKey;
  now?: Date;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Swaps the authorization code for an ID token and verifies it: signature,
 * issuer, audience (our client id), expiry, and the nonce of this sign-in.
 * Throws if anything is off.
 */
export async function exchangeCode(provider: Provider, env: OAuthEnv, origin: string, code: string, state: OAuthState, deps: ExchangeDeps): Promise<ProviderProfile> {
  const now = deps.now ?? new Date();
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId(provider, env),
    client_secret: provider === 'google' ? (env.GOOGLE_CLIENT_SECRET ?? '') : await appleClientSecret(env, now),
    redirect_uri: redirectUri(provider, origin),
  });
  if (provider === 'google') form.set('code_verifier', state.verifier);

  const res = await deps.fetch(ENDPOINTS[provider].token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: form.toString(),
  });
  const body = (await res.json().catch(() => ({}))) as { id_token?: unknown; error?: unknown };
  if (!res.ok || typeof body.id_token !== 'string') {
    throw new Error(`${provider} token endpoint answered ${res.status} ${text(body.error)}`.trim());
  }

  const { payload } = await jwtVerify(body.id_token, deps.keys ?? providerKeys(provider), {
    issuer: [...ENDPOINTS[provider].issuers],
    audience: clientId(provider, env),
    algorithms: ['RS256'],
    currentDate: now,
    requiredClaims: ['sub', 'exp'],
  });
  if (payload.nonce !== state.nonce) throw new Error(`${provider} ID token has the wrong nonce`);

  const names = normaliseCore({ first_name: text(payload.given_name), last_name: text(payload.family_name) });
  return {
    provider,
    subject: text(payload.sub),
    email: normaliseEmail(payload.email),
    // Apple sends the string "true".
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    firstName: names.first_name ?? '',
    lastName: names.last_name ?? '',
  };
}

/** unverified: the provider has not confirmed the email · admin: admins sign in with their password only · failed: try again */
export type OAuthOutcome = { ok: true; account: AccountRow; created: boolean } | { ok: false; error: 'unverified' | 'admin' | 'failed' };

/**
 * Finds or creates the account a Google/Apple sign-in opens.
 *
 * - An identity already on file signs that account in.
 * - Otherwise the provider must have confirmed the email. A guest account with
 *   that email is linked; if its own email was never confirmed, its password is
 *   removed first (which also ends its sessions), so whoever registered the
 *   address earlier does not keep access.
 * - Admin accounts are never opened this way.
 */
export async function resolveOAuthAccount(
  db: D1Database,
  profile: ProviderProfile,
  extras: { answers: Answers; marketing: boolean },
  now = new Date(),
): Promise<OAuthOutcome> {
  let created = false;
  let account: AccountRow | null = null;

  const linkedId = await findIdentity(db, profile.provider, profile.subject);
  if (linkedId) account = await getAccount(db, linkedId);

  if (!account) {
    if (!profile.email || !profile.emailVerified) return { ok: false, error: 'unverified' };
    account = await getAccountByEmail(db, profile.email);
    if (account?.role === 'admin') return { ok: false, error: 'admin' };
    if (account) {
      if (!account.email_verified) {
        if (account.password_hash) await setPassword(db, account.id, null, now);
        await markEmailVerified(db, account.id, now);
      }
    } else {
      account = await createAccount(
        db,
        { email: profile.email, emailVerified: true, firstName: profile.firstName, lastName: profile.lastName, marketing: extras.marketing, signedIn: true },
        now,
      );
      // Lost a race with another sign-up for the same address: the guest can simply try again.
      if (!account) return { ok: false, error: 'failed' };
      created = true;
    }
    await addIdentity(db, profile.provider, profile.subject, account.id, profile.email);
  }
  if (account.role === 'admin') return { ok: false, error: 'admin' };

  if (!created) {
    if (!account.first_name && !account.last_name && (profile.firstName || profile.lastName)) {
      await updateCore(db, account.id, { first_name: profile.firstName, last_name: profile.lastName }, now);
    }
    if (extras.marketing && !account.marketing_opt_in) await setMarketing(db, account.id, true, now);
  }
  await saveAnswers(db, account.id, extras.answers, 'onboarding', now);
  await recordSignIn(db, account.id, now);
  return { ok: true, account: (await getAccount(db, account.id))!, created };
}

export type OAuthErrorCode = 'expired' | 'cancelled' | 'failed' | 'unverified' | 'admin' | 'unavailable';

/** What the sign-in page says for each way a quick sign-in can end without signing anyone in. */
export function oauthErrorMessage(code: string | null, provider: string | null): string {
  const name = isProvider(provider) ? PROVIDER_LABEL[provider] : 'that service';
  switch (code as OAuthErrorCode | null) {
    case 'expired':
      return 'That sign-in took too long or was opened twice. Please try again.';
    case 'cancelled':
      return `Sign-in with ${name} was cancelled.`;
    case 'unverified':
      return `${name} has not confirmed your email address, so we cannot use it. Please sign in with your email and a password instead.`;
    case 'admin':
      return 'This profile signs in with its email and password.';
    case 'unavailable':
      return `Sign-in with ${name} is not available yet. Please use your email and a password.`;
    case 'failed':
      return `We could not sign you in with ${name}. Please try again, or use your email and a password.`;
    default:
      return '';
  }
}

export interface CompleteDeps extends ExchangeDeps {
  db: D1Database;
  env: OAuthEnv;
  origin: string;
  secret: string | undefined;
}

/** The name Apple includes, once, in the form it posts back after the guest's first sign-in. */
function appleName(user: string | undefined): { firstName: string; lastName: string } {
  try {
    const name = (JSON.parse(user ?? '') as { name?: { firstName?: unknown; lastName?: unknown } }).name;
    const tidy = normaliseCore({ first_name: text(name?.firstName), last_name: text(name?.lastName) });
    return { firstName: tidy.first_name ?? '', lastName: tidy.last_name ?? '' };
  } catch {
    return { firstName: '', lastName: '' };
  }
}

/**
 * Handles the provider's callback.
 * @param params what the provider sent back (query for Google, form fields for Apple)
 * @param cookie the OAUTH_COOKIE value
 * @returns the outcome and where to send the guest next
 */
export async function completeOAuth(
  deps: CompleteDeps,
  provider: Provider,
  params: { code?: string; state?: string; error?: string; user?: string },
  cookie: string | undefined,
): Promise<{ outcome: OAuthOutcome | { ok: false; error: OAuthErrorCode }; next: string }> {
  const now = deps.now ?? new Date();
  const saved = await readState(cookie, deps.secret, now);
  // The state proves this browser started this sign-in (it is what makes Apple's cross-site post safe).
  if (!saved || saved.provider !== provider || !params.state || params.state !== saved.state) {
    return { outcome: { ok: false, error: 'expired' }, next: '/account' };
  }
  if (params.error) return { outcome: { ok: false, error: 'cancelled' }, next: saved.next };
  if (!params.code) return { outcome: { ok: false, error: 'failed' }, next: saved.next };

  let profile: ProviderProfile;
  try {
    profile = await exchangeCode(provider, deps.env, deps.origin, params.code, saved, deps);
  } catch (err) {
    console.error(`[oauth] ${provider} sign-in failed`, err instanceof Error ? err.message : err);
    return { outcome: { ok: false, error: 'failed' }, next: saved.next };
  }
  if (provider === 'apple' && !profile.firstName && !profile.lastName) profile = { ...profile, ...appleName(params.user) };

  try {
    const outcome = await resolveOAuthAccount(deps.db, profile, { answers: saved.answers, marketing: saved.marketing }, now);
    return { outcome, next: outcome.ok && outcome.created ? '/account?welcome=1' : saved.next };
  } catch (err) {
    // The database could not be read or written: send the guest back to sign in, not to an error page.
    console.error(`[oauth] ${provider} sign-in could not open an account`, err instanceof Error ? err.message : err);
    return { outcome: { ok: false, error: 'failed' }, next: saved.next };
  }
}
