import { describe, expect, it } from 'vitest';
import { definePage, kindOf, mergeBlocks } from './copy';
import { PAGES } from './pages';

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
});
