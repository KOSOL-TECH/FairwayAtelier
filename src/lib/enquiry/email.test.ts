import { describe, expect, it, vi } from 'vitest';
import { ATELIER, GuestConfirmationEmail, TeamNotificationEmail, guestConfirmation, teamNotification } from './email';
import type { Enquiry } from './handler';

const enquiry: Enquiry = {
  id: 'abc-123',
  receivedAt: '2026-11-01T10:00:00.000Z',
  name: 'Anne Le Goff',
  email: 'anne@example.com',
  phone: '',
  dates: '12–19 May',
  group: 'Four travellers',
  tier: 'Signature',
  notes: 'Celebrating <a birthday> & more',
};

const mailer = (send = vi.fn().mockResolvedValue({ messageId: 'm1' })) => ({ send }) as unknown as SendEmail & { send: typeof send };

describe('teamNotification', () => {
  it('lists every field and escapes guest input in the HTML', () => {
    const m = teamNotification(enquiry);
    expect(m.subject).toBe('New enquiry: Anne Le Goff (12–19 May)');
    expect(m.text).toContain('Notes: Celebrating <a birthday> & more');
    expect(m.text).toContain('Phone: —');
    expect(m.text).toContain('In the admin: https://fairwayatelier.com/admin/enquiries/abc-123');
    expect(m.html).toContain('Celebrating &lt;a birthday&gt; &amp; more');
    expect(m.html).not.toContain('<a birthday>');
  });

  it('keeps line breaks in the name out of the subject', () => {
    expect(teamNotification({ ...enquiry, name: 'Anne\r\nBcc: x@y.z' }).subject).toBe('New enquiry: Anne Bcc: x@y.z (12–19 May)');
  });
});

describe('guestConfirmation', () => {
  it('greets the guest by first name and recaps the enquiry', () => {
    const m = guestConfirmation(enquiry);
    expect(m.text.startsWith('Thank you, Anne.')).toBe(true);
    expect(m.text).toContain('12–19 May, four travellers, Signature tier.');
  });
});

describe('email sinks', () => {
  it('sends the team notification to atelier@ with the guest as Reply-To', async () => {
    const m = mailer();
    await new TeamNotificationEmail(m).handle(enquiry);
    expect(m.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: ATELIER, to: ATELIER.email, replyTo: { name: 'Anne Le Goff', email: 'anne@example.com' } }),
    );
  });

  it('lets a team notification failure propagate', async () => {
    const m = mailer(vi.fn().mockRejectedValue(new Error('E_DELIVERY_FAILED')));
    await expect(new TeamNotificationEmail(m).handle(enquiry)).rejects.toThrow();
  });

  it('logs, but does not throw, when the guest confirmation fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const m = mailer(vi.fn().mockRejectedValue(Object.assign(new Error('x'), { code: 'E_RECIPIENT_SUPPRESSED' })));
    await expect(new GuestConfirmationEmail(m).handle(enquiry)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith('[enquiry] guest confirmation failed', 'abc-123', 'E_RECIPIENT_SUPPRESSED');
    error.mockRestore();
  });
});
