import React from 'react';
export function Button({ variant = 'primary', size = 'md', disabled = false, children, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const pads = { sm: '10px 20px', md: '14px 28px', lg: '17px 36px' };
  const fs = { sm: 11, md: 12, lg: 13 };
  const base = {
    fontFamily: 'var(--font-sans)', fontSize: fs[size], fontWeight: 'var(--weight-semibold)',
    letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', padding: pads[size],
    borderRadius: 'var(--radius-none)', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1, transition: 'all var(--dur-fast) var(--ease-standard)',
    display: 'inline-flex', alignItems: 'center', gap: 8, ...style,
  };
  const variants = {
    // Primary: Pastel Fairway Green with high-contrast Charcoal text (spec §10)
    primary: { background: hover && !disabled ? 'var(--color-fairway-deep)' : 'var(--color-fairway-green)', color: hover && !disabled ? 'var(--color-cream)' : 'var(--color-charcoal)', border: '1px solid transparent' },
    // Secondary: charcoal hairline outline
    secondary: { background: hover && !disabled ? 'rgba(47,49,51,0.06)' : 'transparent', color: 'var(--color-charcoal)', border: '1px solid var(--color-charcoal)' },
    // Ghost: brass-underlined text link
    ghost: { background: 'transparent', color: hover && !disabled ? 'var(--accent)' : 'var(--color-fairway-green)', border: '1px solid transparent', padding: '4px 0', borderBottom: '1px solid var(--accent)' },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{children}</button>
  );
}
