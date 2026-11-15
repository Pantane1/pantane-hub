import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const apiUrl = import.meta.env.VITE_API_URL;

const AdminSettings: React.FC = () => {
  const { refresh } = useAdminAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${apiUrl}/admin/settings`, { withCredentials: true });
        setSettings(res.data);
      } catch (err: any) {
        if (err?.response?.status === 401) refresh();
        setError(err?.response?.data?.error || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [refresh]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading settings…</div>;
  }

  if (error) {
    return <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Settings</h1>
        <p className="text-slate-600 mt-1">Platform configuration and integration health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Environment</h2>
          <p className="text-sm text-slate-600">Mode: {settings?.environment || 'unknown'}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Database</h2>
          <p className="text-sm text-slate-600">Configured: {String(settings?.database?.configured)}</p>
          <p className="text-sm text-slate-600">Connected: {String(settings?.database?.connected)}</p>
          <p className="text-sm text-slate-600">Migrations applied: {settings?.database?.migrationCount ?? 0}</p>
          {settings?.database?.error && <p className="text-sm text-rose-600">{settings.database.error}</p>}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Integration health</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          {Object.entries(settings?.integrations || {}).map(([key, value]) => (
            <li key={key} className="flex items-center justify-between">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className={value ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{value ? 'Configured' : 'Missing'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Allowed CORS origins</h2>
        <ul className="space-y-1 text-sm text-slate-600">
          {(settings?.corsAllowedOrigins || []).map((origin: string) => (
            <li key={origin} className="font-mono text-xs">{origin}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminSettings;