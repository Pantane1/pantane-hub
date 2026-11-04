import React, { useState } from 'react';
import { SnapchatIcon } from './Icons';

const SNAPCHAT_URL = 'https://www.snapchat.com/add/pantane24?share_id=5DozHCgdzrY&locale=en-US';

/**
 * Small floating promo pointing visitors to Snapchat. Bottom-left so it
 * never collides with PhBot's launcher (bottom-right). Dismissible for the
 * current page load only — no persistence, so like OpeningAd it resets
 * on every refresh.
 */
const SnapchatAd: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="slide-up fixed bottom-6 left-6 z-40 max-w-[240px]">
      <div className="relative">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors z-10"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <a
          href={SNAPCHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ad-float group flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl shadow-xl border border-black/5 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
          style={{ backgroundColor: '#FFFC00' }}
        >
          <span className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0">
            <SnapchatIcon className="w-5 h-5 text-[#FFFC00]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-black text-black leading-tight">
              Add me for the streak 👻
            </span>
            <span className="block text-[11px] font-bold text-black/60 leading-tight">
              pantane24
            </span>
          </span>
        </a>
      </div>
    </div>
  );
};

export default SnapchatAd;
