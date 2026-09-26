import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const NotFound: React.FC = () => {
  const location = useLocation();

  useSeo({
    title: 'Page Not Found | Pantane Hub',
    description: "The page you're looking for doesn't exist or may have moved.",
    path: location.pathname,
    noindex: true,
  });

  return (
    <div className="fade-in max-w-lg mx-auto text-center py-24 space-y-6">
      <p className="text-6xl font-extrabold text-slate-200" style={{ fontFamily: 'Syne, sans-serif' }}>404</p>
      <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>Page not found</h1>
      <p className="text-slate-500 text-sm">
        The page you're looking for doesn't exist or may have moved. Here are a few places to go instead:
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link to="/" className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-colors">
          ← Back home
        </Link>
        <Link to="/projects" className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:border-slate-400 transition-colors">
          See Projects
        </Link>
        <Link to="/journal" className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:border-slate-400 transition-colors">
          Read the Journal
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
