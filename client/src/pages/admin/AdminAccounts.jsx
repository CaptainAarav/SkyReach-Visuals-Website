import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/api/admin/accounts')
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateRole = (id, role) => {
    setUpdating(id);
    api.patch('/api/admin/accounts/' + id, { role })
      .then(() => {
        setAccounts((list) =>
          list.map((a) => (a.id === id ? { ...a, role } : a))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(null));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Name</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Email</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Role</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Joined</th>
              <th className="pb-3 text-xs font-semibold uppercase text-cream/60">Actions</th>
            </tr>
          </thead>
          <tbody className="text-cream/90">
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-white/10">
                <td className="py-4 pr-4 font-medium text-white">{account.name}</td>
                <td className="py-4 pr-4 text-cream/80">{account.email}</td>
                <td className="py-4 pr-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${account.role === 'ADMIN' ? 'bg-accent/30 text-accent' : 'bg-white/10 text-cream'}`}>
                    {account.role}
                  </span>
                </td>
                <td className="py-4 pr-4 text-sm text-cream/60">
                  {new Date(account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-4">
                  <select
                    value={account.role}
                    onChange={(e) => updateRole(account.id, e.target.value)}
                    disabled={updating === account.id}
                    className="bg-bg border border-white/20 rounded-lg py-1.5 px-2 text-sm text-cream"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {accounts.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No accounts.</p>
      )}
    </div>
  );
}
