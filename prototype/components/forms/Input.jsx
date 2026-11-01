import React from 'react';
export function Input({ label, placeholder, value, onChange, onBlur, type = 'text', disabled = false, required = false, error, style }) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--color-antique-brass)' : (focus ? 'var(--accent)' : 'var(--border-hairline)');
  return (
    <label style={{ display: 'block', ...style }}>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-heading)', display: 'block', marginBottom: 8 }}>{label}{required && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>*</span>}</span>}
      <input type={type} placeholder={placeholder} value={value} disabled={disabled} aria-invalid={!!error}
        onChange={onChange} onFocus={() => setFocus(true)} onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--text-heading)', background: 'var(--surface-card)', padding: '13px 14px',
          border: '1px solid ' + borderColor, boxShadow: error ? '0 0 0 2px rgba(160,123,71,0.15)' : 'none',
          borderRadius: 'var(--radius-none)', outline: 'none', opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)' }} />
      {error && <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-antique-brass)', marginTop: 6 }}>{error}</span>}
    </label>
  );
}
