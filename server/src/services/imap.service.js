import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { env } from '../config/env.js';

const DEFAULT_LIMIT = 50;
const SENT_NAMES = ['Sent', 'Sent Items', 'Sent Messages', 'INBOX.Sent'];

function getClient() {
  if (!env.imap?.host || !env.imap?.user || !env.imap?.pass) {
    const err = new Error('IMAP not configured');
    err.code = 'IMAP_NOT_CONFIGURED';
    throw err;
  }
  return new ImapFlow({
    host: env.imap.host,
    port: env.imap.port,
    secure: env.imap.secure !== false,
    auth: {
      user: env.imap.user,
      pass: env.imap.pass,
    },
  });
}

function formatEnvelope(msg) {
  const e = msg.envelope || {};
  const from = e.from?.[0];
  const to = (e.to || []).map((a) => (a.address ? `${a.name || ''} <${a.address}>`.trim() || a.address : '')).filter(Boolean);
  return {
    uid: msg.uid,
    from: from ? (from.address ? `${from.name || ''} <${from.address}>`.trim() : from.address) : '',
    to: to.length ? to.join(', ') : '',
    subject: e.subject || '(no subject)',
    date: e.date ? new Date(e.date).toISOString() : null,
  };
}

/**
 * Resolve Sent folder path (IONOS may use "Sent" or "Sent Items").
 */
async function getSentPath(client) {
  const list = await client.list();
  const byPath = new Map(list.map((m) => [m.path, m]));
  for (const name of SENT_NAMES) {
    if (byPath.has(name)) return name;
  }
  const sent = list.find((m) => m.specialUse === '\\Sent' || /^Sent/i.test(m.path));
  return sent ? sent.path : 'Sent';
}

/**
 * List recent messages in a mailbox (envelope only). Newest first.
 * folder: 'INBOX' or resolved Sent path
 * limit: max messages (default 50)
 */
export async function listMailbox(folder, limit = DEFAULT_LIMIT) {
  const client = getClient();
  try {
    await client.connect();
    const mailboxPath = folder === 'Sent' ? await getSentPath(client) : folder;
    const lock = await client.getMailboxLock(mailboxPath);
    try {
      const exists = client.mailbox.exists;
      if (!exists) return [];
      const start = Math.max(1, exists - limit + 1);
      const range = `${start}:${exists}`;
      const messages = await client.fetchAll(range, { envelope: true });
      const out = messages.map(formatEnvelope).reverse();
      return out;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

/**
 * Get INBOX list (last 50).
 */
export async function getInboxList(limit = DEFAULT_LIMIT) {
  return listMailbox('INBOX', limit);
}

/**
 * Get Sent list (last 50). Uses resolved Sent folder.
 */
export async function getSentList(limit = DEFAULT_LIMIT) {
  return listMailbox('Sent', limit);
}

/**
 * Fetch one message by folder and UID. Returns envelope + text/html body.
 */
export async function getMessage(folder, uid) {
  const client = getClient();
  try {
    await client.connect();
    const mailboxPath = folder === 'Sent' ? await getSentPath(client) : folder;
    const lock = await client.getMailboxLock(mailboxPath);
    try {
      const msg = await client.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
      if (!msg) return null;
      const envelope = formatEnvelope(msg);
      let bodyText = '';
      let bodyHtml = '';
      if (msg.source) {
        try {
          const raw = Buffer.isBuffer(msg.source) ? msg.source : Buffer.from(String(msg.source), 'utf-8');
          const parsed = await simpleParser(raw);
          bodyText = parsed.text || '';
          bodyHtml = parsed.html || '';
        } catch {
          const raw = typeof msg.source === 'string' ? msg.source : msg.source.toString('utf-8');
          bodyText = raw;
        }
      }
      return {
        ...envelope,
        bodyText,
        bodyHtml,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
