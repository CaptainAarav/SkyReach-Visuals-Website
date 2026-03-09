import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

function ComposeModal({ onClose, onSent, defaults = {} }) {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState(defaults.recipientEmail || '');
  const [subject, setSubject] = useState(defaults.subject || '');
  const [body, setBody] = useState(defaults.body || '');
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

  const displaySubject = subject || '(No subject)';
  const displayBody = body || '(Your message will appear here)';
  const senderName = user?.name || 'SkyReach';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white">Compose Message</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <div className="flex flex-1 min-h-0">
          <form onSubmit={handleSend} className="flex flex-col w-full md:w-[420px] shrink-0 p-6 space-y-4 overflow-y-auto border-r border-white/10">
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

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={sending}
                className="bg-red text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-dark disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">
                Cancel
              </button>
            </div>
          </form>
          <div className="hidden md:flex flex-col flex-1 min-w-0 bg-bg p-4">
            <p className="text-xs text-cream/50 mb-2 font-medium">Preview (as recipient will see)</p>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-white/10 bg-bg-card">
              <div className="p-4 min-h-full" style={{ backgroundColor: '#0f0f0f' }}>
                <div className="max-w-[520px] rounded-xl overflow-hidden border border-red/20" style={{ backgroundColor: '#1E2D4A' }}>
                  <div className="px-6 pt-6 pb-4 text-left">
                    <h3 className="text-cream font-semibold text-lg mb-3">{displaySubject}</h3>
                    <p className="text-cream/90 text-sm leading-relaxed whitespace-pre-wrap">{displayBody}</p>
                    <p className="mt-6 pt-4 border-t border-white/10 text-cream/70 text-xs leading-relaxed">
                      <strong className="text-cream">SkyReach Visuals</strong><br />
                      {senderName} — Drone Aerial Photography &amp; Inspection · +44 7877691861 · support@skyreachvisuals.co.uk
                    </p>
                    <img src="/skyreach_visuals_text_logo.png" alt="SkyReach Visuals" className="w-24 h-auto mt-3 rounded-lg opacity-90" style={{ filter: 'brightness(0) invert(1)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  const [composeDefaults, setComposeDefaults] = useState({});
  const [tab, setTab] = useState('inbox');
  const [expandedInboxId, setExpandedInboxId] = useState(null);
  const [expandedSentId, setExpandedSentId] = useState(null);

  const loadInbox = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === 'unread') params.set('read', 'false');
    if (filter === 'archived') params.set('archived', 'true');
    api.get(`/api/admin/messages?${params}`)
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

  const markArchived = (id, archived) => {
    api.patch(`/api/admin/messages/${id}/archived`, { archived }).then(() => {
      setMessages((list) => list.filter((m) => m.id !== id));
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
          onClick={() => { setComposeDefaults({}); setShowCompose(true); }}
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
            <button
              type="button"
              onClick={() => setFilter('archived')}
              className={`text-sm px-4 py-2 rounded-xl ${filter === 'archived' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 border border-white/10'}`}
            >
              Archived
            </button>
          </div>
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-bg-card border rounded-2xl p-6 ${msg.read ? 'border-white/10' : 'border-accent/50'} ${expandedInboxId === msg.id ? '' : 'cursor-pointer hover:border-white/20'}`}
                onClick={() => setExpandedInboxId(expandedInboxId === msg.id ? null : msg.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{msg.name}</p>
                    <a href={`mailto:${msg.email}`} className="block text-sm text-cream/70 hover:text-accent transition-colors" onClick={(e) => e.stopPropagation()}>{msg.email}</a>
                    {msg.phone && <a href={`tel:${msg.phone.replace(/\s/g, '')}`} className="block text-sm text-cream/60 hover:text-accent transition-colors" onClick={(e) => e.stopPropagation()}>{msg.phone}</a>}
                    <p className="mt-3 text-cream/80 text-sm">
                      {expandedInboxId === msg.id ? msg.message : (msg.message.length > 80 ? msg.message.slice(0, 80) + '…' : msg.message)}
                    </p>
                    {msg.message.length > 80 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedInboxId(expandedInboxId === msg.id ? null : msg.id); }} className="mt-1 text-xs text-accent hover:underline">
                        {expandedInboxId === msg.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    <p className="mt-2 text-xs text-cream/50">
                      {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {msg.read && ' · Read'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setComposeDefaults({ recipientEmail: msg.email, subject: `Re: ${msg.name}'s enquiry` });
                        setShowCompose(true);
                      }}
                      className="text-sm font-medium text-red hover:text-red-dark"
                    >
                      Reply
                    </button>
                    {!msg.read && (
                      <button
                        type="button"
                        onClick={() => markRead(msg.id)}
                        className="text-sm font-medium text-accent hover:text-accent-light"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markArchived(msg.id, !msg.archived)}
                      className="text-sm font-medium text-cream/60 hover:text-cream"
                    >
                      {msg.archived ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
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
            <div
              key={msg.id}
              className={`bg-bg-card border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition-colors ${expandedSentId === msg.id ? '' : ''}`}
              onClick={() => setExpandedSentId(expandedSentId === msg.id ? null : msg.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-cream/50 mb-1">To: <a href={`mailto:${msg.recipientEmail}`} className="text-cream/70 hover:text-accent transition-colors" onClick={(e) => e.stopPropagation()}>{msg.recipientEmail}</a></p>
                  <p className="font-medium text-white">{msg.subject}</p>
                  <p className="mt-2 text-cream/80 text-sm whitespace-pre-wrap">
                    {expandedSentId === msg.id ? msg.body : (msg.body.length > 80 ? msg.body.slice(0, 80) + '…' : msg.body)}
                  </p>
                  {msg.body.length > 80 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedSentId(expandedSentId === msg.id ? null : msg.id); }} className="mt-1 text-xs text-accent hover:underline">
                      {expandedSentId === msg.id ? 'Show less' : 'Read more'}
                    </button>
                  )}
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
          defaults={composeDefaults}
        />
      )}
    </div>
  );
}
