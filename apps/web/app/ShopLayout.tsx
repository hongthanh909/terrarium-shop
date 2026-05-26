"use client";

import { usePathname } from "next/navigation";

/**
 * ShopLayout — Client wrapper để ẩn Header/Footer/Chat trên admin pages.
 * Pattern chuẩn Next.js App Router: Server Components (header, footer, chat)
 * được truyền như props vào Client Component — hoàn toàn hợp lệ.
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
  const isAdmin = pathname.startsWith("/admin");

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
