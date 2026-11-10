import { describe, expect, it, vi } from 'vitest';
import { claimEmail, confirmUrl, resetEmail, resetUrl, sendAccountEmail, welcomeEmail } from './email';

const origin = 'https://fairwayatelier.com';
const token = 'tok_-ABC123';

describe('links', () => {
  it('point at the confirmation and reset pages on this site', () => {
    expect(confirmUrl(origin, token)).toBe('https://fairwayatelier.com/account/confirm?token=tok_-ABC123');
    expect(resetUrl(origin, token)).toBe('https://fairwayatelier.com/reset-password?token=tok_-ABC123');
  });

  it('encode whatever the token holds', () => {
    expect(resetUrl(origin, 'a b&c')).toBe('https://fairwayatelier.com/reset-password?token=a%20b%26c');
  });
});

describe('account emails', () => {
  const cases = [
    ['welcome', welcomeEmail(confirmUrl(origin, token)), confirmUrl(origin, token)],
    ['reset', resetEmail(resetUrl(origin, token)), resetUrl(origin, token)],
    ['claim', claimEmail(resetUrl(origin, token)), resetUrl(origin, token)],
  ] as const;

  it.each(cases)('%s: carries its link in both the text and the HTML version', (_name, message, url) => {
    expect(message.text).toContain(url);
    expect(message.html).toContain(`href="${url}"`);
    expect(message.subject).toMatch(/Fairway Atelier/);
  });

  it.each(cases)('%s: tells someone who did not ask for it that they can ignore it', (_name, message) => {
    expect(message.text).toMatch(/ignore this email/i);
  });

  it('never contains anything a visitor typed, so the site cannot be used to send someone else’s words', () => {
    // The builders take only the link: there is no name, note or other free text to pass in.
    expect(welcomeEmail.length).toBe(1);
    expect(resetEmail.length).toBe(1);
    expect(claimEmail.length).toBe(1);
  });

  it('escapes the link in HTML', () => {
    const message = resetEmail('https://fairwayatelier.com/reset-password?token=a&b="c"');
    expect(message.html).toContain('href="https://fairwayatelier.com/reset-password?token=a&amp;b=&quot;c&quot;"');
  });

  it('says how long each link lasts', () => {
    expect(welcomeEmail(confirmUrl(origin, token)).text).toMatch(/seven days/);
    expect(resetEmail(resetUrl(origin, token)).text).toMatch(/one hour/);
    expect(claimEmail(resetUrl(origin, token)).text).toMatch(/one hour/);
  });
});

describe('sendAccountEmail', () => {
  const message = resetEmail(resetUrl(origin, token));

  it('sends from atelier@ to the account’s address', async () => {
    const send = vi.fn(async () => ({}));
    expect(await sendAccountEmail({ send } as unknown as SendEmail, 'anne@example.com', message)).toBe(true);
    expect(send).toHaveBeenCalledWith({
      from: { name: 'Fairway Atelier', email: 'atelier@fairwayatelier.com' },
      to: 'anne@example.com',
      ...message,
    });
  });

  it('reports a failed send without throwing, and without logging the link', async () => {
    const send = vi.fn(async () => { throw Object.assign(new Error(`could not send ${message.text}`), { code: 'E_SEND' }); });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await sendAccountEmail({ send } as unknown as SendEmail, 'anne@example.com', message)).toBe(false);
    expect(JSON.stringify(log.mock.calls)).not.toContain(token);
    expect(JSON.stringify(log.mock.calls)).not.toContain('anne@example.com');
    log.mockRestore();
  });

  it('without the email binding: sends nothing, and shows the link only on a developer’s machine', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await sendAccountEmail(undefined, 'anne@example.com', message, { local: true })).toBe(false);
    expect(JSON.stringify(info.mock.calls)).toContain(token);

    info.mockClear();
    expect(await sendAccountEmail(undefined, 'anne@example.com', message, { local: false })).toBe(false);
    expect(JSON.stringify([...info.mock.calls, ...error.mock.calls])).not.toContain(token);
    expect(error).toHaveBeenCalled();
    info.mockRestore();
    error.mockRestore();
  });
});
