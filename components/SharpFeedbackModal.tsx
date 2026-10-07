import React, { useState } from 'react';
import { SharpDeal } from '../types';

interface SharpFeedbackModalProps {
  deal: SharpDeal;
  onClose: () => void;
}

/** Builds the wa.me deep link. Nothing is sent automatically — the user
 *  still has to review and tap Send inside WhatsApp, so this can never
 *  fabricate a completion confirmation on someone's behalf. */
const buildWhatsAppUrl = (
  whatsappNumber: string,
  dealTitle: string,
  name: string,
  userNumber: string,
  status: string,
  note: string
) => {
  const lines = [
    `Hey Pantane 👋🏽, I've done ${dealTitle}.`,
    '',
    `Name: ${name}`,
    `WhatsApp: ${userNumber}`,
    `Status: ${status}`,
  ];
  if (note.trim()) lines.push('', `Note: ${note.trim()}`);
  lines.push('', `I've completed the registration process.`);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${whatsappNumber}?text=${text}`;
};

const SharpFeedbackModal: React.FC<SharpFeedbackModalProps> = ({ deal, onClose }) => {
  const form = deal.feedbackForm!;
  const [name, setName] = useState('');
  const [userNumber, setUserNumber] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState(form.statusOptions?.[0] || 'Promotion has appeared');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length > 0;
  const numberValid = /^[0-9+ ]{7,}$/.test(userNumber.trim());
  const formValid = nameValid && numberValid && confirmed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!formValid) return;

    const url = buildWhatsAppUrl(form.whatsappNumber, deal.title, name.trim(), userNumber.trim(), status, note);
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={form.ctaLabel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>
              {form.ctaLabel}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Sends a pre-filled message to Pantane on WhatsApp — you'll review it before it sends.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-900 transition-colors text-xl leading-none shrink-0 ml-3"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Name / nickname</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
            {touched && !nameValid && <p className="text-xs text-rose-500 mt-1">Name is required.</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">WhatsApp number</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 text-sm"
              value={userNumber}
              onChange={e => setUserNumber(e.target.value)}
              placeholder="e.g. 0740 312 402"
              inputMode="tel"
            />
            {touched && !numberValid && <p className="text-xs text-rose-500 mt-1">Enter a valid phone number.</p>}
          </div>

          <label className="flex items-start gap-2.5 text-sm text-slate-600 leading-snug">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            I have completed the {deal.title} registration process.
          </label>
          {touched && !confirmed && <p className="text-xs text-rose-500 -mt-2">Please confirm completion to continue.</p>}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              {form.statusLabel || 'Status'}
            </label>
            <div className="space-y-2">
              {(form.statusOptions || ['Promotion has appeared', 'Still waiting for promotion']).map(option => (
                <label key={option} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="radio"
                    name="status"
                    checked={status === option}
                    onChange={() => setStatus(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Optional note</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 text-sm"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Anything else worth mentioning"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Send Confirmation
          </button>
        </form>
      </div>
    </div>
  );
};

export default SharpFeedbackModal;
