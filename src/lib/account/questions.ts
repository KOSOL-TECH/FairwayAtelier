/**
 * The questions a guest profile is built from: asked during onboarding (/join),
 * later across the site (ProfilePrompt), on the profile (/account) and on the
 * customer sheet in the admin. Shared by the browser and the Worker.
 *
 * Answers are stored in D1 `account_answers` by question id, so a new question
 * needs no migration. Never rename an id once it is live.
 */
export const SECTIONS = [
  { id: 'golf', title: 'Your golf' },
  { id: 'journey', title: 'Your journey' },
  { id: 'table', title: 'At the table' },
  { id: 'stay', title: 'Your stay' },
  { id: 'touch', title: 'Staying in touch' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** choice: one option · multi: several options · text: one line of free text */
export type QuestionKind = 'choice' | 'multi' | 'text';

export interface Option {
  value: string;
  label: string;
}

export interface Question {
  /** Stored in account_answers.question */
  id: string;
  section: SectionId;
  kind: QuestionKind;
  /** Field label on the profile and the customer sheet */
  label: string;
  /** How the question is put to the guest in onboarding and later questions */
  ask: string;
  options?: readonly Option[];
  /** text: the longest answer kept (default 120) */
  max?: number;
  placeholder?: string;
  /** Onboarding frame that asks it (1 to 4) */
  frame?: 1 | 2 | 3 | 4;
  /** Order among later questions (lowest first); without it the question lives on the profile only */
  prompt?: number;
  /** Does not apply when another answer has one of these values, e.g. a handicap for a non-golfer */
  unless?: { question: string; is: readonly string[] };
}

/** Stored answers by question id. '' means cleared or skipped; a multi answer is a JSON list of option values. */
export type Answers = Record<string, string>;

const NOT_PLAYING = { question: 'golf_level', is: ['non_golfer'] } as const;

export const QUESTIONS: readonly Question[] = [
  // ---- Your golf ----
  {
    id: 'golf_level', section: 'golf', kind: 'choice', frame: 1, prompt: 1,
    label: 'Your golf', ask: 'How would you describe your golf?',
    options: [
      { value: 'low', label: 'Single-figure handicap' },
      { value: 'mid', label: 'Handicap 10 to 18' },
      { value: 'high', label: 'Handicap 19 or above' },
      { value: 'social', label: 'I play for pleasure, no handicap' },
      { value: 'non_golfer', label: 'I don’t play; I travel with a golfer' },
    ],
  },
  {
    id: 'handicap', section: 'golf', kind: 'text', max: 8, prompt: 8, placeholder: 'e.g. 12.4',
    label: 'Handicap index', ask: 'What is your handicap index?',
    unless: { question: 'golf_level', is: ['social', 'non_golfer'] },
  },
  {
    id: 'home_club', section: 'golf', kind: 'text', prompt: 9,
    label: 'Home club', ask: 'Which is your home club?', unless: NOT_PLAYING,
  },
  {
    id: 'rounds', section: 'golf', kind: 'choice',
    label: 'How often you play', ask: 'How often do you play?', unless: NOT_PLAYING,
    options: [
      { value: 'weekly', label: 'Most weeks' },
      { value: 'monthly', label: 'A few times a month' },
      { value: 'occasional', label: 'A few times a year' },
    ],
  },
  {
    id: 'pro_time', section: 'golf', kind: 'choice', prompt: 11,
    label: 'Time with the pro', ask: 'Your dedicated pro is with you all week. How much coaching would you like?', unless: NOT_PLAYING,
    options: [
      { value: 'lots', label: 'As much as possible' },
      { value: 'some', label: 'A few pointers' },
      { value: 'none', label: 'Just the golf, thank you' },
    ],
  },
  {
    id: 'clubs', section: 'golf', kind: 'choice', prompt: 10,
    label: 'Clubs', ask: 'Will you bring your own clubs?', unless: NOT_PLAYING,
    options: [
      { value: 'own', label: 'I travel with my own' },
      { value: 'hire', label: 'I would rather hire a premium set' },
    ],
  },
  {
    id: 'hand', section: 'golf', kind: 'choice',
    label: 'Playing hand', ask: 'Do you play right- or left-handed?', unless: NOT_PLAYING,
    options: [
      { value: 'right', label: 'Right-handed' },
      { value: 'left', label: 'Left-handed' },
    ],
  },
  {
    id: 'buggy', section: 'golf', kind: 'choice',
    label: 'On the course', ask: 'Do you walk the course or take a buggy?', unless: NOT_PLAYING,
    options: [
      { value: 'walk', label: 'I walk' },
      { value: 'buggy', label: 'A buggy, please' },
      { value: 'either', label: 'Either' },
    ],
  },

  // ---- Your journey ----
  {
    id: 'trip_focus', section: 'journey', kind: 'choice', frame: 2, prompt: 2,
    label: 'What matters most', ask: 'What matters most in a week away?',
    options: [
      { value: 'golf', label: 'The golf, above all' },
      { value: 'table', label: 'The table: food and wine' },
      { value: 'both', label: 'Both, in equal measure' },
      { value: 'ease', label: 'Not lifting a finger' },
    ],
  },
  {
    id: 'party', section: 'journey', kind: 'choice', frame: 3, prompt: 3,
    label: 'Travelling with', ask: 'Who would you travel with?',
    options: [
      { value: 'partner', label: 'My partner' },
      { value: 'friends', label: 'Friends' },
      { value: 'family', label: 'Family' },
      { value: 'clients', label: 'Clients or colleagues' },
      { value: 'unsure', label: 'Not sure yet' },
    ],
  },
  {
    id: 'group_size', section: 'journey', kind: 'choice', prompt: 5,
    label: 'Party size', ask: 'How many of you would travel?',
    options: [
      { value: 'two', label: 'Two' },
      { value: 'four', label: 'Four' },
      { value: 'larger', label: 'Five to eight' },
    ],
  },
  {
    id: 'season', section: 'journey', kind: 'multi', prompt: 4,
    label: 'Preferred season', ask: 'When do you like to travel?',
    options: [
      { value: 'spring', label: 'Spring' },
      { value: 'summer', label: 'Summer' },
      { value: 'autumn', label: 'Autumn' },
      { value: 'flexible', label: 'I am flexible' },
    ],
  },
  {
    id: 'tier', section: 'journey', kind: 'choice', prompt: 6,
    label: 'Tier', ask: 'Which of our two tiers interests you?',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'signature', label: 'Signature' },
      { value: 'undecided', label: 'Undecided' },
    ],
  },
  {
    id: 'occasion', section: 'journey', kind: 'choice', prompt: 7,
    label: 'Occasion', ask: 'Is there an occasion to mark?',
    options: [
      { value: 'birthday', label: 'A birthday' },
      { value: 'anniversary', label: 'An anniversary' },
      { value: 'retirement', label: 'A retirement' },
      { value: 'company', label: 'A company trip' },
      { value: 'none', label: 'No occasion, just the week' },
    ],
  },
  {
    id: 'non_golfers', section: 'journey', kind: 'choice',
    label: 'Non-golfers in the party', ask: 'Will anyone in your party not play?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'departure', section: 'journey', kind: 'text', max: 80, placeholder: 'City or airport',
    label: 'Travelling from', ask: 'Where would you travel from?',
  },

  // ---- At the table ----
  {
    id: 'dietary', section: 'table', kind: 'multi',
    label: 'Dietary requirements', ask: 'Any dietary requirements?',
    options: [
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'pescatarian', label: 'Pescatarian' },
      { value: 'gluten_free', label: 'Gluten-free' },
      { value: 'dairy_free', label: 'Dairy-free' },
      { value: 'no_shellfish', label: 'No shellfish' },
      { value: 'no_pork', label: 'No pork' },
    ],
  },
  {
    id: 'allergies', section: 'table', kind: 'text', max: 200,
    label: 'Allergies', ask: 'Any allergies we should know about?',
  },
  {
    id: 'wine', section: 'table', kind: 'choice', prompt: 12,
    label: 'Wine', ask: 'And wine?',
    options: [
      { value: 'enthusiast', label: 'A real interest' },
      { value: 'enjoy', label: 'I enjoy a good glass' },
      { value: 'none', label: 'I don’t drink' },
    ],
  },
  {
    id: 'food_notes', section: 'table', kind: 'text', max: 300, placeholder: 'Favourite dishes, things to avoid',
    label: 'Anything else about food and wine', ask: 'Anything else we should know about food and wine?',
  },

  // ---- Your stay ----
  {
    id: 'bed', section: 'stay', kind: 'choice',
    label: 'Bed', ask: 'How do you like your room made up?',
    options: [
      { value: 'double', label: 'One large bed' },
      { value: 'twin', label: 'Two beds' },
    ],
  },
  {
    id: 'room_notes', section: 'stay', kind: 'text', max: 300, placeholder: 'A sea view, a quiet floor',
    label: 'Room preferences', ask: 'What makes a room feel right?',
  },
  {
    id: 'mobility', section: 'stay', kind: 'text', max: 300,
    label: 'Mobility or access needs', ask: 'Any mobility or access needs?',
  },

  // ---- Staying in touch ----
  {
    id: 'contact_method', section: 'touch', kind: 'choice', prompt: 13,
    label: 'Best way to reach you', ask: 'How should we reach you?',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
      { value: 'whatsapp', label: 'WhatsApp' },
    ],
  },
  {
    id: 'heard_from', section: 'touch', kind: 'choice', frame: 4, prompt: 14,
    label: 'How you heard about us', ask: 'How did you hear about us?',
    options: [
      { value: 'friend', label: 'A friend or family' },
      { value: 'club', label: 'My golf club' },
      { value: 'social', label: 'Instagram or social media' },
      { value: 'search', label: 'A search engine' },
      { value: 'press', label: 'Press or a journal' },
      { value: 'other', label: 'Somewhere else' },
    ],
  },
  {
    id: 'heard_detail', section: 'touch', kind: 'text',
    label: 'Who or what pointed you our way', ask: 'Who or what pointed you our way?',
  },
];

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export const questionById = (id: string): Question | undefined => BY_ID.get(id);

