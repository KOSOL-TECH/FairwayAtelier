import { definePage } from '../copy';
import { META } from '../site';

/** /cookies — defaults are the approved draft; the cookie table follows once the analytics vendor is chosen. */
export default definePage({
  id: 'cookies',
  label: 'Cookie policy',
  path: '/cookies',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/cookies'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/cookies'][1] },

    heading: { group: 'Top of page', label: 'Title', default: 'Cookie policy' },
    updated: { group: 'Top of page', label: 'Last updated (month and year)', default: 'July 2026' },
    placeholder: { group: 'Top of page', label: 'Review note', kind: 'text', default: 'Draft for review before launch. Cookie table to be completed once analytics vendor is finalised.' },
    intro: { group: 'Top of page', label: 'Introduction', kind: 'markdown', default: 'This site uses a minimal set of cookies. In line with CNIL guidance, non-essential cookies are set only with your consent, and refusing is as easy as accepting. You can change your choice at any time using the banner, which reappears when you clear your saved preference.' },

    section1Title: { group: 'Strictly necessary', label: 'Heading', default: 'Strictly necessary' },
    section1Body: { group: 'Strictly necessary', label: 'Text', kind: 'markdown', default: 'Required for the site to function and to remember your cookie choice. These are always active and cannot be switched off. They store no marketing or profiling data.' },

    section2Title: { group: 'Analytics', label: 'Heading', default: 'Analytics (optional, off by default)' },
    section2Body: { group: 'Analytics', label: 'Text', kind: 'markdown', default: 'With your consent, we use a privacy-respecting analytics tool (Plausible, Fathom, or Matomo) that measures aggregate, anonymous usage. It sets no advertising cookies and does not track you across other websites. We do not use Google Analytics.' },

    section3Title: { group: 'Managing your choice', label: 'Heading', default: 'Managing your choice' },
    section3Body: { group: 'Managing your choice', label: 'Text', kind: 'markdown', default: 'Use "Manage preferences" in the cookie banner to accept or refuse analytics individually. Refusing has no effect on your ability to use the site or to enquire. To reset your choice, clear this site\'s stored data in your browser.' },
  },
});
