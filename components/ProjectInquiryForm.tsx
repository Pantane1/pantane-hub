import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_NOTIFY_TEMPLATE_ID, EMAILJS_AUTOREPLY_TEMPLATE_ID } from '../data/emailConfig';
import { CONTACT_EMAIL, whatsappLink } from '../data/contact';
import {
  BUDGET_OPTIONS, TIMELINE_OPTIONS, SERVICE_OPTIONS, STEP_LABELS,
  InquiryValues, InquiryErrors, emptyInquiry, validateStep, validateAll, buildInquiryMessage,
} from '../data/inquiry';

/** A real person can't read, choose and type across three steps faster than this. */
const MIN_FILL_MS = 3000;
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = 'pantanehub_last_inquiry';

const fieldClass = (invalid: boolean) =>
  `w-full px-4 py-3 bg-white border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary focus:border-transparent ${invalid ? 'border-red-400' : 'border-slate-200'}`;
const labelClass = 'text-xs font-bold text-slate-600 uppercase tracking-widest';

const Field: React.FC<{ id: string; label: string; optional?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ id, label, optional, error, hint, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className={labelClass}>
      {label}{optional && <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">(optional)</span>}
    </label>
    {children}
    {hint && !error && <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
  </div>
);

const ProjectInquiryForm: React.FC<{ initialService?: string }> = ({ initialService = '' }) => {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<InquiryValues>({ ...emptyInquiry(), service: SERVICE_OPTIONS.includes(initialService) ? initialService : '' });
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const mountedAt = useRef(Date.now());
  /** Synchronous guard so two submit events can't both pass the `status === 'sending'` check before React re-renders. */
  const submittingRef = useRef(false);

  const set = (k: keyof InquiryValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues(v => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: undefined }));
  };
  const props = (k: keyof InquiryValues) => ({
    id: `inq-${k}`, name: k, value: values[k], onChange: set(k),
    'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `inq-${k}-error` : undefined,
  });

  const next = () => {
    const e = validateStep(step, values);
    setErrors(e);
    if (!Object.keys(e).length) setStep(s => Math.min(s + 1, STEP_LABELS.length - 1));
  };
  const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (step < STEP_LABELS.length - 1) return next();
    if (status === 'sending' || submittingRef.current) return;

    const problem = validateAll(values);
    if (problem) { setStep(problem.step); setErrors(problem.errors); return; }

    // Spam traps are never reported as successful delivery. A legitimate visitor who
    // submits too quickly gets an understandable error instead of a false success.
    if (honeypot) {
      setStatus('error');
      setErrorMsg('Your inquiry could not be submitted. Please try again, or reach me directly on WhatsApp or email.');
      return;
    }
    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setStatus('error');
      setErrorMsg('Please take a moment to review your inquiry before submitting it.');
      return;
    }

    try {
      const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      if (Date.now() - last < COOLDOWN_MS) {
        setStatus('error');
        setErrorMsg('You just sent an inquiry. Please wait a minute before sending another.');
        return;
      }
    } catch { /* storage unavailable — skip the cooldown */ }

    setStatus('sending');
    setErrorMsg('');
    submittingRef.current = true;
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_NOTIFY_TEMPLATE_ID,
        { from_name: values.name.trim(), from_email: values.email.trim(), message: buildInquiryMessage(values) },
        EMAILJS_PUBLIC_KEY,
      );
    } catch (err) {
      console.error('Inquiry send failed:', err);
      setStatus('error');
      setErrorMsg("Your inquiry didn't go through. Please try again, or reach me directly on WhatsApp or email.");
      return; // never show success unless the notification actually sent
    } finally {
      submittingRef.current = false;
    }
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch { /* ignore */ }
    setStatus('sent');
    // Confirmation email to the client is best-effort: Pantane already has the inquiry.
    emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_AUTOREPLY_TEMPLATE_ID,
      { to_name: values.name.trim(), user_email: values.email.trim(), message: `Thanks for your project inquiry about "${values.service}". I've received it and will get back to you soon.` },
      EMAILJS_PUBLIC_KEY,
    ).catch(err => console.error('Inquiry autoreply failed:', err));
  };

  if (status === 'sent') {
    const summary = `Hi Pantane, I just sent a project inquiry on your website.\nName: ${values.name.trim() || '—'}\nService: ${values.service || '—'}\nBudget: ${values.budget || '—'}`;
    return (
      <div role="status" className="space-y-6 rounded-[2rem] border border-brand-navy/10 bg-white p-8 text-center shadow-xl md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl" aria-hidden="true">✓</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Inquiry received</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600">
            Thanks{values.name.trim() ? `, ${values.name.trim().split(' ')[0]}` : ''}. I'll review your project and get back to you by email{values.phone.trim() ? ' or WhatsApp' : ''}.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Want to talk sooner?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={whatsappLink(summary)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-2xl bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-burgundy">Continue on WhatsApp ↗</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center rounded-2xl border border-brand-navy/20 px-6 py-3 text-sm font-bold text-brand-navy transition-colors hover:border-brand-primary hover:text-brand-primary">Email me</a>
          </div>
        </div>
        <Link to="/services" className="inline-block text-sm font-bold text-slate-500 hover:text-brand-primary">← Back to Services</Link>
      </div>
    );
  }

  const last = step === STEP_LABELS.length - 1;
  return (
    <form onSubmit={submit} noValidate className="space-y-7 rounded-[2rem] border border-brand-navy/10 bg-white p-6 shadow-xl md:p-10" aria-label="Project inquiry">
      {/* Progress */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}</p>
        <ol className="flex gap-2" aria-label="Progress">
          {STEP_LABELS.map((label, i) => (
            <li key={label} aria-current={i === step ? 'step' : undefined} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-brand-primary' : 'bg-slate-200'}`} />
              <span className="sr-only">{label}{i < step ? ' (completed)' : i === step ? ' (current)' : ''}</span>
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <Field id="inq-service" label="Service required" error={errors.service}>
            <select {...props('service')} className={fieldClass(!!errors.service)}>
              <option value="" disabled>Select a service…</option>
              {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field id="inq-description" label="Project description" error={errors.description} hint="What do you want built or fixed, and what should it achieve?">
            <textarea {...props('description')} rows={6} maxLength={2100} placeholder="e.g. We run a small shop and want customers to order and pay with M-Pesa on a website." className={`${fieldClass(!!errors.description)} resize-y`} />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Field id="inq-budget" label="Estimated budget" error={errors.budget} hint="Your own estimate in KES. This is not a quote — I'll price the work once I understand the scope.">
            <select {...props('budget')} className={fieldClass(!!errors.budget)}>
              <option value="" disabled>Select a range…</option>
              {BUDGET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field id="inq-timeline" label="Expected timeline" error={errors.timeline}>
            <select {...props('timeline')} className={fieldClass(!!errors.timeline)}>
              <option value="" disabled>Select a timeline…</option>
              {TIMELINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field id="inq-requirements" label="Additional requirements" optional error={errors.requirements}>
            <textarea {...props('requirements')} rows={4} maxLength={1600} placeholder="Anything else I should know — existing systems, deadlines, links, examples you like." className={`${fieldClass(!!errors.requirements)} resize-y`} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="inq-name" label="Full name" error={errors.name}>
              <input {...props('name')} type="text" autoComplete="name" className={fieldClass(!!errors.name)} />
            </Field>
            <Field id="inq-email" label="Email address" error={errors.email}>
              <input {...props('email')} type="email" autoComplete="email" inputMode="email" className={fieldClass(!!errors.email)} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="inq-phone" label="Phone / WhatsApp" optional error={errors.phone}>
              <input {...props('phone')} type="tel" autoComplete="tel" inputMode="tel" placeholder="+254…" className={fieldClass(!!errors.phone)} />
            </Field>
            <Field id="inq-business" label="Business or organization" optional error={errors.business}>
              <input {...props('business')} type="text" autoComplete="organization" className={fieldClass(!!errors.business)} />
            </Field>
          </div>
          {/* Honeypot: invisible to people, tempting to bots. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="inq-company-site">Leave this field empty</label>
            <input id="inq-company-site" name="company_site" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
          <div className="flex flex-wrap gap-3 text-xs font-bold">
            <a href={whatsappLink("Hi Pantane, I tried to send a project inquiry on your website but it didn't go through.")} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">WhatsApp me</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-primary underline">Email me</a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        {step > 0 ? (
          <button type="button" onClick={back} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:text-brand-primary">← Back</button>
        ) : <span />}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-2xl bg-brand-primary px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-burgundy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : last ? 'Send inquiry' : 'Continue →'}
        </button>
      </div>
    </form>
  );
};

export default ProjectInquiryForm;
