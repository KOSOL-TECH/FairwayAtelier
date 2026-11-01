import type { Enquiry, EnquirySink } from './handler';

/**
 * Enquiry emails, sent through the Cloudflare Email Service binding `EMAIL`
 * (wrangler.jsonc). The sender must be on the onboarded domain and listed in
 * the binding's `allowed_sender_addresses`.
 */
export const ATELIER = { name: 'Fairway Atelier', email: 'atelier@fairwayatelier.com' };

type Message = { subject: string; text: string; html: string };

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Strips CR/LF so guest input can never break a header line (subject, name). */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

const firstName = (name: string) => oneLine(name).split(' ')[0] || 'and welcome';

export function teamNotification(e: Enquiry): Message {
  const rows: [string, string][] = [
    ['Name', e.name],
    ['Email', e.email],
    ['Phone', e.phone || '—'],
    ['Dates of interest', e.dates],
    ['Travelling', e.group],
    ['Tier', e.tier],
    ['Notes', e.notes || '—'],
    ['Received', e.receivedAt],
    ['Reference', e.id],
  ];
  return {
    subject: `New enquiry: ${oneLine(e.name)} (${e.dates})`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nReply to this email to answer the guest directly.\n',
    html:
      '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
      rows
        .map(([k, v]) => `<tr><th align="left" valign="top">${k}</th><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`)
        .join('') +
      '</table><p style="font-family:Arial,sans-serif;font-size:14px">Reply to this email to answer the guest directly.</p>',
  };
}

export function guestConfirmation(e: Enquiry): Message {
  const paras = [
    `Thank you, ${firstName(e.name)}.`,
    'Your enquiry is with our France-based team. We will reply within 24 hours to arrange a 30–45 minute consultation call — a personal conversation, not a brochure.',
    `For your records: ${e.dates}, ${e.group.toLowerCase()}, ${e.tier} tier.`,
    'If anything changes in the meantime, simply reply to this email.',
    'Fairway Atelier\nhttps://fairwayatelier.com',
  ];
  return {
    subject: 'Your enquiry with Fairway Atelier',
    text: paras.join('\n\n') + '\n',
    html: paras
      .map((p) => `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.5">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join(''),
  };
}

/** Notifies atelier@ of a new enquiry; Reply-To is the guest. A failure fails the request so the guest can retry. */
export class TeamNotificationEmail implements EnquirySink {
  readonly name = 'team-email';
  constructor(private readonly mailer: SendEmail) {}
  async handle(e: Enquiry) {
    await this.mailer.send({
      from: ATELIER,
      to: ATELIER.email,
      replyTo: { name: oneLine(e.name), email: e.email },
      ...teamNotification(e),
    });
  }
}

/**
 * Confirms receipt to the guest. Runs after the team notification, so a failure
 * here is logged, not thrown: the team already has the enquiry, and a retry
 * would send them a duplicate.
 */
export class GuestConfirmationEmail implements EnquirySink {
  readonly name = 'guest-email';
  constructor(private readonly mailer: SendEmail) {}
  async handle(e: Enquiry) {
    try {
      await this.mailer.send({ from: ATELIER, to: { name: oneLine(e.name), email: e.email }, ...guestConfirmation(e) });
    } catch (err) {
      console.error('[enquiry] guest confirmation failed', e.id, (err as { code?: string }).code ?? err);
    }
  }
}
