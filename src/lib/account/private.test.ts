import { describe, expect, it } from 'vitest';
import { PRIVATE_DATES, privateJourneyEnquiry } from './private';

const anne = { first_name: 'Anne', last_name: 'Martin', email: 'anne@example.com', phone: '+33 6 00 00 00 00' };

describe('privateJourneyEnquiry', () => {
  it('turns a profile into an enquiry for the inbox, with what the guest has told us', () => {
    const enquiry = privateJourneyEnquiry(anne, {
      golf_level: 'mid', trip_focus: 'both', party: 'friends', group_size: 'four', season: '["spring","autumn"]', tier: 'signature', wine: 'enjoy',
    });
    expect(enquiry).toMatchObject({
      name: 'Anne Martin', email: 'anne@example.com', phone: '+33 6 00 00 00 00', dates: PRIVATE_DATES, group: 'Four', tier: 'Undecided',
    });
    expect(enquiry.notes.split('\n')).toEqual([
      'Private journey request, sent from their profile.',
      'Your golf: Handicap 10 to 18',
      'What matters most: Both, in equal measure',
      'Travelling with: Friends',
      'Party size: Four',
      'Preferred season: Spring, Autumn',
    ]);
  });

  it('still makes a complete enquiry from a profile with no name and no answers', () => {
    expect(privateJourneyEnquiry({ first_name: '', last_name: '', email: 'a@b.co', phone: '' }, {})).toEqual({
      name: 'a@b.co', email: 'a@b.co', phone: '', dates: PRIVATE_DATES, group: 'To be agreed', tier: 'Undecided',
      notes: 'Private journey request, sent from their profile.',
    });
  });

  it('says who is travelling when the party size is not known, and leaves skipped answers out', () => {
    const enquiry = privateJourneyEnquiry(anne, { party: 'partner', golf_level: '' });
    expect(enquiry.group).toBe('My partner');
    expect(enquiry.notes).not.toContain('Your golf');
  });
});
