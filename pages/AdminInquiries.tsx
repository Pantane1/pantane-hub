import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface InquirySummary {
  id: string;
  createdAt: string;
  service: string;
  name: string;
  email: string;
  status: string;
  notificationStatus: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const AdminInquiries: React.FC = () => {
  const { csrfToken, refresh } = useAdminAuth();
  const [inquiries, setInquiries] = useState<InquirySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const loadInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      const res = await axios.get(`${apiUrl}/admin/inquiries?${params.toString()}`, { withCredentials: true });
      setInquiries(res.data.inquiries || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInquiries();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Project Inquiries</h1>
          <p className="text-slate-600 mt-1">{total} total inquiries</p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, service..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full sm:w-64"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy">
            Search
          </button>
        </form>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">Loading inquiries…</div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">No inquiries found.</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-widest">
                <tr>
                  <th className="text-left px-5 py-3">Received</th>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Service</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Notification</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-500">{new Date(inquiry.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <Link to={`/admin/inquiries/${inquiry.id}`} className="font-bold text-brand-primary hover:underline">
                        {inquiry.name}
                      </Link>
                      <div className="text-xs text-slate-400">{inquiry.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{inquiry.service}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">{inquiry.status}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-500">{inquiry.notificationStatus}</td>
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

export default AdminInquiries;