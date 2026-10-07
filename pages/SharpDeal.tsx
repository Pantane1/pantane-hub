import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDealBySlug } from '../data/sharp';
import { DealThumbnail, SharpCategoryBadge, SharpStatusBadge, formatDealDate } from '../components/SharpDealCard';
import CopyCode from '../components/CopyCode';
import SharpDisclaimer from '../components/SharpDisclaimer';
import { useSeo } from '../hooks/useSeo';
import { DEFAULT_OG_IMAGE } from '../data/pageSeo';

const DealNotFound: React.FC<{ slug?: string }> = ({ slug }) => {
  useSeo({
    title: 'Deal Not Found | Sharp — PantaneHub',
    description: "This Sharp deal doesn't exist or may have expired and been removed.",
    path: `/sharp/${slug || ''}`,
    noindex: true,
  });
  return (
    <div className="fade-in max-w-lg mx-auto text-center py-20 space-y-5">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto">⚡</div>
      <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>Deal not found</h1>
      <p className="text-slate-500 text-sm">This Sharp deal doesn't exist or may have been removed.</p>
      <Link to="/sharp" className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-colors">
        ← Back to Sharp
      </Link>
    </div>
  );
};

const SharpDeal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const deal = slug ? getDealBySlug(slug) : undefined;

  useSeo({
    title: deal ? `${deal.title} — Get ${deal.reward} | Sharp` : 'Deal Not Found | Sharp — PantaneHub',
    description: deal ? deal.description : "This Sharp deal doesn't exist or may have been removed.",
    path: `/sharp/${slug || ''}`,
    image: deal?.thumbnail || DEFAULT_OG_IMAGE,
    noindex: !deal,
  });

  if (!deal) return <DealNotFound slug={slug} />;

  return (
    <div className="fade-in max-w-3xl mx-auto space-y-10">
      <Link to="/sharp" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Sharp
      </Link>

      <div className="rounded-3xl overflow-hidden">
        <DealThumbnail deal={deal} badge="⚡ SHARP" />
      </div>

      <header className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SharpCategoryBadge category={deal.category} />
          <SharpStatusBadge deal={deal} />
          <span className="text-sm text-slate-400 font-medium">Posted {formatDealDate(deal.datePosted)}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          {deal.title}
        </h1>
      </header>

      {/* Reward info */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New User</p>
          <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>{deal.reward}</p>
        </div>
        {deal.referralReward && (
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referrer</p>
            <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>{deal.referralReward}</p>
          </div>
        )}
        <div className="bg-slate-50 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <div className="mt-1"><SharpStatusBadge deal={deal} /></div>
        </div>
      </div>

      {/* What you get */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">What you get</h2>
        <p className="text-slate-600 leading-relaxed text-lg">{deal.whatYouGet}</p>
      </section>

      {/* How it works */}
      {deal.steps.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">How it works</h2>
          <ol className="space-y-3">
            {deal.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-600 leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Referral code */}
      {deal.referralCode && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Referral Code</h2>
          <CopyCode code={deal.referralCode} />
        </section>
      )}

      {/* Important notice */}
      {deal.importantNotes && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
          <span className="text-base leading-none mt-0.5" aria-hidden="true">⚠️</span>
          <p className="text-sm text-amber-800 leading-relaxed">{deal.importantNotes}</p>
        </div>
      )}

      {/* CTA */}
      {deal.externalUrl && (
        <a
          href={deal.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors w-full sm:w-auto"
        >
          {deal.externalLabel || 'Get Started'} <span aria-hidden="true">→</span>
        </a>
      )}

      <SharpDisclaimer />
    </div>
  );
};

export default SharpDeal;
