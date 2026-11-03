import { env } from 'cloudflare:workers';

/**
 * The site's 404 page for on-demand routes (e.g. an unknown or draft article).
 * Astro cannot rewrite to the prerendered 404 page at runtime, so this serves
 * its built HTML from the static assets with a 404 status.
 */
export async function notFound(url: URL): Promise<Response> {
  const page = await env.ASSETS?.fetch(new URL('/404', url)).catch(() => null);
  const html = page?.ok ? await page.text() : 'Not found';
  return new Response(html, { status: 404, headers: { 'Content-Type': page?.ok ? 'text/html; charset=utf-8' : 'text/plain' } });
}
