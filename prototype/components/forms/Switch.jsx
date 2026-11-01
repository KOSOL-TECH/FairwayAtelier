import React from 'react';
export function Switch({ label, checked = false, onChange, disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      onClick={() => !disabled && onChange && onChange(!checked)}>
      <span style={{ width: 40, height: 22, boxSizing: 'border-box', flexShrink: 0, position: 'relative',
        border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--text-muted)'),
        background: checked ? 'var(--accent)' : 'var(--surface-tint)',
        transition: 'all var(--dur-fast) var(--ease-standard)' }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 14, height: 14,
          background: checked ? 'var(--color-cream)' : 'var(--text-muted)',
          transition: 'all var(--dur-fast) var(--ease-standard)' }}></span>
      </span>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
