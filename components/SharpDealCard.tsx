import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SharpCategory, SharpDeal } from '../types';
import { isDealExpired } from '../data/sharp';

interface CategoryMeta {
  emoji: string;
  badgeClass: string;
}

/** Static Tailwind class strings per category — kept literal so Tailwind's
 *  content scanner picks them up, same convention as JournalCard's CATEGORY_META. */
export const SHARP_CATEGORY_META: Record<SharpCategory, CategoryMeta> = {
  'Deals':         { emoji: '🏷️', badgeClass: 'text-blue-600 bg-blue-50' },
  'Rewards':       { emoji: '⚡', badgeClass: 'text-amber-600 bg-amber-50' },
  'Referrals':     { emoji: '🔗', badgeClass: 'text-indigo-600 bg-indigo-50' },
  'Opportunities': { emoji: '🚀', badgeClass: 'text-emerald-600 bg-emerald-50' },
};

export const formatDealDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });

export const SharpCategoryBadge: React.FC<{ category: SharpCategory; className?: string }> = ({ category, className = '' }) => {
  const meta = SHARP_CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap ${meta.badgeClass} ${className}`}>
      <span aria-hidden="true">{meta.emoji}</span>
      {category}
    </span>
  );
};

export const SharpStatusBadge: React.FC<{ deal: SharpDeal; className?: string }> = ({ deal, className = '' }) => {
  const expired = isDealExpired(deal);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap ${expired ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'} ${className}`}>
      <span aria-hidden="true">{expired ? '⚪' : '🟢'}</span>
      {expired ? 'Expired' : 'Active'}
    </span>
  );
};

/** Thumbnail with a graceful themed placeholder if no image / the image
 *  404s — same pattern as HeroCarousel, so the grid looks complete before
 *  real thumbnails are dropped into public/assets/sharp-deals/. */
export const DealThumbnail: React.FC<{ deal: SharpDeal; badge?: string; className?: string }> = ({ deal, badge, className = '' }) => {
  const [errored, setErrored] = useState(!deal.thumbnail);
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-slate-100 ${className}`}>
      {!errored && deal.thumbnail ? (
        <img
          src={deal.thumbnail}
          alt={`${deal.title} thumbnail`}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-900 flex items-center justify-center">
          <span className="text-4xl opacity-90" aria-hidden="true">⚡</span>
        </div>
      )}
      {badge && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">
          {badge}
        </span>
      )}
      {isDealExpired(deal) && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
          <span className="px-3 py-1.5 bg-white/90 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-lg">Expired</span>
        </div>
      )}
    </div>
  );
};

interface SharpDealCardProps {
  deal: SharpDeal;
}

const SharpDealCard: React.FC<SharpDealCardProps> = ({ deal }) => {
  const expired = isDealExpired(deal);
  return (
    <Link
      to={`/sharp/${deal.slug}`}
      aria-label={`View deal: ${deal.title}`}
      className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="rounded-t-3xl overflow-hidden">
        <DealThumbnail deal={deal} badge="⚡ SHARP" />
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-3">
          <SharpCategoryBadge category={deal.category} />
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{formatDealDate(deal.datePosted)}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>
          Get {deal.reward}
        </h3>

        <p className="text-slate-500 text-sm line-clamp-2 mb-5 flex-grow leading-relaxed">
          {deal.description}
        </p>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <SharpStatusBadge deal={deal} />
          <span className={`inline-flex items-center text-sm font-bold transition-all duration-300 ${expired ? 'text-slate-300' : 'text-slate-900 group-hover:text-blue-600 group-hover:translate-x-1'}`}>
            View Deal <span className="ml-1.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default SharpDealCard;
