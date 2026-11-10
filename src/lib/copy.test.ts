import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { definePage, kindOf, loadPage, mergeBlocks } from './copy';
import { PAGES } from './pages';

describe('loadPage', () => {
  const withImage = definePage({
    id: 'demo-img',
    label: 'Demo',
    path: '/demo',
    blocks: { title: { label: 'Title', default: 'Original title' }, photo: { label: 'Photo', kind: 'image', default: 'photo-x' } },
  });

  it('falls back to the originals, without photos, when D1 fails', async () => {
    const failing = { prepare: () => { throw new Error('D1 unavailable'); } } as unknown as D1Database;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const c = await loadPage(failing, withImage);
    expect(c.t.title).toBe('Original title');
    expect(c.img('photo')).toBeNull();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

const def = definePage({
  id: 'demo',
  label: 'Demo',
  path: '/demo',
  blocks: {
    title: { label: 'Title', default: 'Entirely your own' },
    intro: { label: 'Intro', kind: 'text', default: 'Original intro.' },
  },
});

describe('mergeBlocks', () => {
  it('uses the approved defaults when nothing is stored', () => {
    expect(mergeBlocks(def, [])).toEqual({ title: 'Entirely your own', intro: 'Original intro.' });
  });

  it('applies stored edits and ignores blocks the page no longer has', () => {
    expect(mergeBlocks(def, [{ block: 'intro', value: 'Edited.' }, { block: 'gone', value: 'x' }])).toEqual({
      title: 'Entirely your own',
      intro: 'Edited.',
    });
  });
});

describe('page registry', () => {
  it('has unique page ids', () => {
    const ids = PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every block a label and a non-empty default', () => {
    for (const p of PAGES) {
      for (const [key, b] of Object.entries(p.blocks)) {
        expect(b.label, `${p.id}.${key}`).toBeTruthy();
        expect(b.default.trim(), `${p.id}.${key}`).not.toBe('');
        expect(['line', 'text', 'markdown', 'image']).toContain(kindOf(b));
      }
    }
  });

  it('only uses default images that the migrations seed into the media library', () => {
    const sql = readdirSync('migrations').map((f: string) => readFileSync(`migrations/${f}`, 'utf8')).join('\n');
    for (const p of PAGES) {
      for (const [key, b] of Object.entries(p.blocks)) {
        if (kindOf(b) === 'image') expect(sql, `${p.id}.${key} → ${b.default}`).toContain(`'${b.default}'`);
      }
    }
  });
});
