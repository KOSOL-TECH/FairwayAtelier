// Shared helpers for content pages
function CHero({ eyebrow, title, intro }) {
  return (
    <section style={{ textAlign: 'center', padding: '72px 40px 40px', maxWidth: 820, margin: '0 auto' }}>
      <Eyebrow rules tone="brass">{eyebrow}</Eyebrow>
      <h1 style={{ fontSize: 'var(--text-display-lg)', margin: '16px 0 18px' }}>{title}</h1>
      {intro && <p style={{ fontSize: 17 }}>{intro}</p>}
    </section>
  );
}
function Disclosure() {
  return (
    <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', maxWidth: 720, margin: '8px auto 0', padding: '0 40px' }}>
      Named restaurants, hotels, and courses are illustrative of the experience we curate. Final inclusions per trip are subject to availability and confirmed during the consultation call.
    </p>
  );
}

function DiningGolfScreen({ onNav }) {
  const courses = [
    { img: '../../assets/img-club-heritage.png', name: 'Golf de Dinard', meta: 'Saint-Briac-sur-Mer · Est. 1887', copy: 'The second-oldest course in France — a classic seaside links laid over the cliffs of the Emerald Coast, minutes from both hotels.' },
    { img: '../../assets/img-destination.png', name: 'Golf de Saint-Cast', meta: 'Côte d\'Émeraude · Parkland-links', copy: 'A rolling coastal course with wide Atlantic views, chosen for its condition and light on the week\'s calmer day.' },
    { img: '../../assets/img-golf-bag.png', name: 'Golf de Pléneuf-Val-André', meta: 'Baie de Saint-Brieuc · Cliff-top', copy: 'Dramatic cliff-edge fairways above the bay — the most photographed round of the journey, and a favourite finish.' },
  ];
  const tables = [
    { img: '../../assets/img-dining.png', name: 'Le Coquillage', meta: 'Saint-Méloir-des-Ondes · ★★★', copy: 'Hubert & Olivier Roellinger\'s three-star at Château Richeux — sea, garden, and spice, and the headline dinner of the week.' },
    { img: '../../assets/img-embossed-crest.png', name: 'Le Jules Verne', meta: 'Paris · Eiffel Tower · ★★', copy: 'Lunch two-thirds up the tower before the TGV south — a two-star opening that sets the register for the days to come.' },
    { img: '../../assets/img-arch-lineart.png', name: 'Pourquoi Pas — Castelbrac', meta: 'Dinard · ★', copy: 'A one-star dining room set into the rock above the bay, held for an intimate closing night rather than another long tasting.' },
  ];
  const Section = ({ label, title, lead, items }) => (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 40px 72px' }}>
      <Eyebrow rules tone="brass">{label}</Eyebrow>
      <h2 style={{ fontSize: 'var(--text-display-md)', textAlign: 'center', margin: '14px 0 12px' }}>{title}</h2>
      <p style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 40px' }}>{lead}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        {items.map((c) => (
          <div key={c.name} style={{ border: '1px solid var(--border-hairline)', background: 'var(--surface-card)' }}>
            <img src={c.img} alt={c.name} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '20px 22px 22px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>{c.meta}</div>
              <h3 style={{ fontSize: 24, margin: '8px 0 8px' }}>{c.name}</h3>
              <p style={{ fontSize: 14, margin: 0 }}>{c.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
  return (
    <main>
      <CHero eyebrow="Dining & Golf" title="Championship links, three-star tables" intro="Four rounds of coastal golf and a run of France's most storied restaurants — sequenced across the week so each is met with an appetite, never fatigue." />
      <Section label="The Courses" title="Four rounds on the Emerald Coast" lead="Played with your own English-speaking PGA professional. The precise courses are chosen for each week's weather, light, and the group's rhythm." items={courses} />
      <div style={{ background: 'var(--surface-tint)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)', paddingTop: 48 }}>
        <Section label="The Tables" title="Two unmistakable Michelin moments" lead="Reservations at named tables are confirmed before a week is ever offered — Le Coquillage and Le Jules Verne are held in advance." items={tables} />
      </div>
      <section style={{ textAlign: 'center', padding: '72px 40px 40px' }}>
        <Disclosure />
        <div style={{ marginTop: 28 }}><Button onClick={() => onNav('Enquire')}>Enquire about a journey</Button></div>
      </section>
    </main>
  );
}

function PrivateScreen({ onNav }) {
  const options = [
    ['A private week', 'Take an entire week for your own group of four to eight — the whole journey, closed to others, on dates arranged around you.'],
    ['Charter aviation', 'Private transfer in place of the TGV, or direct charter into Dinard–Pleurtuit, for those who prefer to arrive on their own clock.'],
    ['A Paris extension', 'Bookend the week with nights in the capital — a suite, a table, and a car, handled to the same standard.'],
    ['Beyond golf', 'Sailing on the Rance, a private Mont-Saint-Michel crossing, cellar visits, or a day given entirely to the coast.'],
  ];
  return (
    <main>
      <CHero eyebrow="Private Journeys" title="Entirely your own" intro="Beyond our scheduled weeks, we design private journeys from a blank page — same standard of care, shaped wholly around your group, your dates, and your interests." />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 40px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          {options.map(([t, c]) => (
            <div key={t} style={{ border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', padding: '28px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, background: 'var(--accent)', transform: 'rotate(45deg)' }}></span>
                <h3 style={{ fontSize: 23, margin: 0 }}>{t}</h3>
              </div>
              <p style={{ fontSize: 14, margin: 0 }}>{c}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: 'var(--surface-inverse)', padding: '76px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-brass-light)' }}>By Introduction</div>
          <h2 style={{ fontSize: 'var(--text-display-md)', color: 'var(--text-on-dark)', margin: '16px 0 18px' }}>Every private journey begins with a conversation</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--text-on-dark)', opacity: 0.8, margin: '0 0 32px' }}>Tell us who is travelling and what would make the week yours. We will design a proposal, and — as with every Fairway Atelier journey — you will never see a bill once you arrive.</p>
          <Button onClick={() => onNav('Enquire')}>Enquire about a private journey</Button>
        </div>
      </section>
    </main>
  );
}

function FAQScreen({ onNav }) {
  const faqs = [
    ['Are flights included?', 'No. We keep pricing clean and let you fly as you prefer — but we are glad to arrange business- or first-class travel, or private charter, as an add-on to your journey.'],
    ['How does pricing work?', 'Every journey is bespoke and priced on request. After a short consultation call we send a written, personalised proposal; no sum is ever collected through this website.'],
    ['What is the “no-wallet” promise?', 'Once your journey begins you will never see a bill. Tables, transfers, tee times, and companion arrangements are all settled ahead and quietly maintained — touchless and walletless, start to finish.'],
    ['Who is the journey for?', 'Couples and small groups who love the game and the good life in equal measure. Each week takes a single group of four; larger private groups are arranged separately.'],
    ['Do companions who don’t play golf enjoy it?', 'Very much so. A parallel itinerary runs alongside the rounds — thalasso, Saint-Malo, Cancale, Mont-Saint-Michel, and the Belle-Époque coast.'],
    ['What is the difference between the two tiers?', 'The journey is identical; the hotel differs. Standard is anchored at EMERIA Dinard (thalasso-led); Signature at Hôtel Barrière (a Belle-Époque grand hotel). You choose on the consultation call.'],
    ['How far ahead should we book?', 'Weeks are released in limited numbers and often fill months ahead. If your preferred dates show as waitlisted, enquire anyway — arrangements do change.'],
    ['What if we need to cancel?', 'Cancellation terms follow your written proposal and French travel law. Because named tables and rooms are held on your behalf, terms reflect commitments already made to our partners.'],
  ];
  return (
    <main>
      <CHero eyebrow="Questions" title="Frequently asked" intro="If your question isn't answered here, our France-based team is a message away." />
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '24px 40px 40px' }}>
        {faqs.map(([q, a], i) => (
          <FAQItem key={i} q={q} a={a} defaultOpen={i === 0} />
        ))}
      </section>
      <section style={{ textAlign: 'center', padding: '32px 40px 80px' }}>
        <Button variant="secondary" onClick={() => onNav('Enquire')}>Ask us anything</Button>
      </section>
    </main>
  );
}
function FAQItem({ q, a, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-heading)' }}>{q}</span>
        <span style={{ width: 9, height: 9, flexShrink: 0, borderRight: '1px solid var(--accent)', borderBottom: '1px solid var(--accent)', transform: open ? 'rotate(-135deg)' : 'rotate(45deg)', transition: 'transform var(--dur-fast) var(--ease-standard)' }}></span>
      </button>
      {open && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 'var(--leading-body)', color: 'var(--text-body)', margin: '0 0 24px', maxWidth: 680 }}>{a}</p>}
    </div>
  );
}

