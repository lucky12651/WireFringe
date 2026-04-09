/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },

  // Allow opening the dev server via http://127.0.0.1:3000 (not just localhost)
  // without Next.js blocking dev resources/HMR.
  // Add your LAN IP here if you open the dev server from another device.
  allowedDevOrigins: ['127.0.0.1', 'localhost', '10.5.0.2'],

  // Two-server setup:
  // - Next.js on :3000 (UI)
  // - FastAPI on :8000 (API + /static uploads/CSS)
  // Proxy API + static assets to FastAPI to keep same-origin cookies working.
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${backend}/static/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
