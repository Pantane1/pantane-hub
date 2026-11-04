import React from 'react';

const SharpDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 ${className}`}>
    <span className="text-base leading-none mt-0.5" aria-hidden="true">ℹ️</span>
    <p className="text-xs text-slate-500 leading-relaxed">
      <span className="font-bold text-slate-600">Sharp Note:</span> PantaneHub shares information about deals and
      opportunities for informational purposes. Rewards, eligibility, availability and processing times are
      determined by the respective provider and may change.
    </p>
  </div>
);

export default SharpDisclaimer;
