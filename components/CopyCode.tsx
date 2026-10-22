import React, { useState } from 'react';

const CopyCode: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-2 py-2">
      <code className="flex-1 font-mono font-bold text-lg tracking-[0.15em] text-brand-navy">{code}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Referral code copied' : 'Copy referral code'}
        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
          copied ? 'bg-emerald-500 text-white' : 'bg-brand-primary text-white hover:bg-brand-burgundy'
        }`}
      >
        {copied ? 'Copied ✓' : 'Copy Code'}
      </button>
    </div>
  );
};

export default CopyCode;
