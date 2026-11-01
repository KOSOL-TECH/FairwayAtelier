// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// Every page is prerendered to static HTML. Only /api/enquiry runs on the server,
// so the adapter can be swapped (Netlify, Vercel, Cloudflare) once hosting is chosen.
export default defineConfig({
  site: 'https://fairwayatelier.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'preserve' },
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
});
