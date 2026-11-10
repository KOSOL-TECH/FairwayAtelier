import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { SITEMAP, canonical } from '../lib/site';
import { publishedArticles } from '../lib/articles';

// Rendered on each request so published journal articles are listed as soon as they go live.
export const prerender = false;

/** Articles carry the date they were last edited; the fixed pages have no reliable date, so none is given. */
type Entry = { path: string; changefreq: string; priority: string; lastmod?: string };

export const GET: APIRoute = async () => {
  const articles: Entry[] = (await publishedArticles(env.DB)).map((a) => ({
    path: `/journal/${a.slug}`,
    changefreq: 'monthly',
    priority: '0.6',
    lastmod: a.updated_at.slice(0, 10),
  }));
  const journalAt = SITEMAP.findIndex((e) => e.path === '/journal') + 1;
  const entries: Entry[] = [...SITEMAP.slice(0, journalAt), ...articles, ...SITEMAP.slice(journalAt)];
  const urls = entries.map(({ path, changefreq, priority, lastmod }) =>
    `  <url>\n    <loc>${canonical(path)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
