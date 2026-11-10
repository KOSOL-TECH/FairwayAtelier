import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { OPEN_CONSENT_EVENT, readConsent, writeConsent } from '../../lib/consent';

export interface CookieConsentProps {
  /** Link to the cookie policy page */
  policyHref?: string;
}

type View = 'idle' | 'banner' | 'prefs' | 'closed';

/**
 * CNIL-compliant banner. "Accept all" and "Refuse all" are equal-size primary
 * buttons (legal requirement), analytics is never pre-checked, and the choice
 * expires after six months.
 */
export function CookieConsent({ policyHref = '/cookies' }: CookieConsentProps) {
  const [view, setView] = useState<View>('idle');
  const [analytics, setAnalytics] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setView(readConsent() ? 'closed' : 'banner');
    const reopen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setView('banner');
      requestAnimationFrame(() => rootRef.current?.focus());
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  // While the banner is open, keep focused fields and links from scrolling under it (WCAG 2.4.11).
  const open = view !== 'idle' && view !== 'closed';
  useEffect(() => {
    const el = rootRef.current;
    if (!open || !el) return;
    const root = document.documentElement;
    const pad = () => { root.style.scrollPaddingBottom = `${el.offsetHeight}px`; };
    pad();
    const observer = new ResizeObserver(pad);
    observer.observe(el);
    return () => { observer.disconnect(); root.style.scrollPaddingBottom = ''; };
  }, [open, view]);

  const save = (value: boolean) => { writeConsent(value); setView('closed'); };

  if (view === 'idle' || view === 'closed') return null;

  return (
    <div ref={rootRef} tabIndex={-1} role="region" aria-label="Cookie consent" className="consent">
      <div className="consent__inner">
        {view === 'banner' ? (
          <div className="consent__banner">
            <div className="consent__text">
              <div className="label consent__eyebrow">Your privacy</div>
              <p>
                We use only strictly necessary cookies to run this site. With your consent, we also use privacy-respecting analytics (no Google, no advertising, no cross-site tracking) to understand what interests our guests. You may accept, refuse, or choose — and change your mind at any time.{' '}
                <a href={policyHref} className="consent__link">Cookie policy</a>
              </p>
            </div>
            <div className="consent__actions">
              <Button variant="primary" className="consent__equal" onClick={() => save(true)}>Accept all</Button>
              <Button variant="primary" className="consent__equal" onClick={() => save(false)}>Refuse all</Button>
              <Button variant="secondary" className="consent__equal consent__full" onClick={() => setView('prefs')}>Manage preferences</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="consent__prefs-head">
              <h2 className="consent__title">Cookie preferences</h2>
              <button type="button" className="consent__back" onClick={() => setView('banner')}>Back</button>
            </div>
            <div className="consent__rows">
              <div className="consent__row">
                <div>
                  <div className="consent__row-title">Strictly necessary</div>
                  <div className="consent__row-desc">Required for the site to function. Always on.</div>
                </div>
                <span className="label label--muted">Always active</span>
              </div>
              <Switch large className="consent__row consent__row--switch" checked={analytics} onChange={setAnalytics}
                label={
                  <span>
                    <span className="consent__row-title">Analytics (privacy-respecting)</span>
                    <span className="consent__row-desc">Aggregate, anonymous usage insight. No personal profiling.</span>
                  </span>
                } />
            </div>
            <div className="consent__pref-actions">
              <Button variant="primary" onClick={() => save(analytics)}>Save my choices</Button>
              <Button variant="secondary" onClick={() => save(false)}>Refuse all</Button>
              <Button variant="secondary" onClick={() => save(true)}>Accept all</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