/** The four onboarding questions, in frame order. */
export const ONBOARDING: readonly Question[] = QUESTIONS.filter((q) => q.frame !== undefined).sort((a, b) => a.frame! - b.frame!);

const DEFAULT_MAX = 120;

/** One line of text: control characters removed, whitespace collapsed, capped. */
export function tidy(text: string, max: number): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max).trim();
}

/** @returns the value to store, or null when the raw value is not acceptable for this question. */
function normaliseAnswer(q: Question, raw: unknown): string | null {
  const values = (q.options ?? []).map((o) => o.value);
  if (q.kind === 'multi') {
    if (!Array.isArray(raw)) return null;
    const chosen = values.filter((v) => raw.includes(v));
    return chosen.length ? JSON.stringify(chosen) : '';
  }
  if (typeof raw !== 'string') return null;
  if (q.kind === 'choice') return raw === '' || values.includes(raw) ? raw : null;
  return tidy(raw, q.max ?? DEFAULT_MAX);
}

/**
 * Turns an untrusted `{ questionId: value }` payload into storable answers.
 * Unknown questions, unknown options and values of the wrong type are dropped.
 */
export function normaliseAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const q of QUESTIONS) {
    if (!Object.hasOwn(raw, q.id)) continue;
    const value = normaliseAnswer(q, (raw as Record<string, unknown>)[q.id]);
    if (value !== null) out[q.id] = value;
  }
  return out;
}

