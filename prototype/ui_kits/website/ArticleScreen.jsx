function ArticleScreen({ slug, onNav }) {
  const articles = {
    coast: {
      eyebrow: 'Our USP · The Golf',
      kicker: 'The Golf',
      title: 'Old, beautiful French links — and a pro who is yours all week',
      hero: '../../assets/img-destination.png',
      lede: 'Incredible sea-side courses, some of the oldest in France, played above the cliffs of the Emerald Coast. And at your side the whole week, a dedicated English-speaking professional committed to one thing: your game.',
      body: [
        ['Courses with a century behind them', 'From Golf de Dinard — laid out in 1887, the second-oldest in France — to the cliff-top fairways of Pléneuf-Val-André, these are old, beautiful, distinctly French links, with the Atlantic in every sightline.'],
        ['A pro who follows you around', 'You are not handed a tee time and left to it. A full-time, English-speaking PGA professional accompanies your group all week — reading the wind, walking every hole, and genuinely invested in your play improving by the final round.'],
        ['Golf the way it should feel', 'Present when you want coaching, invisible when you want the round to breathe. The result is a week that is as much about playing better as it is about playing somewhere beautiful.'],
      ],
      pull: 'A dedicated pro at your side all week, committed to your game.',
      next: 'dining', nextLabel: 'The Table',
    },
    dining: {
      eyebrow: 'Our USP · The Table',
      kicker: 'The Table',
      title: 'Amazing food every day, set against breathtaking scenery',
      hero: '../../assets/img-dining.png',
      lede: 'Fine dining is not a once-in-the-week event; it is every day. Beautiful food and beautiful wines, taken in settings — sea-side cliffs, harbours, garden terraces — as memorable as the plates themselves.',
      body: [
        ['Something remarkable, daily', 'From a three-star centrepiece to an unhurried harbour lunch of Cancale oysters, every day carries a meal worth travelling for. The wines are chosen to match — beautiful bottles, poured without ceremony.'],
        ['Scenery that earns its place', 'Dinner above the cliffs, lunch looking out to Saint-Malo, an evening table with the Atlantic turning gold. The setting is part of the cooking here, and it never disappoints.'],
        ['Tables already held', 'The hardest reservations — Le Coquillage, Le Jules Verne — are confirmed before your week is ever offered. You simply arrive; the table is waiting.'],
      ],
      pull: 'Beautiful food and wine every day, above the sea-side cliffs.',
      next: 'restore', nextLabel: 'The Ease',
    },
    restore: {
      eyebrow: 'Our USP · The Ease',
      kicker: 'The Ease',
      title: 'Small groups, true luxury, and never a bill in sight',
      hero: '../../assets/img-club-heritage.png',
      lede: 'A single group of four, an entirely touchless week, and everything — every table, transfer, and tee time — taken care of. From the moment you arrive, you never see a bill, backed by a concierge on call around the clock.',
      body: [
        ['Small groups, real luxury', 'Each journey takes one group of four — never a crowd, never a coach party. Two hotel tiers, sea-view rooms, and a standard of care that comes from keeping the numbers deliberately small.'],
        ['Touchless, and never a bill', 'Once you arrive, nothing asks to be paid, signed, or settled. Tables, transfers, tee times, and companion plans are arranged and paid ahead and quietly maintained — touchless and walletless, start to finish.'],
        ['A concierge, around the clock', 'One named host knows your week by heart, reachable 24/7 by phone, message, or WhatsApp. A change of plan, a special request, a late idea — handled, without you lifting a finger.'],
      ],
      pull: 'From the moment you arrive, you never see a bill.',
      next: 'coast', nextLabel: 'The Golf',
    },
  };
  const a = articles[slug] || articles.coast;
  return (
    <main>
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '64px 40px 8px', textAlign: 'center' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onNav('Home'); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>← Home</a>
        <div style={{ marginTop: 28 }}><Eyebrow rules tone="brass">{a.eyebrow}</Eyebrow></div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 20 }}>{a.kicker}</div>
        <h1 style={{ fontSize: 'var(--text-display-lg)', margin: '12px 0 22px' }}>{a.title}</h1>
      </section>
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px' }}>
        <img src={a.hero} alt={a.kicker} style={{ width: '100%', aspectRatio: '16 / 7', objectFit: 'cover', display: 'block', border: '1px solid var(--border-hairline)' }} />
      </section>
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 40px 0' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--text-heading)', margin: 0 }}>{a.lede}</p>
      </section>
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 40px 8px' }}>
        {a.body.map(([h, p], i) => (
          <div key={i}>
            {i === 1 && (
              <blockquote style={{ margin: '20px 0 36px', padding: '4px 0 4px 28px', borderLeft: '2px solid var(--accent)', fontFamily: 'var(--font-display)', fontSize: 26, fontStyle: 'italic', lineHeight: 1.4, color: 'var(--text-heading)' }}>{a.pull}</blockquote>
            )}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-sm)', color: 'var(--text-heading)', margin: '28px 0 12px' }}>{h}</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 'var(--leading-body)', color: 'var(--text-body)', margin: '0 0 18px' }}>{p}</p>
          </div>
        ))}
      </article>
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 40px 24px' }}>
        <Divider ornament tone="brass" style={{ maxWidth: 220, margin: '0 auto' }} />
      </section>
      <section style={{ textAlign: 'center', padding: '8px 40px 40px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Continue reading</div>
        <a href="#" onClick={(e) => { e.preventDefault(); onNav('Article:' + a.next); }} style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-heading)', borderBottom: '1px solid var(--accent)', paddingBottom: 4 }}>{a.nextLabel} →</a>
      </section>
      <section style={{ background: 'var(--surface-inverse)', padding: '72px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'var(--text-display-md)', color: 'var(--text-on-dark)', margin: '0 0 24px' }}>Begin your week in Brittany</h2>
          <Button onClick={() => onNav('Enquire')}>Enquire about a journey</Button>
        </div>
      </section>
    </main>
  );
}
