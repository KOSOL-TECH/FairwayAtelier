import { env } from 'cloudflare:workers';

/**
 * Per-IP limit on enquiry submissions, enforced by the Workers rate-limiting
 * binding (configured in wrangler.jsonc: 5 requests per 60 seconds). The
 * binding counts per Cloudflare location, so it is a spam brake, not an
 * exact global quota.
 */
export async function rateLimited(key: string): Promise<boolean> {
  const limiter = env.ENQUIRY_LIMITER;
  if (!limiter) return false; // binding absent (e.g. misconfigured preview): fail open, honeypot still applies
  const { success } = await limiter.limit({ key: `enquiry:${key}` });
  return !success;
}
