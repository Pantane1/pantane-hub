import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SharpDeal, SharpCategory, SharpDealType, SharpStatus, SharpRequestField } from '../types';
import { SHARP_CATEGORIES } from '../data/sharp';

const CATEGORIES = SHARP_CATEGORIES.filter((c): c is SharpCategory => c !== 'All');
const DEAL_TYPES: SharpDealType[] = ['reward', 'buying', 'service-request'];
const STATUSES: SharpStatus[] = ['active', 'expired'];

/** Every SharpDeal key this form reads and writes. Any OTHER key on an existing
 *  deal (added by hand, by another tool, or by a future feature) is carried
 *  through an edit untouched, so saving here can never silently strip it. */
const MANAGED_KEYS = new Set([
  'id', 'slug', 'title', 'category', 'description', 'whatYouGet', 'dealType', 'reward',
  'referralReward', 'status', 'statusLabel', 'cardHeadline', 'datePosted', 'deadline',
  'steps', 'referralCode', 'externalUrl', 'externalLabel', 'importantNotes', 'platforms',
  'pricingNote', 'safetyNote', 'requestFields', 'requestSubject', 'thumbnail',
  'thumbnailTheme', 'feedbackForm',
]);

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  id: '',
  slug: '',
  title: '',
  category: 'Rewards' as SharpCategory,
  description: '',
  whatYouGet: '',
  dealType: 'reward' as SharpDealType,
  reward: '',
  referralReward: '',
  status: 'active' as SharpStatus,
  statusLabel: '',
  cardHeadline: '',
  datePosted: todayIso(),
  deadline: '',
  steps: '',             // textarea, one step per line
  referralCode: '',
  externalUrl: '',
  externalLabel: '',
  importantNotes: '',
  platforms: '',         // comma-separated
  pricingNote: '',
  safetyNote: '',
  requestFieldsJson: '', // raw JSON array, validated on submit
  feedbackFormJson: '',  // raw JSON object (e.g. Uber Eats feedback modal), validated on submit
  requestSubject: '',
  thumbnail: '',
  thumbnailPreset: '',
  thumbnailIcon: '',
  thumbnailWordmark: '',
});

type FormState = ReturnType<typeof emptyForm>;

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";

