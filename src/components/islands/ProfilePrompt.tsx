import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Chips } from '../ui/Chips';
import { readConsent } from '../../lib/consent';
import type { PromptView } from '../../lib/account/questions';

/** localStorage: the time (ms) before which no later question is shown in this browser. */
const QUIET_KEY = 'fa_prompt_after';
const DAY = 86_400_000;
/** Shown a little after the page, so it never competes with the first read. */
const DELAY_MS = 4000;

const quietFor = (ms: number) => {
  try {
    localStorage.setItem(QUIET_KEY, String(Date.now() + ms));
  } catch {
    // Storage is blocked: the card may simply appear again on another page.
  }
};

const isQuiet = () => {
  try {
    return Date.now() < Number(localStorage.getItem(QUIET_KEY) ?? 0);
  } catch {
    return false;
  }
};

/**
 * One small card asking a signed-in guest the next question for their profile
 * ("later questions", docs/accounts.md). At most one a day in this browser.
 * Answering or skipping is one tap; a skipped question is not asked again, and
 * closing the card leaves it for another week.
 *
 * Public pages are cached and the same for everyone, so this loads only when
 * the browser carries the signed-in sign (see BaseLayout) and asks the server
 * for the question itself. It never takes focus when it appears.
 */
export function ProfilePrompt() {
  const [question, setQuestion] = useState<PromptView | null>(null);
  const [firstName, setFirstName] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'asking' | 'saving' | 'thanks' | 'failed'>('asking');
  const askId = useId();
  const card = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Not while the cookie banner is still waiting for an answer, and not more than once a day.
    if (isQuiet() || !readConsent()) return;
    let cancelled = false;
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/account/prompt');
        if (res.status === 401) {
          // The session has ended: drop the sign so pages stop asking.
          document.cookie = 'fa_in=; Max-Age=0; Path=/; Secure; SameSite=Lax';
          document.documentElement.classList.remove('signed-in');
          return;
        }
        const body = (await res.json()) as { ok?: boolean; firstName?: string; question?: PromptView | null };
        if (cancelled || !res.ok || !body.question) return;
        setFirstName(body.firstName ?? '');
        setQuestion(body.question);
      } catch {
        // No card this time.
      }
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, []);

  // While the card is up, keep focused links and fields from scrolling underneath it (WCAG 2.4.11).
  const shown = question !== null;
  useEffect(() => {
    const el = card.current;
    if (!shown || !el) return;
    const root = document.documentElement;
    const before = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = `${el.offsetHeight + 28}px`;
    return () => { root.style.scrollPaddingBottom = before; };
  }, [shown]);

  if (!question) return null;

  /** Takes the card away. If focus was inside it, it goes to the page's content instead of being lost. */
  const dismiss = () => {
    if (card.current?.contains(document.activeElement)) {
      const main = document.getElementById('main');
      main?.setAttribute('tabindex', '-1');
      main?.focus({ preventScroll: true });
    }
    setQuestion(null);
  };

  const close = () => {
    quietFor(7 * DAY);
    dismiss();
  };

  const send = async (body: { answers?: Record<string, string | string[]>; skipped?: string[] }) => {
    if (phase === 'saving') return;
    setPhase('saving');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, source: 'prompt' }),
      });
      if (!res.ok) throw new Error(String(res.status));
      quietFor(DAY);
      if (body.skipped) {
        dismiss();
        return;
      }
      setPhase('thanks');
      // The buttons that had focus are gone: keep focus on the card, where the thanks is announced.
      card.current?.focus();
      timer.current = setTimeout(dismiss, 4000);
    } catch {
      // Nothing was saved, so nothing stays selected: the same choice can simply be tapped again.
      setChosen([]);
      setPhase('failed');
    }
  };

  const answer = (value: string | string[]) => send({ answers: { [question.id]: value } });
  const ready = question.kind === 'multi' ? chosen.length > 0 : text.trim() !== '';
  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ready) return;
    void answer(question.kind === 'multi' ? chosen : text.trim());
  };

  return (
    <aside ref={card} tabIndex={-1} className="prompt-card" aria-label="A question for your profile">
      <button type="button" className="fa-dialog__close" aria-label="Close" onClick={close} />
      {/* Both message lines are always here, empty until needed, so that screen readers announce them when they fill. */}
      <p className="prompt-card__thanks" role="status">{phase === 'thanks' ? 'Thank you. It is on your profile.' : ''}</p>
      {phase !== 'thanks' && (
        <form onSubmit={submit}>
          <p className="label">{firstName ? `For your profile, ${firstName}` : 'For your profile'}</p>
          <p id={askId} className="prompt-card__ask">{question.ask}</p>
          {question.kind === 'text' ? (
            <input className="fa-field__control" type="text" aria-labelledby={askId} value={text} maxLength={question.max}
              placeholder={question.placeholder} onChange={(e) => setText(e.target.value)} />
          ) : (
            <Chips labelledBy={askId} options={question.options} multiple={question.kind === 'multi'} disabled={phase === 'saving'}
              value={chosen}
              onChange={(value) => {
                setChosen(value);
                // One choice answers at once; several wait for "Save".
                if (question.kind === 'choice' && value[0]) void answer(value[0]);
              }} />
          )}
          <p className="prompt-card__error" role="alert">{phase === 'failed' ? 'That did not save. Please try again.' : ''}</p>
          <div className="prompt-card__actions">
            {question.kind !== 'choice' && (
              <button type="submit" className="fa-btn fa-btn--primary fa-btn--sm" disabled={!ready || phase === 'saving'}>Save</button>
            )}
            <button type="button" className="prompt-card__skip" onClick={() => send({ skipped: [question.id] })}>Skip</button>
            <a className="prompt-card__skip" href="/account">Open my profile</a>
          </div>
        </form>
      )}
    </aside>
  );
}

/** Mounts the card. Called from BaseLayout only for a browser that carries the signed-in sign. */
export function mountProfilePrompt(el: HTMLElement) {
  createRoot(el).render(<ProfilePrompt />);
}
