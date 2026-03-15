/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
  },
}

module.exports = nextConfig