const AdminSharp: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [deals, setDeals] = useState<SharpDeal[]>([]);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const loadDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/admin/sharp`, { headers: authHeaders() });
      setDeals(res.data.deals);
      setSha(res.data.sha);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('admin_token');
        setToken(null);
      }
      setError(err?.response?.data?.error || 'Failed to load deals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadDeals();
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
    setDeals([]);
    setSha(null);
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingSlug(null);
  };

  const startEdit = (deal: SharpDeal) => {
    setForm({
      id: deal.id,
      slug: deal.slug,
      title: deal.title,
      category: deal.category,
      description: deal.description,
      whatYouGet: deal.whatYouGet,
      dealType: deal.dealType || 'reward',
      reward: deal.reward || '',
      referralReward: deal.referralReward || '',
      status: deal.status,
      statusLabel: deal.statusLabel || '',
      cardHeadline: deal.cardHeadline || '',
      datePosted: deal.datePosted,
      deadline: deal.deadline || '',
      steps: deal.steps.join('\n'),
      referralCode: deal.referralCode || '',
      externalUrl: deal.externalUrl || '',
      externalLabel: deal.externalLabel || '',
      importantNotes: deal.importantNotes || '',
      platforms: deal.platforms?.join(', ') || '',
      pricingNote: deal.pricingNote || '',
      safetyNote: deal.safetyNote || '',
      requestFieldsJson: deal.requestFields ? JSON.stringify(deal.requestFields, null, 2) : '',
      feedbackFormJson: deal.feedbackForm ? JSON.stringify(deal.feedbackForm, null, 2) : '',
      requestSubject: deal.requestSubject || '',
      thumbnail: deal.thumbnail || '',
      thumbnailPreset: deal.thumbnailTheme?.preset || '',
      thumbnailIcon: deal.thumbnailTheme?.icon || '',
      thumbnailWordmark: deal.thumbnailTheme?.wordmark || '',
    });
    setEditingSlug(deal.slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildDealFromForm = (): SharpDeal => {
    const deal: SharpDeal = {
      id: form.id || String(Date.now()),
      slug: form.slug.trim(),
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      whatYouGet: form.whatYouGet.trim(),
      status: form.status,
      datePosted: form.datePosted,
      steps: form.steps.split('\n').map(s => s.trim()).filter(Boolean),
    };
    if (form.dealType !== 'reward') deal.dealType = form.dealType;
    if (form.reward.trim()) deal.reward = form.reward.trim();
    if (form.referralReward.trim()) deal.referralReward = form.referralReward.trim();
    if (form.statusLabel.trim()) deal.statusLabel = form.statusLabel.trim();
    if (form.cardHeadline.trim()) deal.cardHeadline = form.cardHeadline.trim();
    if (form.deadline.trim()) deal.deadline = form.deadline.trim();
    if (form.referralCode.trim()) deal.referralCode = form.referralCode.trim();
    if (form.externalUrl.trim()) deal.externalUrl = form.externalUrl.trim();
    if (form.externalLabel.trim()) deal.externalLabel = form.externalLabel.trim();
    if (form.importantNotes.trim()) deal.importantNotes = form.importantNotes.trim();
    if (form.pricingNote.trim()) deal.pricingNote = form.pricingNote.trim();
    if (form.safetyNote.trim()) deal.safetyNote = form.safetyNote.trim();
    if (form.requestSubject.trim()) deal.requestSubject = form.requestSubject.trim();
    if (form.thumbnail.trim()) deal.thumbnail = form.thumbnail.trim();
    const platforms = form.platforms.split(',').map(p => p.trim()).filter(Boolean);
    if (platforms.length) deal.platforms = platforms;
    if (form.thumbnailPreset.trim() || form.thumbnailIcon.trim() || form.thumbnailWordmark.trim()) {
      deal.thumbnailTheme = {
        preset: form.thumbnailPreset.trim() || undefined,
        icon: form.thumbnailIcon.trim() || '⚡',
        wordmark: form.thumbnailWordmark.trim() || undefined,
      };
    }
    if (form.requestFieldsJson.trim()) {
      deal.requestFields = JSON.parse(form.requestFieldsJson) as SharpRequestField[];
    }
    if (form.feedbackFormJson.trim()) {
      deal.feedbackForm = JSON.parse(form.feedbackFormJson);
    }
    return deal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.slug.trim() || !form.title.trim() || !form.description.trim() || !form.whatYouGet.trim()) {
      setError('Slug, title, description, and "what you get" are required.');
      return;
    }

    let newDeal: SharpDeal;
    try {
      newDeal = buildDealFromForm();
    } catch {
      setError('Request fields / feedback form must be valid JSON (or left blank). Check the syntax.');
      return;
    }

    const isEditing = editingSlug !== null;

    if (!isEditing && deals.some(d => d.slug === newDeal.slug)) {
      setError('That slug is already in use. Choose a unique one.');
      return;
    }

    const updatedDeals = isEditing
      ? deals.map(d => {
          if (d.slug !== editingSlug) return d;
          const preserved = Object.fromEntries(Object.entries(d).filter(([k]) => !MANAGED_KEYS.has(k)));
          return { ...preserved, ...newDeal } as SharpDeal;
        })
      : [...deals, newDeal];

    setSaving(true);
    try {
      await axios.post(
        `${apiUrl}/admin/sharp`,
        { deals: updatedDeals, sha, message: `${isEditing ? 'Update' : 'Add'} Sharp deal: ${newDeal.title}` },
        { headers: authHeaders() }
      );
      setDeals(updatedDeals);
      setSuccess(isEditing ? 'Deal updated and pushed. Vercel will redeploy shortly.' : 'Deal published and pushed. Vercel will redeploy shortly.');
      resetForm();
      loadDeals();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deal: SharpDeal) => {
    if (!window.confirm(`Delete "${deal.title}"? This can't be undone.`)) return;
    const updatedDeals = deals.filter(d => d.slug !== deal.slug);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(
        `${apiUrl}/admin/sharp`,
        { deals: updatedDeals, sha, message: `Delete Sharp deal: ${deal.title}` },
        { headers: authHeaders() }
      );
      setDeals(updatedDeals);
      setSuccess('Deal deleted and pushed.');
      if (editingSlug === deal.slug) resetForm();
      loadDeals();
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
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Sharp Admin</h1>
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
        <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>⚡ Sharp Admin</h1>
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
            {editingSlug ? `Editing: ${editingSlug}` : 'New deal'}
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
            <input className={inputClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="HEIST ATTACK" />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input className={inputClass} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-safe-slug" disabled={!!editingSlug} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SharpCategory }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Deal Type</label>
            <select className={inputClass} value={form.dealType} onChange={e => setForm(f => ({ ...f, dealType: e.target.value as SharpDealType }))}>
              {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SharpStatus }))}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status label override (optional — e.g. "Buying")</label>
            <input className={inputClass} value={form.statusLabel} onChange={e => setForm(f => ({ ...f, statusLabel: e.target.value }))} placeholder="Active" />
          </div>
          <div>
            <label className={labelClass}>Card headline override (optional — e.g. "I Buy Accounts")</label>
            <input className={inputClass} value={form.cardHeadline} onChange={e => setForm(f => ({ ...f, cardHeadline: e.target.value }))} placeholder="Defaults to 'Get {reward}'" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description (short, shown on the card)</label>
          <textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div>
          <label className={labelClass}>What You Get (longer, detail page)</label>
          <textarea className={inputClass} rows={3} value={form.whatYouGet} onChange={e => setForm(f => ({ ...f, whatYouGet: e.target.value }))} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date Posted</label>
            <input type="date" className={inputClass} value={form.datePosted} onChange={e => setForm(f => ({ ...f, datePosted: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Deadline (optional)</label>
            <input type="date" className={inputClass} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className={labelClass}>How it works (one step per line, optional)</label>
          <textarea className={inputClass} rows={4} value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} />
        </div>

        {form.dealType === 'reward' && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Reward (e.g. "KSh 50")</label>
                <input className={inputClass} value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Referral reward (optional)</label>
                <input className={inputClass} value={form.referralReward} onChange={e => setForm(f => ({ ...f, referralReward: e.target.value }))} placeholder="KSh 100 per referral" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Referral code (optional)</label>
                <input className={inputClass} value={form.referralCode} onChange={e => setForm(f => ({ ...f, referralCode: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>External URL (Play Store, app link, etc.)</label>
                <input className={inputClass} value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className={labelClass}>External CTA label (optional)</label>
              <input className={inputClass} value={form.externalLabel} onChange={e => setForm(f => ({ ...f, externalLabel: e.target.value }))} placeholder="Get Started" />
            </div>
          </>
        )}

        {(form.dealType === 'buying' || form.dealType === 'service-request') && (
          <>
            {form.dealType === 'buying' && (
              <div>
                <label className={labelClass}>Platforms (comma-separated)</label>
                <input className={inputClass} value={form.platforms} onChange={e => setForm(f => ({ ...f, platforms: e.target.value }))} placeholder="X (Twitter), Instagram, Facebook" />
              </div>
            )}
            <div>
              <label className={labelClass}>Pricing / availability note</label>
              <input className={inputClass} value={form.pricingNote} onChange={e => setForm(f => ({ ...f, pricingNote: e.target.value }))} />
            </div>
            {form.dealType === 'buying' && (
              <div>
                <label className={labelClass}>Safety / ownership note</label>
                <input className={inputClass} value={form.safetyNote} onChange={e => setForm(f => ({ ...f, safetyNote: e.target.value }))} placeholder="Only submit accounts you legitimately own or are authorized to transfer." />
              </div>
            )}
            <div>
              <label className={labelClass}>Request form fields (JSON array — copy an existing deal's as a template)</label>
              <textarea
                className={`${inputClass} font-mono text-xs`}
                rows={6}
                value={form.requestFieldsJson}
                onChange={e => setForm(f => ({ ...f, requestFieldsJson: e.target.value }))}
                placeholder='[{"name":"platform","label":"Platform","type":"select","required":true,"options":["X","Instagram"]}]'
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Request email subject</label>
                <input className={inputClass} value={form.requestSubject} onChange={e => setForm(f => ({ ...f, requestSubject: e.target.value }))} placeholder="Sharp: Deal Name" />
              </div>
              <div>
                <label className={labelClass}>Submit button label</label>
                <input className={inputClass} value={form.externalLabel} onChange={e => setForm(f => ({ ...f, externalLabel: e.target.value }))} placeholder="Submit Account" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Feedback form (optional JSON object — copy Uber Eats' as a template)</label>
          <textarea
            className={`${inputClass} font-mono text-xs`}
            rows={4}
            value={form.feedbackFormJson}
            onChange={e => setForm(f => ({ ...f, feedbackFormJson: e.target.value }))}
            placeholder='{"ctaLabel":"Share feedback","whatsappNumber":"2547..."}'
          />
        </div>

        <div>
          <label className={labelClass}>Important notice (optional)</label>
          <textarea className={inputClass} rows={2} value={form.importantNotes} onChange={e => setForm(f => ({ ...f, importantNotes: e.target.value }))} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Thumbnail image URL (optional)</label>
            <input className={inputClass} value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} placeholder="/assets/sharp-deals/slug.jpg" />
          </div>
          <div>
            <label className={labelClass}>Placeholder preset key (optional)</label>
            <input className={inputClass} value={form.thumbnailPreset} onChange={e => setForm(f => ({ ...f, thumbnailPreset: e.target.value }))} placeholder="default / absa / loop / accounts / numbers / ubereats" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Placeholder icon (emoji, optional)</label>
            <input className={inputClass} value={form.thumbnailIcon} onChange={e => setForm(f => ({ ...f, thumbnailIcon: e.target.value }))} placeholder="⚡" />
          </div>
          <div>
            <label className={labelClass}>Placeholder wordmark text (optional)</label>
            <input className={inputClass} value={form.thumbnailWordmark} onChange={e => setForm(f => ({ ...f, thumbnailWordmark: e.target.value }))} placeholder="SHARP" />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-400 text-slate-900 font-bold py-3 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          {saving ? 'Pushing to GitHub…' : editingSlug ? 'Save changes' : 'Publish deal'}
        </button>
      </form>

      {/* ── Existing deals ─────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Existing deals {loading && '· loading…'}
        </h2>
        <div className="space-y-2">
          {[...deals].sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()).map(deal => (
            <div key={deal.slug} className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{deal.title}</p>
                <p className="text-xs text-slate-400">{deal.datePosted} · {deal.category} · {deal.dealType || 'reward'} · /{deal.slug}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(deal)} className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide px-2">
                  Edit
                </button>
                <button onClick={() => handleDelete(deal)} className="text-xs font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wide px-2">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && deals.length === 0 && <p className="text-sm text-slate-400">No deals yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminSharp;
