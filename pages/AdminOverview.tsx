import React from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts } from '../data/journal';
import { getAllDeals } from '../data/sharp';

const StatCard: React.FC<{ label: string; value: string; detail: string }> = ({ label, value, detail }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-extrabold text-brand-navy mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</p>
    <p className="text-xs text-slate-500">{detail}</p>
  </div>
);

const AdminOverview: React.FC = () => {
  const journalCount = getAllPosts().length;
  const sharpCount = getAllDeals().length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Overview</h1>
        <p className="text-slate-600">Central administration for PantaneHub content and operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Journal posts" value={String(journalCount)} detail="Published entries in the repository" />
        <StatCard label="Sharp deals" value={String(sharpCount)} detail="Active and archived deals" />
        <StatCard label="Project inquiries" value="—" detail="Database module arrives in the next stage" />
        <StatCard label="Payments" value="—" detail="Transaction history arrives in a later stage" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Quick access</h2>
          <div className="space-y-2">
            <Link to="/admin/journal" className="block px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-primary hover:text-white transition-colors font-bold text-sm text-slate-700">
              Manage Journal
            </Link>
            <Link to="/admin/sharp" className="block px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-primary hover:text-white transition-colors font-bold text-sm text-slate-700">
              Manage Sharp
            </Link>
            <Link to="/admin/inquiries" className="block px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-primary hover:text-white transition-colors font-bold text-sm text-slate-700">
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