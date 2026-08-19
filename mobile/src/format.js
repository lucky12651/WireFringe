export function stripHtml(html) {
  let s = String(html || '');
  if (!s) return '';
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<\/?[^>]+>/g, ' ');
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : ' ';
    });
  return s.replace(/\s+/g, ' ').trim();
}

export function excerpt(post, max = 160) {
  const text = stripHtml(post?.excerpt || '') || stripHtml(post?.content || '');
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export function relativeTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 2) return 'JUST NOW';
  if (m < 60) return `${m} MIN AGO`;
  if (h === 1) return 'AN HOUR AGO';
  if (h < 24) return `${h} HOURS AGO`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function displayName(post) {
  return String(post?.creatorName || post?.creator || 'Wirefringe').trim();
}

export function htmlToBlocks(html, apiBase) {
  let s = String(html || '');
  const images = [];
  s = s.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_, src) => {
    images.push(absUrl(src, apiBase));
    return `\n\n%%IMG${images.length - 1}%%\n\n`;
  });
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|h1|h2|h3|li|blockquote|div)>/gi, '\n\n');
  s = s.replace(/<li[^>]*>/gi, '• ');
  const text = stripHtml(s);
  const chunks = text
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
  return chunks.map((chunk) => {
    const m = chunk.match(/^%%IMG(\d+)%%$/);
    if (m) return { type: 'image', uri: images[Number(m[1])] };
    return { type: 'p', text: chunk };
  });
}

export function absUrl(path, apiBase) {
  if (!path) return null;
  const raw = String(path).trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const base = String(apiBase || '').replace(/\/$/, '');
  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function compact(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function postMatchesFollows(post, follows) {
  if (!post || !follows?.length) return false;
  const topics = new Set();
  const authors = new Set();
  for (const row of follows) {
    const target = String(row?.target || '').trim();
    if (!target) continue;
    if (row.kind === 'topic') {
      topics.add(target.toLowerCase());
      topics.add(compact(target));
    } else if (row.kind === 'author') {
      authors.add(target.toLowerCase());
      authors.add(compact(target));
    }
  }
  const bucket = String(post.bucket || '').trim();
  if (bucket && (topics.has(bucket.toLowerCase()) || topics.has(compact(bucket)))) {
    return true;
  }
  for (const name of [post.creator, post.creatorName]) {
    const value = String(name || '').trim();
    if (value && (authors.has(value.toLowerCase()) || authors.has(compact(value)))) {
      return true;
    }
  }
  return false;
}
