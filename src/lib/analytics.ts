import { CONSENT_CHANGE_EVENT, readConsent, type Consent } from './consent';

/**
 * Loads the privacy-respecting analytics script only once the guest has
 * accepted analytics. No Google Analytics. The provider (Plausible, Fathom or
 * Matomo) is configured through PUBLIC_ANALYTICS_SRC / PUBLIC_ANALYTICS_DOMAIN;
 * while those are empty, nothing is ever loaded.
 */
const SRC = import.meta.env.PUBLIC_ANALYTICS_SRC as string | undefined;
const DOMAIN = import.meta.env.PUBLIC_ANALYTICS_DOMAIN as string | undefined;

let loaded = false;

function load() {
  if (loaded || !SRC) return;
  loaded = true;
  const s = document.createElement('script');
  s.src = SRC;
  s.defer = true;
  if (DOMAIN) s.dataset.domain = DOMAIN;
  document.head.appendChild(s);
}

export function initAnalytics() {
  if (readConsent()?.analytics === true) load();
  window.addEventListener(CONSENT_CHANGE_EVENT, (e) => {
    if ((e as CustomEvent<Consent>).detail.analytics === true) load();
    // Withdrawing consent takes full effect on the next page load, when the script is no longer injected.
  });
}
