import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getAllPosts } from '../data/journal';
import { getAllDeals } from '../data/sharp';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const StatCard: React.FC<{ label: string; value: string; detail: string }> = ({ label, value, detail }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-extrabold text-brand-navy mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</p>
    <p className="text-xs text-slate-500">{detail}</p>
  </div>
);

const apiUrl = import.meta.env.VITE_API_URL;

const AdminOverview: React.FC = () => {
  const { refresh } = useAdminAuth();
  const journalCount = getAllPosts().length;
  const sharpCount = getAllDeals().length;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${apiUrl}/admin/overview`, { withCredentials: true });
        setStats(res.data);
      } catch (err: any) {
        if (err?.response?.status === 401) refresh();
        setError(err?.response?.data?.error || 'Failed to load overview statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [refresh]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Overview</h1>
        <p className="text-slate-600">Central administration for PantaneHub content and operations.</p>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Journal posts" value={String(journalCount)} detail="Published entries in the repository" />
        <StatCard label="Sharp deals" value={String(sharpCount)} detail="Active and archived deals" />
        <StatCard label="Project inquiries" value={loading ? '…' : String(stats?.inquiries?.total ?? 0)} detail="Persisted inquiry records" />
        <StatCard label="New inquiries" value={loading ? '…' : String(stats?.inquiries?.new ?? 0)} detail="Awaiting review" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Contacted" value={loading ? '…' : String(stats?.inquiries?.contacted ?? 0)} detail="Inquiries contacted" />
        <StatCard label="In progress" value={loading ? '…' : String(stats?.inquiries?.inProgress ?? 0)} detail="Active projects" />
        <StatCard label="Completed" value={loading ? '…' : String(stats?.inquiries?.completed ?? 0)} detail="Finished inquiries" />
        <StatCard label="Payment records" value={loading ? '…' : String(stats?.payments ?? 0)} detail="Verified provider events" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Quick access</h2>
          <div className="space-y-2">
            <Link to="/journal" className="block px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-primary hover:text-white transition-colors font-bold text-sm text-slate-700">
              Manage Journal
            </Link>
            <Link to="/sharp" className="block px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-primary hover:text-white transition-colors font-bold text-sm text-slate-700">
              Manage Sharp
            </Link>
            <Link to="/inquiries" className="block px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-primary hover:text-white transition-colors font-bold text-sm text-slate-700">
              Project Inquiries
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>System status</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Authentication: secure server-managed session</li>
            <li>Journal storage: Git-backed JSON</li>
            <li>Sharp storage: Git-backed JSON</li>
            <li>Operational database: foundation installed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;