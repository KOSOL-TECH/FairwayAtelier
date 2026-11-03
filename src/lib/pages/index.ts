import type { PageDef } from '../copy';
import home from './home';
import experience from './experience';
import journey from './journey';
import diningAndGolf from './dining-and-golf';
import availability from './availability';
import privatePage from './private';
import journal from './journal';
import faq from './faq';
import enquire from './enquire';
import footer from './footer';
import notFound from './not-found';
import mentionsLegales from './mentions-legales';
import privacy from './privacy';
import terms from './terms';
import cookies from './cookies';

/** Every editable page, in the order the admin lists them (/admin/pages). */
export const PAGES: PageDef[] = [
  home, experience, journey, diningAndGolf, availability, privatePage, journal, faq, enquire, footer, notFound,
  mentionsLegales, privacy, terms, cookies,
];

export const pageById = (id: string) => PAGES.find((p) => p.id === id);
