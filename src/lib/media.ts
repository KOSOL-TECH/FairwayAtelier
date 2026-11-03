/**
 * Media library: files in R2 (`MEDIA`), described in D1 (`media`,
 * migrations/0005). Served from /media/<id>, resized on request by the Images
 * binding (src/pages/media/[id].ts). A file's id never changes and its bytes
 * are never replaced, so responses can be cached forever.
 */
import type { PageDef } from './copy';

export interface Media {
  id: string;
  r2_key: string;
  filename: string;
  content_type: string;
  size: number;
  width: number;
  height: number;
  alt: string;
  uploaded_by: string;
  uploaded_at: string;
}

export const ACCEPTED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** The only widths /media serves, so the 5,000 free transformations a month cannot be used up by arbitrary sizes. */
export const WIDTHS = [320, 640, 960, 1280, 1600, 2000] as const;

/** Rounds a requested width up to the nearest allowed one (capped at the largest). */
export function snapWidth(w: number): number {
  return WIDTHS.find((x) => x >= w) ?? WIDTHS[WIDTHS.length - 1];
}

/** Picks the best output format the browser accepts. */
export function pickFormat(accept: string | null): 'image/avif' | 'image/webp' | 'image/jpeg' {
  if (accept?.includes('image/avif')) return 'image/avif';
  if (accept?.includes('image/webp')) return 'image/webp';
  return 'image/jpeg';
}

export const mediaUrl = (id: string, width?: number) => `/media/${encodeURIComponent(id)}${width ? `?w=${width}` : ''}`;

/** srcset entries for the allowed widths up to the image's own width (never upscaled). */
export function srcset(m: Pick<Media, 'id' | 'width'>): string {
  const widths: number[] = WIDTHS.filter((w) => w <= m.width);
  if (widths.length === 0 || widths[widths.length - 1] < m.width) widths.push(snapWidth(m.width));
  return [...new Set(widths)].map((w) => `${mediaUrl(m.id, w)} ${Math.min(w, m.width)}w`).join(', ');
}

// ---------- D1 ----------

export async function listMedia(db: D1Database): Promise<Media[]> {
  return (await db.prepare('SELECT * FROM media ORDER BY uploaded_at DESC').all<Media>()).results;
}

export async function getMedia(db: D1Database, id: string): Promise<Media | null> {
  return db.prepare('SELECT * FROM media WHERE id = ?').bind(id).first<Media>();
}

export async function insertMedia(db: D1Database, m: Omit<Media, 'uploaded_at'>) {
  await db
    .prepare('INSERT INTO media (id, r2_key, filename, content_type, size, width, height, alt, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(m.id, m.r2_key, m.filename, m.content_type, m.size, m.width, m.height, m.alt, m.uploaded_by)
    .run();
}

export async function updateAlt(db: D1Database, id: string, alt: string) {
  await db.prepare('UPDATE media SET alt = ? WHERE id = ?').bind(alt, id).run();
}

/**
 * Where a file is used; it can only be deleted when this is empty. Page images
 * count whether they are an editor's choice (page_blocks) or a block's
 * original, since an unedited page shows the original.
 */
export async function mediaUsage(db: D1Database, id: string, pages: PageDef[]): Promise<string[]> {
  const { results } = await db.prepare('SELECT title FROM articles WHERE hero_media_id = ?').bind(id).all<{ title: string }>();
  const { results: edits } = await db
    .prepare("SELECT page, block, value FROM page_blocks WHERE kind = 'image'")
    .all<{ page: string; block: string; value: string }>();
  const edited = new Map(edits.map((e) => [`${e.page}.${e.block}`, e.value]));
  const pageUses = pages.flatMap((p) =>
    Object.entries(p.blocks)
      .filter(([key, b]) => b.kind === 'image' && (edited.get(`${p.id}.${key}`) ?? b.default) === id)
      .map(([, b]) => `Page: ${p.label} · ${b.label}`),
  );
  return [...results.map((r) => `Journal: ${r.title}`), ...pageUses];
}

export async function deleteMedia(db: D1Database, bucket: R2Bucket, m: Media) {
  await db.prepare('DELETE FROM media WHERE id = ?').bind(m.id).run();
  await bucket.delete(m.r2_key);
}
