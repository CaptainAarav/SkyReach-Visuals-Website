import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const roleBadge = {
  ADMIN: 'bg-accent/30 text-accent',
  CUSTOMER_SUPPORT: 'bg-blue-500/20 text-blue-400',
  USER: 'bg-white/10 text-cream',
};

const statusBadge = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  SUSPENDED: 'bg-amber-500/20 text-amber-400',
  BANNED: 'bg-red/20 text-red',
};

function StatCard({ label, value }) {
  return (
    <div className="bg-bg-card rounded-xl border border-white/10 p-4">
      <p className="text-xs uppercase text-cream/50 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function AccountDetailModal({ account, onClose, onUpdate, currentUser }) {
  useBodyScrollLock(true);
  const [tab, setTab] = useState('profile');
  const [editRole, setEditRole] = useState(account.role);
  const [editStatus, setEditStatus] = useState(account.status);
  const [editName, setEditName] = useState(account.name);
  const [editEmail, setEditEmail] = useState(account.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [orders, setOrders] = useState(null);
  const [messages, setMessages] = useState(null);
  const [reviews, setReviews] = useState(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isSelf = currentUser?.id === account.id;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {};
      if (editRole !== account.role) body.role = editRole;
      if (editStatus !== account.status) body.status = editStatus;
      if (editName !== account.name) body.name = editName;
      if (editEmail !== account.email) body.email = editEmail;
      if (Object.keys(body).length === 0) {
        setSuccess('No changes to save.');
        setSaving(false);
        return;
      }
      const updated = await api.patch(`/api/admin/accounts/${account.id}`, body);
      setSuccess('Account updated.');
      onUpdate(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await api.post(`/api/admin/accounts/${account.id}/reset-password`);
      setResetResult(result.tempPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/api/admin/accounts/${account.id}`);
      onUpdate(null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadOrders = useCallback(async () => {
    if (orders) return;
    try {
      const data = await api.get(`/api/admin/accounts/${account.id}/orders`);
      setOrders(data);
    } catch { setOrders([]); }
  }, [account.id, orders]);

  const loadMessages = useCallback(async () => {
    if (messages) return;
    try {
      const data = await api.get(`/api/admin/accounts/${account.id}/messages`);
      setMessages(data);
    } catch { setMessages([]); }
  }, [account.id, messages]);

  const loadReviews = useCallback(async () => {
    if (reviews) return;
    try {
      const data = await api.get(`/api/admin/accounts/${account.id}/reviews`);
      setReviews(data);
    } catch { setReviews([]); }
  }, [account.id, reviews]);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'messages') loadMessages();
    if (tab === 'reviews') loadReviews();
  }, [tab, loadOrders, loadMessages, loadReviews]);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'activity', label: 'Activity' },
    { id: 'orders', label: `Orders (${account.ordersCount})` },
    { id: 'messages', label: `Messages (${account.messagesCount})` },
    { id: 'reviews', label: `Reviews (${account.reviewsCount})` },
    ...(isAdmin ? [{ id: 'danger', label: 'Danger Zone' }] : []),
  ];

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overscroll-contain" aria-modal="true" role="presentation">
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{account.name}</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>

        <div className="flex flex-wrap gap-1 p-4 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                tab === t.id ? 'bg-accent text-white' : 'bg-white/5 text-cream/70 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red">{error}</p>}
          {success && <p className="text-sm text-emerald-400">{success}</p>}

          {tab === 'profile' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Email</label>
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} disabled={!isAdmin} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    {isAdmin && <option value="BANNED">BANNED</option>}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
              <p className="text-xs text-cream/40">Joined {fmtDate(account.createdAt)} &middot; Email {account.emailVerified ? 'verified' : 'not verified'}</p>
            </>
          )}

          {tab === 'activity' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-cream/50 text-xs">Last Login</p>
                  <p className="text-white">{fmtDate(account.lastLoginAt)}</p>
                </div>
                <div>
                  <p className="text-cream/50 text-xs">Last Login IP</p>
                  <p className="text-white font-mono text-xs">{account.lastLoginIp || '—'}</p>
                </div>
                <div>
                  <p className="text-cream/50 text-xs">Last Login Location</p>
                  <p className="text-white">{account.lastLoginLocation || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <StatCard label="Orders" value={account.ordersCount} />
                <StatCard label="Messages" value={account.messagesCount} />
                <StatCard label="Reviews" value={account.reviewsCount} />
              </div>
            </div>
          )}

          {tab === 'orders' && (
            orders === null ? <LoadingSpinner /> : orders.length === 0 ? <p className="text-cream/60">No orders.</p> : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="bg-bg rounded-lg p-3 border border-white/10 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">{o.packageName}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadge[o.status] || 'bg-white/10 text-cream'}`}>{o.status}</span>
                    </div>
                    <p className="text-cream/60 text-xs mt-1">{new Date(o.shootDate).toLocaleDateString('en-GB')} &middot; {o.location}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'messages' && (
            messages === null ? <LoadingSpinner /> : messages.length === 0 ? <p className="text-cream/60">No messages.</p> : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="bg-bg rounded-lg p-3 border border-white/10 text-sm">
                    <p className="text-white">{m.message.slice(0, 120)}{m.message.length > 120 ? '...' : ''}</p>
                    <p className="text-cream/60 text-xs mt-1">{fmtDate(m.createdAt)}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'reviews' && (
            reviews === null ? <LoadingSpinner /> : reviews.length === 0 ? <p className="text-cream/60">No reviews.</p> : (
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-bg rounded-lg p-3 border border-white/10 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">{r.booking?.packageName}</span>
                      {r.rating && <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}</span>}
                    </div>
                    <p className="text-cream/80 mt-1">{r.comment.slice(0, 150)}{r.comment.length > 150 ? '...' : ''}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'danger' && isAdmin && (
            <div className="space-y-4">
              <div className="bg-bg rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Reset Password</h3>
                <p className="text-xs text-cream/60 mb-3">Generate a temporary password for this user.</p>
                <button onClick={handleResetPassword} disabled={saving} className="bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Resetting...' : 'Reset password'}
                </button>
                {resetResult && (
                  <div className="mt-2 bg-bg-card border border-white/10 rounded p-2">
                    <p className="text-xs text-cream/60">Temporary password:</p>
                    <p className="text-sm font-mono text-white select-all">{resetResult}</p>
                  </div>
                )}
              </div>
              {!isSelf && (
                <div className="bg-red/10 rounded-lg p-4 border border-red/30">
                  <h3 className="text-sm font-semibold text-red mb-2">Delete Account</h3>
                  <p className="text-xs text-cream/60 mb-3">Permanently delete this user and all their data. This cannot be undone.</p>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} className="bg-red text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-dark transition-colors">
                      Delete account
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red font-bold">Are you sure?</span>
                      <button onClick={handleDelete} disabled={saving} className="bg-red text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-dark disabled:opacity-50 transition-colors">
                        {saving ? 'Deleting...' : 'Yes, delete'}
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="text-xs text-cream/60 hover:text-white">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAccounts() {
  const { user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      if (sort) params.set('sort', sort);
      const data = await api.get(`/api/admin/accounts?${params.toString()}`);
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    }
  }, [search, filterRole, filterStatus, sort]);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/stats').then(setStats).catch(() => {}),
      fetchAccounts(),
    ]).finally(() => setLoading(false));
  }, [fetchAccounts]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await api.get(`/api/admin/accounts/${id}`);
      setSelectedAccount(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAccountUpdate = (updated) => {
    if (!updated) {
      setAccounts((list) => list.filter((a) => a.id !== selectedAccount.id));
      return;
    }
    setAccounts((list) => list.map((a) => a.id === updated.id ? { ...a, ...updated } : a));
    setSelectedAccount((prev) => prev ? { ...prev, ...updated } : prev);
  };

  if (loading) return <LoadingSpinner />;

  const filters = [
    { label: 'All', value: '' },
    { label: 'Admins', value: 'ADMIN' },
    { label: 'Support', value: 'CUSTOMER_SUPPORT' },
    { label: 'Users', value: 'USER' },
  ];

  const statusFilters = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Banned', value: 'BANNED' },
  ];

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total Users" value={stats.total} />
          <StatCard label="Admins" value={stats.admins} />
          <StatCard label="Support" value={stats.customerSupport} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Suspended" value={stats.suspended} />
          <StatCard label="Banned" value={stats.banned} />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream placeholder:text-cream/40"
        />
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterRole(f.value)}
              className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                filterRole === f.value ? 'bg-accent text-white' : 'bg-bg-card text-cream/70 border border-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.value + 's'}
              onClick={() => setFilterStatus(f.value)}
              className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                filterStatus === f.value ? 'bg-accent text-white' : 'bg-bg-card text-cream/70 border border-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {error && <p className="text-sm text-red mb-4">{error}</p>}
      {detailLoading && <p className="text-sm text-cream/60 mb-4">Loading account details...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Name</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Email</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Role</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Status</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Joined</th>
              <th className="pb-3 text-xs font-semibold uppercase text-cream/60">Actions</th>
            </tr>
          </thead>
          <tbody className="text-cream/90">
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-white/10">
                <td className="py-4 pr-4 font-medium text-white">{account.name}</td>
                <td className="py-4 pr-4"><a href={`mailto:${account.email}`} className="text-cream/80 hover:text-accent transition-colors">{account.email}</a></td>
                <td className="py-4 pr-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${roleBadge[account.role] || 'bg-white/10 text-cream'}`}>
                    {account.role}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusBadge[account.status] || 'bg-white/10 text-cream'}`}>
                    {account.status}
                  </span>
                </td>
                <td className="py-4 pr-4 text-sm text-cream/60">
                  {new Date(account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-4">
                  <button
                    onClick={() => openDetail(account.id)}
                    className="text-xs font-medium text-accent hover:text-white transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {accounts.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No accounts match your filters.</p>
      )}

      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          currentUser={currentUser}
          onClose={() => setSelectedAccount(null)}
          onUpdate={handleAccountUpdate}
        />
      )}
    </div>
  );
}