/** The option values of a stored multi answer. */
export function multiValues(stored: string): string[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** A stored answer as the team and the guest read it. */
export function answerLabel(q: Question, stored: string): string {
  if (!stored) return '';
  const label = (value: string) => q.options?.find((o) => o.value === value)?.label ?? value;
  if (q.kind === 'multi') return multiValues(stored).map(label).join(', ');
  return q.kind === 'choice' ? label(stored) : stored;
}

/** False when another answer makes this question pointless to ask. */
export function isRelevant(q: Question, answers: Answers): boolean {
  return !q.unless || !q.unless.is.includes(answers[q.unless.question] ?? '');
}

/**
 * The next later question for this guest, or null when there is none left.
 * A question with any stored row, answered or skipped (''), is not asked again.
 */
export function nextPrompt(answers: Answers): Question | null {
  const open = QUESTIONS.filter((q) => q.prompt !== undefined && !Object.hasOwn(answers, q.id) && isRelevant(q, answers));
  open.sort((a, b) => a.prompt! - b.prompt!);
  return open[0] ?? null;
}

/**
 * The submitted answers that differ from what is stored. A form that shows
 * every question sends '' for the ones left empty; without this, saving it
 * would mark each of them as skipped and they would never be asked again.
 */
export function changedAnswers(stored: Answers, submitted: Answers): Answers {
  return Object.fromEntries(Object.entries(submitted).filter(([id, value]) => value !== (stored[id] ?? '')));
}

/** A question as sent to the browser for a later-question card. */
export interface PromptView {
  id: string;
  ask: string;
  kind: QuestionKind;
  options: readonly Option[];
  max: number;
  placeholder?: string;
}

export function promptView(q: Question | null): PromptView | null {
  if (!q) return null;
  return { id: q.id, ask: q.ask, kind: q.kind, options: q.options ?? [], max: q.max ?? DEFAULT_MAX, ...(q.placeholder && { placeholder: q.placeholder }) };
}
