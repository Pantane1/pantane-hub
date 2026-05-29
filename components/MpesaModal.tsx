import React, { useState } from 'react';
import axios from 'axios';

interface MpesaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const MpesaModal: React.FC<MpesaModalProps> = ({ isOpen, onClose }) => {
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('100');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state on close
    setStatus('idle');
    setErrorMsg(null);
    onClose();
  };

  const handleStkPush = async () => {
    setErrorMsg(null);

    // Basic client-side validation
    if (!phone.trim()) {
      setErrorMsg('Please enter your M-Pesa phone number.');
      return;
    }
    if (!amount || parseFloat(amount) < 1) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setStatus('loading');

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/stk-push`, {
        phone: phone.trim(),
        amount: parseFloat(amount),
      });

      if (response.data.success) {
        setStatus('success');
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl fade-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Support via M-Pesa
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {status === 'success' ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">STK Push Sent!</h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-4 bg-[#1e293b] text-white rounded-2xl font-bold text-base hover:bg-slate-800 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Phone number input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  +254
                </span>
                <input
                  type="tel"
                  value={phone.startsWith('+254') ? phone.slice(4) : phone.startsWith('0') ? phone.slice(1) : phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="7XX XXX XXX"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-xl font-bold text-slate-800 tracking-wider"
                />
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">
                  KSh
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-xl font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <p className="text-[11px] text-red-600 bg-red-50 p-3 rounded-xl text-center font-bold">
                {errorMsg}
              </p>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                onClick={handleStkPush}
                disabled={status === 'loading'}
                className="w-full py-5 bg-[#28a745] text-white rounded-2xl font-bold text-lg hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Sending STK Push...</span>
                  </>
                ) : (
                  <>
                    <span>Send STK Push</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-300 uppercase font-black tracking-[0.3em] pt-2">
              Secure M-Pesa Connection
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MpesaModal;
