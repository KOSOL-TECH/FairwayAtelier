import React from 'react';
import { Button } from '../../components/core/Button.jsx';
import { Eyebrow } from '../../components/core/Eyebrow.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Radio } from '../../components/forms/Radio.jsx';
import { Dialog } from '../../components/surfaces/Dialog.jsx';
export function EnquireScreen() {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', dates: '', group: '', notes: '' });
  const [tier, setTier] = React.useState(2);
  const [touched, setTouched] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const errs = {};
  if (!form.name.trim()) errs.name = 'Please tell us your name.';
  if (!form.email.trim()) errs.email = 'An email lets us reply.';
  else if (!emailOk(form.email)) errs.email = 'Please check this email address.';
  if (!form.dates) errs.dates = 'Choose a window, or “Flexible”.';
  if (!form.group) errs.group = 'Let us know who is travelling.';

  const show = (k) => (touched[k] || submitted) && errs[k];
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errs).length === 0) setSent(true);
    else { const first = document.querySelector('[aria-invalid="true"]'); first && first.focus(); }
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '72px 40px 96px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Eyebrow rules tone="brass">Enquire</Eyebrow>
        <h1 style={{ fontSize: 'var(--text-display-lg)', margin: '16px 0 12px' }}>Enquire about a private journey</h1>
        <p style={{ fontSize: 16, maxWidth: 500, margin: '0 auto' }}>Tell us a little, and a member of our France-based team will reply within 24 hours to arrange a 30–45 minute consultation call.</p>
      </div>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-card)', padding: 8 }}>
        <div style={{ border: '1px solid var(--border-rule)', padding: '40px 44px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Input label="Full Name" required placeholder="Your name" value={form.name} onChange={set('name')} onBlur={touch('name')} error={show('name') ? errs.name : undefined} />
            <Input label="Email" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} onBlur={touch('email')} error={show('email') ? errs.email : undefined} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Input label="Phone" type="tel" placeholder="Including country code (optional)" value={form.phone} onChange={set('phone')} />
            <Select label="Dates of Interest" required placeholder="Select a window…" options={['10–17 May 2026', '07–14 Jun 2026', '13–20 Sep 2026', '18–25 Oct 2026', 'Flexible / not sure yet']} value={form.dates} onChange={set('dates')} onBlur={touch('dates')} error={show('dates') ? errs.dates : undefined} />
          </div>
          <Select label="Group Composition" required placeholder="Who is travelling?" options={['Two travellers', 'Four travellers', 'A larger private group (5–8)']} value={form.group} onChange={set('group')} onBlur={touch('group')} error={show('group') ? errs.group : undefined} />
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-heading)', marginBottom: 10 }}>Tier Interest</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Radio label="Standard" checked={tier === 0} onChange={() => setTier(0)} />
              <Radio label="Signature" checked={tier === 1} onChange={() => setTier(1)} />
              <Radio label="Undecided" checked={tier === 2} onChange={() => setTier(2)} />
            </div>
          </div>
          <Input label="Anything we should know?" placeholder="Golf handicap, occasion, dietary notes (optional)" value={form.notes} onChange={set('notes')} />
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            {submitted && Object.keys(errs).length > 0 && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-antique-brass)', marginBottom: 14 }}>Please complete the highlighted fields above.</p>
            )}
            <Button size="lg" onClick={submit}>Send enquiry</Button>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', marginTop: 14 }}>By enquiring you agree to our Terms of booking (CGV) and Privacy policy. No deposit is taken online.</p>
          </div>
        </div>
      </div>
      <Dialog open={sent} onClose={() => setSent(false)} eyebrow="Received" title="Thank you"
        actions={<Button onClick={() => setSent(false)}>Close</Button>}>
        Thank you, {form.name.trim().split(' ')[0] || 'and welcome'}. Your enquiry is with our France-based team. We will reply within 24 hours to arrange a 30–45 minute consultation call — a personal conversation, not a brochure. A confirmation is on its way to {form.email.trim() || 'your inbox'}.
      </Dialog>
    </main>
  );
}
