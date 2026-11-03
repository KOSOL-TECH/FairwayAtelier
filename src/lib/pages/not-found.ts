import { definePage } from '../copy';

/** 404 page — defaults are the approved copy from prototype/ui_kits/website. */
export default definePage({
  id: 'not-found',
  label: 'Page not found (404)',
  path: '/404',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab)', default: 'Page not found — Fairway Atelier' },
    metaDescription: { group: 'Search engines', label: 'Description', kind: 'text', default: 'This page could not be found.' },

    eyebrow: { group: 'Page', label: 'Eyebrow', default: 'Not found' },
    title: { group: 'Page', label: 'Title', default: 'This page has wandered off the fairway' },
    copy: { group: 'Page', label: 'Text', kind: 'text', default: 'The page you were looking for has moved or no longer exists.' },
    button: { group: 'Page', label: 'Button', default: 'Return home' },
  },
});
