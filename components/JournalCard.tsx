import React from 'react';
import { Link } from 'react-router-dom';
import { JournalCategory, JournalPost } from '../types';

interface CategoryMeta {
  emoji: string;
  badgeClass: string;
}

/** Static Tailwind class strings per category — kept literal (not built dynamically)
 *  so Tailwind's content scanner picks them up. */
export const CATEGORY_META: Record<JournalCategory, CategoryMeta> = {
  'Work':             { emoji: '💼', badgeClass: 'text-blue-600 bg-blue-50' },
  'Projects':         { emoji: '🚀', badgeClass: 'text-indigo-600 bg-indigo-50' },
  'Learning':         { emoji: '📚', badgeClass: 'text-emerald-600 bg-emerald-50' },
  'Blog':             { emoji: '✍️', badgeClass: 'text-purple-600 bg-purple-50' },
  'Services':         { emoji: '🛠️', badgeClass: 'text-amber-600 bg-amber-50' },
  'Achievements':     { emoji: '🏆', badgeClass: 'text-yellow-700 bg-yellow-50' },
  'Announcements':    { emoji: '📣', badgeClass: 'text-rose-600 bg-rose-50' },
  'Behind the Scenes':{ emoji: '🎬', badgeClass: 'text-slate-600 bg-slate-100' },
};

export const formatJournalDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

export const CategoryBadge: React.FC<{ category: JournalCategory; className?: string }> = ({ category, className = '' }) => {
  const meta = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap ${meta.badgeClass} ${className}`}>
      <span aria-hidden="true">{meta.emoji}</span>
      {category}
    </span>
  );
};

interface JournalCardProps {
  post: JournalPost;
}

const JournalCard: React.FC<JournalCardProps> = ({ post }) => (
  <Link
    to={`/journal/${post.slug}`}
    aria-label={`Read more: ${post.title}`}
    className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  >
    {post.image && (
      <div className="aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={post.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    )}

    <div className="p-7 flex-grow flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <CategoryBadge category={post.category} />
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{formatJournalDate(post.date)}</span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3 group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>
        {post.title}
      </h3>

      <p className="text-slate-500 text-sm line-clamp-3 mb-5 flex-grow leading-relaxed">
        {post.excerpt}
      </p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {post.tags.slice(0, 4).map(t => (
            <span key={t} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex items-center text-sm font-bold text-slate-900 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300">
        Read more <span className="ml-1.5">→</span>
      </div>
    </div>
  </Link>
);

export default JournalCard;
