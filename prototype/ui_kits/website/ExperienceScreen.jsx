import React from 'react';
import { Button } from '../../components/core/Button.jsx';
import { Eyebrow } from '../../components/core/Eyebrow.jsx';
import { Divider } from '../../components/core/Divider.jsx';
export function ExperienceScreen({ onNav }) {
  const handled = [
    ['Timing', 'The whole week is sequenced for you — arrival, rounds, tables, and rest in a rhythm designed around energy, not logistics.'],
    ['Reservations', 'Michelin tables and hotel dining confirmed before your week is ever offered. Le Jules Verne and Le Coquillage are held in advance.'],
    ['Transfers', 'A Mercedes and an English-speaking driver in region; TGV Première between Paris and Brittany. You are met at the carriage door.'],
    ['Tee times', 'Four courses, secured and sequenced, each round with your own PGA professional — present, personal, never overbearing.'],
    ['Companions', 'A parallel itinerary for those not playing: thalasso, Saint-Malo, Cancale oysters, Mont-Saint-Michel, the Belle-Époque coast.'],
    ['On-trip support', 'A named host by your side from booking to farewell — reachable by phone, message, or WhatsApp, twelve hours a day.'],
  ];
  const paths = [
    ['Balanced', 'The flagship — four rounds and two Michelin moments, in perfect balance with rest and the coast.'],
    ['Intensive Golf', 'Five rounds, extended practice, and an optional academy block for those chasing rhythm and improvement.'],
    ['Culinary France', 'One round or none — the France holiday for couples who come for the table and the scenery.'],
    ['Companion', 'A full non-golf journey running alongside the rounds, wanting for nothing.'],
  ];
  return (
    <main>
      <section style={{ textAlign: 'center', padding: '72px 40px 40px', maxWidth: 820, margin: '0 auto' }}>
        <Eyebrow rules tone="brass">The Experience</Eyebrow>
        <h1 style={{ fontSize: 'var(--text-display-lg)', margin: '16px 0 18px' }}>The art of leaving nothing to arrange</h1>
        <p style={{ fontSize: 17 }}>Fairway Atelier is built on a single operating principle: complete guest care. Arrive, settle in, enjoy the experience — and never once worry about the details. They have already been thought through for you.</p>
      </section>

      {/* Walletless promise, concrete */}
      <section style={{ background: 'var(--surface-inverse)', padding: '72px 40px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-brass-light)' }}>The No-Wallet Promise</div>
          <h2 style={{ fontSize: 'var(--text-display-md)', color: 'var(--text-on-dark)', margin: '16px 0 18px' }}>You will never see a bill during your trip.</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--text-on-dark)', opacity: 0.8 }}>
            No tabs, no cheques, no settling up. From the car that meets your flight to the table on your final evening, everything is arranged, confirmed, and paid ahead. The experience is touchless and walletless by design — the truest luxury is the absence of friction.
          </p>
        </div>
      </section>

      {/* What is handled */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 40px' }}>
        <Eyebrow rules tone="brass">Everything, Handled</Eyebrow>
        <h2 style={{ fontSize: 'var(--text-display-md)', textAlign: 'center', margin: '14px 0 44px' }}>What we take care of</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
          {handled.map(([t, c]) => (
            <div key={t}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, background: 'var(--accent)', transform: 'rotate(45deg)' }}></span>
                <h3 style={{ fontSize: 22, margin: 0 }}>{t}</h3>
              </div>
              <p style={{ fontSize: 14, margin: 0 }}>{c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team / trust */}
      <section style={{ background: 'var(--surface-tint)', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)', padding: '76px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-display-sm)', margin: '0 0 14px' }}>A France-based team, a group of four</h2>
            <p style={{ fontSize: 15, margin: 0 }}>We are established in France, and every supplier — hotel, chauffeur, professional, restaurant — is contracted and cared for by us directly. Each journey takes a single group of four, hosted by one named concierge who knows your week by heart. Not a call centre. A person, on the ground, who has your number and answers it.</p>
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-display-sm)', margin: '0 0 14px' }}>Chosen with you, not sold to you</h2>
            <p style={{ fontSize: 15, margin: 0 }}>Before you travel, we build a preference profile — dietary needs, playing level, the things that make a room feel like yours. The two hotel tiers, the courses, the tables, and any extension are shaped on a single consultation call. The journey arrives already fitted to you.</p>
          </div>
        </div>
      </section>

      {/* Experience paths */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 40px' }}>
        <Eyebrow rules tone="brass">Ways to Travel</Eyebrow>
        <h2 style={{ fontSize: 'var(--text-display-md)', textAlign: 'center', margin: '14px 0 44px' }}>Four paths through the same coast</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {paths.map(([t, c]) => (
            <div key={t} style={{ border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', padding: '26px 24px' }}>
              <h3 style={{ fontSize: 21, margin: '0 0 10px' }}>{t}</h3>
              <p style={{ fontSize: 13, margin: 0 }}>{c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder note */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '20px 40px 88px', textAlign: 'center' }}>
        <Divider ornament tone="brass" style={{ maxWidth: 220, margin: '0 auto 32px' }} />
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, lineHeight: 1.5, color: 'var(--text-heading)' }}>
          &ldquo;We built the journey we wanted to be given — unhurried, beautifully fed, and entirely handled. You should never have to reach for your wallet to enjoy a place. Brittany simply made it easy.&rdquo;
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 18 }}>The Founders</p>
        <div style={{ marginTop: 32 }}><Button onClick={() => onNav('Journey')}>See the 8-day journey</Button></div>
      </section>
    </main>
  );
}
