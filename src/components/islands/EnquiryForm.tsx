import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Radio } from '../ui/Radio';
import { Dialog } from '../ui/Dialog';
import { GROUPS, TIERS, validateEnquiry, type EnquiryFields, type FieldErrors, type Tier } from '../../lib/enquiry/validate';
import { CONTACT_EMAIL } from '../../lib/site';

export interface EnquiryFormProps {
  /** "Dates of Interest" options, from the availability data */
  dateOptions: string[];
  /** POST target; the stubbed endpoint lives at /api/enquiry */
  endpoint?: string;
}

type Text = Exclude<keyof EnquiryFields, 'tier'>;
const EMPTY = { name: '', email: '', phone: '', dates: '', group: '', notes: '' };
/** Random UUID where the browser has one; without it the server assigns the id (no retry protection). */
const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined);

export function EnquiryForm({ dateOptions, endpoint = '/api/enquiry' }: EnquiryFormProps) {
  const [form, setForm] = useState<Record<Text, string>>(EMPTY);
  const [tier, setTier] = useState<Tier>('Undecided');
  const [touched, setTouched] = useState<Partial<Record<Text, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState<{ first: string; email: string } | null>(null);
  // A signed-in guest's own name, email and phone, filled in for them (and again after the form is cleared).
  const [profile, setProfile] = useState<Pick<Record<Text, string>, 'name' | 'email' | 'phone'> | null>(null);
  // One id per enquiry: a retry after a failed send updates it on the server instead of duplicating it.
  const submission = useRef(newId());
  const formRef = useRef<HTMLFormElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const fields: EnquiryFields = { ...form, tier };
  const errs: FieldErrors = Object.fromEntries(
    Object.entries({ ...serverErrors, ...validateEnquiry(fields, dateOptions) }).filter(([k, v]) => v && k !== 'tier'),
  );
  const hasErrors = Object.keys(errs).length > 0;

  const set = (k: Text) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
  };
  const touch = (k: Text) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k: keyof FieldErrors) => ((touched[k as Text] || submitted) ? errs[k] : undefined);

  // The page is cached and the same for everyone, so a signed-in guest's details are fetched after it loads.
  // Only fields still empty are filled: whatever the guest has typed stays.
  useEffect(() => {
    if (!document.documentElement.classList.contains('signed-in')) return;
    let cancelled = false;
    fetch('/api/account/me')
      .then((res) => (res.ok ? (res.json() as Promise<{ ok?: boolean; name?: string; email?: string; phone?: string }>) : null))
      .then((me) => {
        if (cancelled || !me?.ok) return;
        const mine = { name: me.name ?? '', email: me.email ?? '', phone: me.phone ?? '' };
        setProfile(mine);
        setForm((f) => ({ ...f, name: f.name || mine.name, email: f.email || mine.email, phone: f.phone || mine.phone }));
      })
      .catch(() => {}); // not signed in after all, or offline: the form simply starts empty
    return () => { cancelled = true; };
  }, []);

  // After a failed attempt, move focus to the first invalid field once it has rendered.
  useEffect(() => {
    if (attempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setSubmitted(true);
    setSendError(false);
    if (hasErrors) { setAttempt((n) => n + 1); return; }
    setSending(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, id: submission.current, company: honeypot.current?.value ?? '' }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: FieldErrors };
      if (res.status === 422 && body.errors) {
        setServerErrors(body.errors);
        setAttempt((n) => n + 1);
      } else if (!res.ok || !body.ok) {
        setSendError(true);
      } else {
        setSent({ first: form.name.trim().split(' ')[0] ?? '', email: form.email.trim() });
      }
    } catch {
      setSendError(true); // network failure: the guest's input is kept for a retry
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    setSent(null);
    submission.current = newId();
    setForm({ ...EMPTY, ...profile }); setTier('Undecided'); setTouched({}); setSubmitted(false);
  };

  return (
    <>
      <form ref={formRef} className="enquiry" noValidate onSubmit={submit} aria-describedby="enquiry-legal">
        <div className="enquiry__row">
          <Input label="Full Name" name="name" autoComplete="name" required placeholder="Your name" value={form.name}
            onChange={set('name')} onBlur={touch('name')} error={show('name')} />
          <Input label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email}
            onChange={set('email')} onBlur={touch('email')} error={show('email')} />
        </div>
        <div className="enquiry__row">
          <Input label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="Including country code (optional)" value={form.phone}
            onChange={set('phone')} />
          <Select label="Dates of Interest" name="dates" required placeholder="Select a window…" options={dateOptions} value={form.dates}
            onChange={set('dates')} onBlur={touch('dates')} error={show('dates')} />
        </div>
        <Select label="Group Composition" name="group" required placeholder="Who is travelling?" options={[...GROUPS]} value={form.group}
          onChange={set('group')} onBlur={touch('group')} error={show('group')} />
        <fieldset className="enquiry__tiers">
          <legend className="fa-field__label">Tier Interest</legend>
          <div className="enquiry__radios">
            {TIERS.map((t) => (
              <Radio key={t} name="tier" value={t} label={t} checked={tier === t} onChange={() => setTier(t)} />
            ))}
          </div>
        </fieldset>
        <Input label="Anything we should know?" name="notes" placeholder="Golf handicap, occasion, dietary notes (optional)" value={form.notes}
          onChange={set('notes')} />
        <div className="enquiry__hp" aria-hidden="true">
          <label>Company<input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div className="enquiry__submit">
          <div role="alert" className="enquiry__alerts">
            {submitted && hasErrors && <p className="enquiry__alert">Please complete the highlighted fields above.</p>}
            {sendError && (
              <p className="enquiry__alert">We could not send your enquiry. Please try again, or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
            )}
          </div>
          <Button size="lg" type="submit" busy={sending}>{sending ? 'Sending…' : 'Send enquiry'}</Button>
          <p id="enquiry-legal" className="enquiry__legal">
            By enquiring you agree to our <a href="/terms">Terms of booking (CGV)</a> and <a href="/privacy">Privacy policy</a>. No deposit is taken online.
          </p>
        </div>
      </form>
      <Dialog open={sent !== null} onClose={close} eyebrow="Received" title="Thank you"
        actions={
          <>
            <Button onClick={close}>Close</Button>
            {/* For a guest without a profile: a quiet way to keep their preferences for next time. */}
            {!profile && <Button variant="ghost" href="/join">Create your profile</Button>}
          </>
        }>
        Thank you, {sent?.first || 'and welcome'}. Your enquiry is with our France-based team. We will reply within 24 hours to arrange a 30–45 minute consultation call — a personal conversation, not a brochure. A confirmation is on its way to {sent?.email || 'your inbox'}.
      </Dialog>
    </>
  );
}
