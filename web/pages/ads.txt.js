/**
 * Dynamic /ads.txt — always reflects admin AdSense settings.
 * Static public/ads.txt was removed so deleted credentials cannot linger.
 */

function internalApiBase() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

export async function getServerSideProps({ res }) {
  let body = '';
  try {
    const r = await fetch(`${internalApiBase()}/api/adsense/ads.txt`, {
      // Never cache empty/full ads.txt after credential changes
      cache: 'no-store',
      headers: { Accept: 'text/plain' },
    });
    if (r.ok) {
      body = await r.text();
    }
  } catch {
    body = '';
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.write(body || '');
  res.end();

  return { props: {} };
}

export default function AdsTxt() {
  return null;
}
