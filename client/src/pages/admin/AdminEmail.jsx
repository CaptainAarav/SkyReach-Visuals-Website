import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { getLogoUrl } from '../../utils/logoUrl.js';

function ComposeModal({ onClose, onSent, replyTo }) {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState(replyTo?.to || replyTo?.from || '');
  const [cc, setCc] = useState('');
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
      await api.post('/api/admin/messages/send', {
        recipientEmail: recipientEmail.trim(),
        cc: cc.trim() || undefined,
        subject,
        body,
      });
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
  const logoUrl = getLogoUrl();

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:40px 20px;background:#F5F5F7;font-family:'Inter',Arial,sans-serif;color:#111827}.card{max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb;overflow:hidden}.card-inner{padding:24px}.card h1{margin:0 0 8px;font-size:20px;font-weight:600;color:#111827}.card .body{font-size:15px;line-height:1.6;color:#4b5563;white-space:pre-wrap;margin:16px 0}.card .footer{padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280}.card .footer strong{color:#111827}img{display:block;max-width:100%;height:auto;border-radius:4px}</style></head><body><div class="card"><div class="card-inner"><img src="${escapeHtml(logoUrl)}" alt="SkyReach Visuals" width="120" height="40"/><h1>${escapeHtml(displaySubject)}</h1><div class="body">${escapeHtml(displayBody)}</div><div class="footer"><strong>SkyReach Visuals</strong><br/>${escapeHtml(senderName)} — Drone Aerial Photography &amp; Inspection · 07877 691861 · support@skyreachvisuals.co.uk</div><img src="${escapeHtml(logoUrl)}" alt="SkyReach Visuals" width="96" height="32" style="margin-top:12px"/></div></div></body></html>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white">Compose Email</h2>
          <button type="button" onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <form onSubmit={handleSend} className="flex flex-col w-full md:w-[420px] shrink-0 p-6 space-y-4 overflow-y-auto md:border-r border-white/10">
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
              <label className="block text-xs text-cream/50 mb-1">CC <span className="text-cream/40">(optional)</span></label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Comma-separated emails"
                className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream placeholder:text-cream/40"
              />
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
              <button type="button" onClick={onClose} className="text-sm font-medium bg-red text-white px-4 py-2 rounded-xl hover:bg-red-dark">Cancel</button>
            </div>
          </form>
          <div className="flex flex-col flex-1 min-w-0 p-4 min-h-[280px]" style={{ backgroundColor: '#F5F5F7' }}>
            <p className="text-xs text-gray-500 mb-2 font-medium shrink-0">Preview (as recipient will see — always light)</p>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200" style={{ backgroundColor: '#F5F5F7' }}>
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="w-full min-h-[320px] border-0 rounded-xl"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Infer email source from subject for outline colour: quote, booking, contact, direct */
function getEmailSource(subject, from) {
  const s = (subject || '').toLowerCase();
  const f = (from || '').toLowerCase();
  if (/\bquote|get a quote|quote request\b/.test(s) || /\bquote\b/.test(f)) return 'quote';
  if (/\bbooking|order|create booking|pay now|invoice\b/.test(s)) return 'booking';
  if (/\bcontact|enquir|enquiry|message from|get in touch\b/.test(s)) return 'contact';
  return 'direct';
}

const SOURCE_BORDER = {
  quote: 'border-l-4 border-l-blue-500',
  booking: 'border-l-4 border-l-emerald-500',
  contact: 'border-l-4 border-l-amber-500',
  direct: 'border-l-4 border-l-accent',
};

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
  const [emailSearchQuery, setEmailSearchQuery] = useState('');

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
    <div className="admin-messages-page rounded-xl border border-white/10 overflow-hidden bg-bg">
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
              <div className="px-3 py-2 border-b border-white/10 flex flex-col gap-2 shrink-0">
                <label className="text-cream/40 text-sm">Search mail</label>
                <input
                  type="text"
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  placeholder="Search by sender, recipient, or subject..."
                  className="w-full bg-bg border border-white/20 rounded-lg py-1.5 px-2 text-sm text-cream placeholder:text-cream/40"
                />
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center p-4"><LoadingSpinner /></div>
              ) : list.length === 0 && !error ? (
                <div className="flex-1 flex items-center justify-center p-4 text-cream/50 text-sm">{tab === 'inbox' ? 'No emails in inbox.' : 'No sent emails.'}</div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {list
                    .filter((item) => {
                      if (!emailSearchQuery.trim()) return true;
                      const q = emailSearchQuery.trim().toLowerCase();
                      const from = (item.from || '').toLowerCase();
                      const to = (item.to || '').toLowerCase();
                      const subject = (item.subject || '').toLowerCase();
                      return from.includes(q) || to.includes(q) || subject.includes(q);
                    })
                    .map((item) => {
                    const isSelected = selectedMessage?.uid === item.uid;
                    const source = getEmailSource(item.subject, item.from);
                    const outlineClass = SOURCE_BORDER[source] || SOURCE_BORDER.direct;
                    return (
                      <button
                        key={`${tab}-${item.uid}`}
                        type="button"
                        onClick={() => openMessage(item)}
                        className={`w-full text-left px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors ${outlineClass} ${isSelected ? 'bg-white/10' : ''}`}
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
