import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getMedia, pickFormat, snapWidth } from '../../lib/media';

export const prerender = false;

const FOREVER = 'public, max-age=31536000, immutable';

/**
 * GET /media/<id>[?w=<width>]: a media library file, resized to one of the
 * allowed widths and converted to AVIF or WebP when the browser accepts it.
 * Results are kept in the edge cache, so each size is transformed once per
 * location.
 */
export const GET: APIRoute = async ({ params, request, url }) => {
  const media = await getMedia(env.DB, params.id ?? '');
  if (!media) return new Response('Not found', { status: 404 });

  const requested = Number(url.searchParams.get('w'));
  const width = requested > 0 ? Math.min(snapWidth(requested), media.width) : null;
  const format = width ? pickFormat(request.headers.get('Accept')) : null;

  // One cache entry per id, width and format, whatever else is in the URL.
  const cacheKey = new Request(`${url.origin}/media/${media.id}?w=${width ?? 'orig'}&f=${format ?? 'orig'}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const object = await env.MEDIA.get(media.r2_key);
  if (!object) return new Response('Not found', { status: 404 });

  let res: Response;
  if (width && format) {
    const out = await env.IMAGES.input(object.body).transform({ width, fit: 'scale-down' }).output({ format, quality: 82 });
    res = out.response();
    res = new Response(res.body, res);
  } else {
    res = new Response(object.body, { headers: { 'Content-Type': media.content_type } });
  }
  res.headers.set('Cache-Control', FOREVER);
  res.headers.set('Vary', 'Accept');
  await cache.put(cacheKey, res.clone());
  return res;
};
