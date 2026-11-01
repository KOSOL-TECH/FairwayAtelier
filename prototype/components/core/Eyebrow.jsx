import React from 'react';
export function Eyebrow({ children, rules = false, tone = 'ink', align = 'center' }) {
  const color = tone === 'brass' ? 'var(--accent)' : 'var(--text-heading)';
  const label = <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color }}>{children}</span>;
  if (!rules) return <div style={{ textAlign: align }}>{label}</div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: align === 'left' ? 'flex-start' : 'center' }}>
      <span style={{ width: 36, height: 1, background: 'var(--accent)' }}></span>{label}<span style={{ width: 36, height: 1, background: 'var(--accent)' }}></span>
    </div>
  );
}
