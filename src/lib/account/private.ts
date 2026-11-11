/**
 * A private-journey request made from a profile (the flow set into /private).
 * There, creating the profile is the enquiry, and a guest who already has one
 * asks with a single tap. Either way it reaches the team's inbox like any
 * other enquiry, with what the guest has told us so far.
 */
import type { EnquiryFields } from '../enquiry/validate';
import { displayName } from './profile';
import { ONBOARDING, answerLabel, questionById, type Answers } from './questions';

/** Shown as the enquiry's dates: for a private journey they are agreed in conversation, not picked from the opened weeks. */
export const PRIVATE_DATES = 'Private journey: dates to be agreed';

/** The answers worth putting in front of the team with the request, in this order. */
const TOLD = [...ONBOARDING.map((q) => q.id), 'group_size', 'season', 'occasion'];

export function privateJourneyEnquiry(
  account: { first_name: string; last_name: string; email: string; phone: string },
  answers: Answers,
): EnquiryFields {
  const said = (id: string) => {
    const question = questionById(id);
    return question && answers[id] ? answerLabel(question, answers[id]) : '';
  };
  const lines = TOLD.flatMap((id) => (said(id) ? [`${questionById(id)!.label}: ${said(id)}`] : []));
  return {
    name: displayName(account),
    email: account.email,
    phone: account.phone,
    dates: PRIVATE_DATES,
    group: said('group_size') || said('party') || 'To be agreed',
    tier: 'Undecided',
    notes: ['Private journey request, sent from their profile.', ...lines].join('\n').slice(0, 2000),
  };
}
