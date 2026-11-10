/**
 * Enquiry validation, shared by the form (client) and /api/enquiry (server)
 * so the rules and messages can never drift apart.
 */
export const TIERS = ['Standard', 'Signature', 'Undecided'] as const;
export type Tier = (typeof TIERS)[number];

export const GROUPS = ['Two travellers', 'Four travellers', 'A larger private group (5–8)'] as const;
export const FLEXIBLE = 'Flexible / not sure yet';

export interface EnquiryFields {
  name: string;
  email: string;
  phone: string;
  dates: string;
  group: string;
  tier: Tier;
  notes: string;
}

export type FieldErrors = Partial<Record<'name' | 'email' | 'dates' | 'group' | 'tier', string>>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGES = {
  name: 'Please tell us your name.',
  emailEmpty: 'An email lets us reply.',
  emailInvalid: 'Please check this email address.',
  dates: 'Choose a window, or “Flexible”.',
  group: 'Let us know who is travelling.',
} as const;

/** Max lengths, enforced server-side to bound what reaches email and the CRM. */
const MAX = { name: 120, email: 254, phone: 40, notes: 2000 };

/**
 * @param dateOptions the allowed "Dates of Interest" values (opened weeks plus "Flexible").
 *   The client passes its rendered list; the server derives it from the availability data.
 */
export function validateEnquiry(f: EnquiryFields, dateOptions: readonly string[]): FieldErrors {
  const errs: FieldErrors = {};
  if (!f.name.trim()) errs.name = MESSAGES.name;
  if (!f.email.trim()) errs.email = MESSAGES.emailEmpty;
  else if (!EMAIL_RE.test(f.email.trim())) errs.email = MESSAGES.emailInvalid;
  if (!f.dates || !dateOptions.includes(f.dates)) errs.dates = MESSAGES.dates;
  if (!f.group || !(GROUPS as readonly string[]).includes(f.group)) errs.group = MESSAGES.group;
  if (!(TIERS as readonly string[]).includes(f.tier)) errs.tier = 'Please choose a tier.';
  return errs;
}

/** Coerces an untrusted payload into trimmed, length-capped fields. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The form sends one random id per enquiry, so a retry after a failed send
 * updates the same enquiry instead of storing a second one.
 * @returns the id in lower case, or undefined if it is missing or not a UUID.
 */
export const submissionId = (raw: Record<string, unknown>): string | undefined =>
  typeof raw.id === 'string' && UUID_RE.test(raw.id) ? raw.id.toLowerCase() : undefined;

export function normaliseEnquiry(raw: Record<string, unknown>): EnquiryFields {
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  return {
    name: s(raw.name, MAX.name),
    email: s(raw.email, MAX.email),
    phone: s(raw.phone, MAX.phone),
    dates: s(raw.dates, 100),
    group: s(raw.group, 100),
    tier: s(raw.tier, 20) as Tier,
    notes: s(raw.notes, MAX.notes),
  };
}
