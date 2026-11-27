import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';

type SupportMode = 'support' | 'invoice';
type SupportCurrency = 'KES' | 'USD';

interface PaystackReceipt {
  status: string;
  reference: string;
  amount: number | null;
  currency: string | null;
  paidAt: string | null;
  channel: string | null;
  customerEmail: string | null;
  customerName: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRESETS: Record<SupportCurrency, number[]> = {
  KES: [250, 600, 1500, 5000],
  USD: [5, 15, 50, 100],
};

const Support: React.FC = () => {
  useSeo(pageSeo.support);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<SupportMode>('support');
  const [currency, setCurrency] = useState<SupportCurrency>('KES');
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaystackReceipt | null>(null);
  const [verifying, setVerifying] = useState(false);
  const verifiedRef = useRef(false);

  const amountValue = Number(amount);
  const amountValid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= 1000000;
  const emailValid = EMAIL_RE.test(email.trim());
  const invoiceValid = mode === 'invoice'
    ? clientName.trim().length >= 2 && invoiceNumber.trim().length >= 2
    : true;
  const canSubmit = amountValid && emailValid && invoiceValid && !loading && !verifying;

  useEffect(() => {
    const reference = searchParams.get('verify');
    if (!reference || verifiedRef.current) return;

    verifiedRef.current = true;
    setVerifying(true);
    setError(null);

    const verifyPayment = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/paystack/verify/${encodeURIComponent(reference)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed.');
        }
        setReceipt(data as PaystackReceipt);
        setSearchParams({}, { replace: true });
      } catch (err) {
        console.error('Paystack verification failed:', err);
        setError('We could not verify this payment. Please contact Pantane with your payment reference.');
        sessionStorage.removeItem(`paystack:verified:${reference}`);
      } finally {
        setVerifying(false);
      }
    };

    const storageKey = `paystack:verified:${reference}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
    verifyPayment();
  }, [searchParams, setSearchParams]);

  const handlePreset = (preset: number) => {
    setSelectedPreset(preset);
    setAmount(String(preset));
  };

  const handleCurrencyChange = (nextCurrency: SupportCurrency) => {
    setCurrency(nextCurrency);
    setAmount('');
    setSelectedPreset(null);
  };

  const handleModeChange = (nextMode: SupportMode) => {
    setMode(nextMode);
    setAmount('');
    setSelectedPreset(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL;
    const payload = mode === 'support'
      ? {
          mode,
          amount: amountValue,
          currency,
          email: email.trim(),
          name: name.trim(),
          note: note.trim(),
        }
      : {
          mode,
          amount: amountValue,
          currency,
          email: email.trim(),
          clientName: clientName.trim(),
          invoiceNumber: invoiceNumber.trim(),
          note: note.trim(),
        };

    try {
      const response = await fetch(`${apiUrl}/api/paystack/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || 'Unable to start checkout.');
      }
      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error('Paystack initialization failed:', err);
      setError('Unable to start checkout. Please try again or contact Pantane directly.');
    } finally {
      setLoading(false);
    }
  };

  const receiptTitle = receipt?.status === 'successful'
    ? 'Payment confirmed'
    : receipt?.status === 'pending'
      ? 'Payment pending'
      : 'Payment not completed';

  const receiptClass = receipt?.status === 'successful'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : receipt?.status === 'pending'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-rose-50 border-rose-200 text-rose-700';

  return (
    <div className="fade-in max-w-5xl mx-auto space-y-12">
      {(receipt || verifying || error) && (
        <div className={`rounded-[2rem] border px-6 py-5 shadow-sm ${receipt ? receiptClass : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {verifying && <p className="font-bold">Verifying payment…</p>}
          {receipt && (
            <div className="space-y-2">
              <p className="text-xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>{receiptTitle}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p><span className="font-bold">Reference:</span> {receipt.reference}</p>
                <p><span className="font-bold">Amount:</span> {receipt.amount !== null ? `${receipt.amount} ${receipt.currency || ''}`.trim() : '—'}</p>
                <p><span className="font-bold">Email:</span> {receipt.customerEmail || '—'}</p>
                <p><span className="font-bold">Channel:</span> {receipt.channel || '—'}</p>
                {receipt.paidAt && <p><span className="font-bold">Paid at:</span> {new Date(receipt.paidAt).toLocaleString()}</p>}
              </div>
            </div>
          )}
          {error && <p className="font-semibold">{error}</p>}
        </div>
      )}

      <div className="text-center space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support the work</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>
          Support the Journey.
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
          Support Pantane’s work, or pay a client invoice securely through Paystack.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('support')}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${mode === 'support' ? 'bg-brand-primary text-white' : 'text-slate-600 hover:text-brand-primary'}`}
          >
            Support the Work
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('invoice')}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${mode === 'invoice' ? 'bg-brand-primary text-white' : 'text-slate-600 hover:text-brand-primary'}`}
          >
            Pay Client Invoice
          </button>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Currency">
          {(['KES', 'USD'] as SupportCurrency[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleCurrencyChange(option)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${currency === option ? 'bg-brand-navy text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {option}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {mode === 'support' && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick amount</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS[currency].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePreset(preset)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedPreset === preset ? 'bg-brand-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {currency} {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  placeholder={`Enter amount in ${currency}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  placeholder="Your name"
                />
              </div>
            </>
          )}

          {mode === 'invoice' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  placeholder={`Enter invoice amount in ${currency}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Client / company name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  placeholder="Client or company name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Invoice number / project scope</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  placeholder="Invoice # or project scope"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Receipt email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all resize-none"
              placeholder="Anything you would like Pantane to know"
            />
          </div>

          {error && <p className="text-red-500 text-xs bg-red-50 px-4 py-3 rounded-xl font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold text-sm hover:bg-brand-burgundy transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting to Paystack…' : mode === 'support' ? 'Support Pantane' : 'Pay Invoice'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 uppercase font-black tracking-[0.3em]">Secured via Paystack</p>
      </div>
    </div>
  );
};

export default Support;
