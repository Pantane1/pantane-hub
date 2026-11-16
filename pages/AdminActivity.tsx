import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface AuditEvent {
  id: number;
  created_at: string;
  actor: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
}

const apiUrl = import.meta.env.VITE_API_URL;

const AdminActivity: React.FC = () => {
  const { refresh } = useAdminAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [search, setSearch] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (targetType) params.set('targetType', targetType);
      if (search.trim()) params.set('search', search.trim());
      const res = await axios.get(`${apiUrl}/admin/activity?${params.toString()}`, { withCredentials: true });
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Activity</h1>
          <p className="text-slate-600 mt-1">{total} audit events</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or target..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full sm:w-56"
          />
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Action filter"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full sm:w-44"
          />
          <input
            type="text"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            placeholder="Target type"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full sm:w-44"
          />
          <button type="button" onClick={loadEvents} className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy">
            Filter
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">Loading activity…</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">No audit events recorded.</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-widest">
                <tr>
                  <th className="text-left px-5 py-3">Time</th>
                  <th className="text-left px-5 py-3">Action</th>
                  <th className="text-left px-5 py-3">Target</th>
                  <th className="text-left px-5 py-3">Actor</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-4 font-bold text-slate-700">{event.action}</td>
                    <td className="px-5 py-4 text-slate-600">{event.target_type || '—'} {event.target_id ? `· ${event.target_id}` : ''}</td>
                    <td className="px-5 py-4 text-slate-500">{event.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivity;