import React from 'react';
import { Button } from '../core/Button.jsx';
export function CookieConsent({ onNav }) {
  const [state, setState] = React.useState('idle'); // idle | banner | prefs | closed
  const [prefs, setPrefs] = React.useState({ analytics: false }); // nothing pre-checked
  React.useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem('fa_consent'); } catch (e) {}
    setState(saved ? 'closed' : 'banner');
  }, []);
  const persist = (val) => { try { localStorage.setItem('fa_consent', JSON.stringify(val)); } catch (e) {} };
  const acceptAll = () => { persist({ analytics: true, ts: Date.now() }); setState('closed'); };
  const refuseAll = () => { persist({ analytics: false, ts: Date.now() }); setState('closed'); };
  const savePrefs = () => { persist({ ...prefs, ts: Date.now() }); setState('closed'); };
  if (state === 'idle' || state === 'closed') return null;

  const equalBtn = { flex: '1 1 0', justifyContent: 'center', minWidth: 150 };
  return (
    <div role="dialog" aria-label="Cookie consent" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--color-cream)', borderTop: '2px solid var(--color-antique-brass)', boxShadow: '0 -8px 40px rgba(47,49,51,0.16)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 40px' }}>
        {state === 'banner' ? (
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 380px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Your privacy</div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.65, color: 'var(--text-body)', margin: 0 }}>
                We use only strictly necessary cookies to run this site. With your consent, we also use privacy-respecting analytics (no Google, no advertising, no cross-site tracking) to understand what interests our guests. You may accept, refuse, or choose — and change your mind at any time.{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onNav && onNav('Cookies'); }} style={{ color: 'var(--accent)' }}>Cookie policy</a>
              </p>
            </div>
            <div style={{ flex: '1 1 320px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="primary" style={equalBtn} onClick={acceptAll}>Accept all</Button>
              <Button variant="primary" style={equalBtn} onClick={refuseAll}>Refuse all</Button>
              <Button variant="secondary" style={{ ...equalBtn, flexBasis: '100%' }} onClick={() => setState('prefs')}>Manage preferences</Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-heading)', margin: 0 }}>Cookie preferences</h3>
              <button onClick={() => setState('banner')} aria-label="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Back</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '16px 0', borderBottom: '1px solid var(--border-hairline)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 'var(--weight-semibold)', color: 'var(--text-heading)' }}>Strictly necessary</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>Required for the site to function. Always on.</div>
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Always active</span>
              </div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '16px 0', borderBottom: '1px solid var(--border-hairline)', cursor: 'pointer' }}
                onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 'var(--weight-semibold)', color: 'var(--text-heading)' }}>Analytics (privacy-respecting)</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>Aggregate, anonymous usage insight. No personal profiling.</div>
                </div>
                <span style={{ width: 44, height: 24, flexShrink: 0, position: 'relative', border: '1px solid ' + (prefs.analytics ? 'var(--accent)' : 'var(--text-muted)'), background: prefs.analytics ? 'var(--accent)' : 'transparent', transition: 'all var(--dur-fast) var(--ease-standard)' }}>
                  <span style={{ position: 'absolute', top: 3, left: prefs.analytics ? 23 : 3, width: 16, height: 16, background: prefs.analytics ? 'var(--color-cream)' : 'var(--text-muted)', transition: 'all var(--dur-fast) var(--ease-standard)' }}></span>
                </span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={savePrefs}>Save my choices</Button>
              <Button variant="secondary" onClick={refuseAll}>Refuse all</Button>
              <Button variant="secondary" onClick={acceptAll}>Accept all</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