function JournalScreen({ onNav }) {
  const featured = { img: '../../assets/img-destination.png', cat: 'The Coast', title: 'Why we chose Brittany', excerpt: 'On the Emerald Coast, the golf, the table, and the sea are never more than a few minutes apart — and that proximity is the whole idea.' };
  const posts = [
    { img: '../../assets/img-club-heritage.png', cat: 'The Courses', title: 'A round at Dinard, France\'s second-oldest course', read: '5 min' },
    { img: '../../assets/img-dining.png', cat: 'The Table', title: 'An afternoon with the Roellingers at Le Coquillage', read: '7 min' },
    { img: '../../assets/img-golf-bag.png', cat: 'The Craft', title: 'What “no wallet” really takes to arrange', read: '4 min' },
    { img: '../../assets/img-arch-lineart.png', cat: 'The Coast', title: 'Crossing to Mont-Saint-Michel, quietly', read: '6 min' },
  ];
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 96px' }}>
      <CHero eyebrow="Journal" title="Notes from the coast" intro="Dispatches on the courses, the tables, and the craft of an effortless week — written by the team who arrange them." />
      <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 40, alignItems: 'center', background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', marginBottom: 40, color: 'inherit' }}>
        <img src={featured.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 300 }} />
        <div style={{ padding: '36px 44px 36px 12px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>Featured · {featured.cat}</div>
          <h2 style={{ fontSize: 'var(--text-display-sm)', margin: '12px 0 12px' }}>{featured.title}</h2>
          <p style={{ fontSize: 15, margin: '0 0 18px' }}>{featured.excerpt}</p>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-fairway-green)', borderBottom: '1px solid var(--accent)', paddingBottom: 3 }}>Read the note</span>
        </div>
      </a>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
        {posts.map((p) => (
          <a key={p.title} href="#" onClick={(e) => { e.preventDefault(); }} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'stretch', border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', color: 'inherit' }}>
            <img src={p.img} alt="" style={{ width: '100%', height: '100%', minHeight: 150, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>{p.cat}</div>
              <h3 style={{ fontSize: 21, margin: '8px 0 10px', lineHeight: 1.2 }}>{p.title}</h3>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>{p.read} read</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
