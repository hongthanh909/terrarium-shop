/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,

  // Nén response để giảm băng thông
  compress: true,

  // Bỏ header X-Powered-By
  poweredByHeader: false,

  // Output mode — standalone để chạy tốt hơn trên VPS với PM2
  // (tạo .next/standalone có thể chạy node server.js trực tiếp)
  output: 'standalone',

  // Tối ưu package imports (tree-shaking tốt hơn)
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

  // Giảm logging noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256],
    minimumCacheTTL: 86400,
    remotePatterns: [
      // ── Supabase (dùng trong giai đoạn chuyển đổi) ────────────────────
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.com',
      },
      // ── MinIO Storage VPS ──────────────────────────────────────────────
      {
        protocol: 'https',
        hostname: 'storage.tiemreudecor.com',
      },
      // ── Truy cập trực tiếp qua IP VPS (dev/debug) ─────────────────────
      {
        protocol: 'http',
        hostname: '14.225.210.118',
      },
      {
        protocol: 'https',
        hostname: '14.225.210.118',
      },
      // ── Ảnh mẫu và placeholder ────────────────────────────────────────
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
      // ── Google (avatar, fonts) ────────────────────────────────────────
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

  // Headers bảo mật
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
