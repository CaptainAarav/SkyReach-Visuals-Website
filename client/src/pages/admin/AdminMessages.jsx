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

  const displaySubject = (subject || '').replace(/^Re:\s*/i, '').trim() || '(No subject)';
  const displayBody = body || '(Your message will appear here)';
  const senderName = user?.name || 'SkyReach';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">New message</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSend} className="flex flex-col flex-1 min-h-0 p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="text"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              placeholder="Search by name or email..."
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400"
              required
            />
            {showDropdown && searchResults.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                {searchResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => selectRecipient(u.email)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="font-medium">{u.name}</span>
                      <span className="text-gray-500 ml-2">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900"
              required
            />
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full flex-1 min-h-[120px] bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 resize-none"
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={sending} className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">Cancel</button>
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
  const [composeDefaults, setComposeDefaults] = useState({});
  const [tab, setTab] = useState('inbox');
  const [selectedId, setSelectedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadInbox = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === 'unread') params.set('read', 'false');
    if (filter === 'archived') params.set('archived', 'true');
    api.get(`/api/admin/messages?${params}`)
      .then((data) => { setMessages(data); setSelectedId(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const loadSent = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/messages/sent')
      .then((data) => { setSentMessages(data); setSelectedId(null); })
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
      if (selectedId === id) setSelectedId(null);
    }).catch((err) => setError(err.message));
  };

  const permanentDelete = (id) => {
    if (!window.confirm('Permanently delete this message?')) return;
    setDeletingId(id);
    api.delete(`/api/admin/messages/${id}`)
      .then(() => {
        setMessages((list) => list.filter((m) => m.id !== id));
        if (selectedId === id) setSelectedId(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setDeletingId(null));
  };

  const list = tab === 'inbox' ? messages : sentMessages;
  const selected = tab === 'inbox'
    ? messages.find((m) => m.id === selectedId)
    : sentMessages.find((m) => m.id === selectedId);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {error && <p className="text-sm text-red-600 px-4 py-2 bg-red-50">{error}</p>}

      {/* Toolbar — Gmail/Outlook style */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`text-sm font-medium px-3 py-2 rounded-lg ${tab === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`text-sm font-medium px-3 py-2 rounded-lg ${tab === 'sent' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Sent
        </button>
        {tab === 'inbox' && (
          <>
            <span className="text-gray-300 mx-1">|</span>
            <button type="button" onClick={() => setFilter('all')} className={`text-sm px-3 py-1.5 rounded ${filter === 'all' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>All</button>
            <button type="button" onClick={() => setFilter('unread')} className={`text-sm px-3 py-1.5 rounded ${filter === 'unread' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>Unread</button>
            <button type="button" onClick={() => setFilter('archived')} className={`text-sm px-3 py-1.5 rounded ${filter === 'archived' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>Deleted</button>
          </>
        )}
        <button
          type="button"
          onClick={() => { setComposeDefaults({}); setShowCompose(true); }}
          className="ml-auto bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Compose
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Message list — left */}
        <div className="w-80 shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No messages.</p>
            ) : (
              list.map((msg) => {
                const isInbox = tab === 'inbox';
                const isSelected = selectedId === msg.id;
                const from = isInbox ? msg.name : msg.recipientEmail;
                const preview = isInbox ? (msg.message?.slice(0, 60) || '') + (msg.message?.length > 60 ? '…' : '') : (msg.subject || '') + ' — ' + (msg.body?.slice(0, 40) || '') + (msg.body?.length > 40 ? '…' : '');
                const date = new Date(msg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setSelectedId(msg.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-red-600' : ''} ${!isInbox ? '' : !msg.read ? 'font-semibold' : ''}`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-sm text-gray-900 truncate">{from}</span>
                      <span className="text-xs text-gray-500 shrink-0">{date}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{preview}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Read pane — right */}
        <div className="flex-1 min-w-0 flex flex-col bg-gray-50 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a message</div>
          ) : (
            <>
              <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {tab === 'inbox' ? (
                      <>
                        <p className="font-semibold text-gray-900">{selected.name}</p>
                        <a href={`mailto:${selected.email}`} className="text-sm text-blue-600 hover:underline">{selected.email}</a>
                        {selected.phone && <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="text-sm text-gray-600 ml-2">{selected.phone}</a>}
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">To: <a href={`mailto:${selected.recipientEmail}`} className="text-blue-600 hover:underline">{selected.recipientEmail}</a></p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">{new Date(selected.createdAt).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {tab === 'inbox' && (
                      <>
                        <button type="button" onClick={() => { setComposeDefaults({ recipientEmail: selected.email, subject: `Re: ${selected.name}'s enquiry` }); setShowCompose(true); }} className="text-sm font-medium text-red-600 hover:text-red-700">Reply</button>
                        {!selected.read && <button type="button" onClick={() => markRead(selected.id)} className="text-sm font-medium text-gray-600 hover:text-gray-900">Mark read</button>}
                        <button type="button" onClick={() => markArchived(selected.id, !selected.archived)} className="text-sm font-medium text-gray-600 hover:text-gray-900">{selected.archived ? 'Restore' : 'Delete'}</button>
                        {selected.archived && <button type="button" onClick={() => permanentDelete(selected.id)} disabled={deletingId === selected.id} className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50">Permanently delete</button>}
                      </>
                    )}
                  </div>
                </div>
                {tab === 'sent' && <p className="font-semibold text-gray-900 mt-2">{selected.subject}</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {tab === 'inbox' ? selected.message : selected.body}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
