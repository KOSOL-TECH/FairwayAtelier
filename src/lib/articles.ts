import { Marked } from 'marked';
import type { Media } from './media';

/**
 * Journal articles (D1 `articles`, migrations/0005), edited in /admin/journal
 * and shown at /journal and /journal/<slug>.
 */
export interface ArticleRow {
  slug: string;
  sort_order: number;
  eyebrow: string;
  kicker: string;
  title: string;
  excerpt: string;
  hero_media_id: string | null;
  lede: string;
  body: string;
  next_slug: string | null;
  featured: number;
  published: number;
  updated_at: string;
}

type HeroFields = Pick<Media, 'id' | 'width' | 'height' | 'alt'>;

export interface Article extends ArticleRow {
  hero: HeroFields | null;
  /** The next article's kicker, used as the "Continue reading" label */
  next_label: string | null;
  /** e.g. "5 min" */
  read_time: string;
}

/**
 * Markdown renderer for article bodies and legal pages. Raw HTML is shown as
 * text, never run. Bare email and web addresses stay plain text (no automatic
 * links); write [text](https://…) for a link.
 */
const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Links and images may only point at web pages, email, phone or this site:
 * `javascript:`, `data:` and other schemes are dropped, even when written
 * with character references (e.g. `java&#x73;cript:`) or mixed case.
 */
export function isSafeUrl(href: string): boolean {
  const decoded = href
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&colon;/gi, ':')
    .replace(/[\u0000- \u007f-\u009f]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(decoded)?.[1]?.toLowerCase();
  return scheme === undefined || ['http', 'https', 'mailto', 'tel'].includes(scheme);
}

const md = new Marked({ gfm: true, breaks: false });
md.use({
  tokenizer: {
    url: () => undefined,
  },
  renderer: {
    html: ({ text }) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    // Returning false keeps marked's own rendering; an unsafe target keeps only the text.
    link(token) {
      return isSafeUrl(token.href) ? false : this.parser.parseInline(token.tokens);
    },
    image(token) {
      return isSafeUrl(token.href) ? false : escapeText(token.text);
    },
  },
});

export const renderMarkdown = (body: string) => md.parse(body, { async: false }) as string;

