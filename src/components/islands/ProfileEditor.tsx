import { useEffect, useId, useRef, useState, type ReactNode, type SubmitEvent } from 'react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Chips } from '../ui/Chips';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { JOIN_STORAGE_KEY } from '../../lib/account/join';
import { CORE_FIELDS, CORE_LABEL, MIN_PASSWORD, completeness, type Core, type CoreField } from '../../lib/account/profile';
import { QUESTIONS, SECTIONS, isRelevant, multiValues, type Answers, type Question } from '../../lib/account/questions';
import type { Provider, PublicProfile } from '../../lib/account/store';
import { CONTACT_EMAIL } from '../../lib/site';

export interface ProfileEditorProps {
  profile: PublicProfile;
  /** Stored answers by question id */
  answers: Answers;
  /** Google / Apple sign-ins linked to the account */
  providers: Provider[];
  /** Enquiries sent from the same address; empty until the email is confirmed */
  enquiries: { received: string; dates: string; party: string; tier: string }[];
  /** First visit, straight from onboarding */
  welcome?: boolean;
  notice?: 'password' | 'confirmed';
}

type SaveState = 'saving' | 'saved' | 'error';
/** What a save sends: `core` fields as text; answers as text, or a list for several choices. */
type Patch = { core?: Partial<Core>; answers?: Record<string, string | string[]>; marketing?: boolean };

const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', apple: 'Apple' };
const AUTOCOMPLETE: Record<CoreField, string> = { first_name: 'given-name', last_name: 'family-name', phone: 'tel', country: 'country-name' };
const CORE_LENGTH: Record<CoreField, number> = { first_name: 60, last_name: 80, phone: 40, country: 60 };
/** Said once under the sections that may hold health-related details. */
const CARE_NOTE: Partial<Record<string, string>> = {
  table: 'Dietary needs and allergies are shared only with the kitchens looking after you.',
  stay: 'Access needs are shared only with the hotels and courses looking after you.',
};

const post = (path: string, body: unknown) =>
  fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** A text field that saves when the guest leaves it, if it changed. */
function TextField({ label, value, onSave, placeholder, hint, maxLength, autoComplete, type }: {
  label: string; value: string; onSave: (value: string) => void;
  placeholder?: string; hint?: string; maxLength?: number; autoComplete?: string; type?: string;
}) {
  const [text, setText] = useState(value);
  return (
    <Input label={label} value={text} placeholder={placeholder} hint={hint} maxLength={maxLength} autoComplete={autoComplete} type={type}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (text.trim() !== value) onSave(text.trim()); }} />
  );
}

/** One section of the profile, with a quiet "Saved" beside its title. */
function Section({ title, state, children, note }: { title: string; state?: SaveState; children: ReactNode; note?: string }) {
  const id = useId();
  return (
    <section className="profile__section" aria-labelledby={id}>
      <div className="profile__section-head">
        <h2 id={id} className="display-sm">{title}</h2>
        <p className="profile__state" role="status">
          {state === 'saved' && 'Saved'}
          {state === 'saving' && 'Saving…'}
          {state === 'error' && 'Could not save. Please try again.'}
        </p>
      </div>
      {children}
      {note && <p className="profile__note">{note}</p>}
    </section>
  );
}

/**
 * The guest's profile at /account. Choices save on tap and text when the field
 * loses focus, through /api/account/profile; every field is optional. Questions
 * that do not apply (a handicap for a non-golfer) are left out.
 */
