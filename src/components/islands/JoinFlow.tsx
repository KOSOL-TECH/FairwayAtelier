import { useEffect, useReducer, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { ProviderButton } from '../ui/ProviderButton';
import { cx } from '../ui/cx';
import { FRAMES, INITIAL, JOIN_STORAGE_KEY, joinReducer, restoreJoin, type JoinAction } from '../../lib/account/join';
import { MIN_PASSWORD, normaliseEmail } from '../../lib/account/profile';
import { ONBOARDING } from '../../lib/account/questions';
import type { Provider } from '../../lib/account/store';
import { CONTACT_EMAIL } from '../../lib/site';

export interface JoinFlowProps {
  /** Quick sign-ins that are set up (docs/accounts.md); none shows the email form alone */
  providers: Provider[];
  /**
   * 'private': set into the Private Journeys page, where creating the profile is the enquiry. The team is
   * told at once, and a guest who is already signed in sends the request with one tap.
   */
  variant?: 'page' | 'private';
}

/** What each frame is about, shown beside "Step n of 5". */
const FRAME_LABELS = ['Your golf', 'Your week', 'Your party', 'One last thing', 'Your profile'];

type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'exists' | 'claim' | 'limited' | 'failed';

const EMPTY: Record<Field, string> = { name: '', email: '', password: '' };

/**
 * Onboarding at /join: four questions, one tap each and always skippable, then
 * the account (Google, Apple, or a name, an email and a password). The rules of
 * the flow live in src/lib/account/join.ts. Nothing is stored until the account
 * is created; until then the answers stay in this tab.
 */
export function JoinFlow({ providers, variant = 'page' }: JoinFlowProps) {
  // Set into a page that has its own title, the questions sit a level below it.
  const Ask = variant === 'private' ? 'h3' : 'h1';
  // On the Private Journeys page a signed-in guest already has a profile: they are shown one button, not the questions.
  const [member, setMember] = useState<{ name: string; state: 'idle' | 'sending' | 'sent' | 'failed' } | null>(null);
  const [state, dispatch] = useReducer(joinReducer, INITIAL);
  const [restored, setRestored] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [leaving, setLeaving] = useState<Provider | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const moved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The page is cached and the same for everyone, so whether the visitor is signed in is found out after it loads.
  useEffect(() => {
    if (variant !== 'private' || !document.documentElement.classList.contains('signed-in')) return;
    let cancelled = false;
    fetch('/api/account/me')
      .then((res) => (res.ok ? (res.json() as Promise<{ ok?: boolean; name?: string }>) : null))
      .then((me) => {
        if (!cancelled && me?.ok) setMember({ name: (me.name ?? '').split(' ')[0], state: 'idle' });
      })
      .catch(() => {}); // not signed in after all: the questions stay
    return () => { cancelled = true; };
  }, [variant]);

  const requestPrivate = async () => {
    if (!member || member.state === 'sending' || member.state === 'sent') return;
    setMember({ ...member, state: 'sending' });
    try {
      const res = await fetch('/api/account/private', { method: 'POST' });
      setMember({ ...member, state: res.ok ? 'sent' : 'failed' });
    } catch {
      setMember({ ...member, state: 'failed' });
    }
  };

  // Pick the flow back up after a reload or "Not now" in this tab.
  useEffect(() => {
    try {
      dispatch({ type: 'restore', state: restoreJoin(sessionStorage.getItem(JOIN_STORAGE_KEY)) });
    } catch {
      // Storage is blocked: the flow simply starts at the first frame.
    }
    setRestored(true);
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(JOIN_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Nothing to do: the answers are still in memory.
    }
  }, [restored, state]);

  // Each frame is a new question: move focus to it so it is announced, but not on first load.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [state.step]);

  // After a failed attempt, move focus to the first field that needs attention.
  useEffect(() => {
    if (attempt > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  // The "Check your inbox" frame replaces the form without a step change: move focus to its heading too.
  useEffect(() => {
    if (status === 'claim') heading.current?.focus();
  }, [status]);

  // Back from Google, Apple or the new profile with the page restored as it was left: make the buttons usable again.
  useEffect(() => {
    const restore = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setLeaving(null);
      setStatus((now) => (now === 'sending' ? 'idle' : now));
    };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  const go = (action: JoinAction) => {
    if (status === 'sending') return;
    // A choice still waiting to move on, and a message about the last attempt, belong to the frame being left.
    clearTimeout(timer.current);
    setPicked(null);
    if (status !== 'idle' && status !== 'claim') setStatus('idle');
    moved.current = true;
    dispatch(action);
  };

  const question = ONBOARDING[state.step];

  /** Shows the choice for a moment, then moves on by itself. */
  const choose = (value: string) => {
    if (!question || picked !== null) return;
    setPicked(value);
    timer.current = setTimeout(() => {
      setPicked(null);
      go({ type: 'answer', question: question.id, value });
    }, 180);
  };

  const set = (field: Field) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const clearSaved = () => {
    try {
      sessionStorage.removeItem(JOIN_STORAGE_KEY);
    } catch {
      // Storage is blocked: nothing was saved.
    }
  };

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    // The same rules as the server (src/lib/account/auth.ts), checked here first to save a round trip.
    const problems: Errors = {};
    if (!form.name.trim()) problems.name = 'Please tell us your name.';
    if (!normaliseEmail(form.email)) problems.email = 'Please check this email address.';
    if (form.password.length < MIN_PASSWORD) problems.password = `Please use at least ${MIN_PASSWORD} characters.`;
    if (Object.keys(problems).length) {
      setErrors(problems);
      setAttempt((n) => n + 1);
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, answers: state.answers, marketing, company: honeypot.current?.value ?? '',
          ...(variant === 'private' && { interest: 'private' }),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; next?: string; claim?: boolean; errors?: Errors };
      if (res.ok && body.ok) {
        clearSaved();
        if (body.claim) setStatus('claim');
        else window.location.assign(body.next ?? '/account'); // stays "Creating…" until the profile opens
      } else if (res.status === 422 && body.errors) {
        setErrors(body.errors);
        setAttempt((n) => n + 1);
        setStatus('idle');
      } else {
        setStatus(res.status === 409 ? 'exists' : res.status === 429 ? 'limited' : 'failed');
      }
    } catch {
      setStatus('failed'); // network failure: what was typed is kept for another try
    }
  };

  /** Google or Apple: the answers go with the request and come back with the account. */
  const continueWith = async (provider: Provider) => {
    if (leaving) return;
    setLeaving(provider);
    try {
      const res = await fetch(`/auth/${provider}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.answers, marketing }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string };
      if (res.ok && body.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
    } catch {
      // fall through to the message below
    }
    setLeaving(null);
    setStatus('failed');
  };

  if (member) {
    return (
      <div className="join-wrap">
        <div className="frame auth__card join">
          <div className="frame__inner auth__inner">
            <p className="label label--11">Your profile</p>
            <Ask className="display-md join__ask">{member.name ? `Shall we begin, ${member.name}?` : 'Shall we begin?'}</Ask>
            <p className="join__intro">
              We have your preferences to hand. Tell us you would like a private journey and our France-based team will reply within 24 hours.
            </p>
            <div className="join__member">
              <Button size="lg" onClick={requestPrivate}>Request a private journey</Button>
              <p role="status" className="join__intro">
                {member.state === 'sending' && 'Sending…'}
                {member.state === 'sent' && 'Thank you. Your request is with our team.'}
              </p>
              <p role="alert" className="enquiry__alert">
                {member.state === 'failed' ? `We could not send it. Please try again, or write to ${CONTACT_EMAIL}.` : ''}
              </p>
            </div>
            <p className="auth__links"><a href="/account">Review your profile</a></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="join-wrap">
    <div className="frame auth__card join">
      <div className="frame__inner auth__inner">
        <div className="join__progress">
          <p className="label label--11">{`Step ${state.step + 1} of ${FRAMES} · ${FRAME_LABELS[state.step]}`}</p>
          <div className="join__dots" aria-hidden="true">
            {FRAME_LABELS.map((label, i) => <span key={label} className={cx('join__dot', i <= state.step && 'join__dot--on')} />)}
          </div>
        </div>

        {question ? (
          <div key={question.id} className="join__frame">
            <Ask ref={heading} tabIndex={-1} id="join-ask" className="display-md join__ask">{question.ask}</Ask>
            {state.step === 0 && (
              <p className="join__intro">Four quick questions, then your profile. It takes under a minute, and you can skip any of them.</p>
            )}
            {question.id === 'heard_from' && <p className="join__intro">Entirely optional.</p>}
            <div className="join__options" role="group" aria-labelledby="join-ask">
              {question.options?.map((o) => (
                <button key={o.value} type="button" className={cx('join__option', picked === o.value && 'join__option--picked')}
                  aria-pressed={state.answers[question.id] === o.value} onClick={() => choose(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            <div className="join__nav">
              {state.step > 0 ? <button type="button" className="join__text-btn" onClick={() => go({ type: 'back' })}>Back</button> : <span />}
              <button type="button" className="join__text-btn" onClick={() => go({ type: 'skip' })}>Skip</button>
            </div>
          </div>
        ) : status === 'claim' ? (
          <div key="claim" className="join__frame">
            <Ask ref={heading} tabIndex={-1} className="display-md join__ask">Check your inbox</Ask>
            <p className="join__intro" role="status">
              We already hold a few details for you from our conversations, so we have sent a link to {form.email.trim()} to finish setting up
              your profile. It works once, for one hour.
            </p>
            <p className="auth__links"><a href="/">Back to the site</a></p>
          </div>
        ) : (
          <div key="account" className="join__frame">
            <Ask ref={heading} tabIndex={-1} className="display-md join__ask">
              {variant === 'private' ? 'Where shall we reach you?' : 'Keep this for next time'}
            </Ask>
            <p className="join__intro">
              {variant === 'private'
                ? 'Create your profile and our France-based team will reply within 24 hours to talk through your private journey.'
                : 'Create your profile and we will have your preferences to hand whenever you enquire.'}
            </p>

            {providers.length > 0 && (
              <>
                <div className="auth__providers">
                  {providers.map((p) => <ProviderButton key={p} provider={p} busy={leaving !== null} onClick={() => continueWith(p)} />)}
                </div>
                <div className="auth__or" role="presentation"><span>or</span></div>
              </>
            )}

            <form ref={formRef} className="auth__form" noValidate onSubmit={submit}>
              <Input label="Your name" name="name" autoComplete="name" required value={form.name} onChange={set('name')} error={errors.name} />
              <Input label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={errors.email} />
              <Input label="Password" name="password" type="password" autoComplete="new-password" required value={form.password}
                onChange={set('password')} error={errors.password} hint={`At least ${MIN_PASSWORD} characters.`} />
              <div className="enquiry__hp" aria-hidden="true">
                <label>Company<input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <Checkbox label="Send me the journal and newly opened weeks by email" checked={marketing} onChange={setMarketing} />
              <div role="alert" className="join__alerts">
                {status === 'exists' && (
                  <p className="enquiry__alert">
                    A profile already exists for this address. <a href="/sign-in">Sign in</a> instead, or <a href="/forgot-password">reset your password</a>.
                  </p>
                )}
                {status === 'limited' && <p className="enquiry__alert">Too many attempts. Please wait a minute and try again.</p>}
                {status === 'failed' && (
                  <p className="enquiry__alert">
                    We could not create your profile. Please try again, or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                  </p>
                )}
              </div>
              <Button size="lg" type="submit" busy={status === 'sending'} className="auth__submit">
                {status === 'sending' ? 'Creating…' : 'Create my profile'}
              </Button>
              <p className="enquiry__legal join__legal">
                By creating a profile you agree to our <a href="/privacy">Privacy policy</a>.
              </p>
            </form>

            <div className="join__nav">
              <button type="button" className="join__text-btn" onClick={() => go({ type: 'back' })}>Back</button>
              <a className="join__text-btn" href="/">Not now</a>
            </div>
          </div>
        )}
      </div>
    </div>
      {/* Creating a profile is what is offered first; signing in is the second choice, in view on every frame. */}
      {status !== 'claim' && (
        <p className="auth__links join__signin">Already have a profile? <a href="/sign-in">Sign in here instead</a>.</p>
      )}
    </div>
  );
}
