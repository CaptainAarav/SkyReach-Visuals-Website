import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    setLoading(true);
    const path = filter === 'unread' ? '/api/admin/messages?read=false' : '/api/admin/messages';
    api.get(path)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const markRead = (id) => {
    api.patch('/api/admin/messages/' + id, { read: true }).then(() => {
      setMessages((list) => list.map((m) => (m.id === id ? { ...m, read: true } : m)));
    }).catch((err) => setError(err.message));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`text-sm px-4 py-2 rounded-xl ${filter === 'all' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 border border-white/10'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`text-sm px-4 py-2 rounded-xl ${filter === 'unread' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 border border-white/10'}`}
        >
          New (unread)
        </button>
      </div>
      <div className="space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`bg-bg-card border rounded-2xl p-6 ${msg.read ? 'border-white/10' : 'border-accent/50'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{msg.name}</p>
                <p className="text-sm text-cream/70">{msg.email}</p>
                {msg.phone && <p className="text-sm text-cream/60">{msg.phone}</p>}
                <p className="mt-3 text-cream/80">{msg.message}</p>
                <p className="mt-2 text-xs text-cream/50">
                  {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {msg.read && ' · Read'}
                </p>
              </div>
              {!msg.read && (
                <button
                  type="button"
                  onClick={() => markRead(msg.id)}
                  className="text-sm font-medium text-accent hover:text-accent-light shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {messages.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No messages.</p>
      )}
    </div>
  );
}
