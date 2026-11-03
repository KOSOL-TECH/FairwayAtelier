import { definePage } from '../copy';
import { META } from '../site';

/**
 * /enquire — defaults are the approved copy from prototype/ui_kits/website.
 * The form's own labels and messages live in the EnquiryForm island.
 */
export default definePage({
  id: 'enquire',
  label: 'Enquire',
  path: '/enquire',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/enquire'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/enquire'][1] },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'Enquire' },
    heroTitle: { group: 'Top of page', label: 'Title', default: 'Enquire about a private journey' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'Tell us a little, and a member of our France-based team will reply within 24 hours to arrange a 30–45 minute consultation call.' },
  },
});
