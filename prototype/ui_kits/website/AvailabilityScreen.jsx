import React from 'react';
import { Button } from '../../components/core/Button.jsx';
import { Eyebrow } from '../../components/core/Eyebrow.jsx';
import { Badge } from '../../components/core/Badge.jsx';
export function AvailabilityScreen({ onNav }) {
  const [open, setOpen] = React.useState(0);
  const weeks = [
    { dates: 'Sun 10 – Sun 17 May 2026', status: 'booking', label: 'Booking', standard: 'Available', signature: 'Available', dining: 'Le Coquillage, Le Jules Verne confirmed' },
    { dates: 'Sun 07 – Sun 14 Jun 2026', status: 'limited', label: 'Limited', standard: 'Waitlist', signature: 'Two suites remaining', dining: 'Le Coquillage confirmed' },
    { dates: 'Sun 13 – Sun 20 Sep 2026', status: 'booking', label: 'Booking', standard: 'Available', signature: 'Available', dining: 'Le Coquillage, Le Jules Verne confirmed' },
    { dates: 'Sun 04 – Sun 11 Oct 2026', status: 'sold', label: 'Sold', standard: 'Sold', signature: 'Sold', dining: '—' },
    { dates: 'Sun 18 – Sun 25 Oct 2026', status: 'waitlist', label: 'Waitlist', standard: 'Waitlist', signature: 'Waitlist', dining: 'To be confirmed' },
  ];
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '72px 40px 96px' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <Eyebrow rules tone="brass">Availability</Eyebrow>
        <h1 style={{ fontSize: 'var(--text-display-lg)', margin: '16px 0 12px' }}>Opened weeks for 2026</h1>
        <p style={{ fontSize: 16, maxWidth: 560, margin: '0 auto' }}>Each week runs for a single group of four. Select a week to see tier availability and the tables confirmed so far.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {weeks.map((w, i) => (
          <div key={w.dates} style={{ border: '1px solid var(--border-hairline)', background: 'var(--surface-card)' }}>
            <button onClick={() => setOpen(open === i ? -1 : i)}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 20, alignItems: 'center', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--text-heading)' }}>{w.dates}</span>
              <Badge tone={w.status} dot>{w.label}</Badge>
              <span style={{ width: 8, height: 8, borderRight: '1px solid var(--accent)', borderBottom: '1px solid var(--accent)', transform: open === i ? 'rotate(-135deg)' : 'rotate(45deg)', transition: 'transform var(--dur-fast) var(--ease-standard)' }}></span>
            </button>
            {open === i && (
              <div style={{ borderTop: '1px solid var(--border-hairline)', padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, background: 'var(--surface-tint)' }}>
                <div><div style={lbl}>Standard — EMERIA</div><div style={val}>{w.standard}</div></div>
                <div><div style={lbl}>Signature — Barrière</div><div style={val}>{w.signature}</div></div>
                <div><div style={lbl}>Headline tables</div><div style={val}>{w.dining}</div></div>
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <Button size="sm" onClick={() => onNav('Enquire')} disabled={w.status === 'sold'}>{w.status === 'sold' ? 'Sold out' : w.status === 'waitlist' ? 'Join the waitlist' : 'Enquire about this week'}</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginTop: 32, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
        Named restaurants, hotels, and courses are illustrative of the experience. Final inclusions per trip are subject to availability and confirmed during the consultation call.
      </p>
    </main>
  );
}
const lbl = { fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 };
const val = { fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)' };
