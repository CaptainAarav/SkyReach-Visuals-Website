import { AppError } from './AppError.js';

/** Pragmatic email validation (local-part + domain); max lengths per RFC-ish practice. */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MAX_EMAIL_LEN = 254;
const MAX_LOCAL_LEN = 64;

export function isValidEmail(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EMAIL_LEN) return false;
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return false;
  const local = trimmed.slice(0, at);
  if (local.length > MAX_LOCAL_LEN) return false;
  return EMAIL_RE.test(trimmed);
}

/**
 * Split CC input (comma / semicolon / newline), trim, lowercase, dedupe; throws with message if any invalid.
 * @param {string|string[]|undefined|null} input
 * @returns {string[]}
 */
export function normalizeAndValidateCcList(input) {
  if (input == null || input === '') return [];
  const parts = Array.isArray(input)
    ? input
    : String(input)
        .split(/[,;\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const lower = p.toLowerCase();
    if (seen.has(lower)) continue;
    if (!isValidEmail(p)) {
      throw new AppError(`Invalid CC email: ${p}`, 400);
    }
    seen.add(lower);
    out.push(p.trim());
  }
  return out;
}

export function validatePrimaryEmail(raw) {
  if (!raw || typeof raw !== 'string' || !isValidEmail(raw)) {
    throw new AppError('Invalid recipient email address', 400);
  }
  return raw.trim();
}
