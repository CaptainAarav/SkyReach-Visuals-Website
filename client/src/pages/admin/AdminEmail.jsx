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

  const displaySubject = (subject || '').replace(/^Re:\s*/i, '').trim() || '(No subject)';
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
          <div className="hidden md:flex flex-col flex-1 min-w-0 bg-[#0f0f0f] p-4">
            <p className="text-xs text-cream/50 mb-2 font-medium">Preview (as recipient will see — new dark design)</p>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl">
              <div className="min-h-full flex justify-center py-6" style={{ backgroundColor: '#0f0f0f' }}>
                <div className="w-full max-w-[520px] rounded-xl overflow-hidden border border-red/20" style={{ backgroundColor: '#1E2D4A' }}>
                  <div className="px-6 pt-6 pb-2">
                    <h2 className="text-cream font-semibold text-xl m-0" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>{displaySubject}</h2>
                  </div>
                  <div className="px-6 pb-4 text-cream/90 text-[15px] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>{displayBody}</div>
                  <div className="px-6 py-4 border-t border-white/10">
                    <p className="text-cream/80 text-[13px] leading-relaxed m-0" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>
                      <strong className="text-cream">SkyReach Visuals</strong><br />
                      {senderName} — Drone Aerial Photography &amp; Inspection · 07877 691861 · support@skyreachvisuals.co.uk
                    </p>
                    <img src="/skyreach_visuals_text_logo.png" alt="SkyReach Visuals" className="w-24 h-auto mt-3 opacity-90" style={{ borderRadius: '4px', filter: 'brightness(0) invert(1)' }} />
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
  const [view, setView] = useState('messages'); // 'messages' | 'people'
  const [tab, setTab] = useState('inbox');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetail, setMessageDetail] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleFilter, setPeopleFilter] = useState(''); // '' | 'quote' | 'booking' | 'direct'

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

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = peopleFilter ? `?filter=${encodeURIComponent(peopleFilter)}` : '';
      const raw = await api.get(`/api/admin/people${params}`);
      const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
      setPeople(list);
    } catch (err) {
      setError(err?.message || 'Could not load people');
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [peopleFilter]);

  useEffect(() => {
    if (view === 'messages') {
      setError(null);
      loadList();
    } else {
      setError(null);
      loadPeople();
    }
  }, [view, loadList, loadPeople]);

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
    <div className="admin-messages-page force-dark rounded-xl border border-white/10 overflow-hidden bg-bg">
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView('messages')}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${view === 'messages' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
          >
            Messages
          </button>
          <button
            type="button"
            onClick={() => setView('people')}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${view === 'people' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
          >
            People
          </button>
          {view === 'messages' && (
            <>
              <button
                type="button"
                onClick={() => setTab('inbox')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${tab === 'inbox' ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white border border-white/10'}`}
              >
                Inbox
              </button>
              <button
                type="button"
                onClick={() => setTab('sent')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${tab === 'sent' ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white border border-white/10'}`}
              >
                Sent
              </button>
            </>
          )}
          {view === 'people' && (
            <>
              <button
                type="button"
                onClick={() => setPeopleFilter('')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${!peopleFilter ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white border border-white/10'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPeopleFilter('quote')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${peopleFilter === 'quote' ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white border border-white/10'}`}
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => setPeopleFilter('booking')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${peopleFilter === 'booking' ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white border border-white/10'}`}
              >
                Booking
              </button>
              <button
                type="button"
                onClick={() => setPeopleFilter('direct')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${peopleFilter === 'direct' ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white border border-white/10'}`}
              >
                Direct email
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => { setReplyTo(null); setComposeOpen(true); }}
            className="ml-auto text-sm font-medium px-4 py-2 rounded-xl bg-red text-white hover:bg-red-dark transition-colors"
          >
            New email
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red/10 border border-red/30 text-red">
            <p className="font-medium">{view === 'people' ? 'Could not load people' : 'Mailbox unavailable'}</p>
            <p className="text-sm mt-1">{error}</p>
            {view === 'messages' && (
              <p className="text-xs mt-2 text-cream/70">Ensure IMAP is configured (IMAP_HOST, IMAP_USER, IMAP_PASS or SMTP_USER/SMTP_PASS for the same mailbox).</p>
            )}
          </div>
        )}

        {view === 'people' ? (
          loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-2">
              {people.length === 0 && !error && (
                <p className="text-cream/60 py-8">No people match this filter.</p>
              )}
              {people.map((p) => (
                <div
                  key={p.email}
                  className="flex items-center justify-between gap-4 bg-bg-card border border-white/10 rounded-xl p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{p.name}</p>
                    <p className="text-sm text-cream/70 truncate">{p.email}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {(p.sources || []).map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-lg bg-white/10 text-cream/80 capitalize">
                        {s}
                      </span>
                    ))}
                  </div>
                  <a
                    href={`mailto:${p.email}`}
                    className="text-sm font-medium text-accent hover:underline shrink-0"
                  >
                    Email
                  </a>
                </div>
              ))}
            </div>
          )
        ) : view === 'messages' ? (
          <div className="flex flex-col md:flex-row gap-0 rounded-xl border border-white/10 overflow-hidden bg-bg-card min-h-[420px]">
            {/* Left: message list — Gmail/Outlook style */}
            <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-white/10 flex flex-col max-h-[50vh] md:max-h-none md:min-h-[420px]">
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 shrink-0">
                <span className="text-cream/40 text-sm">Search mail</span>
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center p-4"><LoadingSpinner /></div>
              ) : list.length === 0 && !error ? (
                <div className="flex-1 flex items-center justify-center p-4 text-cream/50 text-sm">{tab === 'inbox' ? 'No emails in inbox.' : 'No sent emails.'}</div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {list.map((item) => {
                    const isSelected = selectedMessage?.uid === item.uid;
                    return (
                      <button
                        key={`${tab}-${item.uid}`}
                        type="button"
                        onClick={() => openMessage(item)}
                        className={`w-full text-left px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/10 border-l-2 border-l-red' : ''}`}
                      >
                        <div className="flex justify-between gap-2 items-start">
                          <span className="text-sm font-medium text-cream truncate flex-1">{tab === 'inbox' ? item.from : item.to}</span>
                          <span className="text-xs text-cream/50 shrink-0">{item.date ? new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                        <p className="text-xs text-cream/60 truncate mt-0.5">{item.subject || '(No subject)'}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Right: read pane — Gmail/Outlook style */}
            <div className="flex-1 flex flex-col min-w-0 bg-bg min-h-[320px]">
              {!selectedMessage ? (
                <div className="flex-1 flex flex-col items-center justify-center text-cream/50 text-sm p-8">
                  <svg className="w-12 h-12 text-cream/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Select a message
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-white/10 shrink-0 space-y-1">
                    <h2 className="text-lg font-semibold text-cream truncate pr-8">{loadingMessage ? 'Loading…' : (messageDetail?.subject || selectedMessage.subject)}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-0 text-sm text-cream/70">
                      <span><strong className="text-cream/80">From:</strong> {messageDetail?.from ?? selectedMessage.from}</span>
                      <span><strong className="text-cream/80">To:</strong> {messageDetail?.to ?? selectedMessage.to}</span>
                      <span><strong className="text-cream/80">Date:</strong> {messageDetail?.date || selectedMessage.date ? new Date(messageDetail?.date || selectedMessage.date).toLocaleString() : ''}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingMessage ? (
                      <p className="text-cream/50">Loading…</p>
                    ) : messageDetail?.bodyHtml ? (
                      <div className="prose prose-invert prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: messageDetail.bodyHtml }} />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-cream/90 font-sans">{messageDetail?.bodyText ?? messageDetail?.body ?? 'No content'}</pre>
                    )}
                  </div>
                  <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReply({ from: messageDetail?.from ?? selectedMessage.from, to: messageDetail?.to ?? selectedMessage.to, subject: messageDetail?.subject ?? selectedMessage.subject, body: messageDetail?.bodyText ?? messageDetail?.body })}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Reply
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

      </div>

      {composeOpen && (
        <ComposeModal
          replyTo={replyTo || undefined}
          onClose={() => { setComposeOpen(false); setReplyTo(null); }}
          onSent={() => { if (view === 'messages') loadList(); }}
        />
      )}
    </div>
  );
}
