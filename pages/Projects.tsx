import React from 'react';
import { GithubIcon } from '../components/Icons';
import { ProjectCard, ProjectSkeletonCard } from '../components/ProjectCard';
import { useGithubRepos } from '../hooks/useGithubRepos';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';

const Projects: React.FC = () => {
  useSeo(pageSeo.projects);
  const { repos, loading, error } = useGithubRepos();

  return (
    <div className="fade-in space-y-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Portfolio</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-navy mb-5 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          Built to Solve Problems.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Projects I've built and shipped — from full-stack fintech systems to mobile apps and AI tools. Each one reflects how I think and build.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <p className="text-red-500 font-semibold">Could not load repositories.</p>
          <p className="text-red-400 text-sm mt-1">The server may be waking up (free tier) — try refreshing in a few seconds.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1,2,3,4,5,6].map(i => <ProjectSkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {repos.map(r => <ProjectCard key={r.id} repo={r} />)}
        </div>
      )}

      <div className="bg-brand-navy rounded-3xl p-12 text-center text-white">
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Want to see more?</h2>
        <p className="text-slate-400 mb-7 max-w-md mx-auto text-sm leading-relaxed">
          Browse all my repositories and active contributions directly on GitHub.
        </p>
        <a
          href="https://github.com/pantane1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-7 py-3.5 bg-white text-brand-navy rounded-2xl font-bold text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all gap-2"
        >
          <GithubIcon className="w-4 h-4" />
          Browse Full Profile
        </a>
      </div>
    </div>
  );
};

export default Projects;
