import { definePage } from '../copy';
import { META } from '../site';

/** /faq — defaults are the approved copy from prototype/ui_kits/website. */
export default definePage({
  id: 'faq',
  label: 'FAQ',
  path: '/faq',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/faq'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/faq'][1] },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'Questions' },
    heroTitle: { group: 'Top of page', label: 'Title', default: 'Frequently asked' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: "If your question isn't answered here, our France-based team is a message away." },

    q1: { group: 'Questions', label: 'Question 1', default: 'Are flights included?' },
    a1: { group: 'Questions', label: 'Answer 1', kind: 'text', default: 'No. We keep pricing clean and let you fly as you prefer — but we are glad to arrange business- or first-class travel, or private charter, as an add-on to your journey.' },
    q2: { group: 'Questions', label: 'Question 2', default: 'How does pricing work?' },
    a2: { group: 'Questions', label: 'Answer 2', kind: 'text', default: 'Every journey is bespoke and priced on request. After a short consultation call we send a written, personalised proposal; no sum is ever collected through this website.' },
    q3: { group: 'Questions', label: 'Question 3', default: 'What is the “no-wallet” promise?' },
    a3: { group: 'Questions', label: 'Answer 3', kind: 'text', default: 'Once your journey begins you will never see a bill. Tables, transfers, tee times, and companion arrangements are all settled ahead and quietly maintained — touchless and walletless, start to finish.' },
    q4: { group: 'Questions', label: 'Question 4', default: 'Who is the journey for?' },
    a4: { group: 'Questions', label: 'Answer 4', kind: 'text', default: 'Couples and small groups who love the game and the good life in equal measure. Each week takes a single group of four; larger private groups are arranged separately.' },
    q5: { group: 'Questions', label: 'Question 5', default: 'Do companions who don’t play golf enjoy it?' },
    a5: { group: 'Questions', label: 'Answer 5', kind: 'text', default: 'Very much so. A parallel itinerary runs alongside the rounds — thalasso, Saint-Malo, Cancale, Mont-Saint-Michel, and the Belle-Époque coast.' },
    q6: { group: 'Questions', label: 'Question 6', default: 'What is the difference between the two tiers?' },
    a6: { group: 'Questions', label: 'Answer 6', kind: 'text', default: 'The journey is identical; the hotel differs. Standard is anchored at EMERIA Dinard (thalasso-led); Signature at Hôtel Barrière (a Belle-Époque grand hotel). You choose on the consultation call.' },
    q7: { group: 'Questions', label: 'Question 7', default: 'How far ahead should we book?' },
    a7: { group: 'Questions', label: 'Answer 7', kind: 'text', default: 'Weeks are released in limited numbers and often fill months ahead. If your preferred dates show as waitlisted, enquire anyway — arrangements do change.' },
    q8: { group: 'Questions', label: 'Question 8', default: 'What if we need to cancel?' },
    a8: { group: 'Questions', label: 'Answer 8', kind: 'text', default: 'Cancellation terms follow your written proposal and French travel law. Because named tables and rooms are held on your behalf, terms reflect commitments already made to our partners.' },

    ctaButton: { group: 'Bottom of page', label: 'Button', default: 'Ask us anything' },
  },
});
