/**
 * Availability weeks, stored in D1 (`weeks`, migrations/0003_weeks.sql) and
 * edited in /admin/weeks. Feeds /availability, the Home preview and the
 * enquiry form's date options.
 */
export const STATUSES = ['booking', 'limited', 'sold', 'waitlist'] as const;
export type WeekStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<WeekStatus, string> = {
  booking: 'Booking',
  limited: 'Limited',
  sold: 'Sold',
  waitlist: 'Waitlist',
};

export interface WeekRow {
  id: number;
  start_date: string;
  end_date: string;
  status: WeekStatus;
  summary: string;
  standard: string;
  signature: string;
  dining: string;
  featured: number;
  published: number;
  updated_at: string;
}

/** A week with its display labels, as the public pages use it. */
export interface Week extends WeekRow {
  /** e.g. "Sun 10 – Sun 17 May 2026" */
  dates: string;
  /** e.g. "10–17 May 2026"; also the enquiry form's option value */
  short: string;
  label: string;
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return { day: DAY[d.getUTCDay()], dd: String(d.getUTCDate()).padStart(2, '0'), mon: MON[d.getUTCMonth()], yr: d.getUTCFullYear() };
};

/** "Sun 10 – Sun 17 May 2026", "Sun 28 Jun – Sun 05 Jul 2026", "Sun 27 Dec 2026 – Sun 03 Jan 2027" */
export function longDates(start: string, end: string): string {
  const s = parts(start);
  const e = parts(end);
  const sameYear = s.yr === e.yr;
  const head = `${s.day} ${s.dd}${s.mon !== e.mon || !sameYear ? ` ${s.mon}` : ''}${sameYear ? '' : ` ${s.yr}`}`;
  return `${head} – ${e.day} ${e.dd} ${e.mon} ${e.yr}`;
}

/** "10–17 May 2026", "28 Jun–05 Jul 2026", "27 Dec 2026–03 Jan 2027" */
export function shortDates(start: string, end: string): string {
  const s = parts(start);
  const e = parts(end);
  if (s.yr !== e.yr) return `${s.dd} ${s.mon} ${s.yr}–${e.dd} ${e.mon} ${e.yr}`;
  if (s.mon !== e.mon) return `${s.dd} ${s.mon}–${e.dd} ${e.mon} ${e.yr}`;
  return `${s.dd}–${e.dd} ${e.mon} ${e.yr}`;
}

export const withLabels = (w: WeekRow): Week => ({
  ...w,
  dates: longDates(w.start_date, w.end_date),
  short: shortDates(w.start_date, w.end_date),
  label: STATUS_LABEL[w.status],
});

/** Today's date in Brittany, as YYYY-MM-DD. */
export const todayInParis = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

/** "2027" or "2026–2027" for the weeks shown, or '' when there are none. */
export function yearSpan(weeks: Pick<WeekRow, 'start_date'>[]): string {
  const years = [...new Set(weeks.map((w) => w.start_date.slice(0, 4)))].sort();
  return years.length > 1 ? `${years[0]}–${years.at(-1)}` : (years[0] ?? '');
}

// ---------- Reading ----------

/** Published weeks that have not started yet, soonest first. These are the ones the site shows. */
export async function upcomingWeeks(db: D1Database, today = todayInParis()): Promise<Week[]> {
  const { results } = await db
    .prepare('SELECT * FROM weeks WHERE published = 1 AND start_date >= ? ORDER BY start_date')
    .bind(today)
    .all<WeekRow>();
  return results.map(withLabels);
}

/** Every week, newest first, for the admin. */
export async function allWeeks(db: D1Database): Promise<Week[]> {
  const { results } = await db.prepare('SELECT * FROM weeks ORDER BY start_date DESC').all<WeekRow>();
  return results.map(withLabels);
}

export async function getWeek(db: D1Database, id: number): Promise<Week | null> {
  const row = await db.prepare('SELECT * FROM weeks WHERE id = ?').bind(id).first<WeekRow>();
  return row ? withLabels(row) : null;
}

// ---------- Editing ----------

export type WeekInput = Pick<WeekRow, 'start_date' | 'end_date' | 'status' | 'summary' | 'standard' | 'signature' | 'dining'> & {
  featured: boolean;
  published: boolean;
};
export type WeekErrors = Partial<Record<keyof WeekInput, string>>;

const TEXT_MAX = 200;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s: string) => ISO_DATE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

/** Reads the week form. Unknown or missing values become empty strings, so validation reports them. */
export function parseWeekForm(form: FormData): WeekInput {
  const s = (k: string) => String(form.get(k) ?? '').trim().slice(0, TEXT_MAX + 1);
  return {
    start_date: s('start_date'),
    end_date: s('end_date'),
    status: s('status') as WeekStatus,
    summary: s('summary'),
    standard: s('standard'),
    signature: s('signature'),
    dining: s('dining'),
    featured: form.get('featured') === 'on',
    published: form.get('published') === 'on',
  };
}

export function validateWeek(w: WeekInput): WeekErrors {
  const errs: WeekErrors = {};
  if (!validDate(w.start_date)) errs.start_date = 'Choose the first day of the week.';
  if (!validDate(w.end_date)) errs.end_date = 'Choose the last day of the week.';
  else if (!errs.start_date && w.end_date <= w.start_date) errs.end_date = 'The last day must be after the first day.';
  if (!(STATUSES as readonly string[]).includes(w.status)) errs.status = 'Choose a status.';
  for (const k of ['summary', 'standard', 'signature', 'dining'] as const) {
    if (!w[k]) errs[k] = 'Required. Use “—” if there is nothing to say yet.';
    else if (w[k].length > TEXT_MAX) errs[k] = `Keep it under ${TEXT_MAX} characters.`;
  }
  return errs;
}

const values = (w: WeekInput) => [w.start_date, w.end_date, w.status, w.summary, w.standard, w.signature, w.dining, w.featured ? 1 : 0, w.published ? 1 : 0];

/** @returns the new week's id, or null if another week already starts on that date. */
export async function createWeek(db: D1Database, w: WeekInput): Promise<number | null> {
  const row = await db
    .prepare(
      'INSERT INTO weeks (start_date, end_date, status, summary, standard, signature, dining, featured, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(start_date) DO NOTHING RETURNING id',
    )
    .bind(...values(w))
    .first<{ id: number }>();
  return row?.id ?? null;
}

/** @returns false if another week already starts on the new date. */
export async function updateWeek(db: D1Database, id: number, w: WeekInput): Promise<boolean> {
  const clash = await db.prepare('SELECT id FROM weeks WHERE start_date = ? AND id != ?').bind(w.start_date, id).first();
  if (clash) return false;
  await db
    .prepare(
      `UPDATE weeks SET start_date = ?, end_date = ?, status = ?, summary = ?, standard = ?, signature = ?, dining = ?, featured = ?, published = ?,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    )
    .bind(...values(w), id)
    .run();
  return true;
}

export async function setWeekStatus(db: D1Database, id: number, status: WeekStatus) {
  await db.prepare(`UPDATE weeks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(status, id).run();
}

export async function deleteWeek(db: D1Database, id: number) {
  await db.prepare('DELETE FROM weeks WHERE id = ?').bind(id).run();
}
