/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  // Enable static file serving for textures
  async rewrites() {
    return [
      {
        source: "/textures/:path*",
        destination: "/textures/:path*",
      },
    ];
  },
  outputFileTracingRoot: "/Users/fielzachary/exoplanet",
};

module.exports = nextConfig;
