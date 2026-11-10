/**
 * The onboarding flow at /join as a small state machine, kept apart from the
 * JoinFlow island so its rules can be tested: four question frames, one tap
 * each and always skippable, then the account frame.
 */
import { ONBOARDING, normaliseAnswers, type Answers } from './questions';

/** Four questions plus the account frame: the client's ceiling of five. */
export const FRAMES = ONBOARDING.length + 1;
const LAST = FRAMES - 1;

export interface JoinState {
  /** 0-based frame on screen; the last one is the account frame */
  step: number;
  /** Answers given so far, by question id */
  answers: Answers;
}

export const INITIAL: JoinState = { step: 0, answers: {} };

export type JoinAction =
  | { type: 'answer'; question: string; value: string }
  | { type: 'skip' }
  | { type: 'back' }
  /** Picks the flow back up from sessionStorage after the page has loaded */
  | { type: 'restore'; state: JoinState };

export function joinReducer(state: JoinState, action: JoinAction): JoinState {
  const question = ONBOARDING[state.step];
  switch (action.type) {
    case 'answer':
      // Only the question on screen can be answered; the account frame has none.
      if (!question || action.question !== question.id) return state;
      return { step: state.step + 1, answers: { ...state.answers, [question.id]: action.value } };
    case 'skip': {
      if (!question) return state;
      const { [question.id]: _skipped, ...answers } = state.answers;
      return { step: state.step + 1, answers };
    }
    case 'back':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'restore':
      return action.state;
  }
}

/** Key in sessionStorage: the flow survives a reload or "Not now" within the same tab, and no longer. */
export const JOIN_STORAGE_KEY = 'fa_join';

/** Reads a saved flow back, keeping only what is still valid. */
export function restoreJoin(saved: string | null): JoinState {
  try {
    const data = JSON.parse(saved ?? '') as { step?: unknown; answers?: unknown };
    if (!data || typeof data !== 'object' || !Number.isInteger(data.step)) return INITIAL;
    const step = data.step as number;
    if (step < 0 || step > LAST) return INITIAL;
    const valid = normaliseAnswers(data.answers);
    const answers = Object.fromEntries(ONBOARDING.filter((q) => valid[q.id]).map((q) => [q.id, valid[q.id]]));
    return { step, answers };
  } catch {
    return INITIAL;
  }
}
