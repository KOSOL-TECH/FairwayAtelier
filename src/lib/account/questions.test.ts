import { describe, expect, it } from 'vitest';
import {
  ONBOARDING, QUESTIONS, SECTIONS, answerLabel, changedAnswers, isRelevant, multiValues, nextPrompt, normaliseAnswers, promptView, questionById,
} from './questions';

const q = (id: string) => {
  const found = questionById(id);
  if (!found) throw new Error(`no question "${id}"`);
  return found;
};

describe('the question bank', () => {
  it('keeps the ids of live questions (answers are stored by id, so never rename one)', () => {
    expect(QUESTIONS.map((x) => x.id)).toEqual([
      'golf_level', 'handicap', 'home_club', 'rounds', 'pro_time', 'clubs', 'hand', 'buggy',
      'trip_focus', 'party', 'group_size', 'season', 'tier', 'occasion', 'non_golfers', 'departure',
      'dietary', 'allergies', 'wine', 'food_notes',
      'bed', 'room_notes', 'mobility',
      'contact_method', 'heard_from', 'heard_detail',
    ]);
  });

  it('puts every question in a known section', () => {
    const sections = SECTIONS.map((s) => s.id) as string[];
    for (const x of QUESTIONS) expect(sections, x.id).toContain(x.section);
  });

  it('gives every choice at least two options, with unique values', () => {
    for (const x of QUESTIONS.filter((y) => y.kind !== 'text')) {
      const values = (x.options ?? []).map((o) => o.value);
      expect(values.length, x.id).toBeGreaterThanOrEqual(2);
      expect(new Set(values).size, x.id).toBe(values.length);
    }
  });

  it('only names existing questions and options in its relevance rules', () => {
    for (const x of QUESTIONS.filter((y) => y.unless)) {
      const other = q(x.unless!.question);
      const values = (other.options ?? []).map((o) => o.value);
      for (const v of x.unless!.is) expect(values, x.id).toContain(v);
    }
  });

  it('orders later questions without ties', () => {
    const order = QUESTIONS.filter((x) => x.prompt !== undefined).map((x) => x.prompt);
    expect(new Set(order).size).toBe(order.length);
  });
});

describe('onboarding', () => {
  it('asks four questions, one per frame, each answered with a single tap', () => {
    expect(ONBOARDING.map((x) => x.frame)).toEqual([1, 2, 3, 4]);
    expect(ONBOARDING.every((x) => x.kind === 'choice')).toBe(true);
  });

  it('leads with golf and ends with how the guest heard about us', () => {
    expect(ONBOARDING.map((x) => x.id)).toEqual(['golf_level', 'trip_focus', 'party', 'heard_from']);
  });

  it('keeps every frame short enough to answer at a glance', () => {
    for (const x of ONBOARDING) expect(x.options!.length, x.id).toBeLessThanOrEqual(6);
  });
});

describe('normaliseAnswers', () => {
  it('keeps a valid choice and drops unknown questions and unknown options', () => {
    expect(normaliseAnswers({ golf_level: 'mid', tier: 'platinum', made_up: 'x' })).toEqual({ golf_level: 'mid' });
  });

  it('stores several choices in the order of the bank, without repeats', () => {
    expect(normaliseAnswers({ season: ['autumn', 'spring', 'autumn', 'winter'] })).toEqual({ season: '["spring","autumn"]' });
  });

  it('treats an empty value as "cleared"', () => {
    expect(normaliseAnswers({ golf_level: '', season: [], home_club: '   ' })).toEqual({ golf_level: '', season: '', home_club: '' });
  });

  it('tidies free text and caps its length', () => {
    const { home_club, handicap } = normaliseAnswers({ home_club: '  Royal\tSt  George\u0000s \n', handicap: '12.4 and a very long story' });
    expect(home_club).toBe('Royal St Georges');
    expect(handicap).toHaveLength(q('handicap').max!);
  });

  it('drops values of the wrong type', () => {
    expect(normaliseAnswers({ golf_level: ['mid'], season: 'spring', home_club: 42, wine: null })).toEqual({});
  });

  it('returns nothing for input that is not an object', () => {
    for (const bad of [null, undefined, 'x', 7, ['golf_level']]) expect(normaliseAnswers(bad)).toEqual({});
  });

  it('ignores inherited and prototype keys', () => {
    const raw = JSON.parse('{"__proto__": {"golf_level": "mid"}, "constructor": "x", "toString": "y"}');
    expect(normaliseAnswers(raw)).toEqual({});
  });
});

