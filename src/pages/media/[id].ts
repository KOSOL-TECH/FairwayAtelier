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
/** Unknown ids are cached briefly too, so repeated requests for them do not each reach D1. */
const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } });

export const GET: APIRoute = async ({ params, request, url, locals }) => {
  const media = await getMedia(env.DB, params.id ?? '');
  if (!media) return notFound();

  const requested = Number(url.searchParams.get('w'));
  const width = requested > 0 ? Math.min(snapWidth(requested), media.width) : null;
  const format = width ? pickFormat(request.headers.get('Accept')) : null;

  // One cache entry per id, width and format, whatever else is in the URL.
  const cacheKey = new Request(`${url.origin}/media/${media.id}?w=${width ?? 'orig'}&f=${format ?? 'orig'}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const object = await env.MEDIA.get(media.r2_key);
  if (!object) return notFound();

  let res: Response;
  if (width && format) {
    try {
      const out = await env.IMAGES.input(object.body).transform({ width, fit: 'scale-down' }).output({ format, quality: 82 });
      const transformed = out.response();
      res = new Response(transformed.body, transformed);
    } catch (err) {
      // Serve the original rather than a broken image, but do not cache it under the resized key.
      console.error('[media] resize failed', media.id, width, format, err);
      const original = await env.MEDIA.get(media.r2_key);
      if (!original) return notFound();
      return new Response(original.body, { headers: { 'Content-Type': media.content_type, 'Cache-Control': 'public, max-age=300' } });
    }
  } else {
    res = new Response(object.body, { headers: { 'Content-Type': media.content_type } });
  }
  res.headers.set('Cache-Control', FOREVER);
  res.headers.set('Vary', 'Accept');
  // Store in the background so the image is not held back by the cache write.
  const put = cache.put(cacheKey, res.clone()).catch((err) => console.error('[media] cache put failed', err));
  const ctx = (locals as { cfContext?: ExecutionContext }).cfContext;
  if (ctx) ctx.waitUntil(put);
  else await put;
  return res;
};
