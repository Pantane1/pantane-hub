import React from 'react';
import { GithubIcon } from '../components/Icons';
import { CuratedProjectCard, CuratedProjectSkeletonCard } from '../components/CuratedProjectCard';
import { useCuratedProjects } from '../hooks/useCuratedProjects';
import { useSeo } from '../hooks/useSeo';
import { pageSeo } from '../data/pageSeo';

const Projects: React.FC = () => {
  useSeo(pageSeo.projects);
  const { projects, loading, error } = useCuratedProjects();

  return (
    <div className="fade-in space-y-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Portfolio</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-navy mb-5 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          Built to Solve Problems.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Selected projects, case studies, and client work. Each entry shows the problem, solution, and technologies behind the build.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <p className="text-red-500 font-semibold">Could not load projects.</p>
          <p className="text-red-400 text-sm mt-1">The server may be waking up (free tier) — try refreshing in a few seconds.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1, 2, 3, 4, 5, 6].map((i) => <CuratedProjectSkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-14 text-center space-y-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mx-auto">🚀</div>
          <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>No published projects yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Curated case studies are being prepared. You can still browse all public repositories on GitHub.
          </p>
          <a
            href="https://github.com/pantane1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-slate-400 transition-colors"
          >
            <GithubIcon className="w-4 h-4 mr-2" />
            Browse GitHub Profile
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {projects.map((project) => <CuratedProjectCard key={project.id} project={project} />)}
        </div>
      )}

      <div className="bg-brand-navy rounded-3xl p-12 text-center text-white">
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Want to see more?</h2>
        <p className="text-slate-400 mb-7 max-w-md mx-auto text-sm leading-relaxed">
          Browse all public repositories and active contributions directly on GitHub.
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