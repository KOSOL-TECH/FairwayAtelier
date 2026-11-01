import React from 'react';
export function Dialog({ open = false, onClose, eyebrow, title, children, actions, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(47,49,51,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: '90vw', background: 'var(--color-cream)', boxShadow: 'var(--shadow-lift)', padding: 8 }}>
        <div style={{ border: '1px solid var(--border-rule)', padding: '36px 40px', position: 'relative' }}>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>✕</button>
          {eyebrow && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)', textAlign: 'center', marginBottom: 10 }}>{eyebrow}</div>}
          {title && <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-md)', color: 'var(--text-heading)', textAlign: 'center', marginBottom: 16 }}>{title}</div>}
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>{children}</div>
          {actions && <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>{actions}</div>}
        </div>
      </div>
    </div>
  );
}
