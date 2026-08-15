export async function getServerSideProps({ res }) {
  const base = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/api/feed.xml`);
    const xml = await r.text();
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.write(xml);
    res.end();
  } catch {
    res.statusCode = 502;
    res.end('RSS unavailable');
  }
  return { props: {} };
}

export default function RssFeed() {
  return null;
}
