import React from 'react';
export function Tabs({ tabs = [], active, onChange, style }) {
  const [internal, setInternal] = React.useState(0);
  const idx = active !== undefined ? active : internal;
  const set = (i) => { setInternal(i); onChange && onChange(i); };
  return (
    <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-hairline)', ...style }}>
      {tabs.map((t, i) => (
        <button key={t} onClick={() => set(i)}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer', padding: '12px 2px', marginBottom: -1,
            color: i === idx ? 'var(--text-heading)' : 'var(--text-muted)',
            borderBottom: i === idx ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'color var(--dur-fast) var(--ease-standard)' }}>{t}</button>
      ))}
    </div>
  );
}