export function ProfileEditor({ profile, answers: initialAnswers, providers, enquiries, welcome = false, notice }: ProfileEditorProps) {
  const [core, setCore] = useState<Core>({ first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone, country: profile.country });
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [marketing, setMarketing] = useState(profile.marketing);
  const [states, setStates] = useState<Record<string, SaveState | undefined>>({});
  const [hasPassword, setHasPassword] = useState(profile.hasPassword);
  const [password, setPassword] = useState({ current: '', next: '' });
  const [passwordError, setPasswordError] = useState<{ field: 'current' | 'next'; message: string } | null>(null);
  const [passwordState, setPasswordState] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [linkState, setLinkState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [elsewhere, setElsewhere] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [deleting, setDeleting] = useState<'closed' | 'open' | 'sending' | 'failed'>('closed');
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const passwordForm = useRef<HTMLFormElement>(null);
  /** Saves are sent one after another through this chain. */
  const queue = useRef<Promise<void>>(Promise.resolve());
  /** Per section: how many saves are still out, and whether any of this round failed. */
  const pending = useRef<Record<string, { count: number; failed: boolean }>>({});

  // The onboarding answers are on the account now; forget the copy kept in this tab.
  useEffect(() => {
    try {
      sessionStorage.removeItem(JOIN_STORAGE_KEY);
    } catch {
      // Storage is blocked: nothing was kept.
    }
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  // A refused password is made known by moving to the field that needs attention, where its message is read out.
  useEffect(() => {
    if (passwordError) passwordForm.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [passwordError]);

  const progress = completeness(core, answers);

  /**
   * Saves one change. The page shows it at once; `undo` puts the old value back
   * if the save fails, so what is on screen is never something the server does
   * not have, and trying again really sends it again.
   *
   * Saves go out one at a time, in the order they were made, so two quick
   * changes can never land in the wrong order. A section says "Saved" only
   * once all of its saves are back and none of them failed.
   */
  const save = (section: string, patch: Patch, undo: () => void) => {
    const round = (pending.current[section] ??= { count: 0, failed: false });
    if (round.count === 0) round.failed = false;
    round.count += 1;
    clearTimeout(timers.current[section]);
    setStates((s) => ({ ...s, [section]: 'saving' }));

    queue.current = queue.current.then(async () => {
      let ok = false;
      try {
        const res = await post('/api/account/profile', patch);
        if (res.status === 401) {
          window.location.assign('/sign-in?next=%2Faccount');
          return;
        }
        ok = res.ok;
      } catch {
        ok = false; // offline, or the request never arrived
      }
      if (!ok) {
        round.failed = true;
        undo();
      }
      round.count -= 1;
      if (round.count > 0) return;
      setStates((s) => ({ ...s, [section]: round.failed ? 'error' : 'saved' }));
      if (!round.failed) timers.current[section] = setTimeout(() => setStates((s) => ({ ...s, [section]: undefined })), 2500);
    });
  };

  const saveCore = (field: CoreField, value: string) => {
    const before = core[field];
    setCore((c) => ({ ...c, [field]: value }));
    // Put back only if nothing newer has replaced it in the meantime.
    save('about', { core: { [field]: value } }, () => setCore((c) => (c[field] === value ? { ...c, [field]: before } : c)));
  };

  const saveAnswer = (q: Question, value: string | string[]) => {
    // Kept here in the stored form: text as is, several choices as a JSON list.
    const stored = Array.isArray(value) ? (value.length ? JSON.stringify((q.options ?? []).map((o) => o.value).filter((v) => value.includes(v))) : '') : value;
    const before = answers[q.id];
    setAnswers((a) => ({ ...a, [q.id]: stored }));
    save(q.section, { answers: { [q.id]: value } }, () =>
      setAnswers((a) => {
        if (a[q.id] !== stored) return a;
        const { [q.id]: _failed, ...rest } = a;
        return before === undefined ? rest : { ...rest, [q.id]: before };
      }),
    );
  };

  const saveMarketing = (on: boolean) => {
    setMarketing(on);
    save('touch', { marketing: on }, () => setMarketing((now) => (now === on ? !on : now)));
  };

  const changePassword = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwordState === 'sending') return;
    setPasswordError(null);
    setPasswordState('sending');
    try {
      const res = await post('/api/account/password', password);
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; field?: 'current' | 'next'; message?: string };
      if (res.ok && body.ok) {
        setHasPassword(true);
        setPassword({ current: '', next: '' });
        setPasswordState('done');
      } else if (res.status === 422 && body.field && body.message) {
        setPasswordError({ field: body.field, message: body.message });
        setPasswordState('idle');
      } else {
        setPasswordState('failed');
      }
    } catch {
      setPasswordState('failed');
    }
  };

  const sendLink = async () => {
    if (linkState === 'sending') return;
    setLinkState('sending');
    try {
      const res = await post('/api/account/confirmation', {});
      setLinkState(res.ok ? 'sent' : 'failed');
    } catch {
      setLinkState('failed');
    }
  };

  const signOutElsewhere = async () => {
    setElsewhere('sending');
    try {
      const res = await post('/api/account/sessions', {});
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; signedOut?: boolean };
      if (!res.ok || !body.ok) throw new Error(String(res.status));
      if (body.signedOut) window.location.assign('/sign-in?notice=out');
      else setElsewhere('done');
    } catch {
      setElsewhere('failed');
    }
  };

  const deleteProfile = async () => {
    setDeleting('sending');
    try {
      const res = await post('/api/account/delete', { confirm: 'DELETE' });
      if (!res.ok) throw new Error(String(res.status));
      window.location.assign('/sign-in?notice=deleted');
    } catch {
      // Show the failure only if the dialog is still open: a guest who closed it meanwhile is not shown it again.
      setDeleting((now) => (now === 'sending' ? 'failed' : now));
    }
  };

  const methods = [...(hasPassword ? ['your email and a password'] : []), ...providers.map((p) => PROVIDER_NAME[p])];

  return (
    <div className="profile">
      {welcome && (
        <p className="profile__notice" role="status">
          Your profile is ready. Everything below is optional: add what you like, whenever you like.
        </p>
      )}
      {notice === 'confirmed' && <p className="profile__notice" role="status">Thank you. Your email address is confirmed.</p>}
      {notice === 'password' && <p className="profile__notice" role="status">Your new password is set, and you are signed in.</p>}

      <div className="profile__progress">
        <p className="label label--11">{`Your profile · ${progress.done} of ${progress.total} details`}</p>
        <div className="profile__bar" aria-hidden="true"><span style={{ width: `${progress.percent}%` }} /></div>
      </div>

      <Section title="About you" state={states.about}>
        <div className="profile__grid">
          {CORE_FIELDS.map((field) => (
            <TextField key={field} label={CORE_LABEL[field]} value={core[field]} autoComplete={AUTOCOMPLETE[field]}
              type={field === 'phone' ? 'tel' : 'text'} maxLength={CORE_LENGTH[field]}
              hint={field === 'phone' ? 'Including the country code.' : undefined}
              onSave={(value) => saveCore(field, value)} />
          ))}
        </div>
        <div className="profile__email">
          <span className="fa-field__label">Email</span>
          <span className="profile__email-value">{profile.email}</span>
          {profile.emailVerified ? (
            <span className="profile__tag">Confirmed</span>
          ) : (
            <span className="profile__email-action">
              Not confirmed yet.{' '}
              {/* The button stays where it is, so keyboard focus is never lost; the line beside it says what happened. */}
              <button type="button" className="profile__link" onClick={sendLink} aria-disabled={linkState === 'sending' || undefined}>
                {linkState === 'sent' ? 'Send it again' : 'Send me the link'}
              </button>{' '}
              <span role="status">
                {linkState === 'sending' && 'Sending…'}
                {linkState === 'sent' && 'Sent. Please check your inbox.'}
                {linkState === 'failed' && 'We could not send it just now. Please try again later.'}
              </span>
            </span>
          )}
        </div>
        <p className="profile__note">
          To change your email address, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Section>

      {SECTIONS.map((section) => {
        const questions = QUESTIONS.filter((q) => q.section === section.id && isRelevant(q, answers));
        return (
          <Section key={section.id} title={section.title} state={states[section.id]} note={CARE_NOTE[section.id]}>
            <div className="profile__questions">
              {questions.map((q) =>
                q.kind === 'text' ? (
                  <TextField key={q.id} label={q.label} value={answers[q.id] ?? ''} placeholder={q.placeholder} maxLength={q.max ?? 120}
                    onSave={(value) => saveAnswer(q, value)} />
                ) : (
                  <div key={q.id} className="profile__q">
                    <div id={`q-${q.id}`} className="fa-field__label">{q.label}</div>
                    <Chips labelledBy={`q-${q.id}`} options={q.options ?? []} multiple={q.kind === 'multi'}
                      value={q.kind === 'multi' ? multiValues(answers[q.id] ?? '') : answers[q.id] ? [answers[q.id]] : []}
                      onChange={(chosen) => saveAnswer(q, q.kind === 'multi' ? chosen : (chosen[0] ?? ''))} />
                  </div>
                ),
              )}
              {section.id === 'touch' && (
                <Checkbox label="Send me the journal and newly opened weeks by email" checked={marketing}
                  onChange={saveMarketing} />
              )}
            </div>
          </Section>
        );
      })}

      <Section title="Your enquiries">
        {enquiries.length > 0 ? (
          <ul className="profile__enquiries">
            {enquiries.map((e, i) => (
              <li key={i}>
                <span className="profile__enquiry-dates">{e.dates}</span>
                <span>{`${e.party} · ${e.tier} · sent ${e.received}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile__text">
            {profile.emailVerified
              ? 'You have not sent us an enquiry from this address yet.'
              : 'Once your email address is confirmed, the enquiries you have sent us from it appear here.'}
          </p>
        )}
        <p className="profile__actions"><Button href="/enquire" size="sm">Enquire about a week</Button></p>
      </Section>

      <Section title="Signing in">
        <p className="profile__text">{`You sign in with ${methods.join(' or ') || 'your email'}.`}</p>
        <details className="profile__details">
          <summary>{hasPassword ? 'Change your password' : 'Add a password'}</summary>
          <form ref={passwordForm} className="profile__password" noValidate onSubmit={changePassword}>
            {hasPassword && (
              <Input label="Current password" type="password" autoComplete="current-password" value={password.current}
                onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                error={passwordError?.field === 'current' ? passwordError.message : undefined} />
            )}
            <Input label="New password" type="password" autoComplete="new-password" value={password.next}
              onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
              hint={`At least ${profile.isAdmin ? 12 : MIN_PASSWORD} characters. Other devices will be signed out.`}
              error={passwordError?.field === 'next' ? passwordError.message : undefined} />
            <div className="profile__actions">
              <Button type="submit" size="sm" busy={passwordState === 'sending'}>Save password</Button>
              <span role="status" className="profile__state">
                {passwordState === 'done' && 'Your password is saved.'}
                {passwordState === 'failed' && 'Could not save. Please try again in a minute.'}
              </span>
            </div>
          </form>
        </details>
        <div className="profile__actions">
          <form method="post" action="/sign-out"><Button type="submit" variant="secondary" size="sm">Sign out</Button></form>
          <button type="button" className="profile__link" onClick={signOutElsewhere} disabled={elsewhere === 'sending'}>
            Sign out on my other devices
          </button>
          <span role="status" className="profile__state">
            {elsewhere === 'done' && 'Done. Only this device is signed in.'}
            {elsewhere === 'failed' && 'That did not work. Please try again.'}
          </span>
        </div>
        {profile.isAdmin && <p className="profile__actions"><a className="profile__link" href="/admin">Open the admin</a></p>}
      </Section>

      <Section title="Your data">
        <p className="profile__text">
          You can take a copy of everything in your profile, or remove it altogether. Our <a href="/privacy">privacy policy</a> explains how
          we look after it.
        </p>
        <div className="profile__actions">
          <a className="profile__link" href="/account/export">Download my data</a>
          {!profile.isAdmin && (
            <button type="button" className="profile__link profile__link--danger" onClick={() => setDeleting('open')}>Delete my profile</button>
          )}
        </div>
      </Section>

      <Dialog open={deleting !== 'closed'} onClose={() => setDeleting('closed')} eyebrow="Your data" title="Delete your profile?"
        actions={
          <>
            <Button onClick={() => setDeleting('closed')} disabled={deleting === 'sending'}>Keep my profile</Button>
            <Button variant="secondary" onClick={deleteProfile} busy={deleting === 'sending'}>Delete it</Button>
          </>
        }>
        Your profile and everything in it will be removed straight away, and this cannot be undone. Enquiries you have already sent us are
        kept as our privacy policy describes; write to {CONTACT_EMAIL} if you would like those erased too.
        <span role="alert" className="profile__dialog-error">{deleting === 'failed' ? 'We could not delete it just now. Please try again.' : ''}</span>
      </Dialog>
    </div>
  );
}
