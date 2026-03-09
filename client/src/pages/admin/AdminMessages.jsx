import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

function ComposeModal({ onClose, onSent }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchAccounts = useCallback(async (query) => {
    if (query.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    try {
      const data = await api.get(`/api/admin/accounts?search=${encodeURIComponent(query)}`);
      setSearchResults(data.slice(0, 8));
      setShowDropdown(data.length > 0);
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchAccounts(recipientEmail), 300);
    return () => clearTimeout(t);
  }, [recipientEmail, searchAccounts]);

  const selectRecipient = (email) => {
    setRecipientEmail(email);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !subject || !body) return;
    setSending(true);
    setError(null);
    try {
      await api.post('/api/admin/messages/send', { recipientEmail, subject, body });
      onSent();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Compose Message</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {error && <p className="text-sm text-red">{error}</p>}

          <div className="relative">
            <label className="block text-xs text-cream/50 mb-1">Recipient Email</label>
            <input
              type="text"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              placeholder="Search by name or email..."
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
            {showDropdown && searchResults.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 py-1 bg-bg-elevated border border-white/10 rounded-xl shadow-lg z-50 max-h-48 overflow-auto">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => selectRecipient(u.email)}
                      className="w-full text-left px-4 py-2 text-sm text-cream/90 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <span className="font-medium">{u.name}</span>
                      <span className="text-cream/50 ml-2">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs text-cream/50 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-cream/50 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream resize-none"
              required
            />
          </div>

          <div className="bg-bg rounded-lg p-3 border border-white/10 text-xs text-cream/50">
            <p className="font-semibold text-cream/70 mb-1">Email signature (auto-included):</p>
            <p>SkyReach Visuals</p>
            <p>[Your Name] &mdash; Drone Aerial Photography &amp; Inspection</p>
            <p>07877691861</p>
            <p>support@skyreachvisuals.co.uk</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={sending}
              className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [tab, setTab] = useState('inbox');

  const loadInbox = useCallback(() => {
    setLoading(true);
    const path = filter === 'unread' ? '/api/admin/messages?read=false' : '/api/admin/messages';
    api.get(path)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const loadSent = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/messages/sent')
      .then(setSentMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'inbox') loadInbox();
    else loadSent();
  }, [tab, loadInbox, loadSent]);

  const markRead = (id) => {
    api.patch('/api/admin/messages/' + id, { read: true }).then(() => {
      setMessages((list) => list.map((m) => (m.id === id ? { ...m, read: true } : m)));
    }).catch((err) => setError(err.message));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('inbox')}
            className={`text-sm px-4 py-2 rounded-xl ${tab === 'inbox' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 border border-white/10'}`}
          >
            Inbox
          </button>
          <button
            type="button"
            onClick={() => setTab('sent')}
            className={`text-sm px-4 py-2 rounded-xl ${tab === 'sent' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 border border-white/10'}`}
          >
            Sent
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowCompose(true)}
          className="bg-red text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-dark transition-colors"
        >
          Compose Message
        </button>
      </div>

      {tab === 'inbox' && (
        <>
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
                    <a href={`mailto:${msg.email}`} className="block text-sm text-cream/70 hover:text-accent transition-colors">{msg.email}</a>
                    {msg.phone && <a href={`tel:${msg.phone.replace(/\s/g, '')}`} className="block text-sm text-cream/60 hover:text-accent transition-colors">{msg.phone}</a>}
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
        </>
      )}

      {tab === 'sent' && (
        <div className="space-y-6">
          {sentMessages.map((msg) => (
            <div key={msg.id} className="bg-bg-card border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-cream/50 mb-1">To: <a href={`mailto:${msg.recipientEmail}`} className="text-cream/70 hover:text-accent transition-colors">{msg.recipientEmail}</a></p>
                  <p className="font-medium text-white">{msg.subject}</p>
                  <p className="mt-2 text-cream/80 text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p className="mt-2 text-xs text-cream/50">
                    Sent by {msg.sender?.name} &middot; {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {sentMessages.length === 0 && !loading && (
            <p className="text-cream/60 py-8">No sent messages.</p>
          )}
        </div>
      )}

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() => { if (tab === 'sent') loadSent(); }}
        />
      )}
    </div>
  );
}
