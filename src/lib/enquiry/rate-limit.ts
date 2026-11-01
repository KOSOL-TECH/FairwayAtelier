/**
 * Fixed-window, in-memory rate limit per client key. Adequate for a single
 * long-lived Node process; on serverless hosting each instance has its own
 * memory, so move this to the platform's KV/edge rate limiting (or Turnstile).
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; start: number }>();

export function rateLimited(key: string, now = Date.now()): boolean {
  const entry = hits.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { count: 1, start: now });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}
