import React from 'react';
export function Radio({ label, checked = false, onChange, disabled = false, name }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      onClick={() => !disabled && onChange && onChange(true)}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', boxSizing: 'border-box', flexShrink: 0,
        border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--text-muted)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--dur-fast) var(--ease-standard)' }}>
        {checked && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></span>}
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}
