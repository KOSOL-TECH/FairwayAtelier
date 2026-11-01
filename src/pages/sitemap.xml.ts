import type { APIRoute } from 'astro';
import { SITEMAP, canonical } from '../lib/site';

export const GET: APIRoute = () => {
  const urls = SITEMAP.map(({ path, changefreq, priority }) =>
    `  <url>\n    <loc>${canonical(path)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
