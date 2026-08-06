/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },

  // Allow opening the dev server via http://127.0.0.1:3000 (not just localhost)
  // without Next.js blocking dev resources/HMR.
  // Add your LAN IP here if you open the dev server from another device.
  allowedDevOrigins: ['127.0.0.1', 'localhost', '10.5.0.2', '80.225.223.80'],

  // Two-server / monorepo setup:
  // - Next.js on :3000 (UI)
  // - FastAPI on :8000 by default (GridWork Docker monorepo; override with BACKEND_URL for local)
  // Proxy API + static assets to FastAPI to keep same-origin cookies working.
  async rewrites() {
    const backend = (
      process.env.BACKEND_URL ||
      process.env.INTERNAL_API_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${backend}/static/:path*`,
      },
      // Dynamic ads.txt from admin AdSense settings (not static public file)
      {
        source: '/ads.txt',
        destination: `${backend}/api/adsense/ads.txt`,
      },
    ];
  },
};

module.exports = nextConfig;
