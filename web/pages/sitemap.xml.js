import { api } from '../lib/api';
import { SITE_URL } from '../lib/site';
import { slugifyTitle } from '../lib/utils';

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const STATIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/disclaimer',
  '/community-guidelines',
  '/tip-us',
  '/archives',
  '/masthead',
  '/sourcing',
  '/search',
];

function buildUrl(loc, lastmod, changefreq, priority) {
  return [
    '<url>',
    `<loc>${escapeXml(loc)}</loc>`,
    lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    changefreq ? `<changefreq>${changefreq}</changefreq>` : '',
    priority ? `<priority>${priority}</priority>` : '',
    '</url>',
  ]
    .filter(Boolean)
    .join('');
}

export async function getServerSideProps({ res }) {
  const base = String(SITE_URL || 'https://wirefringe.com').replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);

  let postUrls = [];
  try {
    const posts = await api('/api/posts');
    postUrls = (posts || []).slice(0, 500).map((p) => {
      const slug = slugifyTitle(p.title) || p.id;
      const loc = `${base}/post/${encodeURIComponent(slug)}`;
      let lastmod = today;
      if (p.date) {
        try {
          lastmod = new Date(p.date).toISOString().slice(0, 10);
        } catch {
          /* keep today */
        }
      }
      return buildUrl(loc, lastmod, 'weekly', '0.7');
    });
  } catch {
    postUrls = [];
  }

  const staticUrls = STATIC_PATHS.map((path) => {
    const priority = path === '/' ? '1.0' : path === '/privacy' || path === '/about' ? '0.9' : '0.6';
    return buildUrl(`${base}${path === '/' ? '' : path}`, today, path === '/' ? 'hourly' : 'monthly', priority);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join('\n')}
${postUrls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