describe('answerLabel', () => {
  it('shows the option label for a choice', () => {
    expect(answerLabel(q('tier'), 'signature')).toBe('Signature');
  });

  it('joins several choices', () => {
    expect(answerLabel(q('season'), '["spring","autumn"]')).toBe('Spring, Autumn');
  });

  it('shows free text as written, and nothing for a cleared answer', () => {
    expect(answerLabel(q('home_club'), 'Dinard')).toBe('Dinard');
    expect(answerLabel(q('tier'), '')).toBe('');
  });

  it('falls back to the stored value when an option has since been removed', () => {
    expect(answerLabel(q('tier'), 'retired-tier')).toBe('retired-tier');
  });
});

describe('multiValues', () => {
  it('reads a stored list and survives anything else', () => {
    expect(multiValues('["spring","autumn"]')).toEqual(['spring', 'autumn']);
    expect(multiValues('')).toEqual([]);
    expect(multiValues('not json')).toEqual([]);
    expect(multiValues('{"a":1}')).toEqual([]);
    expect(multiValues('[1,"spring"]')).toEqual(['spring']);
  });
});

describe('isRelevant', () => {
  it('does not ask a non-golfer about their own game', () => {
    for (const id of ['handicap', 'home_club', 'rounds', 'pro_time', 'clubs', 'hand', 'buggy']) {
      expect(isRelevant(q(id), { golf_level: 'non_golfer' }), id).toBe(false);
    }
  });

  it('does not ask for a handicap from someone who plays without one', () => {
    expect(isRelevant(q('handicap'), { golf_level: 'social' })).toBe(false);
    expect(isRelevant(q('home_club'), { golf_level: 'social' })).toBe(true);
  });

  it('asks everything while the golf question is unanswered', () => {
    expect(QUESTIONS.every((x) => isRelevant(x, {}))).toBe(true);
  });
});

describe('nextPrompt (later questions)', () => {
  it('starts with a skipped onboarding question', () => {
    expect(nextPrompt({})?.id).toBe('golf_level');
  });

  it('moves on to the first question not yet answered', () => {
    expect(nextPrompt({ golf_level: 'mid', trip_focus: 'both', party: 'friends' })?.id).toBe('season');
  });

  it('never repeats a question the guest skipped', () => {
    expect(nextPrompt({ golf_level: 'mid', trip_focus: 'both', party: 'friends', season: '' })?.id).toBe('group_size');
  });

  it('leaves out questions that do not apply', () => {
    const asked = new Set<string>();
    const answers: Record<string, string> = { golf_level: 'non_golfer' };
    for (let next = nextPrompt(answers); next; next = nextPrompt(answers)) {
      asked.add(next.id);
      answers[next.id] = '';
    }
    expect(asked.has('handicap')).toBe(false);
    expect(asked.has('clubs')).toBe(false);
    expect(asked.has('wine')).toBe(true);
  });

  it('has nothing left once every later question has an answer or a skip', () => {
    const answers = Object.fromEntries(QUESTIONS.map((x) => [x.id, '']));
    expect(nextPrompt(answers)).toBeNull();
  });
});

describe('changedAnswers', () => {
  it('keeps only what differs from what is stored', () => {
    const stored = { golf_level: 'mid', tier: 'signature', season: '["spring"]' };
    expect(changedAnswers(stored, { golf_level: 'mid', tier: 'standard', season: '["spring","autumn"]' })).toEqual({
      tier: 'standard', season: '["spring","autumn"]',
    });
  });

  it('does not turn an untouched empty field into a skip', () => {
    expect(changedAnswers({ golf_level: 'mid' }, { golf_level: 'mid', tier: '', home_club: '', season: '' })).toEqual({});
  });

  it('records a cleared answer', () => {
    expect(changedAnswers({ tier: 'signature' }, { tier: '' })).toEqual({ tier: '' });
  });

  it('leaves a stored skip alone when the field is still empty', () => {
    expect(changedAnswers({ tier: '' }, { tier: '' })).toEqual({});
  });
});

describe('promptView', () => {
  it('gives the browser what it needs to ask a question, and nothing for none', () => {
    expect(promptView(q('tier'))).toEqual({
      id: 'tier', ask: 'Which of our two tiers interests you?', kind: 'choice', max: 120,
      options: [{ value: 'standard', label: 'Standard' }, { value: 'signature', label: 'Signature' }, { value: 'undecided', label: 'Undecided' }],
    });
    expect(promptView(q('handicap'))).toEqual({ id: 'handicap', ask: 'What is your handicap index?', kind: 'text', options: [], max: 8, placeholder: 'e.g. 12.4' });
    expect(promptView(null)).toBeNull();
  });
});
