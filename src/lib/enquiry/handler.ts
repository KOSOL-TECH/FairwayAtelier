import { env } from 'cloudflare:workers';
import type { EnquiryFields } from './validate';
import { GuestConfirmationEmail, TeamNotificationEmail } from './email';
import { D1Sink } from './store';

export interface Enquiry extends EnquiryFields {
  id: string;
  receivedAt: string;
}

/**
 * One step in processing an accepted enquiry. Implementations are run in order;
 * any failure is reported to the guest as "could not send" so they can retry.
 *
 * Implementations: ConsoleSink, D1Sink (./store.ts, the admin inbox), and
 * TeamNotificationEmail and GuestConfirmationEmail (./email.ts).
 */
export interface EnquirySink {
  readonly name: string;
  handle(enquiry: Enquiry): Promise<void>;
}

/** Development stub: logs the enquiry so the flow can be exercised end to end. */
export class ConsoleSink implements EnquirySink {
  readonly name = 'console';
  async handle(enquiry: Enquiry) {
    console.info('[enquiry] received', JSON.stringify({ ...enquiry, email: '<redacted>', phone: enquiry.phone ? '<redacted>' : '' }));
  }
}

/**
 * The sinks every accepted enquiry is sent through: logged, stored for the
 * admin inbox, then emailed. Without the `EMAIL` binding (e.g. `astro dev`)
 * no emails are sent.
 */
export function getEnquirySinks(): EnquirySink[] {
  const sinks: EnquirySink[] = [new ConsoleSink(), new D1Sink(env.DB)];
  const mailer = env.EMAIL;
  if (mailer) sinks.push(new TeamNotificationEmail(mailer), new GuestConfirmationEmail(mailer));
  return sinks;
}

export async function processEnquiry(fields: EnquiryFields, sinks = getEnquirySinks()): Promise<Enquiry> {
  const enquiry: Enquiry = { ...fields, id: crypto.randomUUID(), receivedAt: new Date().toISOString() };
  for (const sink of sinks) await sink.handle(enquiry);
  return enquiry;
}
