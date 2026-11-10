import { describe, expect, it } from 'vitest';
import { APPLE_CALLBACK, accessFor, areaOf, isCrossSiteWrite, isPublicPage, safeNext, siteOrigin } from './guard';

describe('areaOf', () => {
  it.each([
    ['/admin', 'admin'],
    ['/admin/customers/abc', 'admin'],
    ['/api/admin/anything', 'admin'],
    ['/account', 'account'],
    ['/account/export', 'account'],
    ['/account/confirm', 'account'],
    ['/api/account/profile', 'account'],
    ['/join', 'auth'],
    ['/sign-in', 'auth'],
    ['/sign-out', 'auth'],
    ['/forgot-password', 'auth'],
    ['/reset-password', 'auth'],
    ['/auth/google/start', 'auth'],
    ['/auth/apple/callback', 'auth'],
    ['/auth/sign-up', 'auth'],
    ['/', 'site'],
    ['/journal/coast', 'site'],
    ['/enquire', 'site'],
    ['/api/enquiry', 'site'],
    ['/media/img-1', 'site'],
    ['/administrator', 'site'],
    ['/accounts', 'site'],
    ['/joinery', 'site'],
    ['/sign-in-help', 'site'],
  ])('%s is %s', (path, area) => {
    expect(areaOf(path)).toBe(area);
  });
});

describe('isPublicPage (what the edge may cache)', () => {
  it('caches the pages every visitor sees', () => {
    for (const path of ['/', '/journey', '/journal/coast', '/enquire', '/sitemap.xml', '/a-missing-page']) {
      expect(isPublicPage(path), path).toBe(true);
    }
  });

  it('never caches anything personal, any API, media or Astro internals', () => {
    for (const path of [
      '/account', '/account/export', '/account/confirm', '/api/account/me', '/join', '/sign-in', '/sign-out',
      '/forgot-password', '/reset-password', '/auth/google/callback', '/auth/sign-up',
      '/admin', '/admin/customers', '/api/admin/x', '/api/enquiry', '/media/x', '/_server-islands/Departures', '/_image',
    ]) {
      expect(isPublicPage(path), path).toBe(false);
    }
  });
});

describe('safeNext', () => {
  it.each([
    ['/account', '/account'],
    ['/account/confirm?token=abc-DEF_123', '/account/confirm?token=abc-DEF_123'],
    ['/admin', '/admin'],
    ['/admin/customers?q=anne', '/admin/customers?q=anne'],
    [null, '/account'],
    [undefined, '/account'],
    ['', '/account'],
    ['/', '/account'],
    ['/journal', '/account'],
    ['/accountant', '/account'],
    ['/administrator', '/account'],
    ['https://evil.example/account', '/account'],
    ['//evil.example/account', '/account'],
    ['/\\evil.example', '/account'],
    ['/account\\..\\evil', '/account'],
    ['/account//evil.example', '/account'],
    ['/account/../admin', '/account'],
    ['/account\n/x', '/account'],
    ['/account\u0000', '/account'],
    [' /account', '/account'],
    [`/account?x=${'a'.repeat(600)}`, '/account'],
  ])('%j → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it('uses the given fallback', () => {
    expect(safeNext('https://evil.example', '/admin')).toBe('/admin');
  });
});

