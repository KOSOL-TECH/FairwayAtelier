import React from 'react';
import { Badge } from '../core/Badge.jsx';
export function Card({ image, imageAlt, eyebrow, title, children, badge, footer, hoverLift = true, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)',
        boxShadow: hover && hoverLift ? 'var(--shadow-lift)' : 'var(--shadow-card)',
        transition: 'box-shadow var(--dur-slow) var(--ease-standard)', display: 'flex', flexDirection: 'column', ...style }}>
      {image && <div style={{ position: 'relative' }}>
        <img src={image} alt={imageAlt || ''} style={{ width: '100%', display: 'block', aspectRatio: '4 / 3', objectFit: 'cover' }} />
        {badge && <div style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone="inverse">{badge}</Badge></div>}
      </div>}
      <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {eyebrow && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)' }}>{eyebrow}</div>}
        {title && <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-sm)', color: 'var(--text-heading)', fontWeight: 'var(--weight-medium)', lineHeight: 1.15 }}>{title}</div>}
        {children && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>{children}</div>}
        {footer && <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-hairline)', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{footer}</div>}
      </div>
    </div>
  );
}
