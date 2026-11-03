import { definePage } from '../copy';
import { META } from '../site';

/**
 * /availability — defaults are the approved copy from prototype/ui_kits/website.
 * The weeks themselves are edited in /admin/weeks.
 */
export default definePage({
  id: 'availability',
  label: 'Availability',
  path: '/availability',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/availability'][0] },
    metaDescription: {
      group: 'Search engines',
      label: 'Description (Google)',
      kind: 'text',
      default: META['/availability'][1],
      help: 'Keep the words “Opened weeks for 2026.” and the years are updated automatically from the listed weeks.',
    },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'Availability' },
    heading: { group: 'Top of page', label: 'Title', default: 'Opened weeks', help: 'The years of the listed weeks are added automatically, e.g. “for 2026”.' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'Each week runs for a single group of four. Select a week to see tier availability and the tables confirmed so far.' },

    emptyState: { group: 'Weeks', label: 'Message when no weeks are listed', kind: 'text', default: 'New weeks are being prepared. Enquire and we will hold your preferred dates.' },
    standardLabel: { group: 'Weeks', label: 'Standard tier label', default: 'Standard — EMERIA' },
    signatureLabel: { group: 'Weeks', label: 'Signature tier label', default: 'Signature — Barrière' },
    diningLabel: { group: 'Weeks', label: 'Tables label', default: 'Headline tables' },
    ctaOpen: { group: 'Weeks', label: 'Button (open week)', default: 'Enquire about this week' },
    ctaWaitlist: { group: 'Weeks', label: 'Button (waitlisted week)', default: 'Join the waitlist' },
    ctaSold: { group: 'Weeks', label: 'Button (sold-out week)', default: 'Sold out' },

    footnote: { group: 'Bottom of page', label: 'Footnote', kind: 'text', default: 'Named restaurants, hotels, and courses are illustrative of the experience. Final inclusions per trip are subject to availability and confirmed during the consultation call.' },
  },
});
