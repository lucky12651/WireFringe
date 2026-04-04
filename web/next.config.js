/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },

  // Two-server setup:
  // - Next.js on :3000
  // - FastAPI on :8000
  // Proxy API + static assets to FastAPI to avoid CORS.
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
