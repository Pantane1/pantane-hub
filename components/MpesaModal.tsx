import React, { useState } from 'react';
import axios from 'axios';

interface MpesaModalProps { isOpen: boolean; onClose: () => void; }
type Status = 'idle' | 'loading' | 'success' | 'error';

const MpesaModal: React.FC<MpesaModalProps> = ({ isOpen, onClose }) => {
  const [digits, setDigits]   = useState('');   // stores only the digits after +254
  const [amount, setAmount]   = useState('100');
  const [status, setStatus]   = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => { setStatus('idle'); setErrorMsg(null); setDigits(''); onClose(); };

  const handleStkPush = async () => {
    setErrorMsg(null);
    const trimmed = digits.trim().replace(/\s/g, '');
    if (!trimmed || trimmed.length < 9) { setErrorMsg('Enter a valid Safaricom number (e.g. 7XX XXX XXX).'); return; }
    const parsedAmt = parseFloat(amount);
    if (!parsedAmt || parsedAmt < 1) { setErrorMsg('Please enter a valid amount (min KSh 1).'); return; }

    // Always send as +2547xxxxxxxxx
    const phone = `+254${trimmed.startsWith('0') ? trimmed.slice(1) : trimmed}`;

    setStatus('loading');
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/stk-push`, { phone, amount: Math.round(parsedAmt) });
      if (response.data.success) { setStatus('success'); }
      else throw new Error(response.data.error || 'Unknown error');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Support via M-Pesa</h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>STK Push Sent!</h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
            </div>
            <button onClick={handleClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-[0.99]">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-Pesa Phone Number</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">+254</span>
                <input
                  type="tel" value={digits} onChange={e => setDigits(e.target.value)}
                  placeholder="7XX XXX XXX" maxLength={10}
                  className="w-full pl-16 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg font-bold text-slate-800 tracking-wider transition-all"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (KSh)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">KSh</span>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)} min={1}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg font-bold text-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {['50','100','200','500'].map(v => (
                <button key={v} onClick={() => setAmount(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${amount === v ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                  {v}
                </button>
              ))}
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-600 bg-red-50 px-4 py-3 rounded-xl text-center font-bold">{errorMsg}</p>
            )}

            <button
              onClick={handleStkPush} disabled={status === 'loading'}
              className="w-full py-4 bg-[#28a745] text-white rounded-2xl font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Sending STK Push…
                </>
              ) : 'Send STK Push →'}
            </button>

            <p className="text-center text-[9px] text-slate-300 uppercase font-black tracking-[0.3em]">Secured via Lipana · Safaricom M-Pesa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MpesaModal;
