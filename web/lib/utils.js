/**
 * Shared utility functions for Coffee n Blog
 * DRY: Common formatting and calculation logic
 */

export function formatDateShort(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime?.())) return '';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export function formatDateFull(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime?.())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function monthKey(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime?.())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function pctChange(current, previous) {
  if (!previous) {
    if (!current) return { text: '0%', dir: 'flat' };
    return { text: '∞', dir: 'up' };
  }
  const v = ((current - previous) / previous) * 100;
  const dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  return { text: `${Math.abs(v).toFixed(2)}%`, dir };
}

export function initialsFromName(name) {
  const s = String(name || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/g).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

export function slugifyTitle(title) {
  const s = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return s.slice(0, 90) || 'post';
}

export function postUrl(post) {
  const id = post?.id;
  if (!id) return '/';
  const slug = slugifyTitle(post?.title);
  return `/post/${encodeURIComponent(slug)}`;
}

export function truncateText(text, maxLength, suffix = '…') {
  const s = String(text || '').trim();
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength) + suffix;
}

export function sanitizePreview(text) {
  return String(text || '')
    .trim()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate posts grouped by month for the last N months
 */
export function calculatePostsByMonth(posts, monthsCount = 6) {
  const now = new Date();
  const keys = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }

  const counts = new Map(keys.map((k) => [k, 0]));
  for (const p of posts || []) {
    if (!p?.date) continue;
    const k = monthKey(p.date);
    if (!k) continue;
    if (!counts.has(k)) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
  }

  return keys.map((k) => {
    const [yStr, mStr] = String(k).split('-');
    const year = Number(yStr);
    const monthIndex = Number(mStr) - 1;
    const label =
      Number.isFinite(year) && monthIndex >= 0 && monthIndex <= 11
        ? new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' })
        : String(k);

    return {
      key: k,
      label,
      count: counts.get(k) || 0,
    };
  });
}

/**
 * Calculate post growth for the last N days vs previous period
 */
export function calculatePostGrowth(posts, days = 30) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const startCurrent = now - days * day;
  const startPrev = now - 2 * days * day;

  let current = 0;
  let prev = 0;

  for (const p of posts || []) {
    if (!p?.date) continue;
    const t = new Date(p.date).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= startCurrent) current++;
    else if (t >= startPrev) prev++;
  }

  return { current, prev, delta: pctChange(current, prev) };
}

/**
 * Sort posts with drafts first, then by date desc
 */
export function sortPostsForDisplay(posts) {
  const base = (posts || []).map((p, idx) => ({
    ...p,
    _idx: idx,
    dateObj: p?.date ? new Date(p.date) : null,
  }));

  base.sort((a, b) => {
    const aDraft = !a.dateObj;
    const bDraft = !b.dateObj;
    if (aDraft !== bDraft) return aDraft ? -1 : 1;
    if (aDraft && bDraft) return b._idx - a._idx;
    const ta = a.dateObj ? a.dateObj.getTime() : -Infinity;
    const tb = b.dateObj ? b.dateObj.getTime() : -Infinity;
    return tb - ta;
  });

  return base;
}

/**
 * Calculate creator counts from posts
 */
export function calculateCreatorCounts(posts) {
  const out = new Map();
  for (const p of posts || []) {
    const key = (p?.creator || '').trim() || 'Unknown';
    out.set(key, (out.get(key) || 0) + 1);
  }
  return out;
}

/**
 * Calculate member stats combining users and creator counts
 */
export function calculateMemberStats(users, creatorCounts, canManageUsers) {
  const roleByUsername = new Map();
  if (canManageUsers && Array.isArray(users)) {
    for (const u of users) {
      if (!u?.username) continue;
      roleByUsername.set(u.username, u.role || '');
    }
  }

  const list = [...creatorCounts.entries()].map(([username, count]) => ({
    username,
    role: roleByUsername.get(username) || '',
    count,
  }));

  if (canManageUsers && Array.isArray(users)) {
    for (const u of users) {
      if (!u?.username) continue;
      if (creatorCounts.has(u.username)) continue;
      list.push({ username: u.username, role: u.role || '', count: 0 });
    }
  }

  list.sort((a, b) => b.count - a.count || a.username.localeCompare(b.username));
  return list;
}

export function formatRelativeDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime?.())) return '';
  
  const now = new Date();
  const diff = now - d;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
