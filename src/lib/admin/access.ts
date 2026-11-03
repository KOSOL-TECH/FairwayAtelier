/**
 * Verifies the Cloudflare Access token on admin requests.
 *
 * Access (configured in the Zero Trust dashboard) already blocks anyone who is
 * not signed in, and adds a signed JWT in the `Cf-Access-Jwt-Assertion`
 * header. Checking it here as well means a missing or misconfigured Access
 * policy cannot expose the admin: without a valid token, the Worker refuses.
 */
export interface AccessConfig {
  /** e.g. "fairwayatelier.cloudflareaccess.com" */
  teamDomain: string;
  /** The Access application's Audience (AUD) tag */
  aud: string;
}

interface Jwk extends JsonWebKey {
  kid: string;
}

type FetchKeys = (url: string) => Promise<{ keys: Jwk[] }>;

const fetchKeys: FetchKeys = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Access certs: HTTP ${res.status}`);
  return res.json();
};

/** Public keys per team domain, kept for the life of the isolate (Access rotates keys every 6 weeks). */
const keyCache = new Map<string, Map<string, CryptoKey>>();

async function getKey(teamDomain: string, kid: string, load: FetchKeys): Promise<CryptoKey | undefined> {
  let keys = keyCache.get(teamDomain);
  if (!keys?.has(kid)) {
    // Unknown kid: reload once, in case the keys rotated.
    const { keys: jwks } = await load(`https://${teamDomain}/cdn-cgi/access/certs`);
    keys = new Map();
    for (const jwk of jwks) {
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      keys.set(jwk.kid, key);
    }
    keyCache.set(teamDomain, keys);
  }
  return keys.get(kid);
}

const b64urlBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

/**
 * @returns the signed-in user's email, or null if the token is missing, forged,
 *   expired, or issued for another application.
 */
export async function verifyAccessJwt(
  token: string | null,
  config: AccessConfig,
  { now = Date.now(), load = fetchKeys }: { now?: number; load?: FetchKeys } = {},
): Promise<string | null> {
  if (!token || !config.teamDomain || !config.aud) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const [h, p, sig] = parts;
    const header = b64urlJson(h);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
    const key = await getKey(config.teamDomain, header.kid, load);
    if (!key) return null;
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(sig), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;

    const claims = b64urlJson(p);
    const aud: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(config.aud)) return null;
    if (claims.iss !== `https://${config.teamDomain}`) return null;
    const secs = now / 1000;
    if (typeof claims.exp !== 'number' || claims.exp < secs) return null;
    if (typeof claims.nbf === 'number' && claims.nbf > secs + 60) return null;
    return typeof claims.email === 'string' && claims.email ? claims.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Test hook: forget cached keys. */
export function clearKeyCache() {
  keyCache.clear();
}
