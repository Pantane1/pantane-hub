import React from 'react';
import { GithubRepo } from '../types';
import { GithubIcon } from './Icons';

export const ProjectCard: React.FC<{ repo: GithubRepo }> = ({ repo }) => (
  <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
    <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
      <img
        src={`https://opengraph.githubassets.com/1/pantane1/${repo.name}`}
        alt={repo.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (!parent || parent.querySelector('.fallback-card')) return;
          const lang = repo.language || 'Code';
          const desc = repo.description
            ? repo.description.slice(0, 72) + (repo.description.length > 72 ? '…' : '')
            : 'A project built with precision and care.';
         const fallback = document.createElement('div');
         fallback.className = 'fallback-card';
         fallback.style.cssText = 'width:100%;height:100%;background:var(--brand-navy);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px;position:relative;box-sizing:border-box;';
         fallback.innerHTML = `
           <div style="position:absolute;top:10px;right:12px;background:rgba(255,255,255,0.08);border-radius:6px;padding:2px 8px;font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:0.05em;">${lang}</div>
           <div style="width:34px;height:34px;background:var(--brand-burgundy);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">⚡</div>
           <p style="margin:0;font-size:13px;font-weight:700;color:#f1f5f9;text-align:center;font-family:Syne,sans-serif;">${repo.name}</p>
           <p style="margin:0;font-size:10px;color:#64748b;text-align:center;line-height:1.5;max-width:200px;">${desc}</p>
        `;
        parent.appendChild(fallback);
      }}
     />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white text-brand-navy rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <GithubIcon className="w-4 h-4" />
          View Source
        </a>
      </div>
    </div>

    <div className="p-7 flex-grow flex flex-col">
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="text-lg font-bold text-brand-navy leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{repo.name}</h3>
        <span className="text-[10px] font-bold text-brand-primary bg-brand-rose/10 px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap flex-shrink-0">
          {repo.language || 'Code'}
        </span>
      </div>

      <p className="text-slate-500 text-sm line-clamp-3 mb-5 flex-grow leading-relaxed">
        {repo.description || 'A software project built with precision and modern best practices.'}
      </p>

      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {repo.topics.slice(0, 4).map(t => (
            <span key={t} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-semibold hover:bg-brand-primary hover:text-white transition-colors cursor-default">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
        <span>Updated {new Date(repo.updated_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <div className="flex items-center gap-1 text-slate-600 font-semibold">
          <svg className="w-3.5 h-3.5 text-brand-rose" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          {repo.stargazers_count}
        </div>
      </div>
    </div>
  </div>
);

export const ProjectSkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="aspect-video bg-slate-100" />
    <div className="p-7 space-y-3">
      <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
  </div>
);
