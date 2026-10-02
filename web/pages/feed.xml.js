import internalApi from '../lib/internalApi';

const internalApiBase = internalApi.internalApiBase;

export async function getServerSideProps({ res }) {
  const base = internalApiBase();
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
