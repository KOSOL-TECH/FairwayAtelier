import { describe, expect, it } from 'vitest';
import { longDates, parseWeekForm, shortDates, todayInParis, validateWeek, yearSpan, type WeekInput } from './weeks';

describe('date labels', () => {
  it('match the format of the original availability data', () => {
    expect(longDates('2026-05-10', '2026-05-17')).toBe('Sun 10 – Sun 17 May 2026');
    expect(shortDates('2026-05-10', '2026-05-17')).toBe('10–17 May 2026');
    expect(longDates('2026-06-07', '2026-06-14')).toBe('Sun 07 – Sun 14 Jun 2026');
    expect(shortDates('2026-06-07', '2026-06-14')).toBe('07–14 Jun 2026');
  });

  it('name both months when a week spans two', () => {
    expect(longDates('2027-06-27', '2027-07-04')).toBe('Sun 27 Jun – Sun 04 Jul 2027');
    expect(shortDates('2027-06-27', '2027-07-04')).toBe('27 Jun–04 Jul 2027');
  });

  it('name both years when a week spans New Year', () => {
    expect(longDates('2027-12-26', '2028-01-02')).toBe('Sun 26 Dec 2027 – Sun 02 Jan 2028');
    expect(shortDates('2027-12-26', '2028-01-02')).toBe('26 Dec 2027–02 Jan 2028');
  });
});

describe('todayInParis', () => {
  it('uses the Paris date, not UTC', () => {
    // 23:30 UTC on 31 Dec is already 1 Jan in Paris.
    expect(todayInParis(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
});

describe('yearSpan', () => {
  it('gives one year, a range, or nothing', () => {
    expect(yearSpan([{ start_date: '2027-05-09' }, { start_date: '2027-09-12' }])).toBe('2027');
    expect(yearSpan([{ start_date: '2028-05-07' }, { start_date: '2027-09-12' }])).toBe('2027–2028');
    expect(yearSpan([])).toBe('');
  });
});

const valid: WeekInput = {
  start_date: '2027-05-09',
  end_date: '2027-05-16',
  status: 'booking',
  summary: 'Standard & Signature',
  standard: 'Available',
  signature: 'Available',
  dining: 'Le Coquillage confirmed',
  featured: true,
  published: true,
};

describe('validateWeek', () => {
  it('accepts a complete week', () => {
    expect(validateWeek(valid)).toEqual({});
  });

  it('rejects impossible dates and an end before the start', () => {
    expect(validateWeek({ ...valid, start_date: '2027-02-30' }).start_date).toBeTruthy();
    expect(validateWeek({ ...valid, end_date: '2027-05-09' }).end_date).toBe('The last day must be after the first day.');
  });

  it('rejects an unknown status and empty or long text', () => {
    const errs = validateWeek({ ...valid, status: 'open' as WeekInput['status'], dining: '', summary: 'x'.repeat(201) });
    expect(Object.keys(errs).sort()).toEqual(['dining', 'status', 'summary']);
  });
});

describe('parseWeekForm', () => {
  it('trims text and reads checkboxes', () => {
    const f = new FormData();
    f.set('start_date', ' 2027-05-09 ');
    f.set('summary', '  Signature only ');
    f.set('featured', 'on');
    const w = parseWeekForm(f);
    expect(w.start_date).toBe('2027-05-09');
    expect(w.summary).toBe('Signature only');
    expect(w.featured).toBe(true);
    expect(w.published).toBe(false);
    expect(w.dining).toBe('');
  });
});
