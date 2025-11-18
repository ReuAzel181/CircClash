/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'circlash.game'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Experimental features to help with caching issues
  experimental: {
    // Disable incremental cache to prevent stale builds
    isrMemoryCacheSize: 0,
  },
  // Configure webpack to handle file watching better
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Improve file watching on Windows
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
    }
    return config
  },
}

module.exports = nextConfig
