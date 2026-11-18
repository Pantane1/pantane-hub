import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Project } from '../types';
import { useSeo } from '../hooks/useSeo';
import { DEFAULT_OG_IMAGE, SITE_URL } from '../data/pageSeo';

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: project ? `${project.title} — Pantane Projects` : 'Project Not Found | PantaneHub',
    description: project ? (project.tagline || project.solutionSummary || project.problemSolved || 'A curated project from PantaneHub.') : 'This project does not exist or may have been removed.',
    path: `/projects/${slug || ''}`,
    image: project?.coverImage || DEFAULT_OG_IMAGE,
    type: 'article',
    noindex: !project,
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await fetch(`${apiUrl}/projects/${slug}`);
        if (!res.ok) throw new Error(`Project API ${res.status}`);
        const data = await res.json();
        if (!cancelled) setProject(data.project || null);
      } catch (err) {
        console.error('Failed to load project:', err);
        if (!cancelled) setError('Could not load this project.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProject();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="max-w-3xl mx-auto text-sm text-slate-500">Loading project…</div>;
  }

  if (error || !project) {
    return (
      <div className="fade-in max-w-lg mx-auto text-center py-20 space-y-5">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto">🚀</div>
        <h1 className="text-2xl font-bold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Project not found</h1>
        <p className="text-slate-500 text-sm">This project doesn't exist or may have been removed.</p>
        <Link to="/projects" className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-2xl font-bold text-sm hover:bg-brand-burgundy transition-colors">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-4xl mx-auto space-y-10">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-primary transition-colors">
        ← Back to Projects
      </Link>

      <div className="rounded-3xl overflow-hidden bg-slate-100">
        {project.coverImage ? (
          <img src={project.coverImage} alt={project.title} className="w-full aspect-video object-cover" />
        ) : (
          <div className="aspect-video bg-brand-navy flex items-center justify-center">
            <span className="text-white font-black text-4xl" style={{ fontFamily: 'Syne, sans-serif' }}>{project.title.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>

      <header className="space-y-4">
        {project.category && (
          <span className="inline-flex px-3 py-1 rounded-full bg-brand-rose/20 text-brand-burgundy text-xs font-bold uppercase tracking-wider">
            {project.category}
          </span>
        )}
        <h1 className="text-3xl md:text-5xl font-extrabold text-brand-navy leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          {project.title}
        </h1>
        {project.tagline && <p className="text-lg text-slate-600 leading-relaxed">{project.tagline}</p>}
        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span key={tech} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-xs font-semibold ring-1 ring-slate-200">
                {tech}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-2xl font-bold text-sm hover:bg-brand-burgundy transition-colors">
              View Live Project →
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 text-brand-navy rounded-2xl font-bold text-sm hover:border-slate-400 transition-colors">
              View Repository
            </a>
          )}
        </div>
      </header>

      {(project.problemSolved || project.solutionSummary) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {project.problemSolved && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Problem solved</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{project.problemSolved}</p>
            </div>
          )}
          {project.solutionSummary && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Solution summary</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{project.solutionSummary}</p>
            </div>
          )}
        </section>
      )}

      {project.highlights.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Highlights</h2>
          <ul className="space-y-3">
            {project.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-slate-700">
                <span className="text-brand-primary mt-1">▸</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.galleryImages.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Screenshot gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {project.galleryImages.map((image, index) => (
              <figure key={`${image.url}-${index}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <img src={image.url} alt={image.alt || project.title} loading="lazy" className="w-full aspect-video object-cover" />
                {image.alt && <figcaption className="p-4 text-sm text-slate-500">{image.alt}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="bg-brand-navy rounded-3xl p-8 md:p-10 text-white">
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Start a Similar Project</h2>
        <p className="text-slate-300 mb-6 max-w-2xl">
          Need something like this? Tell me about your project and I’ll review the scope, timeline, and quote.
        </p>
        <Link
          to="/start-project"
          className="inline-flex items-center px-7 py-3.5 bg-white text-brand-navy rounded-2xl font-bold text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all gap-2"
        >
          Request a Quote →
        </Link>
      </div>
    </div>
  );
};

export default ProjectDetail;