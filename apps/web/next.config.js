/** @type {import('next').NextConfig} */
module.exports = {
  // Tắt strict mode trong dev để tránh double render
  reactStrictMode: false,

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
};