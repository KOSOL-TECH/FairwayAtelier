import { env } from 'cloudflare:workers';
import type { EnquiryFields } from './validate';
import { GuestConfirmationEmail, TeamNotificationEmail } from './email';

export interface Enquiry extends EnquiryFields {
  id: string;
  receivedAt: string;
}

/**
 * One step in processing an accepted enquiry. Implementations are run in order;
 * any failure is reported to the guest as "could not send" so they can retry.
 *
 * Implementations: ConsoleSink, TeamNotificationEmail and GuestConfirmationEmail
 * (./email.ts). Planned: CrmSink, once the client picks a CRM (BACKLOG D-02).
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
 * The sinks every accepted enquiry is sent through. Without the `EMAIL`
 * binding (e.g. `astro dev`) enquiries are only logged.
 */
export function getEnquirySinks(): EnquirySink[] {
  const mailer = env.EMAIL;
  if (!mailer) return [new ConsoleSink()];
  return [new ConsoleSink(), new TeamNotificationEmail(mailer), new GuestConfirmationEmail(mailer)];
}

export async function processEnquiry(fields: EnquiryFields, sinks = getEnquirySinks()): Promise<Enquiry> {
  const enquiry: Enquiry = { ...fields, id: crypto.randomUUID(), receivedAt: new Date().toISOString() };
  for (const sink of sinks) await sink.handle(enquiry);
  return enquiry;
}
