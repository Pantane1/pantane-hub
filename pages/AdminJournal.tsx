import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { JournalPost, JournalCategory, SocialPlatform } from '../types';
import { JOURNAL_CATEGORIES } from '../data/journal';

const SOCIAL_PLATFORMS: SocialPlatform[] = ['github', 'linkedin', 'twitter', 'instagram', 'facebook', 'whatsapp'];
const CATEGORIES = JOURNAL_CATEGORIES.filter((c): c is JournalCategory => c !== 'All');

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  content: '',        // textarea, one paragraph per line
  date: todayIso(),
  category: 'Blog' as JournalCategory,
  tags: '',            // comma-separated
  image: '',
  featured: false,
  links: [] as { label: string; url: string }[],
  sharedOn: [] as SocialPlatform[],
  serviceCta: '',
});

type FormState = ReturnType<typeof emptyForm>;

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";

const AdminJournal: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/admin/journal`, { headers: authHeaders() });
      setPosts(res.data.posts);
      setSha(res.data.sha);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('admin_token');
        setToken(null);
      }
      setError(err?.response?.data?.error || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await axios.post(`${apiUrl}/admin/login`, {}, { headers: { Authorization: `Bearer ${passwordInput}` } });
      sessionStorage.setItem('admin_token', passwordInput);
      setToken(passwordInput);
    } catch (err: any) {
      setLoginError(err?.response?.data?.error || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken(null);
    setPosts([]);
    setSha(null);
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingSlug(null);
  };

  const startEdit = (post: JournalPost) => {
    setForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content.join('\n'),
      date: post.date,
      category: post.category,
      tags: post.tags.join(', '),
      image: post.image || '',
      featured: !!post.featured,
      links: post.links?.map(l => ({ label: l.label, url: l.url })) || [],
      sharedOn: post.sharedOn || [],
      serviceCta: post.service?.cta || '',
    });
    setEditingSlug(post.slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSharedOn = (platform: SocialPlatform) => {
    setForm(f => ({
      ...f,
      sharedOn: f.sharedOn.includes(platform)
        ? f.sharedOn.filter(p => p !== platform)
        : [...f.sharedOn, platform],
    }));
  };

  const addLinkRow = () => setForm(f => ({ ...f, links: [...f.links, { label: '', url: '' }] }));
  const removeLinkRow = (index: number) => setForm(f => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  const updateLinkRow = (index: number, field: 'label' | 'url', value: string) =>
    setForm(f => ({ ...f, links: f.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)) }));

  const buildPostFromForm = (): JournalPost => {
    const post: JournalPost = {
      id: form.id || String(Date.now()),
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.split('\n').map(s => s.trim()).filter(Boolean),
      date: form.date,
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (form.image.trim()) post.image = form.image.trim();
    if (form.featured) post.featured = true;
    const cleanLinks = form.links
      .map(l => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter(l => l.label && l.url);
    if (cleanLinks.length) post.links = cleanLinks;
    if (form.sharedOn.length) post.sharedOn = form.sharedOn;
    if (form.serviceCta.trim()) post.service = { cta: form.serviceCta.trim() };
    return post;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.slug.trim() || !form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setError('Slug, title, excerpt, and content are required.');
      return;
    }

    const newPost = buildPostFromForm();
    const isEditing = editingSlug !== null;

    if (!isEditing && posts.some(p => p.slug === newPost.slug)) {
      setError('That slug is already in use. Choose a unique one.');
      return;
    }

    const updatedPosts = isEditing
      ? posts.map(p => (p.slug === editingSlug ? newPost : p))
      : [...posts, newPost];

    setSaving(true);
    try {
      const res = await axios.post(
        `${apiUrl}/admin/journal`,
        { posts: updatedPosts, sha, message: `${isEditing ? 'Update' : 'Add'} journal post: ${newPost.title}` },
        { headers: authHeaders() }
      );
      setPosts(updatedPosts);
      setSuccess(isEditing ? 'Post updated and pushed. Vercel will redeploy shortly.' : 'Post published and pushed. Vercel will redeploy shortly.');
      resetForm();
      // Refresh to pick up the new file sha for the next edit
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: JournalPost) => {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    const updatedPosts = posts.filter(p => p.slug !== post.slug);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(
        `${apiUrl}/admin/journal`,
        { posts: updatedPosts, sha, message: `Delete journal post: ${post.title}` },
        { headers: authHeaders() }
      );
      setPosts(updatedPosts);
      setSuccess('Post deleted and pushed.');
      if (editingSlug === post.slug) resetForm();
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="fade-in max-w-sm mx-auto mt-20">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Journal Admin</h1>
          <p className="text-sm text-slate-500 mb-6">Enter the admin password to continue.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              autoFocus
              className={inputClass}
              placeholder="Password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
            />
            {loginError && <p className="text-sm text-rose-600">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading || !passwordInput}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Checking…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-3xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>Journal Admin</h1>
        <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wide">
          Log out
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      {/* ── Form ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
            {editingSlug ? `Editing: ${editingSlug}` : 'New post'}
          </h2>
          {editingSlug && (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wide">
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input className={inputClass} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-safe-slug" disabled={!!editingSlug} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Excerpt</label>
          <textarea className={inputClass} rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
        </div>

        <div>
          <label className={labelClass}>Content (one paragraph per line)</label>
          <textarea className={inputClass} rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as JournalCategory }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input className={inputClass} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="WebDevelopment, PantaneHub" />
        </div>

        <div>
          <label className={labelClass}>Image URL (optional)</label>
          <input className={inputClass} value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
        </div>

        <div>
          <label className={labelClass}>Links (optional — GitHub, live project, etc.)</label>
          <div className="space-y-2">
            {form.links.map((link, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                <input
                  className={inputClass}
                  value={link.label}
                  onChange={e => updateLinkRow(i, 'label', e.target.value)}
                  placeholder="Label (e.g. GitHub)"
                />
                <input
                  className={inputClass}
                  value={link.url}
                  onChange={e => updateLinkRow(i, 'url', e.target.value)}
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => removeLinkRow(i)}
                  aria-label="Remove link"
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLinkRow}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide px-1"
            >
              + Add link
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Shared on (optional)</label>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_PLATFORMS.map(platform => (
              <button
                type="button"
                key={platform}
                onClick={() => toggleSharedOn(platform)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                  form.sharedOn.includes(platform)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Service CTA text (optional — adds a "Request this service" style button)</label>
          <input className={inputClass} value={form.serviceCta} onChange={e => setForm(f => ({ ...f, serviceCta: e.target.value }))} placeholder="Request this service" />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
          Featured post
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-400 text-slate-900 font-bold py-3 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          {saving ? 'Pushing to GitHub…' : editingSlug ? 'Save changes' : 'Publish post'}
        </button>
      </form>

      {/* ── Existing posts ─────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Existing posts {loading && '· loading…'}
        </h2>
        <div className="space-y-2">
          {[...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(post => (
            <div key={post.slug} className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{post.title}</p>
                <p className="text-xs text-slate-400">{post.date} · {post.category} · /{post.slug}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(post)} className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide px-2">
                  Edit
                </button>
                <button onClick={() => handleDelete(post)} className="text-xs font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wide px-2">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && posts.length === 0 && <p className="text-sm text-slate-400">No posts yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminJournal;
