import React from 'react';
export function SiteFooter({ onNav }) {
  const col = { fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: 2.1, color: 'var(--text-on-dark)', opacity: 0.75 };
  const h = { fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--color-brass-light)', marginBottom: 12 };
  return (
    <footer style={{ background: 'var(--surface-inverse)', padding: '64px 40px 36px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ display: 'inline-block', background: 'var(--color-cream)', padding: '14px 18px' }}>
            <img src="../../assets/crest.png" alt="" style={{ height: 60, display: 'block' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 19, color: 'var(--text-on-dark)', marginTop: 16 }}>Play Beautifully. Travel Effortlessly.</div>
        </div>
        <div><div style={h}>Journey</div><div style={{ display: 'flex', flexDirection: 'column' }}>
          {[['The Experience', 'Experience'], ['The 8-Day Journey', 'Journey'], ['Dining & Golf', 'DiningGolf'], ['Private Journeys', 'Private']].map(([l, p]) => (
            <a key={p} href="#" onClick={(e) => { e.preventDefault(); onNav && onNav(p); }} style={{ ...col, color: 'var(--text-on-dark)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div></div>
        <div><div style={h}>Plan</div><div style={{ display: 'flex', flexDirection: 'column' }}>
          {[['Availability', 'Availability'], ['Journal', 'Journal'], ['FAQ', 'FAQ'], ['Enquire', 'Enquire']].map(([l, p]) => (
            <a key={p} href="#" onClick={(e) => { e.preventDefault(); onNav && onNav(p); }} style={{ ...col, color: 'var(--text-on-dark)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div></div>
        <div><div style={h}>Enquiries</div><div style={col}>atelier@fairwayatelier.com<br />By appointment<br />France-based team</div></div>
      </div>
      <div style={{ maxWidth: 1200, margin: '40px auto 0', paddingTop: 24, borderTop: '1px solid rgba(245,241,232,0.15)' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, lineHeight: 1.7, color: 'var(--text-on-dark)', opacity: 0.55, margin: '0 0 14px', maxWidth: 820 }}>
          Named restaurants, hotels, and courses are illustrative of the experience we curate. Final inclusions per trip are subject to availability and confirmed during the consultation call.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-on-dark)', opacity: 0.5 }}>
          <span>© 2026 FAIRWAY ATELIER SAS — ATOUT FRANCE IM0XX2600XX</span>
          <span style={{ display: 'flex', gap: 18 }}>
            {[['Mentions légales', 'MentionsLegales'], ['Privacy', 'Privacy'], ['Terms (CGV)', 'Terms'], ['Cookies', 'Cookies']].map(([label, p]) => (
              <a key={p} href="#" onClick={(e) => { e.preventDefault(); onNav && onNav(p); }} style={{ color: 'inherit' }}>{label}</a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
