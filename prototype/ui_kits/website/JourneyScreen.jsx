import React from 'react';
import { Button } from '../../components/core/Button.jsx';
import { Eyebrow } from '../../components/core/Eyebrow.jsx';
import { Divider } from '../../components/core/Divider.jsx';
import { Tabs } from '../../components/surfaces/Tabs.jsx';
export function JourneyScreen({ onNav }) {
  const [tier, setTier] = React.useState(0);
  const days = [
    ['Day 1', 'Arrival in Paris', 'Met at CDG or Orly and driven to a five-star Paris hotel. No itinerary, no pressure — only a calm dinner and a good night\'s sleep. The trip begins the moment your car door closes.'],
    ['Day 2', 'Le Jules Verne, then the calm chapter', 'A lazy Paris morning, then lunch at Le Jules Verne inside the Eiffel Tower (two Michelin stars). Your chauffeur is waiting at the South Pillar; a short transfer to Montparnasse, then TGV Première to Brittany — a restful two hours rather than four in a car. A driver meets your carriage at Rennes; you are at your hotel on the Emerald Coast by early evening.'],
    ['Day 3', 'Golf de Dinard', 'The heritage opener — the second-oldest course in France (1887), minutes from your hotel. A round with your own English-speaking PGA professional, an unhurried lunch at the course, and the afternoon at your pace. Your companion has the thalasso and the coast.'],
    ['Day 4', 'The coastal links', 'Saint-Cast Côte d\'Émeraude or Pléneuf-Val-André, chosen for the week\'s weather and light. Cliff-top fairways above the Atlantic, a table near the course, and home before dusk.'],
    ['Day 5', 'The centrepiece', 'A day that breathes. A thalasso morning, an optional private crossing to Mont-Saint-Michel, then the headline dinner of the week — Le Coquillage at Saint-Méloir-des-Ondes, three Michelin stars, sea and garden. Delivered before late-week fatigue, when you can savour every course.'],
    ['Day 6', 'The third round', 'The alternate coastal course, then a refined but calmer dinner — a local table chosen for the group\'s rhythm rather than another long tasting.'],
    ['Day 7', 'The final round & a quiet close', 'One last course, then a closing dinner that is intimate rather than epic — a single Michelin star at Castelbrac, or your hotel\'s own grand dining room. A fitting end, not an endurance test.'],
    ['Day 8', 'Homeward, unhurried', 'A late breakfast, a driver to Rennes, TGV to Paris, and a car waiting for your flight. Everything already arranged — right down to the timing of your departure.'],
  ];
  const tiers = [
    { eyebrow: 'Standard Tier', img: '../../assets/img-club-heritage.png', hotel: 'EMERIA Dinard Hôtel Thalasso & Spa', lead: 'Your home for six nights is a destination thalassotherapy resort — the largest wellness institute on the Emerald Coast, and the restorative heart of the journey.',
      points: ['2,800 m² thalasso & spa institute — 58 treatment rooms', 'Heated seawater pools facing the sea', 'Sea-view rooms; the Horizon bar\'s panoramic view', 'Minutes from Dinard Golf; twenty from Saint-Malo'], img: '../../assets/img-club-heritage.png' },
    { eyebrow: 'Signature Tier', img: '../../assets/img-destination.png', hotel: 'Hôtel Barrière Le Grand Hôtel Dinard', lead: 'A five-star Belle-Époque grand hotel facing the bay of Saint-Malo, member of Leading Hotels of the World — for those who want the formal grand-hotel signal.',
      points: ['Le George V dining room; the 333 Café piano-bar', 'Spa Diane Barrière; indoor pool, hammam, sauna', 'Casino Barrière adjacent; a short walk to the beach', 'Optional: charter aviation, a Castelbrac Michelin-room night, a Paris extension'], img: '../../assets/img-destination.png' },
  ];
  const t = tiers[tier];
  const bill = { fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' };
  return (
    <main>
      <section style={{ textAlign: 'center', padding: '72px 40px 36px', maxWidth: 800, margin: '0 auto' }}>
        <Eyebrow rules tone="brass">The 8-Day Journey</Eyebrow>
        <h1 style={{ fontSize: 'var(--text-display-lg)', margin: '16px 0 14px' }}>Eight days on the Emerald Coast</h1>
        <p style={{ fontSize: 16 }}>An 8-day, 7-night journey for a single group of four — four rounds of championship golf, two unmistakable Michelin moments, and the whole of Brittany arranged around you.</p>
      </section>

      {/* Walletless differentiator */}
      <section style={{ background: 'var(--surface-inverse)', padding: '72px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-brass-light)' }}>The Fairway Atelier Difference</div>
          <h2 style={{ fontSize: 'var(--text-display-md)', color: 'var(--text-on-dark)', margin: '16px 0 18px' }}>You will never see a bill during your trip.</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--text-on-dark)', opacity: 0.8, maxWidth: 660, margin: '0 auto' }}>
            No cheques at dinner, no tabs at the bar, no settling up with a driver. Timing, reservations, transfers, tee times, restaurant access, and every companion arrangement are handled before you arrive and quietly maintained throughout. Touchless and walletless, from the first car door to the last. You carry a set of clubs and an appetite — we carry everything else.
          </p>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', marginTop: 36 }}>
            {['Nothing to sign', 'Nothing to arrange', 'Nothing to carry'].map((x) => (
              <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-on-dark)' }}>
                <span style={{ width: 6, height: 6, background: 'var(--color-brass-light)', transform: 'rotate(45deg)' }}></span>{x}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '72px 40px' }}>
        <Eyebrow rules tone="brass">Day by Day</Eyebrow>
        <h2 style={{ fontSize: 'var(--text-display-md)', textAlign: 'center', margin: '14px 0 12px' }}>The rhythm of the week</h2>
        <p style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>The same narrative whichever tier you choose. The hotels differ; the care does not.</p>
        {days.map(([d, title, copy]) => (
          <div key={d} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 28, padding: '26px 0', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)', paddingTop: 4 }}>{d}</div>
            <div>
              <h3 style={{ fontSize: 24, margin: '0 0 6px' }}>{title}</h3>
              <p style={{ fontSize: 15, margin: 0 }}>{copy}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Tiers */}
      <section style={{ background: 'var(--surface-tint)', borderTop: '1px solid var(--border-hairline)', padding: '76px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Eyebrow rules tone="brass">Choose Your Tier</Eyebrow>
          <h2 style={{ fontSize: 'var(--text-display-md)', textAlign: 'center', margin: '14px 0 32px' }}>Two hotels, one journey</h2>
          <Tabs tabs={['Standard — EMERIA', 'Signature — Barrière']} active={tier} onChange={setTier} style={{ justifyContent: 'center', marginBottom: 36 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 40, alignItems: 'center', background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', padding: 8 }}>
            <img src={t.img} alt={t.hotel} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 340 }} />
            <div style={{ padding: '32px 40px 32px 12px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>{t.eyebrow}</div>
              <h3 style={{ fontSize: 30, margin: '10px 0 14px' }}>{t.hotel}</h3>
              <p style={{ fontSize: 15, margin: '0 0 18px' }}>{t.lead}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.points.map((p) => (
                  <li key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)' }}>
                    <span style={{ width: 5, height: 5, background: 'var(--accent)', transform: 'rotate(45deg)', marginTop: 7, flexShrink: 0 }}></span>{p}
                  </li>
                ))}
              </ul>
              <Divider tone="hairline" style={{ margin: '0 0 18px' }} />
              <div style={bill}>Priced on request</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 20px' }}>Every journey is bespoke; your exact price is confirmed on the consultation call. Flights are not included — though we are glad to arrange business- or first-class travel as an add-on.</p>
              <Button onClick={() => onNav('Enquire')}>Enquire about this tier</Button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginTop: 20, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
            Named restaurants and courses are illustrative of the experience we curate. Each week&apos;s final inclusions are confirmed during your consultation call.
          </p>
        </div>
      </section>
    </main>
  );
}
