import type { NextConfig } from 'next'

const apiUrl = process.env.API_URL || 'http://localhost:5034/api'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.simulacros.pe' },
      { protocol: 'https', hostname: 'cocodrilito-backend-production.up.railway.app' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
