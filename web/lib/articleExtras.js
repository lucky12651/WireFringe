import { slugifyTitle, stripHtml } from './utils';

export function extractHeadings(html) {
  const out = [];
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let m;
  let i = 0;
  while ((m = re.exec(String(html || '')))) {
    const text = stripHtml(m[1] || '').trim();
    if (!text) continue;
    i += 1;
    const id = slugifyTitle(text) || `section-${i}`;
    out.push({ id, text });
  }
  return out;
}

export function injectHeadingIds(html) {
  let i = 0;
  return String(html || '').replace(/<h2(\b[^>]*)>([\s\S]*?)<\/h2>/gi, (full, attrs, inner) => {
    if (/\sid\s*=/i.test(attrs || '')) return full;
    i += 1;
    const text = stripHtml(inner || '').trim();
    const id = slugifyTitle(text) || `section-${i}`;
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
}

export function extractKeyPoints(html, max = 3) {
  const headings = extractHeadings(html).map((h) => h.text).filter((t) => t.length > 8 && t.length < 110);
  if (headings.length >= max) return headings.slice(0, max);
  const paras = String(html || '')
    .split(/<\/p>/i)
    .map((s) => stripHtml(s).replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 50 && s.length < 180 && !/rewritten from/i.test(s));
  const merged = [...headings];
  for (const p of paras) {
    if (merged.length >= max) break;
    if (!merged.some((x) => x.slice(0, 24) === p.slice(0, 24))) merged.push(p);
  }
  return merged.slice(0, max);
}

export function heroCredit(post) {
  const name = String(post?.sourceName || '').trim();
  if (name) return `Photo: ${name}`;
  return 'Photo: Wirefringe';
}

export function relativeUpdated(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 2) return 'Updated just now';
  if (mins < 60) return `Updated ${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`;
}

export function shouldShowUpdated(post) {
  const u = post?.updatedAt || post?.correctedAt;
  if (!u) return false;
  if (post?.correction) return true;
  if (!post?.date) return true;
  const pub = new Date(post.date).getTime();
  const upd = new Date(u).getTime();
  return Number.isFinite(pub) && Number.isFinite(upd) && upd - pub > 5 * 60 * 1000;
}

export function neighborsInCategory(post, latest = []) {
  const bucket = String(post?.bucket || '');
  const list = (latest || []).filter((p) => String(p?.id) !== String(post?.id) && p?.bucket === bucket);
  const dated = [...(latest || [])].filter((p) => p?.bucket === bucket);
  dated.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const idx = dated.findIndex((p) => String(p.id) === String(post?.id));
  let prev = null;
  let next = null;
  if (idx >= 0) {
    prev = dated[idx - 1] || null;
    next = dated[idx + 1] || null;
  }
  if (!prev) prev = list[0] || null;
  if (!next) next = list[1] || list[0] || null;
  if (prev && next && String(prev.id) === String(next.id)) next = list.find((p) => String(p.id) !== String(prev.id)) || null;
  return { prev, next };
}
