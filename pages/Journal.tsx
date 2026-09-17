import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { JournalCategory } from '../types';
import { getAllPosts, isToday, JOURNAL_CATEGORIES, searchPosts } from '../data/journal';
import JournalCard, { CategoryBadge, formatJournalDate } from '../components/JournalCard';

const TodayCard: React.FC<{ post: ReturnType<typeof getAllPosts>[number] }> = ({ post }) => (
  <Link
    to={`/journal/${post.slug}`}
    className="group block bg-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
  >
    <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse inline-block" />
          Today
        </span>
        <span className="text-slate-400 text-xs font-semibold">{formatJournalDate(post.date)}</span>
        <CategoryBadge category={post.category} className="!bg-white/10 !text-white" />
      </div>

      <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4 group-hover:text-amber-400 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>
        {post.title}
      </h2>

      <p className="text-slate-300 leading-relaxed max-w-2xl mb-7">
        {post.excerpt}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm group-hover:bg-amber-400 transition-colors">
          Read the full entry →
        </span>
        {post.tags.slice(0, 3).map(t => (
          <span key={t} className="text-slate-400 text-xs font-semibold">#{t}</span>
        ))}
      </div>
    </div>
  </Link>
);

const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-14 text-center space-y-4">
    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mx-auto">🗒️</div>
    <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>No entries here yet</h3>
    <p className="text-slate-500 text-sm max-w-sm mx-auto">
      Nothing matches that category or search right now. New entries get added regularly — check back soon.
    </p>
    <button
      onClick={onReset}
      className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-slate-400 transition-colors"
    >
      Clear filters
    </button>
  </div>
);

const Journal: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<JournalCategory | 'All'>('All');
  const [query, setQuery] = useState('');

  const allPosts = useMemo(() => getAllPosts(), []);
  const latest = allPosts[0];
  const showTodayFeature = !!latest && isToday(latest) && activeCategory === 'All' && !query.trim();

  const filtered = useMemo(() => {
    const byCategory = activeCategory === 'All' ? allPosts : allPosts.filter(p => p.category === activeCategory);
    const results = searchPosts(byCategory, query);
    return showTodayFeature ? results.filter(p => p.id !== latest.id) : results;
  }, [allPosts, activeCategory, query, showTodayFeature, latest]);

  const resetFilters = () => { setActiveCategory('All'); setQuery(''); };

  return (
    <div className="fade-in space-y-12">
      {/* Hero */}
      <div className="max-w-2xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Journal</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          Building. Learning. Creating. Sharing.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Social media is where I distribute what I'm building — this is where I document and archive it. Projects in progress, things I'm learning,
          services I offer, and the occasional longer write-up. All in one place, permanently.
        </p>
      </div>

      {/* Today feature */}
      {showTodayFeature && <TodayCard post={latest} />}

      {/* Search + category filters */}
      <div className="space-y-5">
        <div className="relative max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search entries, tags, categories…"
            aria-label="Search Journal entries"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter Journal by category">
          {JOURNAL_CATEGORIES.map(cat => (
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
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map(post => <JournalCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
};

export default Journal;
