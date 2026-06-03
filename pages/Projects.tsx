import React, { useEffect, useState } from 'react';
import { GithubRepo } from '../types';
import { GithubIcon } from '../components/Icons';

const ProjectCard: React.FC<{ repo: GithubRepo }> = ({ repo }) => (
  <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
    <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
      <img
        src={`https://opengraph.githubassets.com/1/pantane1/${repo.name}`}
        alt={repo.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/400/225?random=${repo.id}`; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <GithubIcon className="w-4 h-4" />
          View Source
        </a>
      </div>
    </div>

    <div className="p-7 flex-grow flex flex-col">
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="text-lg font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{repo.name}</h3>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap flex-shrink-0">
          {repo.language || 'Code'}
        </span>
      </div>

      <p className="text-slate-500 text-sm line-clamp-3 mb-5 flex-grow leading-relaxed">
        {repo.description || 'A software project built with precision and modern best practices.'}
      </p>

      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {repo.topics.slice(0, 4).map(t => (
            <span key={t} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-semibold hover:bg-blue-600 hover:text-white transition-colors cursor-default">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
        <span>Updated {new Date(repo.updated_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <div className="flex items-center gap-1 text-slate-600 font-semibold">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          {repo.stargazers_count}
        </div>
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="aspect-video bg-slate-100" />
    <div className="p-7 space-y-3">
      <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
  </div>
);

const Projects: React.FC = () => {
  const [repos, setRepos]     = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const headers: HeadersInit = {};
        const token = import.meta.env.VITE_GITHUB_TOKEN;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res  = await fetch('https://api.github.com/users/pantane1/repos?sort=updated&per_page=12', { headers });
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const data = await res.json();
        setRepos(data);
      } catch (err) {
        console.error('Failed to fetch GitHub repos:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  return (
    <div className="fade-in space-y-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Portfolio</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          Built to Solve Problems.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Projects I've built and shipped — from full-stack fintech systems to mobile apps and AI tools. Each one reflects how I think and build.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <p className="text-red-500 font-semibold">Could not load repositories.</p>
          <p className="text-red-400 text-sm mt-1">GitHub API may be rate-limited. Try again shortly.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {repos.map(r => <ProjectCard key={r.id} repo={r} />)}
        </div>
      )}

      <div className="bg-slate-900 rounded-3xl p-12 text-center text-white">
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Want to see more?</h2>
        <p className="text-slate-400 mb-7 max-w-md mx-auto text-sm leading-relaxed">
          Browse all my repositories and active contributions directly on GitHub.
        </p>
        <a
          href="https://github.com/pantane1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-7 py-3.5 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all gap-2"
        >
          <GithubIcon className="w-4 h-4" />
          Browse Full Profile
        </a>
      </div>
    </div>
  );
};

export default Projects;
