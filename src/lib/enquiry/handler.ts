import type { EnquiryFields } from './validate';

export interface Enquiry extends EnquiryFields {
  id: string;
  receivedAt: string;
}

/**
 * One step in processing an accepted enquiry. Implementations are run in order;
 * any failure is reported to the guest as "could not send" so they can retry.
 *
 * Planned implementations (not yet wired, see README "Open decisions"):
 *  - TeamNotificationEmail: notify atelier@fairwayatelier.com
 *  - GuestConfirmationEmail: confirm receipt to the guest
 *  - CrmSink: push the enquiry to the CRM (vendor to be chosen with the client)
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

/** The sinks every accepted enquiry is sent through. Replace the stub here. */
export function getEnquirySinks(): EnquirySink[] {
  return [new ConsoleSink()];
}

export async function processEnquiry(fields: EnquiryFields, sinks = getEnquirySinks()): Promise<Enquiry> {
  const enquiry: Enquiry = { ...fields, id: crypto.randomUUID(), receivedAt: new Date().toISOString() };
  for (const sink of sinks) await sink.handle(enquiry);
  return enquiry;
}
