import { useEffect, useState } from 'react';
import { Project } from '../types';

interface UseCuratedProjectsOptions {
  featuredOnly?: boolean;
}

export const useCuratedProjects = ({ featuredOnly = false }: UseCuratedProjectsOptions = {}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchProjects = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const url = new URL(`${apiUrl}/projects`);
        if (featuredOnly) url.searchParams.set('featured', 'true');
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Projects API ${res.status}`);
        const data = await res.json();
        if (!cancelled) setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to fetch curated projects:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, [featuredOnly]);

  return { projects, loading, error };
};