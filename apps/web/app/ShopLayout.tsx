"use client";

import { usePathname } from "next/navigation";
import { useIdleLogout } from "@/hooks/useIdleLogout";

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
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {chat}
    </>
  );
}
