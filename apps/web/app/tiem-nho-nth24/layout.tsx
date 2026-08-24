"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package, Home,
  ShoppingCart, Percent, FileText, LogOut,
  Grid3X3, ExternalLink, Star, ShieldCheck, Compass, Brain, Store, BarChart3, MessagesSquare, TicketPercent,
} from "lucide-react";
import { AdminChatNotifier } from "@/components/chat/AdminChatNotifier";
import { SHOP_FORUM_ENABLED } from "@/lib/features";


interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);

  // If we are on the admin login page, render children directly without the sidebar & header
  if (pathname === "/tiem-nho-nth24/login") {
    return (
      <div className="min-h-[100dvh] bg-white">

        {children}
      </div>
    );
  }

  const menuItems = [
    { href: "/tiem-nho-nth24", label: "Bảng Điều Khiển", icon: Home },
    { href: "/tiem-nho-nth24/messages", label: "Tin nhắn", icon: MessagesSquare, badge: chatUnread },
    { href: "/tiem-nho-nth24/explore", label: "Khám Phá", icon: Compass },
    { href: "/tiem-nho-nth24/products", label: "Sản phẩm", icon: Package },
    { href: "/tiem-nho-nth24/categories", label: "Danh mục", icon: Grid3X3 },
    { href: "/tiem-nho-nth24/orders", label: "Đơn hàng", icon: ShoppingCart },
    { href: "/tiem-nho-nth24/vouchers", label: "Phiếu giảm giá", icon: Percent },
    { href: "/tiem-nho-nth24/community-reward", label: "Ưu đãi Facebook", icon: TicketPercent },
    { href: "/tiem-nho-nth24/blog", label: "Blog", icon: FileText },
    { href: "/tiem-nho-nth24/reviews", label: "Đánh giá", icon: Star },
    { href: "/tiem-nho-nth24/analytics", label: "Phân tích truy cập", icon: BarChart3 },
    ...(SHOP_FORUM_ENABLED ? [
      { href: "/tiem-nho-nth24/shops", label: "Quản lý shop", icon: Store },
      { href: "/tiem-nho-nth24/marketplace-categories", label: "Danh mục diễn đàn", icon: Grid3X3 },
    ] : []),
    { href: "/tiem-nho-nth24/policies", label: "Chính sách", icon: ShieldCheck },
    { href: "/tiem-nho-nth24/ai-knowledge", label: "Kiến thức AI", icon: Brain },
  ];

  const isActive = (href: string) => {
    if (href === "/tiem-nho-nth24") return pathname === "/tiem-nho-nth24";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/tiem-nho-nth24/login" });
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50/60">


      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col border-r border-gray-200 bg-white text-gray-800 lg:flex">
        {/* Logo */}
        <div className="border-b border-gray-200 px-5 py-5">
          <Link href="/" className="flex flex-col group">
            <span
              className="text-[22px] leading-tight text-gray-950 transition-colors group-hover:text-gray-600"
              style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
            >
              tiệm Rêu Décor
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-px flex-1 bg-gray-200" />
              <span
                className="whitespace-nowrap text-[9px] text-gray-400"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
              >
                Admin Dashboard
              </span>
              <div className="h-px w-4 bg-gray-200" />
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-3 overflow-y-auto px-3 space-y-0.5">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 ${
                  active
                    ? "bg-gray-950 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                }`}
              >
                <item.icon
                  className="flex-shrink-0"
                  style={{ width: "18px", height: "18px" }}
                />
                <span>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                  </span>
                )}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-0.5 border-t border-gray-200 p-3">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
          >
            <ExternalLink className="flex-shrink-0" style={{ width: "18px", height: "18px" }} />
            <span>Xem cửa hàng</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
          >
            <LogOut className="flex-shrink-0" style={{ width: "18px", height: "18px" }} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-[100dvh] flex-col lg:ml-60">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find((m) => isActive(m.href))?.label ?? "Bảng Điều Khiển"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">tiệm Rêu Décor · Hệ thống quản lý</p>
          </div>
          <div className="flex items-center gap-2">
            <AdminChatNotifier onUnreadChange={setChatUnread} />
            <Link
              href="/"
              className="flex min-h-10 items-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xem cửa hàng</span>
            </Link>
          </div>
          </div>
          <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Admin mobile navigation">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 ${
                    active
                      ? "border-gray-950 bg-gray-950 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-950"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {(item.badge ?? 0) > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
