/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 生产 Docker 部署使用 standalone 输出，产物更小、启动更快
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas', 'jsdom']
    return config
  },
}

export default nextConfig
