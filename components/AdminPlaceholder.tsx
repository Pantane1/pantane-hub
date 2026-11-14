import React from 'react';

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title, description }) => (
  <div className="max-w-3xl space-y-4">
    <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h1>
    <p className="text-slate-600 leading-relaxed">{description}</p>
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-sm text-slate-500">
      This module will be implemented in a later mission stage. Existing platform functionality remains unchanged.
    </div>
  </div>
);

export default AdminPlaceholder;