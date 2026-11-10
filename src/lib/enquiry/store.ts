import type { Enquiry, EnquirySink } from './handler';

/**
 * Stored enquiries (D1 `enquiries`, migrations/0004_enquiries.sql), shown in
 * /admin/enquiries. Enquiries that never led to a booking are deleted three
 * years after the last contact (BACKLOG D-13); booked ones are kept.
 */
export const ENQUIRY_STATUSES = ['new', 'replied', 'booked', 'closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: 'New',
  replied: 'Replied',
  booked: 'Booked',
  closed: 'Closed',
};

export const RETENTION_YEARS = 3;

export interface StoredEnquiry {
  id: string;
  received_at: string;
  name: string;
  email: string;
  phone: string;
  dates: string;
  party: string;
  tier: string;
  message: string;
  status: EnquiryStatus;
  internal_notes: string;
  last_contact_at: string;
  updated_at: string;
}

/** The moment before which unbooked enquiries are deleted. */
export function retentionCutoff(now = new Date()): string {
  const d = new Date(now);
  d.setUTCFullYear(d.getUTCFullYear() - RETENTION_YEARS);
  return d.toISOString();
}

/** Deletes unbooked enquiries past the retention period. Cheap; runs on every new enquiry and inbox visit. */
export async function purgeExpired(db: D1Database, now = new Date()): Promise<number> {
  const res = await db.prepare("DELETE FROM enquiries WHERE status != 'booked' AND last_contact_at < ?").bind(retentionCutoff(now)).run();
  return res.meta.changes ?? 0;
}

/**
 * Saves each accepted enquiry first, so it is kept even if an email then fails.
 * A retry of the same submission (same id) replaces the guest's details while
 * the enquiry is still New, instead of adding a duplicate; once the team has
 * acted on it, the stored enquiry is left as it is.
 */
export const UPSERT_ENQUIRY = `INSERT INTO enquiries (id, received_at, name, email, phone, dates, party, tier, message, last_contact_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET name = excluded.name, email = excluded.email, phone = excluded.phone, dates = excluded.dates,
    party = excluded.party, tier = excluded.tier, message = excluded.message, last_contact_at = excluded.last_contact_at,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE enquiries.status = 'new'`;

export class D1Sink implements EnquirySink {
  readonly name = 'd1';
  constructor(private readonly db: D1Database) {}
  async handle(e: Enquiry) {
    await this.db
      .prepare(UPSERT_ENQUIRY)
      .bind(e.id, e.receivedAt, e.name, e.email, e.phone, e.dates, e.group, e.tier, e.notes, e.receivedAt)
      .run();
    await purgeExpired(this.db).catch((err) => console.error('[enquiry] purge failed', err));
  }
}

export async function countByStatus(db: D1Database): Promise<Record<EnquiryStatus, number>> {
  const { results } = await db.prepare('SELECT status, count(*) AS n FROM enquiries GROUP BY status').all<{ status: EnquiryStatus; n: number }>();
  const counts = { new: 0, replied: 0, booked: 0, closed: 0 };
  for (const r of results) counts[r.status] = r.n;
  return counts;
}

export async function listEnquiries(db: D1Database, status?: EnquiryStatus, limit = 200): Promise<StoredEnquiry[]> {
  const q = status
    ? db.prepare('SELECT * FROM enquiries WHERE status = ? ORDER BY received_at DESC LIMIT ?').bind(status, limit)
    : db.prepare('SELECT * FROM enquiries ORDER BY received_at DESC LIMIT ?').bind(limit);
  return (await q.all<StoredEnquiry>()).results;
}

export async function getEnquiry(db: D1Database, id: string): Promise<StoredEnquiry | null> {
  return db.prepare('SELECT * FROM enquiries WHERE id = ?').bind(id).first<StoredEnquiry>();
}

/** Saving a status or notes counts as contact, so it restarts the retention clock. */
export async function updateEnquiry(db: D1Database, id: string, status: EnquiryStatus, internalNotes: string) {
  await db
    .prepare(
      `UPDATE enquiries SET status = ?, internal_notes = ?, last_contact_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    )
    .bind(status, internalNotes, id)
    .run();
}

export async function deleteEnquiry(db: D1Database, id: string) {
  await db.prepare('DELETE FROM enquiries WHERE id = ?').bind(id).run();
}
