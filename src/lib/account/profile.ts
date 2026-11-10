/**
 * The few profile details stored as columns on `accounts` (name, phone,
 * country), as opposed to the answers in ./questions.ts. Shared by the browser
 * and the Worker.
 */
import { EMAIL_RE } from '../enquiry/validate';
import { QUESTIONS, isRelevant, tidy, type Answers } from './questions';

export const CORE_FIELDS = ['first_name', 'last_name', 'phone', 'country'] as const;
export type CoreField = (typeof CORE_FIELDS)[number];
export type Core = Record<CoreField, string>;

export const CORE_LABEL: Record<CoreField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  phone: 'Phone',
  country: 'Country of residence',
};

/** Shortest password a guest may choose (admins: MIN_PASSWORD_LENGTH in src/lib/admin/password.ts). Here so the browser can show it. */
export const MIN_PASSWORD = 8;

const CORE_MAX: Record<CoreField, number> = { first_name: 60, last_name: 80, phone: 40, country: 60 };

/** @returns the address trimmed and in lower case, or '' if it is not one valid address. */
export function normaliseEmail(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : '';
}

/** "Anne de la Tour" → first name "Anne", last name "de la Tour". */
export function splitName(full: string): Pick<Core, 'first_name' | 'last_name'> {
  const [first = '', ...rest] = tidy(full, 400).split(' ');
  return { first_name: first.slice(0, CORE_MAX.first_name), last_name: rest.join(' ').slice(0, CORE_MAX.last_name) };
}

/**
 * Picks the profile fields out of an untrusted payload. Only these four can be
 * changed this way: never the role, the email or anything internal.
 */
export function normaliseCore(raw: unknown): Partial<Core> {
  const out: Partial<Core> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const field of CORE_FIELDS) {
    const value = Object.hasOwn(raw, field) ? (raw as Record<string, unknown>)[field] : undefined;
    if (typeof value === 'string') out[field] = tidy(value, CORE_MAX[field]);
  }
  return out;
}

export function displayName(a: { first_name: string; last_name: string; email: string }): string {
  return [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email;
}

/** How much of the profile is filled in, counting only questions that apply to this guest. */
export function completeness(core: Core, answers: Answers): { done: number; total: number; percent: number } {
  const relevant = QUESTIONS.filter((q) => isRelevant(q, answers));
  const done = CORE_FIELDS.filter((f) => core[f]).length + relevant.filter((q) => answers[q.id]).length;
  const total = CORE_FIELDS.length + relevant.length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
