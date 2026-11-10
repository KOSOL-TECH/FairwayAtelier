import { definePage } from '../copy';
import { META } from '../site';

/** /privacy — defaults are the approved GDPR draft, pending review by counsel/DPO. */
export default definePage({
  id: 'privacy',
  label: 'Privacy policy',
  path: '/privacy',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/privacy'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/privacy'][1] },

    heading: { group: 'Top of page', label: 'Title', default: 'Privacy policy' },
    updated: { group: 'Top of page', label: 'Last updated (month and year)', default: 'November 2026' },
    placeholder: { group: 'Top of page', label: 'Review note', kind: 'text', default: 'GDPR-aligned draft for review by counsel/DPO before launch.' },
    intro: { group: 'Top of page', label: 'Introduction', kind: 'markdown', default: 'Fairway Atelier SAS ("we") is the data controller for personal data collected through this website, in accordance with the EU General Data Protection Regulation (GDPR) and the French Loi Informatique et Libertés.' },

    section1Title: { group: 'What we collect', label: 'Heading', default: 'What we collect' },
    section1Body: { group: 'What we collect', label: 'Text', kind: 'markdown', default: 'Only what you provide. When you enquire: your name, email, phone, dates and group composition, tier interest, and any notes you choose to share (such as dietary needs or handicap). If you create a profile: your name and email, how you sign in, and whatever you choose to add about your golf, your travel plans, food and wine, your stay, and how you heard about us. Every profile question is optional. A password is stored only in hashed form. If you sign in with Google or Apple, that company tells us your name and email address; we never see your password with them. We collect no more than is necessary to arrange your consultation call and plan your week.' },

    section2Title: { group: 'Why we use it', label: 'Heading', default: 'Why we use it' },
    section2Body: { group: 'Why we use it', label: 'Text', kind: 'markdown', default: 'To respond to your enquiry, arrange and conduct your consultation call, build your preference profile and keep it available to you when you sign in, send you our journal and newly opened weeks if you ask for them, and — only with your consent — to understand aggregate, anonymous site usage. We do not sell personal data, and we do not use it for automated profiling or advertising.' },

    section3Title: { group: 'Lawful basis', label: 'Heading', default: 'Lawful basis' },
    section3Body: { group: 'Lawful basis', label: 'Text', kind: 'markdown', default: 'Enquiries and profiles: performance of pre-contractual steps at your request and our legitimate interest in responding. Dietary, allergy and access details you choose to add to your profile: your consent, given by adding them, which you withdraw by removing them. Emails about the journal and new weeks: your consent, which you may withdraw in your profile at any time. Analytics: your consent, which you may withdraw at any time via our [cookie preferences](/cookies).' },

    section4Title: { group: 'Retention', label: 'Heading', default: 'Retention' },
    section4Body: { group: 'Retention', label: 'Text', kind: 'markdown', default: 'Enquiry data is kept for the duration of our conversation and, where a journey proceeds, for the period required by French tax and tourism law. Otherwise it is deleted three years after our last contact with you. A profile is kept until you delete it, which you can do from the profile itself at any time; otherwise it is deleted three years after you last signed in or we last updated it, unless you have booked with us.' },

    section5Title: { group: 'Your rights', label: 'Heading', default: 'Your rights' },
    section5Body: {
      group: 'Your rights',
      label: 'Text',
      kind: 'markdown',
      default: 'You have the right to access, rectify, erase, restrict, and port your data, and to object to processing. If you have a profile, you can correct it, download a copy of it and delete it yourself from your profile page. To exercise these rights, or to lodge a complaint, contact atelier@fairwayatelier.com. You may also complain to the CNIL (www.cnil.fr).',
    },

    section6Title: { group: 'Analytics', label: 'Heading', default: 'Analytics' },
    section6Body: { group: 'Analytics', label: 'Text', kind: 'markdown', default: 'We use privacy-respecting analytics (such as Plausible, Fathom, or Matomo) that do not set advertising cookies or track you across sites. We do not use Google Analytics.' },
  },
});
