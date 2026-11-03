import { definePage } from '../copy';
import { ATOUT_FRANCE, META } from '../site';

/** /terms — defaults are the approved CGV draft, pending review by French travel-law counsel. */
export default definePage({
  id: 'terms',
  label: 'Terms',
  path: '/terms',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/terms'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/terms'][1] },

    heading: { group: 'Top of page', label: 'Title', default: 'Terms of booking — CGV' },
    updated: { group: 'Top of page', label: 'Last updated (month and year)', default: 'July 2026' },
    placeholder: { group: 'Top of page', label: 'Review note', kind: 'text', default: 'Conditions Générales de Vente — draft for review by French travel-law counsel before launch.' },
    intro: { group: 'Top of page', label: 'Introduction', kind: 'markdown', default: `These conditions govern the sale of travel services by Fairway Atelier SAS (Atout France ${ATOUT_FRANCE}) and apply in addition to Articles L.211-1 et seq. of the French Code du tourisme.` },

    section1Title: { group: 'Enquiry and consultation', label: 'Heading', default: 'Enquiry and consultation' },
    section1Body: { group: 'Enquiry and consultation', label: 'Text', kind: 'markdown', default: 'No sum is collected through this website. A journey is arranged only after a consultation call and the issue of a written, personalised proposal. A contract is formed when you accept that proposal in writing and pay the agreed deposit.' },

    section2Title: { group: 'Pricing', label: 'Heading', default: 'Pricing' },
    section2Body: { group: 'Pricing', label: 'Text', kind: 'markdown', default: 'All journeys are bespoke and priced on request; the price confirmed in your proposal prevails. Flights are not included and, where arranged at your request, are billed separately at cost plus a stated handling fee.' },

    section3Title: { group: 'Payment schedule', label: 'Heading', default: 'Payment schedule' },
    section3Body: { group: 'Payment schedule', label: 'Text', kind: 'markdown', default: '[Deposit %] on confirmation; the balance due [XX] days before departure. Payment terms are set out in full in your individual proposal.' },

    section4Title: { group: 'Changes and cancellation', label: 'Heading', default: 'Changes and cancellation' },
    section4Body: { group: 'Changes and cancellation', label: 'Text', kind: 'markdown', default: 'Cancellation terms follow the schedule in your proposal and the Code du tourisme. Because named restaurants, hotels, and courses are held on your behalf, cancellation charges reflect commitments already made to our partners.' },

    section5Title: { group: 'Named inclusions', label: 'Heading', default: 'Named inclusions' },
    section5Body: { group: 'Named inclusions', label: 'Text', kind: 'markdown', default: 'Named restaurants, hotels, and courses are illustrative of the experience we curate. Final inclusions are confirmed during your consultation and in your written proposal, and remain subject to availability.' },

    section6Title: { group: 'Liability and guarantee', label: 'Heading', default: 'Liability and guarantee' },
    section6Body: { group: 'Liability and guarantee', label: 'Text', kind: 'markdown', default: 'We hold the financial guarantee and professional liability insurance required of a French travel operator. Full details appear in the [Mentions légales](/mentions-legales).' },
  },
});
