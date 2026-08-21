import { stripHtml } from './utils';

function fingerprint(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’“”"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isSameTitle(a, b) {
  const x = fingerprint(a);
  const y = fingerprint(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.startsWith(y) && x.length <= y.length + 28) return true;
  if (y.startsWith(x) && y.length <= x.length + 28) return true;
  const shorter = x.length < y.length ? x : y;
  const longer = x.length < y.length ? y : x;
  return shorter.length > 24 && longer.includes(shorter) && longer.length - shorter.length < 36;
}

export function isJunkHeading(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return true;
  if (t.length < 3) return true;
  if (/^\$/.test(t)) return true;
  if (/%\s*off/i.test(t) && t.length < 48) return true;
  if (/^[\d\s$%.,off]+$/i.test(t)) return true;
  if (/^(buy now|shop now|deal of the day|sponsored)\b/i.test(t) && t.length < 32) return true;
  return false;
}

function wrapBareHeading(inner) {
  const t = String(inner || '').trim();
  if (!t) return '';
  if (/^<h[1-6]\b/i.test(t)) return t;
  const text = stripHtml(t).trim();
  if (!text) return '';
  return `<h2>${text}</h2>`;
}

function normalizeGutenberg(html) {
  let raw = String(html || '').trim();
  if (!raw) return '';

  if (/<!--\s*wp:/i.test(raw)) {
    raw = raw.replace(
      /<!--\s*wp:paragraph(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:paragraph\s*-->/gi,
      (_, inner) => {
        const t = String(inner || '').trim();
        if (!t) return '';
        if (/^<p[\s>]/i.test(t)) return t;
        return `<p>${t}</p>`;
      }
    );
    raw = raw.replace(
      /<!--\s*wp:heading(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:heading\s*-->/gi,
      (_, inner) => wrapBareHeading(inner)
    );
    raw = raw.replace(
      /<!--\s*wp:list(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:list\s*-->/gi,
      (_, inner) => String(inner || '').trim()
    );
    raw = raw.replace(
      /<!--\s*wp:quote(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:quote\s*-->/gi,
      (_, inner) => {
        const t = String(inner || '').trim();
        if (!t) return '';
        if (/^<blockquote/i.test(t)) return t;
        return `<blockquote>${t}</blockquote>`;
      }
    );
    raw = raw.replace(
      /<!--\s*wp:(?:image|embed|html|separator|spacer|group|columns|column)(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:\w+\s*-->/gi,
      (_, inner) => String(inner || '').trim()
    );
    raw = raw.replace(/<!--\s*\/?wp:[^>]*-->/gi, '');
  }

  if (!/<\/p>/i.test(raw) && /<br\s*\/?>\s*<br\s*\/?>/i.test(raw)) {
    const parts = raw
      .split(/<br\s*\/?>\s*<br\s*\/?>/i)
      .map((s) => s.replace(/<br\s*\/?>/gi, ' ').trim())
      .filter(Boolean);
    if (parts.length > 1) {
      raw = parts.map((p) => (/^<p[\s>]/i.test(p) ? p : `<p>${p}</p>`)).join('\n');
    }
  }

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    const paras = raw
      .split(/\n\s*\n+/)
      .map((s) => s.replace(/\n/g, ' ').trim())
      .filter(Boolean);
    if (paras.length) raw = paras.map((p) => `<p>${p}</p>`).join('\n');
  }

  raw = raw.replace(/^([^<][\s\S]*?)(?=<)/, (_, text) => {
    const t = String(text || '').trim();
    if (!t) return '';
    return `<h2>${t}</h2>`;
  });

  raw = raw.replace(/<h1(\b[^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
  return raw.trim();
}

export function prepareArticleHtml(html, title = '') {
  let raw = normalizeGutenberg(html);
  if (!raw) return '';

  raw = raw.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi, (block) => {
    const text = stripHtml(block);
    if (isJunkHeading(text) || isSameTitle(text, title)) return '';
    return block;
  });

  raw = raw.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (block, offset) => {
    if (offset > 80) return block;
    const text = stripHtml(block);
    if (isSameTitle(text, title)) return '';
    return block;
  });

  raw = raw.replace(/(?:<p\b[^>]*>\s*<\/p>\s*)+/gi, '');
  raw = raw.replace(/(?:<h2\b[^>]*>\s*<\/h2>\s*)+/gi, '');
  return raw.trim();
}

export function splitHtmlBlocks(html) {
  const raw = String(html || '').trim();
  if (!raw) return [];

  if (/<\/p>/i.test(raw) || /<\/h[1-6]>/i.test(raw)) {
    const parts = raw
      .split(/(?=<(?:p|h[1-6]|blockquote|ul|ol|figure|div|hr|pre|table)\b)/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts;
  }

  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return [raw];
  const sentences = plain.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  if (sentences.length >= 2) {
    const groups = [];
    for (let i = 0; i < sentences.length; i += 2) {
      groups.push(`<p>${sentences.slice(i, i + 2).join(' ')}</p>`);
    }
    return groups;
  }
  return [`<p>${plain}</p>`];
}

export function isParagraphBlock(html) {
  const s = String(html || '').trim();
  if (/^<p[\s>]/i.test(s) || /<\/p>/i.test(s)) return true;
  if (/^<h[1-6]/i.test(s) || /^<(?:ul|ol|figure|pre|table|hr)\b/i.test(s)) return false;
  const text = s.replace(/<[^>]+>/g, '').trim();
  return text.length > 80;
}

export function decoratePullQuote(blocks) {
  let used = false;
  return (blocks || []).map((block, index) => {
    const html = String(block || '');
    if (used || index < 2 || index > 7) return { html, pull: false };
    if (!/^<p[\s>]/i.test(html.trim())) return { html, pull: false };
    const text = stripHtml(html).replace(/\s+/g, ' ').trim();
    if (text.length < 72 || text.length > 180) return { html, pull: false };
    if (!/^["“]/.test(text) && !/\b(said|says|told|according to)\b/i.test(text)) {
      return { html, pull: false };
    }
    used = true;
    return { html: `<blockquote>${text}</blockquote>`, pull: true };
  });
}
