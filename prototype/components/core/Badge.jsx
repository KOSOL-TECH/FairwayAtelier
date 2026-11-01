import React from 'react';
export function Badge({ tone = 'brass', dot = false, children }) {
  const tones = {
    brass: { color: 'var(--accent)', border: '1px solid var(--accent)', background: 'transparent' },
    green: { color: 'var(--color-fairway-green)', border: '1px solid var(--color-fairway-green)', background: 'transparent' },
    stone: { color: 'var(--text-body)', border: '1px solid var(--border-hairline)', background: 'var(--surface-tint)' },
    inverse: { color: 'var(--text-on-dark)', border: '1px solid transparent', background: 'var(--color-charcoal)' },
    booking: { color: 'var(--color-fairway-green)', border: '1px solid var(--color-fairway-green)', background: 'rgba(95,115,91,0.08)' },
    limited: { color: 'var(--accent)', border: '1px solid var(--accent)', background: 'rgba(160,123,71,0.08)' },
    sold: { color: 'var(--text-on-dark)', border: '1px solid transparent', background: 'var(--color-charcoal)' },
    waitlist: { color: 'var(--text-body)', border: '1px solid var(--border-hairline)', background: 'var(--surface-tint)' },
  };
  return <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 7, ...tones[tone] }}>{dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }}></span>}{children}</span>;
}
