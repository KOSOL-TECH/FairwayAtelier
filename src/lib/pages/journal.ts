import { definePage } from '../copy';
import { META } from '../site';

/**
 * /journal — defaults are the approved copy from prototype/ui_kits/website.
 * The articles themselves are edited in /admin/journal.
 */
export default definePage({
  id: 'journal',
  label: 'Journal',
  path: '/journal',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/journal'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/journal'][1] },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'Journal' },
    heroTitle: { group: 'Top of page', label: 'Title', default: 'Notes from the coast' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'Dispatches on the courses, the tables, and the craft of an effortless week — written by the team who arrange them.' },

    featuredLabel: { group: 'Articles', label: 'Featured article label', default: 'Featured', help: 'Shown before the featured article’s kicker, e.g. “Featured · The Courses”.' },
    readMore: { group: 'Articles', label: 'Featured article link', default: 'Read the note' },
    readSuffix: { group: 'Articles', label: 'Word after the reading time', default: 'read', help: 'Shown as e.g. “5 min read”.' },
  },
});
