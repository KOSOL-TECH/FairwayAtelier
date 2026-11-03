import { definePage } from '../copy';
import { ATOUT_FRANCE, CONTACT_EMAIL, META } from '../site';

/** /mentions-legales — defaults are the approved draft; [bracketed] items are placeholders for counsel. */
export default definePage({
  id: 'mentions-legales',
  label: 'Mentions légales',
  path: '/mentions-legales',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/mentions-legales'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/mentions-legales'][1] },

    heading: { group: 'Top of page', label: 'Title', default: 'Mentions légales' },
    updated: { group: 'Top of page', label: 'Last updated (month and year)', default: 'July 2026' },
    placeholder: { group: 'Top of page', label: 'Review note', kind: 'text', default: 'Draft for review by French counsel before launch. Registration numbers below are placeholders.' },
    intro: { group: 'Top of page', label: 'Introduction', kind: 'markdown', default: 'In accordance with Article 6 of French Law No. 2004-575 of 21 June 2004 (LCEN), the following information is provided to users of this website.' },

    publisherTitle: { group: 'Publisher', label: 'Heading', default: 'Publisher' },
    row1Label: { group: 'Publisher', label: 'Row 1 label', default: 'Company' },
    row1Value: { group: 'Publisher', label: 'Row 1 value', default: 'Fairway Atelier SAS' },
    row2Label: { group: 'Publisher', label: 'Row 2 label', default: 'Legal form' },
    row2Value: { group: 'Publisher', label: 'Row 2 value', default: 'Société par actions simplifiée (SAS)' },
    row3Label: { group: 'Publisher', label: 'Row 3 label', default: 'Share capital' },
    row3Value: { group: 'Publisher', label: 'Row 3 value', default: '€XX,000' },
    row4Label: { group: 'Publisher', label: 'Row 4 label', default: 'Registered office' },
    row4Value: { group: 'Publisher', label: 'Row 4 value', default: '[Street], Dinard, 35800, France' },
    row5Label: { group: 'Publisher', label: 'Row 5 label', default: 'RCS / SIREN' },
    row5Value: { group: 'Publisher', label: 'Row 5 value', default: 'RCS Saint-Malo XXX XXX XXX' },
    row6Label: { group: 'Publisher', label: 'Row 6 label', default: 'VAT (TVA)' },
    row6Value: { group: 'Publisher', label: 'Row 6 value', default: 'FR XX XXX XXX XXX' },
    row7Label: { group: 'Publisher', label: 'Row 7 label', default: 'Travel licence' },
    row7Value: { group: 'Publisher', label: 'Row 7 value', default: `Atout France ${ATOUT_FRANCE}` },
    row8Label: { group: 'Publisher', label: 'Row 8 label', default: 'Financial guarantee' },
    row8Value: { group: 'Publisher', label: 'Row 8 value', default: '[Guarantor], per Art. L.211-18 Code du tourisme' },
    row9Label: { group: 'Publisher', label: 'Row 9 label', default: 'Professional insurance' },
    row9Value: { group: 'Publisher', label: 'Row 9 value', default: '[Insurer], [policy no.]' },
    row10Label: { group: 'Publisher', label: 'Row 10 label', default: 'Publication director' },
    row10Value: { group: 'Publisher', label: 'Row 10 value', default: '[Name], President' },
    row11Label: { group: 'Publisher', label: 'Row 11 label', default: 'Contact' },
    row11Value: { group: 'Publisher', label: 'Row 11 value', default: CONTACT_EMAIL },

    hostingTitle: { group: 'Hosting', label: 'Heading', default: 'Hosting' },
    hostingBody: { group: 'Hosting', label: 'Text', kind: 'markdown', default: 'This website is hosted by [Host name], [address], [contact]. All servers are located within the European Union.' },

    ipTitle: { group: 'Intellectual property', label: 'Heading', default: 'Intellectual property' },
    ipBody: { group: 'Intellectual property', label: 'Text', kind: 'markdown', default: 'All content — text, images, logos, and the Fairway Atelier name and crest — is the property of Fairway Atelier SAS or its licensors and may not be reproduced without prior written consent.' },
  },
});
