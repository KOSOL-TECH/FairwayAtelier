import React from 'react';
export function Select({ label, options = [], value, onChange, onBlur, disabled = false, required = false, error, placeholder, style }) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--color-antique-brass)' : (focus ? 'var(--accent)' : 'var(--border-hairline)');
  return (
    <label style={{ display: 'block', position: 'relative', ...style }}>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-heading)', display: 'block', marginBottom: 8 }}>{label}{required && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>*</span>}</span>}
      <select value={value} disabled={disabled} onChange={onChange} aria-invalid={!!error}
        onFocus={() => setFocus(true)} onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'var(--font-sans)',
          fontSize: 14, color: value ? 'var(--text-heading)' : 'var(--text-muted)', background: 'var(--surface-card)', padding: '13px 14px',
          border: '1px solid ' + borderColor, boxShadow: error ? '0 0 0 2px rgba(160,123,71,0.15)' : 'none', borderRadius: 0,
          outline: 'none', cursor: 'pointer', opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 14, top: label ? 43 : 16, width: 7, height: 7,
        borderRight: '1px solid var(--accent)', borderBottom: '1px solid var(--accent)',
        transform: 'rotate(45deg)', pointerEvents: 'none' }}></span>
      {error && <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-antique-brass)', marginTop: 6 }}>{error}</span>}
    </label>
  );
}
