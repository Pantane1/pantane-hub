import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface ContactMessage {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  message: string;
  notificationStatus: string;
  notificationError: string | null;
}

const apiUrl = import.meta.env.VITE_API_URL;

const AdminCommunications: React.FC = () => {
  const { csrfToken, refresh } = useAdminAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await axios.get(`${apiUrl}/admin/communications?${params.toString()}`, { withCredentials: true });
      setMessages(res.data.messages || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load communications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${apiUrl}/admin/communications/${id}/notify`, {}, {
        withCredentials: true,
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
      setSuccess('Notification retry completed.');
      await loadMessages();
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to retry notification.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Communications</h1>
          <p className="text-slate-600 mt-1">{total} contact messages</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadMessages();
          }}
          className="flex gap-3"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full sm:w-64"
          />
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy">
            Search
          </button>
        </form>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">Loading communications…</div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">No contact messages recorded.</div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="font-bold text-brand-navy">{message.name}</p>
                  <p className="text-xs text-slate-400">{message.email} · {new Date(message.createdAt).toLocaleString()}</p>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{message.message}</p>
                  <p className="mt-3 text-xs font-bold text-slate-500">Notification: {message.notificationStatus}</p>
                  {message.notificationError && <p className="text-xs text-rose-600">{message.notificationError}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRetry(message.id)}
                  disabled={retryingId === message.id}
                  className="px-4 py-2.5 rounded-xl border border-brand-primary/40 text-brand-primary text-sm font-bold hover:bg-brand-primary hover:text-white disabled:opacity-50"
                >
                  {retryingId === message.id ? 'Retrying…' : 'Retry notification'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCommunications;