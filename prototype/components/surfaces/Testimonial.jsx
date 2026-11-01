import React from 'react';
export function Testimonial({ quote, name, detail, align = 'center' }) {
  return (
    <figure style={{ margin: 0, textAlign: align, maxWidth: 640 }}>
      <span aria-hidden="true" style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 0.6, color: 'var(--accent)', opacity: 0.5, marginBottom: 18 }}>&ldquo;</span>
      <blockquote style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--text-heading)' }}>{quote}</blockquote>
      <figcaption style={{ marginTop: 22 }}>
        <span style={{ display: 'inline-block', width: 28, height: 1, background: 'var(--accent)', marginBottom: 14 }}></span>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-heading)' }}>{name}</div>
        {detail && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{detail}</div>}
      </figcaption>
    </figure>
  );
}
