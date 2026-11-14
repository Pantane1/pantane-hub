import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const navItems = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/inquiries', label: 'Project Inquiries' },
  { to: '/admin/journal', label: 'Journal' },
  { to: '/admin/sharp', label: 'Sharp' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/communications', label: 'Communications' },
  { to: '/admin/access', label: 'Access' },
  { to: '/admin/activity', label: 'Activity' },
  { to: '/admin/settings', label: 'Settings' },
];

const AdminLayout: React.FC = () => {
  const { status, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Checking session…</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <AdminLogin />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-navy text-white transform transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="text-lg font-black tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="text-white">PANTANE</span>
            <span className="text-brand-rose ml-0.5">HUB</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive ? 'bg-brand-primary text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Administration</div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-slate-500 hover:text-brand-primary uppercase tracking-wide"
          >
            Log out
          </button>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await login(password);
    if (!ok) {
      setError('Login failed. Check your password and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <h1 className="text-2xl font-extrabold text-brand-navy mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>PantaneHub Admin</h1>
        <p className="text-sm text-slate-500 mb-6">Enter the administrator password to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 text-sm"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl hover:bg-brand-burgundy transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLayout;