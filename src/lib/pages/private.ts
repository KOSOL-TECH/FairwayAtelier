import { definePage } from '../copy';
import { META } from '../site';

/** /private — defaults are the approved copy from prototype/ui_kits/website. */
export default definePage({
  id: 'private',
  label: 'Private Journeys',
  path: '/private',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/private'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/private'][1] },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'Private Journeys' },
    heroTitle: { group: 'Top of page', label: 'Title', default: 'Entirely your own' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'Beyond our scheduled weeks, we design private journeys from a blank page — same standard of care, shaped wholly around your group, your dates, and your interests.' },

    option1Title: { group: 'Options', label: 'Option 1 title', default: 'A private week' },
    option1Copy: { group: 'Options', label: 'Option 1 text', kind: 'text', default: 'Take an entire week for your own group of four to eight — the whole journey, closed to others, on dates arranged around you.' },
    option2Title: { group: 'Options', label: 'Option 2 title', default: 'Charter aviation' },
    option2Copy: { group: 'Options', label: 'Option 2 text', kind: 'text', default: 'Private transfer in place of the TGV, or direct charter into Dinard–Pleurtuit, for those who prefer to arrive on their own clock.' },
    option3Title: { group: 'Options', label: 'Option 3 title', default: 'A Paris extension' },
    option3Copy: { group: 'Options', label: 'Option 3 text', kind: 'text', default: 'Bookend the week with nights in the capital — a suite, a table, and a car, handled to the same standard.' },
    option4Title: { group: 'Options', label: 'Option 4 title', default: 'Beyond golf' },
    option4Copy: { group: 'Options', label: 'Option 4 text', kind: 'text', default: 'Sailing on the Rance, a private Mont-Saint-Michel crossing, cellar visits, or a day given entirely to the coast.' },

    ctaLabel: { group: 'Closing band', label: 'Small label', default: 'By Introduction' },
    ctaTitle: { group: 'Closing band', label: 'Title', default: 'Every private journey begins with a conversation' },
    ctaCopy: { group: 'Closing band', label: 'Text', kind: 'text', default: 'Tell us who is travelling and what would make the week yours. We will design a proposal, and — as with every Fairway Atelier journey — you will never see a bill once you arrive.' },
    ctaButton: { group: 'Closing band', label: 'Button', default: 'Enquire about a private journey' },
  },
});
