/**
 * Dynamic /ads.txt — always reflects admin AdSense settings.
 * Static public/ads.txt was removed so deleted credentials cannot linger.
 */

import internalApi from '../lib/internalApi';

const internalApiBase = internalApi.internalApiBase;

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
