/**
 * CNIL-compliant consent storage. The guest's choice is kept in localStorage as
 * `fa_consent = { analytics: boolean, ts }` and expires after six months, after
 * which the banner is shown again.
 */
export interface Consent {
  analytics: boolean;
  ts: number;
}

export const CONSENT_KEY = 'fa_consent';
export const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182; // ~6 months
/** Dispatched on window to reopen the banner (footer "Cookie settings" link). */
export const OPEN_CONSENT_EVENT = 'fa:open-consent';
/** Dispatched on window whenever the guest saves a choice. */
export const CONSENT_CHANGE_EVENT = 'fa:consent-change';

export function readConsent(now = Date.now()): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.ts !== 'number') return null;
    if (now - parsed.ts > CONSENT_MAX_AGE_MS) return null;
    return { analytics: parsed.analytics, ts: parsed.ts };
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): Consent {
  const consent: Consent = { analytics, ts: Date.now() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Storage unavailable (private mode): the choice still applies for this page view.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_CHANGE_EVENT, { detail: consent }));
  return consent;
}
