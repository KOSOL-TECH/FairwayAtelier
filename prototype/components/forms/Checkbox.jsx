import React from 'react';
export function Checkbox({ label, checked = false, onChange, disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      onClick={() => !disabled && onChange && onChange(!checked)}>
      <span style={{ width: 18, height: 18, boxSizing: 'border-box', flexShrink: 0,
        border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--text-muted)'),
        background: checked ? 'var(--accent)' : 'var(--surface-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--dur-fast) var(--ease-standard)' }}>
        {checked && <span style={{ width: 4, height: 8, borderRight: '1.5px solid var(--color-cream)', borderBottom: '1.5px solid var(--color-cream)', transform: 'rotate(45deg)', marginTop: -2 }}></span>}
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}
