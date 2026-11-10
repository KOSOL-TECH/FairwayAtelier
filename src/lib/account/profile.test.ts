import { describe, expect, it } from 'vitest';
import { QUESTIONS, isRelevant } from './questions';
import { completeness, displayName, normaliseCore, normaliseEmail, splitName } from './profile';

const EMPTY = { first_name: '', last_name: '', phone: '', country: '' };

describe('normaliseEmail', () => {
  it('trims and lower-cases a valid address', () => {
    expect(normaliseEmail('  Anne.Martin@Example.COM ')).toBe('anne.martin@example.com');
  });

  it('returns nothing for anything that is not one address', () => {
    for (const bad of ['', 'anne', 'anne@', '@example.com', 'a b@example.com', 'anne@example', 42, null, undefined, `${'a'.repeat(250)}@example.com`]) {
      expect(normaliseEmail(bad), String(bad)).toBe('');
    }
  });
});

describe('splitName', () => {
  it.each([
    ['Anne Martin', 'Anne', 'Martin'],
    ['  Anne   de la  Tour ', 'Anne', 'de la Tour'],
    ['Anne', 'Anne', ''],
    ['', '', ''],
  ])('%j → %j + %j', (full, first, last) => {
    expect(splitName(full)).toEqual({ first_name: first, last_name: last });
  });

  it('caps each part', () => {
    const { first_name, last_name } = splitName(`${'a'.repeat(100)} ${'b'.repeat(200)}`);
    expect(first_name).toHaveLength(60);
    expect(last_name).toHaveLength(80);
  });
});

describe('normaliseCore', () => {
  it('keeps only the four profile fields, tidied', () => {
    expect(normaliseCore({ first_name: '  Anne ', last_name: 'Martin', phone: '+33 6 12 34 56 78', country: 'France', role: 'admin', email: 'x@y.co', internal_notes: 'x' }))
      .toEqual({ first_name: 'Anne', last_name: 'Martin', phone: '+33 6 12 34 56 78', country: 'France' });
  });

  it('leaves out fields that were not sent or are not text', () => {
    expect(normaliseCore({ phone: '', country: 7 })).toEqual({ phone: '' });
    expect(normaliseCore(null)).toEqual({});
    expect(normaliseCore(['first_name'])).toEqual({});
  });

  it('caps long values', () => {
    expect(normaliseCore({ phone: '1'.repeat(100) }).phone).toHaveLength(40);
  });
});

describe('displayName', () => {
  it('prefers the name and falls back to the email', () => {
    expect(displayName({ first_name: 'Anne', last_name: 'Martin', email: 'a@b.co' })).toBe('Anne Martin');
    expect(displayName({ first_name: 'Anne', last_name: '', email: 'a@b.co' })).toBe('Anne');
    expect(displayName({ first_name: '', last_name: '', email: 'a@b.co' })).toBe('a@b.co');
  });
});

describe('completeness', () => {
  it('starts at nothing', () => {
    expect(completeness(EMPTY, {})).toEqual({ done: 0, total: QUESTIONS.length + 4, percent: 0 });
  });

  it('counts profile fields and answers, but not skipped questions', () => {
    const c = completeness({ ...EMPTY, first_name: 'Anne', phone: '+33' }, { golf_level: 'mid', tier: '', season: '["spring"]' });
    expect(c.done).toBe(4);
  });

  it('leaves questions that do not apply out of the total', () => {
    const answers = { golf_level: 'non_golfer' };
    const relevant = QUESTIONS.filter((q) => isRelevant(q, answers)).length;
    expect(relevant).toBeLessThan(QUESTIONS.length);
    expect(completeness(EMPTY, answers).total).toBe(relevant + 4);
  });

  it('does not count an old answer to a question that no longer applies', () => {
    expect(completeness(EMPTY, { golf_level: 'non_golfer', handicap: '12' }).done).toBe(1);
  });

  it('reaches 100% when everything that applies is filled in', () => {
    const answers: Record<string, string> = { golf_level: 'non_golfer' };
    for (const q of QUESTIONS) if (isRelevant(q, answers) && q.id !== 'golf_level') answers[q.id] = q.kind === 'text' ? 'x' : q.kind === 'multi' ? JSON.stringify([q.options![0].value]) : q.options![0].value;
    expect(completeness({ first_name: 'A', last_name: 'B', phone: '1', country: 'FR' }, answers).percent).toBe(100);
  });
});
