import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import AuthProvider from '@/components/AuthProvider';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null,
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tiemreudecor.com"),
  title: {
    default: "Tiệm Rêu Décor - Terrarium & Moss Art Thủ Công",
    template: "%s | Tiệm Rêu Décor",
  },
  description:
    "Khám phá bộ sưu tập terrarium và moss art thủ công tại Tiệm Rêu Décor. Giao hàng toàn quốc, chăm sóc tận tâm.",
  keywords: ["terrarium", "moss art", "cây cảnh mini", "tiệu cảnh", "trang trí nội thất", "mua terrarium", "tiệm rêu décor"],
  authors: [{ name: "Tiệm Rêu Décor" }],
  openGraph: {
    title: "Tiệm Rêu Décor - Terrarium & Moss Art Thủ Công",
    description: "Khám phá bộ sưu tập terrarium và moss art thủ công. Giao hàng toàn quốc.",
    type: "website",
    locale: "vi_VN",
    siteName: "Tiệm Rêu Décor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiệm Rêu Décor",
    description: "Terrarium & Moss Art Thủ Công",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}