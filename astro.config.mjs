// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// Every page is prerendered to static HTML and served from Cloudflare's asset
// store. Only /api/enquiry runs in the Worker.
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
  integrations: [react()],
});