/** About 200 words a minute, counting the lede; at least 1 minute. */
export function readTime(a: Pick<ArticleRow, 'lede' | 'body'>): string {
  const words = `${a.lede} ${a.body}`.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

const SELECT = `SELECT a.*, m.id AS m_id, m.width AS m_width, m.height AS m_height, m.alt AS m_alt, n.kicker AS next_label
  FROM articles a LEFT JOIN media m ON m.id = a.hero_media_id LEFT JOIN articles n ON n.slug = a.next_slug AND n.published = 1`;

type Joined = ArticleRow & { m_id: string | null; m_width: number; m_height: number; m_alt: string; next_label: string | null };

const shape = ({ m_id, m_width, m_height, m_alt, ...a }: Joined): Article => ({
  ...a,
  hero: m_id ? { id: m_id, width: m_width, height: m_height, alt: m_alt } : null,
  read_time: readTime(a),
});

export async function publishedArticles(db: D1Database): Promise<Article[]> {
  const { results } = await db.prepare(`${SELECT} WHERE a.published = 1 ORDER BY a.sort_order, a.title`).all<Joined>();
  return results.map(shape);
}

export async function allArticles(db: D1Database): Promise<Article[]> {
  const { results } = await db.prepare(`${SELECT} ORDER BY a.published DESC, a.sort_order, a.title`).all<Joined>();
  return results.map(shape);
}

export async function getArticle(db: D1Database, slug: string, { publishedOnly = true } = {}): Promise<Article | null> {
  const row = await db
    .prepare(`${SELECT} WHERE a.slug = ?${publishedOnly ? ' AND a.published = 1' : ''}`)
    .bind(slug)
    .first<Joined>();
  return row ? shape(row) : null;
}

/** The large card on /journal: the first published article marked featured, else the first published one. */
export function splitFeatured(articles: Article[]): { featured: Article | null; rest: Article[] } {
  const featured = articles.find((a) => a.featured) ?? articles[0] ?? null;
  return { featured, rest: articles.filter((a) => a !== featured) };
}

// ---------- Editing ----------

export type ArticleInput = Omit<ArticleRow, 'updated_at' | 'featured' | 'published'> & { featured: boolean; published: boolean };
export type ArticleErrors = Partial<Record<keyof ArticleInput, string>>;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Why we chose Brittany!" → "why-we-chose-brittany" */
export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export function parseArticleForm(form: FormData): ArticleInput {
  const s = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
  const title = s('title', 200);
  return {
    slug: s('slug', 80) || slugify(title),
    sort_order: Number(form.get('sort_order')) || 0,
    eyebrow: s('eyebrow', 120),
    kicker: s('kicker', 60),
    title,
    excerpt: s('excerpt', 400),
    hero_media_id: s('hero_media_id', 64) || null,
    lede: s('lede', 1000),
    body: String(form.get('body') ?? '').replace(/\r\n/g, '\n').trim().slice(0, 50_000),
    next_slug: s('next_slug', 80) || null,
    featured: form.get('featured') === 'on',
    published: form.get('published') === 'on',
  };
}

export function validateArticle(a: ArticleInput): ArticleErrors {
  const errs: ArticleErrors = {};
  if (!SLUG_RE.test(a.slug)) errs.slug = 'Use lower-case letters, numbers and hyphens, e.g. why-we-chose-brittany.';
  if (!a.title) errs.title = 'Required.';
  if (!a.kicker) errs.kicker = 'Required, e.g. The Golf.';
  if (!a.eyebrow) errs.eyebrow = 'Required, e.g. Our USP · The Golf.';
  if (a.next_slug === a.slug) errs.next_slug = 'Choose a different article.';
  if (a.published) {
    if (!a.hero_media_id) errs.hero_media_id = 'Choose an image before publishing.';
    if (!a.lede) errs.lede = 'Write the opening paragraph before publishing.';
    if (!a.body) errs.body = 'Write the article before publishing.';
    if (!a.excerpt) errs.excerpt = 'Write the card text before publishing.';
  }
  return errs;
}

const cols = ['slug', 'sort_order', 'eyebrow', 'kicker', 'title', 'excerpt', 'hero_media_id', 'lede', 'body', 'next_slug', 'featured', 'published'] as const;
const vals = (a: ArticleInput) => cols.map((c) => (c === 'featured' || c === 'published' ? (a[c] ? 1 : 0) : a[c]));

/** @returns false if the slug is taken. */
export async function createArticle(db: D1Database, a: ArticleInput): Promise<boolean> {
  const row = await db
    .prepare(`INSERT INTO articles (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) ON CONFLICT(slug) DO NOTHING RETURNING slug`)
    .bind(...vals(a))
    .first();
  return !!row;
}

/** Saves an article, possibly under a new slug (links pointing at the old slug follow it). @returns false if the new slug is taken. */
export async function updateArticle(db: D1Database, oldSlug: string, a: ArticleInput): Promise<boolean> {
  if (a.slug !== oldSlug && (await db.prepare('SELECT 1 FROM articles WHERE slug = ?').bind(a.slug).first())) return false;
  await db.batch([
    db
      .prepare(`UPDATE articles SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE slug = ?`)
      .bind(...vals(a), oldSlug),
    db.prepare('UPDATE articles SET next_slug = ? WHERE next_slug = ?').bind(a.slug, oldSlug),
  ]);
  return true;
}

export async function deleteArticle(db: D1Database, slug: string) {
  await db.batch([
    db.prepare('UPDATE articles SET next_slug = NULL WHERE next_slug = ?').bind(slug),
    db.prepare('DELETE FROM articles WHERE slug = ?').bind(slug),
  ]);
}
