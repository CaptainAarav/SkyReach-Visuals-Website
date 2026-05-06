import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard.jsx';

vi.mock('../../api/client.js', () => ({
  api: {
    get: vi.fn((path) => {
      if (String(path).includes('/admin/stats')) {
        return Promise.resolve({
          revenue: 10_000,
          totalQuotes: 1,
          totalBookings: 2,
          totalAccepted: 1,
          totalDeclined: 0,
        });
      }
      if (String(path).includes('/admin/traffic')) {
        return Promise.resolve({
          daily: [{ date: '2026-01-01', views: 3 }],
          total: 3,
        });
      }
      return Promise.resolve({});
    }),
    delete: vi.fn(() => Promise.resolve()),
    patch: vi.fn(() => Promise.resolve()),
    post: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('../../hooks/useAuth.js', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' }, loading: false }),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats after load without throwing (CountUp and traffic chart)', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Website traffic (sessions)')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'External customer' })).toBeInTheDocument();
  });
});