describe('isCrossSiteWrite', () => {
  const url = new URL('https://fairwayatelier.com/account');
  const req = (method: string, headers: Record<string, string> = {}) => new Request(url, { method, headers });

  it('lets every read through', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(isCrossSiteWrite(req(method, { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' }), url)).toBe(false);
    }
  });

  it('accepts a write from this site', () => {
    expect(isCrossSiteWrite(req('POST', { 'Sec-Fetch-Site': 'same-origin' }), url)).toBe(false);
    expect(isCrossSiteWrite(req('POST', { Origin: 'https://fairwayatelier.com' }), url)).toBe(false);
  });

  it('refuses a write from another site, a sub-domain or another scheme', () => {
    expect(isCrossSiteWrite(req('POST', { 'Sec-Fetch-Site': 'cross-site' }), url)).toBe(true);
    expect(isCrossSiteWrite(req('POST', { 'Sec-Fetch-Site': 'same-site' }), url)).toBe(true);
    expect(isCrossSiteWrite(req('POST', { Origin: 'https://evil.example' }), url)).toBe(true);
    expect(isCrossSiteWrite(req('POST', { Origin: 'http://fairwayatelier.com' }), url)).toBe(true);
    expect(isCrossSiteWrite(req('DELETE', { Origin: 'https://www.fairwayatelier.com' }), url)).toBe(true);
  });

  it('refuses a cross-site JSON write too, not only form posts', () => {
    const request = req('POST', { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' });
    expect(isCrossSiteWrite(request, url)).toBe(true);
  });

  it('believes the browser over the Origin header when they disagree', () => {
    expect(isCrossSiteWrite(req('POST', { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://fairwayatelier.com' }), url)).toBe(true);
  });

  it('lets through clients that are not browsers (no ambient cookies to abuse)', () => {
    expect(isCrossSiteWrite(req('POST'), url)).toBe(false);
  });

  it('names the one route that must accept a cross-site post', () => {
    expect(APPLE_CALLBACK).toBe('/auth/apple/callback');
    expect(areaOf(APPLE_CALLBACK)).toBe('auth');
  });
});

describe('siteOrigin', () => {
  it('is the production site, whatever host the request names', () => {
    expect(siteOrigin(new URL('https://fairwayatelier.com/sign-in'))).toBe('https://fairwayatelier.com');
    expect(siteOrigin(new URL('https://evil.example/sign-in'))).toBe('https://fairwayatelier.com');
  });

  it('is the local server while developing', () => {
    expect(siteOrigin(new URL('http://localhost:4321/sign-in'))).toBe('http://localhost:4321');
    expect(siteOrigin(new URL('http://127.0.0.1:4322/x'))).toBe('http://127.0.0.1:4322');
  });
});

describe('accessFor', () => {
  const guest = { role: 'customer' as const };
  const admin = { role: 'admin' as const };

  it('leaves the public site and the sign-in pages open to everyone', () => {
    for (const who of [null, guest, admin]) {
      expect(accessFor('site', '/journey', '', who, false)).toEqual({ kind: 'allow' });
      expect(accessFor('auth', '/sign-in', '', who, false)).toEqual({ kind: 'allow' });
    }
  });

  it('sends a signed-out visitor to sign in, and brings them back afterwards', () => {
    expect(accessFor('account', '/account/confirm', '?token=abc', null, false)).toEqual({
      kind: 'redirect', to: '/sign-in?next=%2Faccount%2Fconfirm%3Ftoken%3Dabc',
    });
    expect(accessFor('admin', '/admin/weeks', '', null, false)).toEqual({ kind: 'redirect', to: '/sign-in?next=%2Fadmin%2Fweeks' });
  });

  it('answers a signed-out API call with 401 instead of a redirect', () => {
    expect(accessFor('account', '/api/account/profile', '', null, false)).toEqual({ kind: 'deny', status: 401 });
    expect(accessFor('admin', '/api/admin/x', '', null, false)).toEqual({ kind: 'deny', status: 401 });
  });

  it('lets any signed-in guest into their own account area', () => {
    expect(accessFor('account', '/account', '', guest, false)).toEqual({ kind: 'allow' });
    expect(accessFor('account', '/api/account/profile', '', admin, false)).toEqual({ kind: 'allow' });
  });

  it('never lets a guest into the admin', () => {
    expect(accessFor('admin', '/admin', '', guest, true)).toEqual({ kind: 'redirect', to: '/account' });
    expect(accessFor('admin', '/admin/customers/abc', '', guest, true)).toEqual({ kind: 'redirect', to: '/account' });
    expect(accessFor('admin', '/api/admin/x', '', guest, true)).toEqual({ kind: 'deny', status: 403 });
  });

  it('asks an admin to sign in again once their sign-in is more than 12 hours old', () => {
    expect(accessFor('admin', '/admin/weeks', '?x=1', admin, false)).toEqual({
      kind: 'redirect', to: '/sign-in?next=%2Fadmin%2Fweeks%3Fx%3D1&again=1',
    });
    expect(accessFor('admin', '/api/admin/x', '', admin, false)).toEqual({ kind: 'deny', status: 401 });
  });

  it('lets a freshly signed-in admin in', () => {
    expect(accessFor('admin', '/admin', '', admin, true)).toEqual({ kind: 'allow' });
    expect(accessFor('admin', '/api/admin/x', '', admin, true)).toEqual({ kind: 'allow' });
  });
});
