import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/lib/query-provider";
import ShopLayout from "./ShopLayout";
import { Toaster } from "sonner";

// ChatWidget lazy-loaded để tránh SSR issues
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://tiemreudecor.com"
  ),
  title: {
    default: "Tiệm Rêu Décor - Terrarium & Moss Art Thủ Công",
    template: "%s | Tiệm Rêu Décor",
  },
  description:
    "Khám phá bộ sưu tập terrarium và moss art thủ công tại Tiệm Rêu Décor. Giao hàng toàn quốc, chăm sóc tận tâm.",
  keywords: [
    "terrarium",
    "moss art",
    "cây cảnh mini",
    "tiểu cảnh",
    "trang trí nội thất",
    "mua terrarium",
    "tiệm rêu décor",
  ],
  authors: [{ name: "Tiệm Rêu Décor" }],
  openGraph: {
    title: "Tiệm Rêu Décor - Terrarium & Moss Art Thủ Công",
    description:
      "Khám phá bộ sưu tập terrarium và moss art thủ công. Giao hàng toàn quốc.",
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

/**
 * Root layout — Server Component (không dùng headers() để tránh ChunkLoadError).
 * ShopLayout (client) sẽ tự detect admin path bằng usePathname().
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${dancingScript.variable}`}>
      <head>
        {/* Preconnect Google Fonts — gi\u1ea3m DNS lookup + TLS latency cho fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <QueryProvider>
            <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />
            <ShopLayout
              header={<Header />}
              footer={<Footer />}
              chat={<ChatWidget />}
            >
              {children}
            </ShopLayout>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}