/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,

  // Nén response để giảm băng thông
  compress: true,

  // Bỏ header X-Powered-By để bảo mật và tăng nhẹ hiệu suất
  poweredByHeader: false,

  // Tối ưu package imports (tree-shaking tốt hơn = ít module compile hơn)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-sheet',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
    ],
  },

  // Giảm logging noise trong dev
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    // Kích thước thiết bị hợp lý cho mobile/desktop
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Kích thước nhỏ cho thumbnail, icon
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256],
    // Cache ảnh 1 ngày
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },

  // Headers bảo mật + cache tốt hơn
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets lâu hơn
        source: '/(_next/static|favicon.ico)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
