import { definePage } from '../copy';
import { META } from '../site';

/** /dining-and-golf — defaults are the approved copy from prototype/ui_kits/website. */
export default definePage({
  id: 'dining-and-golf',
  label: 'Dining & Golf',
  path: '/dining-and-golf',
  blocks: {
    metaTitle: { group: 'Search engines', label: 'Page title (browser tab and Google)', default: META['/dining-and-golf'][0] },
    metaDescription: { group: 'Search engines', label: 'Description (Google)', kind: 'text', default: META['/dining-and-golf'][1] },

    heroEyebrow: { group: 'Top of page', label: 'Eyebrow', default: 'Dining & Golf' },
    heroTitle: { group: 'Top of page', label: 'Title', default: 'Championship links, three-star tables' },
    heroIntro: { group: 'Top of page', label: 'Introduction', kind: 'text', default: 'Four rounds of coastal golf and a run of France\'s most storied restaurants — sequenced across the week so each is met with an appetite, never fatigue.' },

    coursesLabel: { group: 'The courses', label: 'Eyebrow', default: 'The Courses' },
    coursesTitle: { group: 'The courses', label: 'Title', default: 'Four rounds on the Emerald Coast' },
    coursesLead: { group: 'The courses', label: 'Introduction', kind: 'text', default: 'Played with your own English-speaking PGA professional. The precise courses are chosen for each week\'s weather, light, and the group\'s rhythm.' },
    course1Image: { group: 'The courses', label: 'Course 1 photo', kind: 'image', default: 'img-club-heritage' },
    course1Name: { group: 'The courses', label: 'Course 1 name (also the photo description)', default: 'Golf de Dinard' },
    course1Meta: { group: 'The courses', label: 'Course 1 details line', default: 'Saint-Briac-sur-Mer · Est. 1887' },
    course1Copy: { group: 'The courses', label: 'Course 1 description', kind: 'text', default: 'The second-oldest course in France — a classic seaside links laid over the cliffs of the Emerald Coast, minutes from both hotels.' },
    course2Image: { group: 'The courses', label: 'Course 2 photo', kind: 'image', default: 'img-destination' },
    course2Name: { group: 'The courses', label: 'Course 2 name (also the photo description)', default: 'Golf de Saint-Cast' },
    course2Meta: { group: 'The courses', label: 'Course 2 details line', default: 'Côte d\'Émeraude · Parkland-links' },
    course2Copy: { group: 'The courses', label: 'Course 2 description', kind: 'text', default: 'A rolling coastal course with wide Atlantic views, chosen for its condition and light on the week\'s calmer day.' },
    course3Image: { group: 'The courses', label: 'Course 3 photo', kind: 'image', default: 'img-golf-bag' },
    course3Name: { group: 'The courses', label: 'Course 3 name (also the photo description)', default: 'Golf de Pléneuf-Val-André' },
    course3Meta: { group: 'The courses', label: 'Course 3 details line', default: 'Baie de Saint-Brieuc · Cliff-top' },
    course3Copy: { group: 'The courses', label: 'Course 3 description', kind: 'text', default: 'Dramatic cliff-edge fairways above the bay — the most photographed round of the journey, and a favourite finish.' },

    tablesLabel: { group: 'The tables', label: 'Eyebrow', default: 'The Tables' },
    tablesTitle: { group: 'The tables', label: 'Title', default: 'Two unmistakable Michelin moments' },
    tablesLead: { group: 'The tables', label: 'Introduction', kind: 'text', default: 'Reservations at named tables are confirmed before a week is ever offered — Le Coquillage and Le Jules Verne are held in advance.' },
    table1Image: { group: 'The tables', label: 'Restaurant 1 photo', kind: 'image', default: 'img-dining' },
    table1Name: { group: 'The tables', label: 'Restaurant 1 name (also the photo description)', default: 'Le Coquillage' },
    table1Meta: { group: 'The tables', label: 'Restaurant 1 details line', default: 'Saint-Méloir-des-Ondes · ★★★' },
    table1Copy: { group: 'The tables', label: 'Restaurant 1 description', kind: 'text', default: 'Hubert & Olivier Roellinger\'s three-star at Château Richeux — sea, garden, and spice, and the headline dinner of the week.' },
    table2Image: { group: 'The tables', label: 'Restaurant 2 photo', kind: 'image', default: 'img-embossed-crest' },
    table2Name: { group: 'The tables', label: 'Restaurant 2 name (also the photo description)', default: 'Le Jules Verne' },
    table2Meta: { group: 'The tables', label: 'Restaurant 2 details line', default: 'Paris · Eiffel Tower · ★★' },
    table2Copy: { group: 'The tables', label: 'Restaurant 2 description', kind: 'text', default: 'Lunch two-thirds up the tower before the TGV south — a two-star opening that sets the register for the days to come.' },
    table3Image: { group: 'The tables', label: 'Restaurant 3 photo', kind: 'image', default: 'img-arch-lineart' },
    table3Name: { group: 'The tables', label: 'Restaurant 3 name (also the photo description)', default: 'Pourquoi Pas — Castelbrac' },
    table3Meta: { group: 'The tables', label: 'Restaurant 3 details line', default: 'Dinard · ★' },
    table3Copy: { group: 'The tables', label: 'Restaurant 3 description', kind: 'text', default: 'A one-star dining room set into the rock above the bay, held for an intimate closing night rather than another long tasting.' },

    ctaButton: { group: 'Bottom of page', label: 'Button', default: 'Enquire about a journey' },
  },
});
