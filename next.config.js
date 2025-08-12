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
}

module.exports = nextConfig
