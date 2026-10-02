/**
 * Origin Next.js uses to reach FastAPI.
 * Browser calls stay on the site (/api/...). This value is only for the
 * server-side proxy and for SSR fetches.
 *
 * A public BACKEND_URL such as https://wirefringe.com must not be used here:
 * the proxy would call the site itself and every login would return 500.
 */
function internalApiBase() {
  const internal = clean(process.env.INTERNAL_API_URL);
  if (internal) return internal;

  const backend = clean(process.env.BACKEND_URL);
  if (backend && isDirectApiUrl(backend)) return backend;

  return 'http://127.0.0.1:8000';
}

function clean(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function isDirectApiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch (_) {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.internal') || host.endsWith('.local')) {
    return true;
  }
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 127 || a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

module.exports = { internalApiBase };
module.exports.internalApiBase = internalApiBase;
