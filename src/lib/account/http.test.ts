import { describe, expect, it, vi } from 'vitest';
import { background, clientIp, endSession, isLocal, json, limited, readJsonObject, startSession } from './http';
import { HINT_COOKIE, SESSION_COOKIE, readSession } from './session';

const post = (body: string, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  new Request('https://fairwayatelier.com/api/account/profile', { method: 'POST', body, headers });

describe('readJsonObject', () => {
  it('reads a JSON object', async () => {
    expect(await readJsonObject(post('{"a":1,"b":{"c":"é"}}'))).toEqual({ a: 1, b: { c: 'é' } });
  });

  it('refuses anything that is not JSON', async () => {
    const res = (await readJsonObject(post('a=1', { 'Content-Type': 'application/x-www-form-urlencoded' }))) as Response;
    expect(res.status).toBe(415);
    expect(((await readJsonObject(post('{}', {}))) as Response).status).toBe(415);
  });

  it('refuses a body that is too large, whether or not it says so', async () => {
    const big = JSON.stringify({ notes: 'x'.repeat(20_000) });
    expect(((await readJsonObject(post(big, { 'Content-Type': 'application/json', 'Content-Length': String(big.length) }))) as Response).status).toBe(413);
    expect(((await readJsonObject(post(big))) as Response).status).toBe(413);
    expect(await readJsonObject(post(big), 64_000)).toMatchObject({ notes: expect.any(String) });
  });

  it('refuses broken JSON and JSON that is not an object', async () => {
    for (const body of ['{', '', '[1,2]', '"text"', '7', 'null']) {
      const res = (await readJsonObject(post(body))) as Response;
      expect(res.status, body).toBe(400);
    }
  });
});

describe('json', () => {
  it('answers with JSON that is never stored by a cache', async () => {
    const res = json(422, { ok: false });
    expect(res.status).toBe(422);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({ ok: false });
  });
});

describe('limited', () => {
  const limiter = (allow: (key: string) => boolean) => ({ limit: vi.fn(async ({ key }: { key: string }) => ({ success: allow(key) })) }) as unknown as RateLimit;

  it('is over the limit as soon as any of its keys is', async () => {
    expect(await limited(limiter(() => true), 'ip:1', 'email:a')).toBe(false);
    expect(await limited(limiter((k) => k !== 'email:a'), 'ip:1', 'email:a')).toBe(true);
  });

  it('lets everything through when the limiter is not bound (local development)', async () => {
    expect(await limited(undefined, 'ip:1')).toBe(false);
  });
});

describe('clientIp', () => {
  it('reads the address Cloudflare reports', () => {
    expect(clientIp(new Request('https://x.example', { headers: { 'CF-Connecting-IP': '203.0.113.7' } }))).toBe('203.0.113.7');
    expect(clientIp(new Request('https://x.example'))).toBe('unknown');
  });
});

describe('session cookies', () => {
  const jar = () => {
    const set = vi.fn();
    const del = vi.fn();
    return { cookies: { set, delete: del } as never, set, del };
  };

  it('sets the signed session cookie and the readable sign', async () => {
    const { cookies, set } = jar();
    await startSession(cookies, { id: 'acc-1', session_key: 'key-1' }, 'secret');
    const [name, value, options] = set.mock.calls[0];
    expect(name).toBe(SESSION_COOKIE);
    expect(await readSession(value, 'secret')).toMatchObject({ aid: 'acc-1', key: 'key-1' });
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    expect(set.mock.calls[1]).toEqual([HINT_COOKIE, '1', expect.objectContaining({ httpOnly: false, secure: true, sameSite: 'lax', path: '/' })]);
  });

  it('clears both on sign-out, with the attributes a __Host- cookie needs', () => {
    const { cookies, del } = jar();
    endSession(cookies);
    expect(del.mock.calls).toEqual([
      [SESSION_COOKIE, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' }],
      [HINT_COOKIE, { path: '/', httpOnly: false, secure: true, sameSite: 'lax' }],
    ]);
  });
});

describe('background', () => {
  it('hands the work to the Workers runtime when there is one, so the response does not wait', async () => {
    const waitUntil = vi.fn();
    const work = Promise.resolve('sent');
    await background({ cfContext: { waitUntil } } as never, work);
    expect(waitUntil).toHaveBeenCalledWith(work);
  });

  it('waits for the work itself otherwise', async () => {
    let done = false;
    await background({} as never, new Promise<void>((resolve) => setTimeout(() => { done = true; resolve(); }, 5)));
    expect(done).toBe(true);
  });
});

describe('isLocal', () => {
  it('is true only on a developer machine', () => {
    expect(isLocal(new URL('http://localhost:4321/x'))).toBe(true);
    expect(isLocal(new URL('http://127.0.0.1:4321/x'))).toBe(true);
    expect(isLocal(new URL('https://fairwayatelier.com/x'))).toBe(false);
    expect(isLocal(new URL('https://localhost.evil.example/x'))).toBe(false);
  });
});
