import { useEffect, useState } from 'react';
import { GithubRepo } from '../types';

/**
 * Fetches the GitHub repos list from the existing backend (VITE_API_URL/repos
 * — the same Render-hosted, rate-limit-cached endpoint pages/Projects.tsx
 * already used). Extracted here so Home.tsx can reuse the identical repos
 * for its pinned-projects section and stats count without a second,
 * diverging implementation.
 */
export const useGithubRepos = () => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchRepos = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await fetch(`${apiUrl}/repos`);
        if (!res.ok) throw new Error(`Repos API ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRepos(data);
      } catch (err) {
        console.error('Failed to fetch GitHub repos:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRepos();
    return () => { cancelled = true; };
  }, []);

  return { repos, loading, error };
};
