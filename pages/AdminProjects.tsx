import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Project, ProjectGalleryImage } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface ProjectForm {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  problemSolved: string;
  solutionSummary: string;
  highlights: string;
  techStack: string;
  category: string;
  coverImage: string;
  galleryImages: ProjectGalleryImage[];
  liveUrl: string;
  repoUrl: string;
  githubRepoId: string;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: string;
}

interface GithubRepoOption {
  id: number;
  name: string;
  description: string;
  htmlUrl: string;
  homepage: string;
  language: string;
  topics: string[];
  updatedAt: string;
  fork: boolean;
  private: boolean;
}

const apiUrl = import.meta.env.VITE_API_URL;

const emptyForm = (): ProjectForm => ({
  title: '',
  slug: '',
  tagline: '',
  problemSolved: '',
  solutionSummary: '',
  highlights: '',
  techStack: '',
  category: '',
  coverImage: '',
  galleryImages: [],
  liveUrl: '',
  repoUrl: '',
  githubRepoId: '',
  isPublished: false,
  isFeatured: false,
  displayOrder: '0',
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const AdminProjects: React.FC = () => {
  const { csrfToken, refresh } = useAdminAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [includeForks, setIncludeForks] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = () => (csrfToken ? { 'X-CSRF-Token': csrfToken } : {});

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/admin/projects`, { withCredentials: true });
      setProjects(res.data.projects || []);
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const startEdit = (project: Project) => {
    setForm({
      id: project.id,
      title: project.title,
      slug: project.slug,
      tagline: project.tagline,
      problemSolved: project.problemSolved,
      solutionSummary: project.solutionSummary,
      highlights: project.highlights.join('\n'),
      techStack: project.techStack.join(', '),
      category: project.category,
      coverImage: project.coverImage,
      galleryImages: project.galleryImages,
      liveUrl: project.liveUrl,
      repoUrl: project.repoUrl,
      githubRepoId: project.githubRepoId ? String(project.githubRepoId) : '',
      isPublished: project.isPublished,
      isFeatured: project.isFeatured,
      displayOrder: String(project.displayOrder),
    });
    setEditingId(project.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildProject = () => ({
    title: form.title.trim(),
    slug: form.slug.trim(),
    tagline: form.tagline.trim(),
    problemSolved: form.problemSolved.trim(),
    solutionSummary: form.solutionSummary.trim(),
    highlights: form.highlights.split('\n').map((item) => item.trim()).filter(Boolean),
    techStack: form.techStack.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
    category: form.category.trim(),
    coverImage: form.coverImage.trim(),
    galleryImages: form.galleryImages,
    liveUrl: form.liveUrl.trim(),
    repoUrl: form.repoUrl.trim(),
    githubRepoId: form.githubRepoId ? Number(form.githubRepoId) : undefined,
    isPublished: form.isPublished,
    isFeatured: form.isFeatured,
    displayOrder: Number(form.displayOrder || 0),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const project = buildProject();
    if (!project.title || !project.slug) {
      setError('Title and slug are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await axios.patch(`${apiUrl}/admin/projects/${editingId}`, project, { withCredentials: true, headers: authHeaders() });
        setSuccess('Project updated.');
      } else {
        await axios.post(`${apiUrl}/admin/projects`, project, { withCredentials: true, headers: authHeaders() });
        setSuccess('Project created as a draft.');
      }
      resetForm();
      await loadProjects();
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.delete(`${apiUrl}/admin/projects/${project.id}`, { withCredentials: true, headers: authHeaders() });
      setSuccess('Project deleted.');
      if (editingId === project.id) resetForm();
      await loadProjects();
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to delete project.');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const sorted = [...projects].sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title));
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= sorted.length) return;

    const current = sorted[index];
    const other = sorted[otherIndex];
    setSaving(true);
    setError(null);
    try {
      await axios.post(
        `${apiUrl}/admin/projects/reorder`,
        {
          projects: [
            { id: current.id, displayOrder: other.displayOrder },
            { id: other.id, displayOrder: current.displayOrder },
          ],
        },
        { withCredentials: true, headers: authHeaders() }
      );
      await loadProjects();
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to reorder projects.');
    } finally {
      setSaving(false);
    }
  };

  const loadGithubRepos = async () => {
    setImportLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (repoSearch.trim()) params.set('search', repoSearch.trim());
      if (includeForks) params.set('includeForks', 'true');
      const res = await axios.get(`${apiUrl}/admin/github/repos?${params.toString()}`, { withCredentials: true });
      setRepos(res.data.repositories || []);
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load GitHub repositories.');
    } finally {
      setImportLoading(false);
    }
  };

  const importGithubRepo = async (repo: GithubRepoOption) => {
    setImportingId(repo.id);
    setError(null);
    try {
      const res = await axios.post(
        `${apiUrl}/admin/projects/import/github`,
        { githubRepoId: repo.id },
        { withCredentials: true, headers: authHeaders() }
      );
      const project = res.data.project;
      setForm({
        ...emptyForm(),
        title: project.title || repo.name,
        slug: project.slug || slugify(repo.name),
        tagline: project.tagline || repo.description || '',
        problemSolved: project.problemSolved || '',
        solutionSummary: project.solutionSummary || repo.description || '',
        techStack: (project.techStack || []).join(', ') || [repo.language, ...(repo.topics || [])].filter(Boolean).join(', '),
        category: project.category || 'Software',
        coverImage: project.coverImage || '',
        galleryImages: project.galleryImages || [],
        liveUrl: project.liveUrl || repo.homepage || '',
        repoUrl: project.repoUrl || repo.htmlUrl || '',
        githubRepoId: project.githubRepoId ? String(project.githubRepoId) : String(repo.id),
        isPublished: false,
        isFeatured: false,
        displayOrder: String(project.displayOrder || 0),
      });
      setEditingId(project.id);
      setImportOpen(false);
      setSuccess(res.data.alreadyImported ? 'Repository already imported. Editing existing draft.' : 'GitHub repository imported as a draft.');
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to import GitHub repository.');
    } finally {
      setImportingId(null);
    }
  };

  const uploadImage = async (file: File, target: 'cover' | 'gallery') => {
    if (!form.slug.trim()) {
      setError('Enter a slug before uploading images.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files can be uploaded.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const res = await axios.post(
        `${apiUrl}/admin/projects/assets`,
        {
          slug: form.slug.trim(),
          filename: file.name,
          contentType: file.type,
          data: dataUrl,
        },
        { withCredentials: true, headers: authHeaders() }
      );

      if (target === 'cover') {
        setForm((current) => ({ ...current, coverImage: res.data.url }));
      } else {
        setForm((current) => ({
          ...current,
          galleryImages: [...current.galleryImages, { url: res.data.url, alt: file.name }],
        }));
      }
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (importOpen) loadGithubRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importOpen]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Projects</h1>
          <p className="text-slate-600 mt-1">Curate accomplished projects, screenshots, case studies, and publishing status.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-brand-primary/40 text-brand-primary text-sm font-bold hover:bg-brand-primary hover:text-white"
          >
            Import from GitHub
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy"
          >
            New project
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
            {editingId ? 'Edit project' : 'New project'}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wide">
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Slug</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="url-safe-slug" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tagline</label>
          <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Problem solved</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" rows={4} value={form.problemSolved} onChange={(e) => setForm((f) => ({ ...f, problemSolved: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Solution summary</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" rows={4} value={form.solutionSummary} onChange={(e) => setForm((f) => ({ ...f, solutionSummary: e.target.value }))} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Highlights (one per line)</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" rows={4} value={form.highlights} onChange={(e) => setForm((f) => ({ ...f, highlights: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tech stack (comma-separated)</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" rows={4} value={form.techStack} onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Display order</label>
            <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
              Featured
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Cover image URL</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} placeholder="https://... or /uploads/projects/..." />
            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')} />
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploading || !form.slug.trim()} className="mt-2 text-xs font-bold text-brand-primary hover:text-brand-burgundy disabled:opacity-50">
              {uploading ? 'Uploading…' : 'Upload cover image'}
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Live URL</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.liveUrl} onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))} placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Repository URL (optional)</label>
          <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.repoUrl} onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))} placeholder="https://github.com/..." />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Gallery image URLs</label>
          <div className="space-y-2">
            {form.galleryImages.map((image, index) => (
              <div key={`${image.url}-${index}`} className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  value={image.url}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    galleryImages: f.galleryImages.map((item, itemIndex) => (itemIndex === index ? { ...item, url: e.target.value } : item)),
                  }))}
                />
                <input
                  className="w-40 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  value={image.alt || ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    galleryImages: f.galleryImages.map((item, itemIndex) => (itemIndex === index ? { ...item, alt: e.target.value } : item)),
                  }))}
                  placeholder="Alt text"
                />
                <button type="button" onClick={() => setForm((f) => ({ ...f, galleryImages: f.galleryImages.filter((_, itemIndex) => itemIndex !== index) }))} className="px-3 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600">
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, galleryImages: [...f.galleryImages, { url: '', alt: '' }] }))}
                className="text-xs font-bold text-slate-500 hover:text-brand-primary uppercase tracking-wide px-1"
              >
                + Add image URL
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading || !form.slug.trim()}
                className="text-xs font-bold text-brand-primary hover:text-brand-burgundy disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload screenshot'}
              </button>
              <input ref={galleryInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'gallery')} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {editingId && (
            <button type="button" onClick={() => handleDelete(projects.find((project) => project.id === editingId) as Project)} className="rounded-xl px-4 py-3 text-sm font-bold text-rose-500 hover:text-rose-700">
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-2xl bg-brand-primary px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-burgundy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create draft'}
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Existing projects</h2>
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">No projects yet.</div>
        ) : (
          <div className="space-y-3">
            {[...projects].sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title)).map((project, index, sorted) => (
              <div key={project.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{project.title}</p>
                  <p className="text-xs text-slate-400">/{project.slug} · {project.isPublished ? 'Published' : 'Draft'}{project.isFeatured ? ' · Featured' : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => handleReorder(index, -1)} disabled={index === 0 || saving} className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40">↑</button>
                  <button type="button" onClick={() => handleReorder(index, 1)} disabled={index === sorted.length - 1 || saving} className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40">↓</button>
                  <button type="button" onClick={() => startEdit(project)} className="text-xs font-bold text-slate-500 hover:text-brand-primary uppercase tracking-wide px-2">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Import from GitHub</h2>
              <button type="button" onClick={() => setImportOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="search"
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                placeholder="Search repositories..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={includeForks} onChange={(e) => setIncludeForks(e.target.checked)} />
                Include forks
              </label>
              <button type="button" onClick={loadGithubRepos} className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy">
                Search
              </button>
            </div>
            {importLoading ? (
              <p className="text-sm text-slate-500">Loading repositories…</p>
            ) : repos.length === 0 ? (
              <p className="text-sm text-slate-500">No repositories found.</p>
            ) : (
              <div className="space-y-2">
                {repos.map((repo) => (
                  <div key={repo.id} className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800">{repo.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{repo.description || 'No description'}</p>
                      <p className="text-xs text-slate-400 mt-1">{repo.language || 'Code'} · {repo.updatedAt.slice(0, 10)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => importGithubRepo(repo)}
                      disabled={importingId === repo.id}
                      className="shrink-0 px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-burgundy disabled:opacity-50"
                    >
                      {importingId === repo.id ? 'Importing…' : 'Import'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;