/**
 * Emails about a guest's account, sent through the same Cloudflare Email
 * Service binding as the enquiry emails (src/lib/enquiry/email.ts).
 *
 * Each builder takes only the link. Nothing a visitor typed (a name, a note)
 * ever goes into these emails: anyone can enter anyone's address at sign-up,
 * and the site must not become a way to send a stranger chosen words from
 * atelier@.
 */
import { ATELIER } from '../enquiry/email';

export interface AccountMessage {
  subject: string;
  text: string;
  html: string;
}

export const confirmUrl = (origin: string, token: string) => `${origin}/account/confirm?token=${encodeURIComponent(token)}`;
export const resetUrl = (origin: string, token: string) => `${origin}/reset-password?token=${encodeURIComponent(token)}`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const SIGN_OFF = 'Fairway Atelier\nhttps://fairwayatelier.com';
const P = 'font-family:Georgia,serif;font-size:16px;line-height:1.5';

/** @param paragraphs plain paragraphs; `link` is placed after the first one */
function build(subject: string, paragraphs: string[], link: { url: string; label: string }): AccountMessage {
  const [first, ...rest] = paragraphs;
  return {
    subject,
    text: [first, link.url, ...rest, SIGN_OFF].join('\n\n') + '\n',
    html: [
      `<p style="${P}">${escapeHtml(first)}</p>`,
      `<p style="${P}"><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></p>`,
      ...[...rest, SIGN_OFF].map((p) => `<p style="${P}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`),
    ].join(''),
  };
}

/** After signing up with an email and a password. The profile works without confirming; this unlocks past enquiries. */
export function welcomeEmail(url: string): AccountMessage {
  return build(
    'Welcome to Fairway Atelier',
    [
      'Welcome to Fairway Atelier. Your profile is ready. Please confirm that this is your email address:',
      'Once confirmed, your profile will also show the enquiries you have sent us from this address. The link works for seven days.',
      'If you did not create a profile with us, you can ignore this email and nothing further will happen.',
    ],
    { url, label: 'Confirm my email address' },
  );
}

export function resetEmail(url: string): AccountMessage {
  return build(
    'Reset your Fairway Atelier password',
    [
      'You asked to reset the password for your Fairway Atelier profile. Choose a new one here:',
      'The link works once, for one hour.',
      'If you did not ask for this, you can ignore this email and your password stays as it is.',
    ],
    { url, label: 'Choose a new password' },
  );
}

/** When someone signs up with an address the team already started a sheet for: the mailbox owner sets the password. */
export function claimEmail(url: string): AccountMessage {
  return build(
    'Finish setting up your Fairway Atelier profile',
    [
      'We already hold a few details for this address from our conversations with you. To open your profile, choose a password here:',
      'The link works once, for one hour.',
      'If this was not you, you can ignore this email and nothing further will happen.',
    ],
    { url, label: 'Choose a password' },
  );
}

/**
 * Sends an account email. Never throws: a failed send must not undo the
 * sign-up or reveal anything to the visitor. Links and addresses are kept out
 * of the logs.
 * @param opts.local on a developer's machine without the binding, print the text so the link can be followed
 * @returns whether the email was handed to the mail service
 */
export async function sendAccountEmail(mailer: SendEmail | undefined, to: string, message: AccountMessage, opts: { local?: boolean } = {}): Promise<boolean> {
  if (!mailer) {
    if (opts.local) console.info(`[account] no EMAIL binding; "${message.subject}" would have said:\n${message.text}`);
    else console.error(`[account] no EMAIL binding; "${message.subject}" was not sent`);
    return false;
  }
  try {
    await mailer.send({ from: ATELIER, to, ...message });
    return true;
  } catch (err) {
    console.error(`[account] "${message.subject}" failed to send`, (err as { code?: string }).code ?? 'unknown error');
    return false;
  }
}
