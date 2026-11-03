import { definePage } from '../copy';
import { META } from '../site';

/** /experience — defaults are the approved copy from prototype/ui_kits/website. */
export default definePage({
  id: 'experience',
  label: 'The Experience',
  path: '/experience',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/experience'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/experience'][1] },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'The Experience' },
    heroTitle: { group: 'Top of page', label: 'Title', default: 'The art of leaving nothing to arrange' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'Fairway Atelier is built on a single operating principle: complete guest care. Arrive, settle in, enjoy the experience — and never once worry about the details. They have already been thought through for you.' },

    promiseLabel: { group: 'No-Wallet Promise band', label: 'Small label', default: 'The No-Wallet Promise' },
    promiseTitle: { group: 'No-Wallet Promise band', label: 'Title', default: 'You will never see a bill during your trip.' },
    promiseCopy: { group: 'No-Wallet Promise band', label: 'Text', kind: 'text', default: 'No tabs, no cheques, no settling up. From the car that meets your flight to the table on your final evening, everything is arranged, confirmed, and paid ahead. The experience is touchless and walletless by design — the truest luxury is the absence of friction.' },

    handledEyebrow: { group: 'What we take care of', label: 'Eyebrow', default: 'Everything, Handled' },
    handledTitle: { group: 'What we take care of', label: 'Title', default: 'What we take care of' },
    handled1Title: { group: 'What we take care of', label: 'Item 1 title', default: 'Timing' },
    handled1Copy: { group: 'What we take care of', label: 'Item 1 text', kind: 'text', default: 'The whole week is sequenced for you — arrival, rounds, tables, and rest in a rhythm designed around energy, not logistics.' },
    handled2Title: { group: 'What we take care of', label: 'Item 2 title', default: 'Reservations' },
    handled2Copy: { group: 'What we take care of', label: 'Item 2 text', kind: 'text', default: 'Michelin tables and hotel dining confirmed before your week is ever offered. Le Jules Verne and Le Coquillage are held in advance.' },
    handled3Title: { group: 'What we take care of', label: 'Item 3 title', default: 'Transfers' },
    handled3Copy: { group: 'What we take care of', label: 'Item 3 text', kind: 'text', default: 'A Mercedes and an English-speaking driver in region; TGV Première between Paris and Brittany. You are met at the carriage door.' },
    handled4Title: { group: 'What we take care of', label: 'Item 4 title', default: 'Tee times' },
    handled4Copy: { group: 'What we take care of', label: 'Item 4 text', kind: 'text', default: 'Four courses, secured and sequenced, each round with your own PGA professional — present, personal, never overbearing.' },
    handled5Title: { group: 'What we take care of', label: 'Item 5 title', default: 'Companions' },
    handled5Copy: { group: 'What we take care of', label: 'Item 5 text', kind: 'text', default: 'A parallel itinerary for those not playing: thalasso, Saint-Malo, Cancale oysters, Mont-Saint-Michel, the Belle-Époque coast.' },
    handled6Title: { group: 'What we take care of', label: 'Item 6 title', default: 'On-trip support' },
    handled6Copy: { group: 'What we take care of', label: 'Item 6 text', kind: 'text', default: 'A named host by your side from booking to farewell — reachable by phone, message, or WhatsApp, twelve hours a day.' },

    team1Title: { group: 'Team and consultation', label: 'Left column title', default: 'A France-based team, a group of four' },
    team1Copy: { group: 'Team and consultation', label: 'Left column text', kind: 'text', default: 'We are established in France, and every supplier — hotel, chauffeur, professional, restaurant — is contracted and cared for by us directly. Each journey takes a single group of four, hosted by one named concierge who knows your week by heart. Not a call centre. A person, on the ground, who has your number and answers it.' },
    team2Title: { group: 'Team and consultation', label: 'Right column title', default: 'Chosen with you, not sold to you' },
    team2Copy: { group: 'Team and consultation', label: 'Right column text', kind: 'text', default: 'Before you travel, we build a preference profile — dietary needs, playing level, the things that make a room feel like yours. The two hotel tiers, the courses, the tables, and any extension are shaped on a single consultation call. The journey arrives already fitted to you.' },

    pathsEyebrow: { group: 'Ways to travel', label: 'Eyebrow', default: 'Ways to Travel' },
    pathsTitle: { group: 'Ways to travel', label: 'Title', default: 'Four paths through the same coast' },
    path1Title: { group: 'Ways to travel', label: 'Path 1 title', default: 'Balanced' },
    path1Copy: { group: 'Ways to travel', label: 'Path 1 text', kind: 'text', default: 'The flagship — four rounds and two Michelin moments, in perfect balance with rest and the coast.' },
    path2Title: { group: 'Ways to travel', label: 'Path 2 title', default: 'Intensive Golf' },
    path2Copy: { group: 'Ways to travel', label: 'Path 2 text', kind: 'text', default: 'Five rounds, extended practice, and an optional academy block for those chasing rhythm and improvement.' },
    path3Title: { group: 'Ways to travel', label: 'Path 3 title', default: 'Culinary France' },
    path3Copy: { group: 'Ways to travel', label: 'Path 3 text', kind: 'text', default: 'One round or none — the France holiday for couples who come for the table and the scenery.' },
    path4Title: { group: 'Ways to travel', label: 'Path 4 title', default: 'Companion' },
    path4Copy: { group: 'Ways to travel', label: 'Path 4 text', kind: 'text', default: 'A full non-golf journey running alongside the rounds, wanting for nothing.' },

    founderQuote: { group: 'Founders’ quote', label: 'Quote (quotation marks are added automatically)', kind: 'text', default: 'We built the journey we wanted to be given — unhurried, beautifully fed, and entirely handled. You should never have to reach for your wallet to enjoy a place. Brittany simply made it easy.' },
    founderBy: { group: 'Founders’ quote', label: 'Signed by', default: 'The Founders' },
    founderButton: { group: 'Founders’ quote', label: 'Button', default: 'See the 8-day journey' },
  },
});
