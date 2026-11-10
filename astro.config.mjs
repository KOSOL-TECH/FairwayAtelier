// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';

// Pages render on demand in the Worker so admin edits (D1) show without a
// rebuild. Public pages are kept in Cloudflare's Worker cache (`cache` in
// wrangler.jsonc) and purged when an admin change is saved (src/middleware.ts).
export default defineConfig({
  site: 'https://fairwayatelier.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'preserve' },
  // Images on prerendered pages are optimised with Sharp at build time; pages
  // rendered on demand (CMS-driven, docs/admin.md) resize through the IMAGES binding.
  adapter: cloudflare({ imageService: { build: 'compile', runtime: 'cloudflare-binding' } }),
  // No sessions are used, so no KV namespace is provisioned for them.
  session: false,
  cache: { provider: cacheCloudflare() },
  // Cross-site writes are refused in src/middleware.ts instead (isCrossSiteWrite):
  // the same check, on every non-GET request rather than form posts only, with
  // one exception Astro's built-in check cannot make: Apple's sign-in callback.
  security: { checkOrigin: false },
  integrations: [react()],
});
