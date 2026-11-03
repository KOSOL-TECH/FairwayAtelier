export const SITE_URL = 'https://fairwayatelier.com';
export const CONTACT_EMAIL = 'atelier@fairwayatelier.com';
/** Placeholder until the Atout France registration is issued (launch blocker). */
export const ATOUT_FRANCE = 'IM0XX2600XX';
export const ENTITY = 'Fairway Atelier SAS';

/** Per-route <title> and meta description, verbatim from the prototype's META object. */
export const META = {
  '/': ['Fairway Atelier — Bespoke Luxury Golf Travel in Brittany', 'Championship links, Michelin tables, and a touchless, walletless week on the Emerald Coast of Brittany.'],
  '/experience': ['The Experience — Fairway Atelier', 'Complete guest care on the Emerald Coast: arrive, settle in, and never see a bill. Everything is handled.'],
  '/journey': ['The 8-Day Journey — Fairway Atelier', 'Eight unhurried days in Brittany — four championship rounds, two Michelin moments, two hotel tiers.'],
  '/availability': ['Availability — Fairway Atelier', 'Opened weeks for 2026. Each week runs for a single group of four; enquire to hold your dates.'],
  '/dining-and-golf': ['Dining & Golf — Fairway Atelier', 'Golf de Dinard, Saint-Cast and Pléneuf-Val-André, with three-star tables including Le Coquillage.'],
  '/private': ['Private Journeys — Fairway Atelier', 'Bespoke private golf journeys in Brittany, designed from a blank page around your group and dates.'],
  '/faq': ['Frequently Asked — Fairway Atelier', 'Flights, pricing, the no-wallet promise, tiers, and booking — answered by our France-based team.'],
  '/journal': ['Journal — Fairway Atelier', 'Notes from the coast: the courses, the tables, and the craft of an effortless week.'],
  '/enquire': ['Enquire — Fairway Atelier', 'Tell us a little and our France-based team replies within 24 hours to arrange a consultation call.'],
  '/mentions-legales': ['Mentions légales — Fairway Atelier', 'Legal information for Fairway Atelier SAS.'],
  '/privacy': ['Privacy Policy — Fairway Atelier', 'How Fairway Atelier collects and protects your personal data, in line with the GDPR.'],
  '/terms': ['Terms of Booking (CGV) — Fairway Atelier', 'Conditions of sale for Fairway Atelier travel services.'],
  '/cookies': ['Cookie Policy — Fairway Atelier', 'How we use cookies, and how to accept, refuse, or manage them.'],
} as const satisfies Record<string, readonly [string, string]>;

export type StaticRoute = keyof typeof META;

export const NAV: ReadonlyArray<readonly [label: string, href: string]> = [
  ['Home', '/'],
  ['Experience', '/experience'],
  ['Journey', '/journey'],
  ['Dining & Golf', '/dining-and-golf'],
  ['Availability', '/availability'],
  ['Journal', '/journal'],
  ['Enquire', '/enquire'],
];

export const FOOTER_JOURNEY = [
  ['The Experience', '/experience'],
  ['The 8-Day Journey', '/journey'],
  ['Dining & Golf', '/dining-and-golf'],
  ['Private Journeys', '/private'],
] as const;

export const FOOTER_PLAN = [
  ['Availability', '/availability'],
  ['Journal', '/journal'],
  ['FAQ', '/faq'],
  ['Enquire', '/enquire'],
] as const;

export const FOOTER_LEGAL = [
  ['Mentions légales', '/mentions-legales'],
  ['Privacy', '/privacy'],
  ['Terms (CGV)', '/terms'],
  ['Cookies', '/cookies'],
] as const;

/** Sitemap entries; changefreq and priority as in the prototype's sitemap.xml. Published journal articles are added from D1 (src/pages/sitemap.xml.ts). */
export const SITEMAP: ReadonlyArray<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/experience', changefreq: 'monthly', priority: '0.8' },
  { path: '/journey', changefreq: 'monthly', priority: '0.9' },
  { path: '/dining-and-golf', changefreq: 'monthly', priority: '0.8' },
  { path: '/availability', changefreq: 'weekly', priority: '0.9' },
  { path: '/private', changefreq: 'monthly', priority: '0.7' },
  { path: '/journal', changefreq: 'weekly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/enquire', changefreq: 'monthly', priority: '0.9' },
  { path: '/mentions-legales', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms', changefreq: 'yearly', priority: '0.2' },
  { path: '/cookies', changefreq: 'yearly', priority: '0.2' },
];

/** Organization structured data, on every page. */
export const TRAVEL_AGENCY_LD = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'Fairway Atelier',
  description: 'Bespoke luxury golf travel on the Emerald Coast of Brittany, France.',
  url: `${SITE_URL}/`,
  email: CONTACT_EMAIL,
  slogan: 'Play Beautifully. Travel Effortlessly.',
  areaServed: 'Brittany, France',
  address: { '@type': 'PostalAddress', addressLocality: 'Dinard', postalCode: '35800', addressCountry: 'FR' },
};

/** "/" stays "/", everything else has no trailing slash. */
export function canonical(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.replace(/\/$/, '')}`;
}
