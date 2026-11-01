import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_CHANGE_EVENT, CONSENT_KEY, CONSENT_MAX_AGE_MS, readConsent, writeConsent } from './consent';

// The tests run in Node, so stand in for the browser's localStorage and window.
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});
const dispatchEvent = vi.fn();
vi.stubGlobal('window', { dispatchEvent });

beforeEach(() => {
  store.clear();
  dispatchEvent.mockClear();
});

describe('readConsent', () => {
  it('returns null when no choice has been saved', () => {
    expect(readConsent()).toBeNull();
  });

  it('returns a saved choice within six months', () => {
    const ts = Date.now();
    store.set(CONSENT_KEY, JSON.stringify({ analytics: true, ts }));
    expect(readConsent(ts + CONSENT_MAX_AGE_MS)).toEqual({ analytics: true, ts });
  });

  it('expires a choice older than six months, so the banner shows again', () => {
    const ts = Date.now();
    store.set(CONSENT_KEY, JSON.stringify({ analytics: false, ts }));
    expect(readConsent(ts + CONSENT_MAX_AGE_MS + 1)).toBeNull();
  });

  it.each(['not json', '{"analytics":"yes","ts":1}', '{"analytics":true}'])('ignores a corrupt value: %s', (raw) => {
    store.set(CONSENT_KEY, raw);
    expect(readConsent()).toBeNull();
  });
});

describe('writeConsent', () => {
  it('saves the choice and announces it', () => {
    const consent = writeConsent(false);
    expect(readConsent()).toEqual(consent);
    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0][0].type).toBe(CONSENT_CHANGE_EVENT);
  });

  it('still announces the choice when storage is unavailable', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    expect(writeConsent(true).analytics).toBe(true);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });
});
