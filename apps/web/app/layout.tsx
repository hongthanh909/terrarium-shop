import type { Metadata, Viewport } from "next";
import { Dancing_Script, Inter, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/lib/query-provider";
import ShopLayout from "./ShopLayout";
import { CustomToastContainer } from "@/components/ui/custom-toast";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { ChatWidgetClient } from "@/components/ChatWidgetClient";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { FacebookGroupVoucherPopup } from "@/components/FacebookGroupVoucherPopup";

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

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["500", "600", "700"],
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
    "Khám phá terrarium và moss art thủ công tại Tiệm Rêu Décor. Giao tiêu chuẩn trong TP.HCM; các khu vực khác được tư vấn phí riêng.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
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
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Tiệm Rêu Décor - Terrarium & Moss Art Thủ Công",
    description:
      "Terrarium và moss art thủ công. Giao tiêu chuẩn trong TP.HCM; các khu vực khác được tư vấn phí riêng.",
    type: "website",
    locale: "vi_VN",
    siteName: "Tiệm Rêu Décor",
    images: [
      {
        url: "/home-hero-full-banner.png?v=20260714",
        width: 1680,
        height: 900,
        alt: "Tiệm Rêu Décor - Một chút rêu, một chút xanh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiệm Rêu Décor",
    description: "Terrarium & Moss Art Thủ Công",
    images: ["/home-hero-full-banner.png?v=20260714"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
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
    <html lang="vi" className={`${inter.variable} ${dancingScript.variable} ${playfair.variable}`}>
      <body
        className={`${inter.className} antialiased min-h-[100dvh] flex flex-col`}
      >
        <AuthProvider>
          <QueryProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <CustomToastContainer />
            <FacebookGroupVoucherPopup />
            <ShopLayout
              header={<Header />}
              footer={<Footer />}
              chat={<ChatWidgetClient />}
            >
              {children}
            </ShopLayout>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
