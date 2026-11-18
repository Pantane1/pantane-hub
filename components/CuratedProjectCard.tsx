import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';

export const CuratedProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <article className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
    <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
      {project.coverImage ? (
        <img
          src={project.coverImage}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-brand-navy flex items-center justify-center">
          <span className="text-white font-black text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>{project.title.slice(0, 2).toUpperCase()}</span>
        </div>
      )}
      {project.category && (
        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 text-brand-navy text-xs font-bold uppercase tracking-wider">
          {project.category}
        </span>
      )}
    </div>

    <div className="p-7 flex-grow flex flex-col">
      <h3 className="text-xl font-bold text-brand-navy mb-2 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{project.title}</h3>
      <p className="text-slate-500 text-sm line-clamp-3 mb-5 flex-grow leading-relaxed">
        {project.tagline || project.solutionSummary || project.problemSolved || 'A curated project from PantaneHub.'}
      </p>

      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.techStack.slice(0, 5).map((tech) => (
            <span key={tech} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[11px] font-semibold">
              {tech}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/projects/${project.slug}`}
        className="inline-flex w-fit text-sm font-bold text-brand-primary transition-colors hover:text-brand-burgundy"
      >
        View case study →
      </Link>
    </div>
  </article>
);

export const CuratedProjectSkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="aspect-video bg-slate-100" />
    <div className="p-7 space-y-3">
      <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
  </div>
);