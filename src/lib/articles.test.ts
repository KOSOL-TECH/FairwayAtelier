import { describe, expect, it } from 'vitest';
import { readTime, renderMarkdown, slugify, splitFeatured, validateArticle, type Article, type ArticleInput } from './articles';
import { pickFormat, snapWidth, srcset } from './media';

describe('renderMarkdown', () => {
  it('renders headings, paragraphs and the pull-quote blockquote', () => {
    const html = renderMarkdown('## Courses\n\nOld links.\n\n> A pro at your side.');
    expect(html).toContain('<h2>Courses</h2>');
    expect(html).toContain('<p>Old links.</p>');
    expect(html).toContain('<blockquote>\n<p>A pro at your side.</p>\n</blockquote>');
  });

  it('shows raw HTML as text instead of running it', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\nHello <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('keeps only the text of links and images with unsafe targets', () => {
    for (const href of ['javascript:alert(1)', 'JAVASCRIPT:x', 'java&#x73;cript:x', 'java&#115;cript:x', '<javascript:x>', 'vbscript:x', 'data:text/html,hi']) {
      const html = renderMarkdown(`[Read more](${href}) ![a <b> photo](${href})`);
      expect(html, href).not.toContain('href=');
      expect(html, href).not.toContain('<img');
      expect(html, href).toContain('Read more');
      expect(html, href).toContain('a &lt;b&gt; photo');
    }
  });

  it('keeps web, email, phone and on-site links', () => {
    const html = renderMarkdown('[a](https://x.fr) [b](mailto:atelier@fairwayatelier.com) [c](tel:+33299000000) [d](/journey) [e](#faq) ![f](/media/x?w=640)');
    for (const href of ['https://x.fr', 'mailto:atelier@fairwayatelier.com', 'tel:+33299000000', '/journey', '#faq']) expect(html).toContain(`href="${href}"`);
    expect(html).toContain('<img src="/media/x?w=640" alt="f">');
  });
});

it('leaves bare email and web addresses as plain text', () => {
  const html = renderMarkdown('Write to atelier@fairwayatelier.com or see www.cnil.fr, or [the CNIL](https://www.cnil.fr).');
  expect(html.trim()).toBe('<p>Write to atelier@fairwayatelier.com or see www.cnil.fr, or <a href="https://www.cnil.fr">the CNIL</a>.</p>');
});

describe('readTime', () => {
  it('rounds to minutes at about 200 words a minute, minimum 1', () => {
    expect(readTime({ lede: '', body: 'word '.repeat(1000) })).toBe('5 min');
    expect(readTime({ lede: 'short', body: '' })).toBe('1 min');
  });
});

describe('slugify', () => {
  it('makes URL-safe slugs', () => {
    expect(slugify('Why we chose Brittany!')).toBe('why-we-chose-brittany');
    expect(slugify('Crossing to Mont-Saint-Michel, quietly')).toBe('crossing-to-mont-saint-michel-quietly');
    expect(slugify('Hôtel Barrière — Le Grand')).toBe('hotel-barriere-le-grand');
  });
});

const base: ArticleInput = {
  slug: 'coast', sort_order: 1, eyebrow: 'Our USP · The Golf', kicker: 'The Golf', title: 'Old links', excerpt: 'Card text',
  hero_media_id: 'img-destination', lede: 'Lede', body: 'Body', next_slug: 'dining', featured: false, published: true,
};

describe('validateArticle', () => {
  it('accepts a complete article', () => {
    expect(validateArticle(base)).toEqual({});
  });

  it('lets drafts be incomplete but not published articles', () => {
    const empty = { ...base, hero_media_id: null, lede: '', body: '', excerpt: '' };
    expect(validateArticle({ ...empty, published: false })).toEqual({});
    expect(Object.keys(validateArticle(empty)).sort()).toEqual(['body', 'excerpt', 'hero_media_id', 'lede']);
  });

  it('rejects bad slugs and linking an article to itself', () => {
    expect(validateArticle({ ...base, slug: 'Bad Slug' }).slug).toBeTruthy();
    expect(validateArticle({ ...base, next_slug: 'coast' }).next_slug).toBeTruthy();
  });
});

describe('splitFeatured', () => {
  const a = (slug: string, featured = 0) => ({ slug, featured }) as Article;
  it('uses the article marked featured, else the first', () => {
    expect(splitFeatured([a('x'), a('y', 1)]).featured?.slug).toBe('y');
    expect(splitFeatured([a('x'), a('y')]).featured?.slug).toBe('x');
    expect(splitFeatured([])).toEqual({ featured: null, rest: [] });
  });
});

describe('media helpers', () => {
  it('snaps widths to the allowed set', () => {
    expect(snapWidth(1)).toBe(320);
    expect(snapWidth(700)).toBe(960);
    expect(snapWidth(9999)).toBe(2000);
  });

  it('prefers AVIF, then WebP, then JPEG', () => {
    expect(pickFormat('image/avif,image/webp,*/*')).toBe('image/avif');
    expect(pickFormat('image/webp,*/*')).toBe('image/webp');
    expect(pickFormat(null)).toBe('image/jpeg');
  });

  it('never offers widths larger than the original', () => {
    expect(srcset({ id: 'a', width: 1000 })).toBe('/media/a?w=320 320w, /media/a?w=640 640w, /media/a?w=960 960w, /media/a?w=1280 1000w');
    expect(srcset({ id: 'b', width: 170 })).toBe('/media/b?w=320 170w');
  });
});
