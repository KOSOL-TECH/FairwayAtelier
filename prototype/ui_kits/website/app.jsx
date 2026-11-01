function WebsiteApp() {
  const [page, setPage] = React.useState('Home');
  const nav = (p) => { setPage(p); window.scrollTo(0, 0); };
  const META = {
    Home: ['Fairway Atelier — Bespoke Luxury Golf Travel in Brittany', 'Championship links, Michelin tables, and a touchless, walletless week on the Emerald Coast of Brittany.'],
    Experience: ['The Experience — Fairway Atelier', 'Complete guest care on the Emerald Coast: arrive, settle in, and never see a bill. Everything is handled.'],
    Journey: ['The 8-Day Journey — Fairway Atelier', 'Eight unhurried days in Brittany — four championship rounds, two Michelin moments, two hotel tiers.'],
    Availability: ['Availability — Fairway Atelier', 'Opened weeks for 2026. Each week runs for a single group of four; enquire to hold your dates.'],
    DiningGolf: ['Dining & Golf — Fairway Atelier', 'Golf de Dinard, Saint-Cast and Pléneuf-Val-André, with three-star tables including Le Coquillage.'],
    Private: ['Private Journeys — Fairway Atelier', 'Bespoke private golf journeys in Brittany, designed from a blank page around your group and dates.'],
    FAQ: ['Frequently Asked — Fairway Atelier', 'Flights, pricing, the no-wallet promise, tiers, and booking — answered by our France-based team.'],
    Journal: ['Journal — Fairway Atelier', 'Notes from the coast: the courses, the tables, and the craft of an effortless week.'],
    Enquire: ['Enquire — Fairway Atelier', 'Tell us a little and our France-based team replies within 24 hours to arrange a consultation call.'],
    MentionsLegales: ['Mentions légales — Fairway Atelier', 'Legal information for Fairway Atelier SAS.'],
    Privacy: ['Privacy Policy — Fairway Atelier', 'How Fairway Atelier collects and protects your personal data, in line with the GDPR.'],
    Terms: ['Terms of Booking (CGV) — Fairway Atelier', 'Conditions of sale for Fairway Atelier travel services.'],
    Cookies: ['Cookie Policy — Fairway Atelier', 'How we use cookies, and how to accept, refuse, or manage them.'],
  };
  React.useEffect(() => {
    const [title, desc] = META[page] || META.Home;
    document.title = title;
    const set = (sel, attr, val) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, val); };
    set('meta[name="description"]', 'content', desc);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', desc);
    set('meta[name="twitter:title"]', 'content', title);
    set('meta[name="twitter:description"]', 'content', desc);
  }, [page]);
  return (
    <div>
      <SiteHeader page={page} onNav={nav} />
      {page === 'Home' && <HomeScreen onNav={nav} />}
      {page === 'Experience' && <ExperienceScreen onNav={nav} />}
      {page === 'Journey' && <JourneyScreen onNav={nav} />}
      {page === 'Availability' && <AvailabilityScreen onNav={nav} />}
      {page === 'DiningGolf' && <DiningGolfScreen onNav={nav} />}
      {page === 'Private' && <PrivateScreen onNav={nav} />}
      {page === 'FAQ' && <FAQScreen onNav={nav} />}
      {page === 'Journal' && <JournalScreen onNav={nav} />}
      {page === 'Enquire' && <EnquireScreen />}
      {page.indexOf('Article:') === 0 && <ArticleScreen slug={page.slice(8)} onNav={nav} />}
      {page === 'MentionsLegales' && <MentionsLegalesScreen />}
      {page === 'Privacy' && <PrivacyScreen onNav={nav} />}
      {page === 'Terms' && <TermsScreen />}
      {page === 'Cookies' && <CookiesScreen onNav={nav} />}
      <ScrollReveal trigger={page} />
      <ResponsiveStyles />
      <SiteFooter onNav={nav} />
      <CookieConsent onNav={nav} />
    </div>
  );
}
