import { definePage } from '../copy';
import { META } from '../site';

/** / (home) — defaults are the approved copy from prototype/ui_kits/website. */
export default definePage({
  id: 'home',
  label: 'Home',
  path: '/',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/'][1] },
    ogDescription: { group: 'Search engines', label: 'Description when shared on social media', kind: 'text', default: 'Championship links, Michelin tables, and a touchless, walletless week on the Emerald Coast of Brittany. You will never see a bill during your trip.' },

    heroTitle: { group: 'Top of page', label: 'Title', default: 'Bespoke luxury golf travel, beautifully arranged.' },
    heroLead: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'France golf holidays shaped by fine dining, beautiful scenery, attentive hospitality, and the quiet ease of having every detail handled.' },
    heroButton1: { group: 'Top of page', label: 'Main button', default: 'View available departures' },
    heroButton2: { group: 'Top of page', label: 'Second button', default: 'Enquire about a private journey' },

    introEyebrow: { group: 'The experience', label: 'Eyebrow', default: 'The Fairway Atelier Experience' },
    introText: { group: 'The experience', label: 'Text', kind: 'text', default: 'Eight unhurried days on the Emerald Coast of Brittany — championship links by day, three-Michelin tables by night, and the calm of a place that runs entirely without you having to ask.' },

    card1Image: { group: 'Three cards', label: 'Card 1 photo', kind: 'image', default: 'img-destination' },
    card1Title: { group: 'Three cards', label: 'Card 1 title (also the photo description)', default: 'The Golf' },
    card1Copy: { group: 'Three cards', label: 'Card 1 text', kind: 'text', default: 'Old, beautiful French seaside courses — and your own English-speaking pro at your side all week, committed to your game.' },
    card2Image: { group: 'Three cards', label: 'Card 2 photo', kind: 'image', default: 'img-dining' },
    card2Title: { group: 'Three cards', label: 'Card 2 title (also the photo description)', default: 'The Table' },
    card2Copy: { group: 'Three cards', label: 'Card 2 text', kind: 'text', default: 'Fine dining and beautiful wines every day, set against sea-side cliffs and breathtaking scenery.' },
    card3Image: { group: 'Three cards', label: 'Card 3 photo', kind: 'image', default: 'img-club-heritage' },
    card3Title: { group: 'Three cards', label: 'Card 3 title (also the photo description)', default: 'The Ease' },
    card3Copy: { group: 'Three cards', label: 'Card 3 text', kind: 'text', default: 'Small groups, true luxury, everything taken care of. Touchless — you never see a bill — with a 24/7 concierge.' },
    cardReadMore: { group: 'Three cards', label: '“Read more” link (all cards)', default: 'Read more' },

    departuresEyebrow: { group: 'Available departures', label: 'Eyebrow', default: 'Available Departures' },
    departuresTitle: { group: 'Available departures', label: 'Title', default: 'The next bookable weeks' },
    departuresButton: { group: 'Available departures', label: 'Button', default: 'See full availability' },

    tiersEyebrow: { group: 'Two ways to stay', label: 'Eyebrow', default: 'Two Ways to Stay' },
    tiersTitle: { group: 'Two ways to stay', label: 'Title', default: 'Choose the rhythm that suits you' },
    tier1Eyebrow: { group: 'Two ways to stay', label: 'Tier 1 small label', default: 'Standard Tier' },
    tier1Name: { group: 'Two ways to stay', label: 'Tier 1 name', default: 'EMERIA Dinard' },
    tier1Copy: { group: 'Two ways to stay', label: 'Tier 1 text', kind: 'text', default: 'Anchored at EMERIA Dinard Hôtel Thalasso & Spa — the largest thalassotherapy institute on the coast, and the heart of our restorative rhythm.' },
    tier1Button: { group: 'Two ways to stay', label: 'Tier 1 button', default: 'Explore the Standard journey' },
    tier2Eyebrow: { group: 'Two ways to stay', label: 'Tier 2 small label', default: 'Signature Tier' },
    tier2Name: { group: 'Two ways to stay', label: 'Tier 2 name', default: 'Hôtel Barrière' },
    tier2Copy: { group: 'Two ways to stay', label: 'Tier 2 text', kind: 'text', default: 'Anchored at Hôtel Barrière Le Grand Hôtel Dinard, a Belle-Époque grand hotel facing the bay of Saint-Malo, member of Leading Hotels of the World.' },
    tier2Button: { group: 'Two ways to stay', label: 'Tier 2 button', default: 'Explore the Signature journey' },
    tierPrice: { group: 'Two ways to stay', label: 'Price line (both tiers)', default: 'Priced on request' },

    trust1Title: { group: 'Promises band', label: 'Promise 1 title', default: 'France-based' },
    trust1Copy: { group: 'Promises band', label: 'Promise 1 text', default: 'A team on the ground, not a call centre' },
    trust2Title: { group: 'Promises band', label: 'Promise 2 title', default: 'Intimate' },
    trust2Copy: { group: 'Promises band', label: 'Promise 2 text', default: 'Four guests to a journey, never a crowd' },
    trust3Title: { group: 'Promises band', label: 'Promise 3 title', default: 'Named-host' },
    trust3Copy: { group: 'Promises band', label: 'Promise 3 text', default: 'One concierge, from enquiry to farewell' },
    trust4Title: { group: 'Promises band', label: 'Promise 4 title', default: 'Fully handled' },
    trust4Copy: { group: 'Promises band', label: 'Promise 4 text', default: 'No wallet, no logistics — only the days themselves' },

    voicesEyebrow: { group: 'Guest quotes', label: 'Eyebrow', default: 'In Their Words' },
    voice1Quote: { group: 'Guest quotes', label: 'Quote 1', kind: 'text', default: 'We arrived with clubs and an appetite, and for eight days lifted not a finger. The finest week we have given ourselves.' },
    voice1Name: { group: 'Guest quotes', label: 'Quote 1 guest name', default: 'R. & M. Callahan' },
    voice1Detail: { group: 'Guest quotes', label: 'Quote 1 journey and date', default: 'The Signature Journey · September 2025' },
    voice2Quote: { group: 'Guest quotes', label: 'Quote 2', kind: 'text', default: 'Dinner at Le Coquillage, a round above the Atlantic, and never once a bill. That is the whole trick, and they have mastered it.' },
    voice2Name: { group: 'Guest quotes', label: 'Quote 2 guest name', default: 'James Ellory' },
    voice2Detail: { group: 'Guest quotes', label: 'Quote 2 journey and date', default: 'The Standard Journey · May 2025' },
    voice3Quote: { group: 'Guest quotes', label: 'Quote 3', kind: 'text', default: 'I came for the golf; my wife came for the coast. We both left saying it was the best-organised holiday of our lives.' },
    voice3Name: { group: 'Guest quotes', label: 'Quote 3 guest name', default: 'Dr. P. Hargreave' },
    voice3Detail: { group: 'Guest quotes', label: 'Quote 3 journey and date', default: 'The 8-Day Journey · June 2025' },

    closingEyebrow: { group: 'Closing', label: 'Eyebrow', default: 'Begin' },
    closingTitle: { group: 'Closing', label: 'Title', default: 'Your week in Brittany starts with a conversation.' },
    closingButton: { group: 'Closing', label: 'Button', default: 'View available departures' },
  },
});
