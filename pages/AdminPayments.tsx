import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface PaymentTransaction {
  id: string;
  created_at: string;
  updated_at: string;
  provider: string;
  provider_reference: string;
  amount: string | null;
  currency: string;
  status: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const AdminPayments: React.FC = () => {
  const { refresh } = useAdminAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await axios.get(`${apiUrl}/admin/payments?${params.toString()}`, { withCredentials: true });
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      if (err?.response?.status === 401) refresh();
      setError(err?.response?.data?.error || 'Failed to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy" style={{ fontFamily: 'Syne, sans-serif' }}>Payments</h1>
          <p className="text-slate-600 mt-1">{total} transaction records from verified provider events</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider or reference..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full sm:w-64"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={loadTransactions}
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-burgundy"
          >
            Search
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">Loading transactions…</div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm text-slate-500">
          No payment transactions recorded. Transactions are created from verified provider events.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-widest">
                <tr>
                  <th className="text-left px-5 py-3">Received</th>
                  <th className="text-left px-5 py-3">Provider</th>
                  <th className="text-left px-5 py-3">Reference</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-slate-500">{transaction.created_at ? new Date(transaction.created_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-4 text-slate-700">{transaction.provider}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{transaction.provider_reference || '—'}</td>
                    <td className="px-5 py-4 text-slate-700">{transaction.amount ? `${transaction.amount} ${transaction.currency}` : '—'}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">{transaction.status}</span>
                    </td>
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

export default AdminPayments;