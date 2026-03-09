import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

function ComposeModal({ onClose, onSent, replyTo }) {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState(replyTo?.to || replyTo?.from || '');
  const [subject, setSubject] = useState(replyTo?.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo?.subject || ''}`.trim());
  const [body, setBody] = useState(replyTo?.body ? `\n\n---\n${replyTo.body}` : '');
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientEmail?.trim() || !subject?.trim() || !body?.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post('/api/admin/messages/send', { recipientEmail: recipientEmail.trim(), subject, body });
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
          <h2 className="text-lg font-bold text-white">Compose Email</h2>
          <button type="button" onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <div className="flex flex-1 min-h-0">
          <form onSubmit={handleSend} className="flex flex-col w-full md:w-[420px] shrink-0 p-6 space-y-4 overflow-y-auto border-r border-white/10">
            {error && <p className="text-sm text-red">{error}</p>}
            <div className="relative">
              <label className="block text-xs text-cream/50 mb-1">To</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                placeholder="Recipient email"
                className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
                required
              />
              {showDropdown && searchResults.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 py-1 bg-bg-elevated border border-white/10 rounded-xl shadow-lg z-50 max-h-48 overflow-auto">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => { setRecipientEmail(u.email); setShowDropdown(false); setSearchResults([]); }}
                        className="w-full text-left px-4 py-2 text-sm text-cream/90 hover:text-white hover:bg-white/10"
                      >
                        {u.name} — {u.email}
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
                rows={8}
                className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream resize-none"
                required
              />
            </div>
            <p className="text-xs text-cream/50">Double-check the recipient address to avoid bounces.</p>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={sending} className="bg-red text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-dark disabled:opacity-50">
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">Cancel</button>
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

function MessageModal({ message, folder, onClose, onReply }) {
  const safeHtml = message?.bodyHtml
    ? { __html: message.bodyHtml }
    : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white truncate pr-4">{message?.subject}</h2>
          <button type="button" onClick={onClose} className="text-cream/60 hover:text-white text-xl shrink-0">&times;</button>
        </div>
        <div className="p-4 border-b border-white/10 text-sm text-cream/80 space-y-1 shrink-0">
          <p><span className="text-cream/50">From:</span> {message?.from}</p>
          <p><span className="text-cream/50">To:</span> {message?.to}</p>
          <p><span className="text-cream/50">Date:</span> {message?.date ? new Date(message.date).toLocaleString() : ''}</p>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {safeHtml ? (
            <div className="prose prose-invert prose-sm max-w-none break-words" dangerouslySetInnerHTML={safeHtml} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-cream/90 font-sans">{message?.bodyText || 'No content'}</pre>
          )}
        </div>
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => onReply({ from: message?.from, to: message?.to, subject: message?.subject, body: message?.bodyText })}
            className="text-sm font-medium text-accent hover:underline"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmail() {
  const [tab, setTab] = useState('inbox');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetail, setMessageDetail] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === 'inbox' ? '/api/admin/mail/inbox' : '/api/admin/mail/sent';
      const data = await api.get(endpoint);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load mailbox');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openMessage = async (item) => {
    const folder = tab === 'inbox' ? 'INBOX' : 'Sent';
    setSelectedMessage(item);
    setMessageDetail(null);
    setLoadingMessage(true);
    try {
      const data = await api.get(`/api/admin/mail/messages/${folder}/${item.uid}`);
      setMessageDetail(data);
    } catch (err) {
      setMessageDetail({ subject: item.subject, from: item.from, to: item.to, date: item.date, bodyText: err.message });
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    setSelectedMessage(null);
    setMessageDetail(null);
    setComposeOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${tab === 'inbox' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
        >
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${tab === 'sent' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
        >
          Sent
        </button>
        <button
          type="button"
          onClick={() => { setReplyTo(null); setComposeOpen(true); }}
          className="ml-auto text-sm font-medium px-4 py-2 rounded-xl bg-red text-white hover:bg-red-dark transition-colors"
        >
          New email
        </button>
      </div>

      <p className="text-xs text-cream/50 mb-4">
        Live view of your IONOS mailbox. Sending uses the same account (no need to open IONOS webmail).
      </p>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red/10 border border-red/30 text-red">
          <p className="font-medium">Mailbox unavailable</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2 text-cream/70">Ensure IMAP is configured (IMAP_HOST, IMAP_USER, IMAP_PASS or SMTP_USER/SMTP_PASS for the same mailbox).</p>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-2">
          {list.length === 0 && !error && (
            <p className="text-cream/60 py-8">{tab === 'inbox' ? 'No emails in inbox.' : 'No sent emails.'}</p>
          )}
          {list.map((item) => (
            <button
              key={`${tab}-${item.uid}`}
              type="button"
              onClick={() => openMessage(item)}
              className="w-full text-left bg-bg-card border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{tab === 'inbox' ? item.from : item.to}</p>
                  <p className="text-sm text-cream/70 truncate">{item.subject}</p>
                </div>
                <span className="text-xs text-cream/50 shrink-0">
                  {item.date ? new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedMessage && (
        <MessageModal
          message={loadingMessage ? { ...selectedMessage, bodyText: 'Loading…' } : messageDetail}
          folder={tab}
          onClose={() => { setSelectedMessage(null); setMessageDetail(null); }}
          onReply={handleReply}
        />
      )}

      {composeOpen && (
        <ComposeModal
          replyTo={replyTo || undefined}
          onClose={() => { setComposeOpen(false); setReplyTo(null); }}
          onSent={() => { loadList(); }}
        />
      )}
    </div>
  );
}
