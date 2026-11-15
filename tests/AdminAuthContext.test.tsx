import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act, waitFor, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import AdminLayout from '../components/AdminLayout';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios);

describe('Admin authentication client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('verifies the session with credentials', async () => {
    mockedAxios.get.mockResolvedValue({ data: { authenticated: true, csrfToken: 'csrf-token' } });

    const { result } = renderHook(() => useAdminAuth(), { wrapper: AdminAuthProvider });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/admin/session', { withCredentials: true });
    expect(result.current.csrfToken).toBe('csrf-token');
  });

  it('sends login with credentials', async () => {
    mockedAxios.get.mockRejectedValue(new Error('unauthorized'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper: AdminAuthProvider });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    mockedAxios.post.mockResolvedValueOnce({ data: { csrfToken: 'csrf-token' } });
    let success = false;
    await act(async () => {
      success = await result.current.login('secret-password');
    });

    expect(success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/admin/login',
      { password: 'secret-password' },
      { withCredentials: true }
    );
    expect(result.current.status).toBe('authenticated');
  });

  it('sends logout with credentials and CSRF token', async () => {
    mockedAxios.get.mockRejectedValue(new Error('unauthorized'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper: AdminAuthProvider });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    mockedAxios.post.mockResolvedValueOnce({ data: { csrfToken: 'csrf-token' } });
    await act(async () => {
      await result.current.login('secret-password');
    });

    mockedAxios.post.mockResolvedValueOnce({});
    await act(async () => {
      await result.current.logout();
    });

    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/admin/logout',
      {},
      { withCredentials: true, headers: { 'X-CSRF-Token': 'csrf-token' } }
    );
    expect(result.current.status).toBe('unauthenticated');
  });

  it('reports failed login without exposing an authenticated state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('unauthorized'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper: AdminAuthProvider });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    mockedAxios.post.mockRejectedValueOnce(new Error('bad credentials'));
    let success = true;
    await act(async () => {
      success = await result.current.login('wrong-password');
    });

    expect(success).toBe(false);
    expect(result.current.status).toBe('unauthenticated');
  });

  it('displays a login error in the admin layout', async () => {
    mockedAxios.get.mockRejectedValue(new Error('unauthorized'));
    mockedAxios.post.mockRejectedValueOnce(new Error('bad credentials'));

    render(
      <MemoryRouter>
        <AdminAuthProvider>
          <AdminLayout />
        </AdminAuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Login failed. Check your password and try again.')).toBeInTheDocument());
  });
});