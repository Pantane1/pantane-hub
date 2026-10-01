import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SharpCategory } from '../types';
import { getAllDeals, getDealsByCategory, getFeaturedDeal, isDealExpired, SHARP_CATEGORIES } from '../data/sharp';
import SharpDealCard, { DealThumbnail, SharpCategoryBadge, SharpStatusBadge } from '../components/SharpDealCard';
import SharpDisclaimer from '../components/SharpDisclaimer';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';

const FeaturedDealCard: React.FC<{ deal: ReturnType<typeof getAllDeals>[number] }> = ({ deal }) => {
  const expired = isDealExpired(deal);
  return (
    <Link
      to={`/sharp/${deal.slug}`}
      className="group grid md:grid-cols-2 bg-slate-900 rounded-[2rem] overflow-hidden relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <div className="relative">
        <DealThumbnail deal={deal} badge="⚡ SHARP" />
      </div>

      <div className="p-8 md:p-10 flex flex-col justify-center relative">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3 mb-5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">
            Featured Deal
          </span>
          <SharpCategoryBadge category={deal.category} className="!bg-white/10 !text-white" />
          <SharpStatusBadge deal={deal} className="!bg-white/10 !text-white" />
        </div>

        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          {deal.title}
        </h2>
        <p className="text-amber-300 font-bold text-lg mb-4">Get {deal.reward}</p>
        <p className="text-slate-300 leading-relaxed mb-7 max-w-md">{deal.description}</p>

        <span className={`inline-flex items-center px-6 py-3 rounded-2xl font-bold text-sm w-fit transition-colors ${expired ? 'bg-white/10 text-slate-400' : 'bg-white text-slate-900 group-hover:bg-amber-400'}`}>
          {expired ? 'View Details' : 'See How It Works →'}
        </span>
      </div>
    </Link>
  );
};

const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-14 text-center space-y-4">
    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mx-auto">⚡</div>
    <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>No deals here yet</h3>
    <p className="text-slate-500 text-sm max-w-sm mx-auto">
      Nothing in this category right now. New deals get added regularly — check back soon.
    </p>
    <button
      onClick={onReset}
      className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-slate-400 transition-colors"
    >
      Clear filter
    </button>
  </div>
);

const Sharp: React.FC = () => {
  useSeo(pageSeo.sharp);
  const [activeCategory, setActiveCategory] = useState<SharpCategory | 'All'>('All');

  const allDeals = useMemo(() => getAllDeals(), []);
  const featured = useMemo(() => getFeaturedDeal(), []);
  const showFeatured = activeCategory === 'All' && !!featured;

  const filtered = useMemo(() => {
    const byCategory = getDealsByCategory(activeCategory);
    return showFeatured ? byCategory.filter(d => d.id !== featured!.id) : byCategory;
  }, [activeCategory, showFeatured, featured]);

  return (
    <div className="fade-in space-y-12">
      {/* Hero */}
      <div className="max-w-2xl">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">⚡ Sharp</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          New deals. Smart opportunities. No confusion.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Discover new deals, rewards and opportunities — with simple explanations showing exactly how they work.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter Sharp deals by category">
        {SHARP_CATEGORIES.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${
              activeCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured deal */}
      {showFeatured && <FeaturedDealCard deal={featured!} />}

      {/* Grid */}
      <div className="space-y-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latest Sharp Drops</h2>
        {filtered.length === 0 ? (
          <EmptyState onReset={() => setActiveCategory('All')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map(deal => <SharpDealCard key={deal.id} deal={deal} />)}
          </div>
        )}
      </div>

      <SharpDisclaimer />
    </div>
  );
};

export default Sharp;
