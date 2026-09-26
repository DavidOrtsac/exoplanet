/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Single-process server (.next/standalone/server.js) instead of `next start`
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/ml-proxy/:path*',
        destination: 'http://127.0.0.1:5001/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
