import { describe, expect, it } from 'vitest';
import { FLEXIBLE, GROUPS, MESSAGES, normaliseEnquiry, validateEnquiry, type EnquiryFields } from './validate';

const DATES = ['12–19 May', FLEXIBLE];

const valid: EnquiryFields = {
  name: 'Anne Le Goff',
  email: 'anne@example.com',
  phone: '',
  dates: '12–19 May',
  group: GROUPS[0],
  tier: 'Signature',
  notes: '',
};

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    expect(validateEnquiry(valid, DATES)).toEqual({});
  });

  it('accepts "Flexible" dates and the "Undecided" tier', () => {
    expect(validateEnquiry({ ...valid, dates: FLEXIBLE, tier: 'Undecided' }, DATES)).toEqual({});
  });

  it('reports every missing required field', () => {
    const empty = { name: ' ', email: '', phone: '', dates: '', group: '', tier: '', notes: '' } as unknown as EnquiryFields;
    expect(validateEnquiry(empty, DATES)).toEqual({
      name: MESSAGES.name,
      email: MESSAGES.emailEmpty,
      dates: MESSAGES.dates,
      group: MESSAGES.group,
      tier: 'Please choose a tier.',
    });
  });

  it.each(['anne', 'anne@', 'anne@example', 'an ne@example.com'])('rejects the malformed email %s', (email) => {
    expect(validateEnquiry({ ...valid, email }, DATES)).toEqual({ email: MESSAGES.emailInvalid });
  });

  it('rejects dates that are not on offer, such as a sold-out week', () => {
    expect(validateEnquiry({ ...valid, dates: '1–8 June' }, DATES)).toEqual({ dates: MESSAGES.dates });
  });

  it('rejects a group or tier outside the allowed lists', () => {
    const errs = validateEnquiry({ ...valid, group: 'Twelve travellers', tier: 'Platinum' as EnquiryFields['tier'] }, DATES);
    expect(errs).toEqual({ group: MESSAGES.group, tier: 'Please choose a tier.' });
  });
});

describe('normaliseEnquiry', () => {
  it('trims strings and blanks out non-string values', () => {
    const f = normaliseEnquiry({ name: '  Anne  ', email: 42, phone: null, notes: ['x'] });
    expect(f).toEqual({ name: 'Anne', email: '', phone: '', dates: '', group: '', tier: '', notes: '' });
  });

  it('caps field lengths', () => {
    const f = normaliseEnquiry({ name: 'a'.repeat(500), phone: '1'.repeat(100), notes: 'n'.repeat(5000) });
    expect(f.name).toHaveLength(120);
    expect(f.phone).toHaveLength(40);
    expect(f.notes).toHaveLength(2000);
  });
});
