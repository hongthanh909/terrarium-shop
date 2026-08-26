"use client";

import { usePathname } from "next/navigation";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { MobileBottomNav } from "@/components/MobileBottomNav";

/**
 * ShopLayout — Client wrapper để ẩn Header/Footer/Chat trên admin pages.
 * Pattern chuẩn Next.js App Router: Server Components (header, footer, chat)
 * được truyền như props vào Client Component — hoàn toàn hợp lệ.
 *
 * Tích hợp useIdleLogout:
 * - Customer: 30 phút idle → cảnh báo → 2 phút nữa → logout
 * - Admin: 60 phút idle (admin có thể bận thao tác dài)
 */
export default function ShopLayout({
  children,
  header,
  footer,
  chat,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  chat: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isAdmin  = pathname.startsWith("/tiem-nho-nth24");

  // Idle logout: 30 phút cho customer, 60 phút cho admin
  useIdleLogout({
    idleMinutes: isAdmin ? 60 : 30,
    warnMinutes: 2,
    enabled: true, // Luôn bật — hook tự check session bên trong
  });

  if (isAdmin) {
    // Admin pages: chỉ render children (admin layout tự xử lý sidebar + content)
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Bỏ qua đến nội dung chính
      </a>
      {header}
      <main id="main-content" className="min-w-0 flex-1" tabIndex={-1}>
        <div className="mx-auto min-h-full w-full max-w-[512px] min-[513px]:border-x min-[513px]:border-border/70 md:max-w-none md:border-x-0">
          {children}
        </div>
      </main>
      <div className="hidden md:block">{footer}</div>
      <MobileBottomNav />
      {chat}
    </>
  );
}
