import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface AdminAuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  csrfToken: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const apiUrl = import.meta.env.VITE_API_URL;

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AdminAuthContextValue['status']>('loading');
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/session`, { withCredentials: true });
      setCsrfToken(res.data?.csrfToken ?? null);
      setStatus('authenticated');
    } catch {
      setCsrfToken(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (password: string) => {
    try {
      const res = await axios.post(`${apiUrl}/admin/login`, { password }, { withCredentials: true });
      setCsrfToken(res.data?.csrfToken ?? null);
      setStatus('authenticated');
      return true;
    } catch {
      setCsrfToken(null);
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${apiUrl}/admin/logout`, {}, {
        withCredentials: true,
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
    } catch {
      // Clear local state even if the network request fails.
    } finally {
      setCsrfToken(null);
      setStatus('unauthenticated');
    }
  }, [csrfToken]);

  return (
    <AdminAuthContext.Provider value={{ status, csrfToken, login, logout, refresh }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider.');
  }
  return context;
}