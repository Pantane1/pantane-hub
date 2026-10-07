import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { SharpRequestField } from '../types';
import { EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_NOTIFY_TEMPLATE_ID, EMAILJS_AUTOREPLY_TEMPLATE_ID } from '../data/emailConfig';

interface SharpRequestFormProps {
  dealTitle: string;
  requestSubject: string;
  fields: SharpRequestField[];
  ctaLabel: string;
  successMessage?: string;
}

const fieldInputClass = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const fieldLabelClass = 'text-xs font-bold text-slate-500 uppercase tracking-widest';

/**
 * Reusable request-capture form for Sharp marketplace/service deals (e.g.
 * buying social accounts, requesting an international number). Reuses the
 * exact same EmailJS service + templates as pages/Contact.tsx (see
 * data/emailConfig.ts) — same inbox, same autoreply — rather than a
 * separate mechanism, per field list driven entirely by `fields` so a new
 * deal can get its own request form just by adding field config to its
 * data/sharp.json entry.
 */
const SharpRequestForm: React.FC<SharpRequestFormProps> = ({ dealTitle, requestSubject, fields, ctaLabel, successMessage }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const senderName = (formData.get('from_name') as string) || 'Sharp visitor';
    const senderEmail = (formData.get('from_email') as string) || '';

    const detailLines = fields.map(f => `${f.label}: ${(formData.get(f.name) as string) || '—'}`);
    const message = `${requestSubject}\n\n${detailLines.join('\n')}`;

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_NOTIFY_TEMPLATE_ID,
        { from_name: senderName, from_email: senderEmail, message },
        EMAILJS_PUBLIC_KEY
      );

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_AUTOREPLY_TEMPLATE_ID,
        { to_name: senderName, user_email: senderEmail, message: `Thanks for your ${dealTitle} request — I'll be in touch shortly.` },
        EMAILJS_PUBLIC_KEY
      );

      setSubmitted(true);
      form.reset();
    } catch (err) {
      console.error('Sharp request send failed:', err);
      setError('Failed to send your request. Please try again, or reach out via the Contact page.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-7 text-center space-y-2">
        <p className="text-2xl">✅</p>
        <p className="text-sm font-bold text-emerald-700">{successMessage || 'Request sent!'}</p>
        <p className="text-xs text-emerald-600">I'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 border border-slate-100 rounded-2xl p-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Your Name</label>
          <input required type="text" name="from_name" placeholder="Your name" className={fieldInputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Email Address</label>
          <input required type="email" name="from_email" placeholder="you@example.com" className={fieldInputClass} />
        </div>
      </div>

      {fields.map(f => (
        <div key={f.name} className="space-y-1.5">
          <label className={fieldLabelClass}>{f.label}</label>
          {f.type === 'select' ? (
            <select required={f.required} name={f.name} defaultValue="" className={fieldInputClass}>
              <option value="" disabled>Select…</option>
              {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea required={f.required} name={f.name} placeholder={f.placeholder} rows={3} className={`${fieldInputClass} resize-none`} />
          ) : (
            <input required={f.required} type="text" name={f.name} placeholder={f.placeholder} className={fieldInputClass} />
          )}
        </div>
      ))}

      {error && <p className="text-red-500 text-xs bg-red-50 px-4 py-3 rounded-xl font-semibold">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending…' : `${ctaLabel} →`}
      </button>
    </form>
  );
};

export default SharpRequestForm;
