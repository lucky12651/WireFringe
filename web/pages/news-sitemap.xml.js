import { api } from '../lib/api';
import { SITE_URL } from '../lib/site';
import { slugifyTitle } from '../lib/utils';

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function getServerSideProps({ res }) {
  let posts = [];
  try {
    posts = (await api('/api/posts')) || [];
  } catch {
    posts = [];
  }
  const twoDays = Date.now() - 48 * 3600 * 1000;
  const recent = posts.filter((p) => {
    const t = new Date(p.date || 0).getTime();
    return Number.isFinite(t) && t >= twoDays;
  });
  const urls = recent
    .map((p) => {
      const loc = `${SITE_URL}/post/${encodeURIComponent(slugifyTitle(p.title))}`;
      const pub = p.date ? new Date(p.date).toISOString() : '';
      return `<url><loc>${escapeXml(loc)}</loc><news:news><news:publication><news:name>Wirefringe</news:name><news:language>en</news:language></news:publication>${pub ? `<news:publication_date>${pub}</news:publication_date>` : ''}<news:title>${escapeXml(p.title)}</news:title></news:news></url>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function NewsSitemap() {
  return null;
}
