import { renderMarkdown } from './articles';
import type { Media } from './media';

/**
 * Editable page copy and images (/admin/pages).
 *
 * Each page declares its blocks once, in src/lib/pages/<page>.ts, with the
 * approved original as the default. D1 `page_blocks` (migrations/0006) holds
 * only the blocks an editor has changed. A page loads its copy with
 * `loadPage()` and renders `c.t.<key>`, `c.md(<key>)` and `c.img(<key>)`.
 */
export type BlockKind = 'line' | 'text' | 'markdown' | 'image';

export interface BlockDef {
  /** Field label in the admin, e.g. "Hero title" */
  label: string;
  /** The approved original. For an image block, a media library id. */
  default: string;
  /** line: one line (default) · text: a paragraph · markdown: rich text (legal pages) · image: a media library image */
  kind?: BlockKind;
  /** Optional hint under the field */
  help?: string;
  /** Groups fields under a heading in the admin, e.g. "Hero" */
  group?: string;
}

export interface PageDef<K extends string = string> {
  /** Registry id, stored in page_blocks.page; never change it once live */
  id: string;
  /** Name in the admin */
  label: string;
  /** Public URL, for the admin's "View" link */
  path: string;
  blocks: Record<K, BlockDef>;
}

/** Declares a page's editable blocks; keeps the keys typed for `c.t.<key>`. */
export const definePage = <K extends string>(def: PageDef<K>) => def;

export const kindOf = (b: BlockDef): BlockKind => b.kind ?? 'line';

type MediaFields = Pick<Media, 'id' | 'width' | 'height' | 'alt'>;

export interface PageCopy<K extends string> {
  /** Every block's current value (text, Markdown source, or media id) */
  t: Record<K, string>;
  /** A markdown block rendered to HTML, for `set:html` */
  md(key: K): string;
  /** An image block's media, or null if the image was deleted */
  img(key: K): MediaFields | null;
}

/** Merges stored edits over the defaults. Pure, so it can be tested without D1. */
export function mergeBlocks<K extends string>(def: PageDef<K>, rows: { block: string; value: string }[]): Record<K, string> {
  const t = Object.fromEntries(Object.entries<BlockDef>(def.blocks).map(([k, b]) => [k, b.default.trim()])) as Record<K, string>;
  for (const r of rows) if (r.block in def.blocks) t[r.block as K] = r.value;
  return t;
}

/**
 * Loads a page's copy. If D1 cannot be read, the page still renders with the
 * approved originals (and without content photos, which are served from D1 too)
 * rather than failing the whole site.
 */
export async function loadPage<K extends string>(db: D1Database, def: PageDef<K>): Promise<PageCopy<K>> {
  let t = mergeBlocks(def, []);
  const media = new Map<string, MediaFields>();
  try {
    const { results } = await db.prepare('SELECT block, value FROM page_blocks WHERE page = ?').bind(def.id).all<{ block: string; value: string }>();
    t = mergeBlocks(def, results);

    const imageKeys = (Object.keys(def.blocks) as K[]).filter((k) => kindOf(def.blocks[k]) === 'image');
    const ids = [...new Set(imageKeys.map((k) => t[k]).filter(Boolean))];
    if (ids.length) {
      const rows = await db
        .prepare(`SELECT id, width, height, alt FROM media WHERE id IN (${ids.map(() => '?').join(', ')})`)
        .bind(...ids)
        .all<MediaFields>();
      for (const m of rows.results) media.set(m.id, m);
    }
  } catch (err) {
    console.error(`[copy] could not load page "${def.id}", showing the originals`, err);
  }

  return {
    t,
    md: (key) => renderMarkdown(t[key]),
    img: (key) => media.get(t[key]) ?? null,
  };
}

/**
 * Saves an editor's values for one page. A value equal to the original is not
 * stored (its row is removed), so "restore the original" is just pasting it back.
 * @returns the keys whose stored value changed.
 */
export async function savePage(db: D1Database, def: PageDef, values: Record<string, string>, email: string): Promise<string[]> {
  const { results } = await db.prepare('SELECT block, value FROM page_blocks WHERE page = ?').bind(def.id).all<{ block: string; value: string }>();
  const current = mergeBlocks(def, results);
  const changed: string[] = [];
  const stmts: D1PreparedStatement[] = [];
  for (const [key, b] of Object.entries<BlockDef>(def.blocks)) {
    if (!(key in values)) continue;
    const value = kindOf(b) === 'line' ? values[key].replace(/\s+/g, ' ').trim() : values[key].replace(/\r\n/g, '\n').trim();
    if (value === current[key as keyof typeof current]) continue;
    changed.push(key);
    stmts.push(
      value === b.default.trim()
        ? db.prepare('DELETE FROM page_blocks WHERE page = ? AND block = ?').bind(def.id, key)
        : db
            .prepare(
              `INSERT INTO page_blocks (page, block, kind, value, updated_by) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (page, block) DO UPDATE SET kind = excluded.kind, value = excluded.value, updated_by = excluded.updated_by,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
            )
            .bind(def.id, key, kindOf(b), value, email),
    );
  }
  if (stmts.length) await db.batch(stmts);
  return changed;
}

/** Block keys that currently differ from the original, for the admin's "Edited" markers. */
export async function editedBlocks(db: D1Database, pageId: string): Promise<Set<string>> {
  const { results } = await db.prepare('SELECT block FROM page_blocks WHERE page = ?').bind(pageId).all<{ block: string }>();
  return new Set(results.map((r) => r.block));
}
