import React from 'react';
import { Button } from '../../components/core/Button.jsx';
import { Eyebrow } from '../../components/core/Eyebrow.jsx';
import { Badge } from '../../components/core/Badge.jsx';
import { Divider } from '../../components/core/Divider.jsx';
import { Testimonial } from '../../components/surfaces/Testimonial.jsx';
export function HomeScreen({ onNav }) {
  const voices = [
    { quote: 'We arrived with clubs and an appetite, and for eight days lifted not a finger. The finest week we have given ourselves.', name: 'R. & M. Callahan', detail: 'The Signature Journey · September 2025' },
    { quote: 'Dinner at Le Coquillage, a round above the Atlantic, and never once a bill. That is the whole trick, and they have mastered it.', name: 'James Ellory', detail: 'The Standard Journey · May 2025' },
    { quote: 'I came for the golf; my wife came for the coast. We both left saying it was the best-organised holiday of our lives.', name: 'Dr. P. Hargreave', detail: 'The 8-Day Journey · June 2025' },
  ];
  const [voice, setVoice] = React.useState(0);
  const atmospheres = [
    { slug: 'coast', img: '../../assets/img-destination.png', title: 'The Golf', copy: 'Old, beautiful French seaside courses — and your own English-speaking pro at your side all week, committed to your game.' },
    { slug: 'dining', img: '../../assets/img-dining.png', title: 'The Table', copy: 'Fine dining and beautiful wines every day, set against sea-side cliffs and breathtaking scenery.' },
    { slug: 'restore', img: '../../assets/img-club-heritage.png', title: 'The Ease', copy: 'Small groups, true luxury, everything taken care of. Touchless — you never see a bill — with a 24/7 concierge.' },
  ];
  const weeks = [
    { dates: 'Sun 10 – Sun 17 May 2026', tier: 'Standard & Signature', status: 'booking', label: 'Booking' },
    { dates: 'Sun 07 – Sun 14 Jun 2026', tier: 'Signature only', status: 'limited', label: 'Limited' },
    { dates: 'Sun 13 – Sun 20 Sep 2026', tier: 'Standard & Signature', status: 'booking', label: 'Booking' },
    { dates: 'Sun 04 – Sun 11 Oct 2026', tier: 'Waitlist', status: 'sold', label: 'Sold' },
  ];
  return (
    <main>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-page)', textAlign: 'center', padding: '92px 40px 84px' }}>
        <img src="../../assets/hero-villa.png" alt="" aria-hidden="true" style={{ position: 'absolute', top: 24, right: 0, width: 420, opacity: 0.5, pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0))', maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0))' }} />
        <img src="../../assets/hero-villa.png" alt="" aria-hidden="true" style={{ position: 'absolute', top: 24, left: 0, width: 420, opacity: 0.5, pointerEvents: 'none', transform: 'scaleX(-1)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0))', maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0))' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="../../assets/crest.png" alt="" style={{ height: 104 }} />
          <h1 style={{ fontSize: 'var(--text-display-xl)', fontWeight: 'var(--weight-medium)', margin: '26px auto 0', maxWidth: 800 }}>Bespoke luxury golf travel, beautifully arranged.</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: 'var(--text-body)', margin: '20px auto 0', maxWidth: 620 }}>France golf holidays shaped by fine dining, beautiful scenery, attentive hospitality, and the quiet ease of having every detail handled.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 34 }}>
            <Button onClick={() => onNav('Availability')}>View available departures</Button>
            <Button variant="secondary" onClick={() => onNav('Enquire')}>Enquire about a private journey</Button>
          </div>
        </div>
      </section>
      <Divider ornament tone="brass" style={{ maxWidth: 320, margin: '0 auto' }} />

      {/* Editorial intro */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '80px 40px 20px', textAlign: 'center' }}>
        <Eyebrow rules tone="brass">The Fairway Atelier Experience</Eyebrow>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.5, color: 'var(--text-heading)', margin: '22px 0 0' }}>
          Eight unhurried days on the Emerald Coast of Brittany — championship links by day, three-Michelin tables by night, and the calm of a place that runs entirely without you having to ask.
        </p>
      </section>

      {/* How it feels */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 40px 88px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {atmospheres.map((a) => (
            <a key={a.title} href="#" onClick={(e) => { e.preventDefault(); onNav('Article:' + a.slug); }} style={{ color: 'inherit', display: 'block', cursor: 'pointer' }}>
              <img src={a.img} alt={a.title} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', border: '1px solid var(--border-hairline)' }} />
              <h3 style={{ fontSize: 22, margin: '18px 0 8px' }}>{a.title}</h3>
              <p style={{ fontSize: 14, margin: '0 0 12px' }}>{a.copy}</p>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-fairway-green)', borderBottom: '1px solid var(--accent)', paddingBottom: 3 }}>Read more</span>
            </a>
          ))}
        </div>
      </section>

      {/* Available departures preview */}
      <section style={{ background: 'var(--surface-tint)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)', padding: '80px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Eyebrow rules tone="brass">Available Departures</Eyebrow>
          <h2 style={{ fontSize: 'var(--text-display-md)', textAlign: 'center', margin: '14px 0 36px' }}>The next bookable weeks</h2>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}>
            {weeks.map((w, i) => (
              <div key={w.dates} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 20, alignItems: 'center', padding: '18px 24px', borderTop: i ? '1px solid var(--border-hairline)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--text-heading)' }}>{w.dates}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{w.tier}</span>
                <Badge tone={w.status} dot>{w.label}</Badge>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}><Button onClick={() => onNav('Availability')}>See full availability</Button></div>
        </div>
      </section>

      {/* Tier preview */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '88px 40px' }}>
        <Eyebrow rules tone="brass">Two Ways to Stay</Eyebrow>
        <h2 style={{ fontSize: 'var(--text-display-lg)', textAlign: 'center', margin: '14px 0 44px' }}>Choose the rhythm that suits you</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div style={{ border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', padding: 8 }}>
            <div style={{ border: '1px solid var(--border-rule)', padding: '32px 34px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>Standard Tier</div>
              <h3 style={{ fontSize: 28, margin: '10px 0 12px' }}>EMERIA Dinard</h3>
              <p style={{ fontSize: 14, margin: '0 0 18px' }}>Anchored at EMERIA Dinard Hôtel Thalasso &amp; Spa — the largest thalassotherapy institute on the coast, and the heart of our restorative rhythm.</p>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>Priced on request</div>
              <div style={{ marginTop: 18 }}><Button variant="ghost" onClick={() => onNav('Journey')}>Explore the Standard journey</Button></div>
            </div>
          </div>
          <div style={{ border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', padding: 8 }}>
            <div style={{ border: '1px solid var(--border-rule)', padding: '32px 34px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>Signature Tier</div>
              <h3 style={{ fontSize: 28, margin: '10px 0 12px' }}>Hôtel Barrière</h3>
              <p style={{ fontSize: 14, margin: '0 0 18px' }}>Anchored at Hôtel Barrière Le Grand Hôtel Dinard, a Belle-Époque grand hotel facing the bay of Saint-Malo, member of Leading Hotels of the World.</p>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>Priced on request</div>
              <div style={{ marginTop: 18 }}><Button variant="ghost" onClick={() => onNav('Journey')}>Explore the Signature journey</Button></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section style={{ background: 'var(--surface-inverse)', padding: '76px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          {[['France-based', 'A team on the ground, not a call centre'], ['Intimate', 'Four guests to a journey, never a crowd'], ['Named-host', 'One concierge, from enquiry to farewell'], ['Fully handled', 'No wallet, no logistics — only the days themselves']].map(([t, c]) => (
            <div key={t}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-on-dark)' }}>{t}</div>
              <div style={{ width: 24, height: 1, background: 'var(--color-brass-light)', margin: '12px auto' }}></div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-on-dark)', opacity: 0.7, margin: 0 }}>{c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: 'var(--surface-tint)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)', padding: '84px 40px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Eyebrow rules tone="brass">In Their Words</Eyebrow>
          <div style={{ marginTop: 32, minHeight: 260, display: 'flex', alignItems: 'center' }}>
            <Testimonial quote={voices[voice].quote} name={voices[voice].name} detail={voices[voice].detail} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {voices.map((_, i) => (
              <button key={i} aria-label={'Guest ' + (i + 1)} onClick={() => setVoice(i)}
                style={{ width: 9, height: 9, padding: 0, border: '1px solid var(--accent)', background: i === voice ? 'var(--accent)' : 'transparent', cursor: 'pointer', transform: 'rotate(45deg)', transition: 'background var(--dur-fast) var(--ease-standard)' }}></button>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ background: 'var(--surface-page)', textAlign: 'center', padding: '84px 40px' }}>
        <Eyebrow tone="brass">Begin</Eyebrow>
        <h2 style={{ fontSize: 'var(--text-display-lg)', margin: '12px auto 20px', maxWidth: 620 }}>Your week in Brittany starts with a conversation.</h2>
        <Button size="lg" onClick={() => onNav('Enquire')}>View available departures</Button>
      </section>
    </main>
  );
}
