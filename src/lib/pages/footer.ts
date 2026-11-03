import { definePage } from '../copy';
import { ATOUT_FRANCE, ENTITY } from '../site';

/**
 * Footer on every page, plus the named-asset disclosure (src/components/Disclosure.astro),
 * so that text is edited in one place. Defaults are the approved copy from prototype/ui_kits/website.
 */
export default definePage({
  id: 'footer',
  label: 'Footer (every page)',
  path: '/',
  blocks: {
    tagline: { group: 'Footer', label: 'Tagline under the crest', default: 'Play Beautifully. Travel Effortlessly.' },
    journeyHeading: { group: 'Footer', label: 'First links column heading', default: 'Journey' },
    planHeading: { group: 'Footer', label: 'Second links column heading', default: 'Plan' },
    enquiriesHeading: { group: 'Footer', label: 'Enquiries column heading', default: 'Enquiries' },
    enquiriesLine1: { group: 'Footer', label: 'Enquiries line under the email', default: 'By appointment' },
    enquiriesLine2: { group: 'Footer', label: 'Enquiries last line', default: 'France-based team' },

    disclosure: {
      group: 'Legal',
      label: 'Disclosure about named restaurants, hotels and courses',
      kind: 'text',
      help: 'Shown in the footer and on the Dining & Golf page.',
      default: 'Named restaurants, hotels, and courses are illustrative of the experience we curate. Final inclusions per trip are subject to availability and confirmed during the consultation call.',
    },
    legalLine: {
      group: 'Legal',
      label: 'Company and Atout France registration line',
      help: 'Replace the placeholder with the real Atout France registration number once issued.',
      default: `© 2026 ${ENTITY.toUpperCase()} — ATOUT FRANCE ${ATOUT_FRANCE}`,
    },
    legal1Label: { group: 'Legal', label: 'Link 1 (Mentions légales)', default: 'Mentions légales' },
    legal2Label: { group: 'Legal', label: 'Link 2 (Privacy)', default: 'Privacy' },
    legal3Label: { group: 'Legal', label: 'Link 3 (Terms)', default: 'Terms (CGV)' },
    legal4Label: { group: 'Legal', label: 'Link 4 (Cookies)', default: 'Cookies' },
    cookieSettings: { group: 'Legal', label: 'Cookie settings button', default: 'Cookie settings' },
  },
});
