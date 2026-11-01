import React from 'react';
export function Divider({ ornament = false, tone = 'hairline', style }) {
  const color = tone === 'brass' ? 'var(--accent)' : 'var(--border-hairline)';
  if (!ornament) return <hr style={{ border: 'none', borderTop: '1px solid ' + color, margin: 0, ...style }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <span style={{ flex: 1, height: 1, background: color }}></span>
      <span style={{ width: 6, height: 6, background: 'var(--accent)', transform: 'rotate(45deg)' }}></span>
      <span style={{ flex: 1, height: 1, background: color }}></span>
    </div>
  );
}
