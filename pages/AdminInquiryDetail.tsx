import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface InquiryDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  service: string;
  description: string;
  budget: string;
  timeline: string;
  requirements: string;
  name: string;
  email: string;
  phone: string | null;
  business: string | null;
  status: string;
  internalNotes: string;
  notificationStatus: string;
  notificationError: string | null;
  lastNotifiedAt: string | null;
}

const apiUrl = import.meta.env.VITE_API_URL;

const AdminInquiryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { csrfToken, refresh } = useAdminAuth();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadInquiry = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/admin/inquiries/${id}`, { withCredentials: true });
      const data = res.data;
      setInquiry(data.inquiry);
      setEvents(data.events || []);
      setAttempts(data.notificationAttempts || []);
      setStatus(data.inquiry.status);
      setInternalNotes(data.inquiry.internalNotes || '');
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load inquiry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.patch(
        `${apiUrl}/admin/inquiries/${id}`,
        { status, internalNotes },
        { withCredentials: true, headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {} }
      );
      setInquiry(res.data.inquiry);
      setSuccess('Inquiry updated.');
      await loadInquiry();
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to update inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.post(
        `${apiUrl}/admin/inquiries/${id}/notify`,
        {},
        { withCredentials: true, headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {} }
      );
      setInquiry(res.data.inquiry);
      setSuccess('Notification retry completed.');
      await loadInquiry();
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to retry notification.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading inquiry…</div>;
  }

  if (error && !inquiry) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>;
  }

  if (!inquiry) {
    return <div className="text-sm text-slate-500">Inquiry not found.</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/inquiries" className="text-sm font-bold text-slate-400 hover:text-brand-primary">← Back to inquiries</Link>
          <h1 className="text-3xl font-extrabold text-brand-navy mt-2" style={{ fontFamily: 'Syne, sans-serif' }}>{inquiry.name}</h1>
          <p className="text-slate-500">{inquiry.email}</p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy disabled:opacity-50"
        >
          {retrying ? 'Retrying…' : 'Retry notification'}
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-bold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Project details</h2>
          <p className="text-sm"><span className="font-bold text-slate-500">Service:</span> {inquiry.service}</p>
          <p className="text-sm"><span className="font-bold text-slate-500">Budget:</span> {inquiry.budget}</p>
          <p className="text-sm"><span className="font-bold text-slate-500">Timeline:</span> {inquiry.timeline}</p>
          <p className="text-sm"><span className="font-bold text-slate-500">Phone:</span> {inquiry.phone || '—'}</p>
          <p className="text-sm"><span className="font-bold text-slate-500">Business:</span> {inquiry.business || '—'}</p>
          <p className="text-sm"><span className="font-bold text-slate-500">Received:</span> {new Date(inquiry.createdAt).toLocaleString()}</p>
          <p className="text-sm"><span className="font-bold text-slate-500">Notification:</span> {inquiry.notificationStatus}</p>
          {inquiry.notificationError && <p className="text-sm text-rose-600">{inquiry.notificationError}</p>}
          <div className="pt-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{inquiry.description}</p>
          </div>
          {inquiry.requirements && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Requirements</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{inquiry.requirements}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Status and notes</h2>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Internal notes</label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={6}
              className="mt-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-y"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl hover:bg-brand-burgundy disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Event history</h2>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No events recorded.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="text-sm border-l-2 border-brand-primary pl-3">
                  <p className="font-bold text-slate-700">{event.event_type}</p>
                  <p className="text-xs text-slate-400">{new Date(event.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Notification attempts</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-slate-500">No notification attempts recorded.</p>
          ) : (
            <ul className="space-y-3">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="text-sm border-l-2 border-brand-rose pl-3">
                  <p className="font-bold text-slate-700">{attempt.channel}: {attempt.status}</p>
                  {attempt.error && <p className="text-xs text-rose-600">{attempt.error}</p>}
                  <p className="text-xs text-slate-400">{new Date(attempt.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInquiryDetail;