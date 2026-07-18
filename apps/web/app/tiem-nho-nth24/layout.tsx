"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package, Home,
  ShoppingCart, Percent, FileText, LogOut,
  Grid3X3, ExternalLink, Star, ShieldCheck, Compass, Brain, Store, BarChart3, MessagesSquare,
} from "lucide-react";
import { AdminChatNotifier } from "@/components/chat/AdminChatNotifier";


interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);

  // If we are on the admin login page, render children directly without the sidebar & header
  if (pathname === "/tiem-nho-nth24/login") {
    return (
      <div className="min-h-[100dvh] bg-[#fafbf8]">

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
    { href: "/tiem-nho-nth24/blog", label: "Blog", icon: FileText },
    { href: "/tiem-nho-nth24/reviews", label: "Đánh giá", icon: Star },
    { href: "/tiem-nho-nth24/analytics", label: "Phân tích truy cập", icon: BarChart3 },
    { href: "/tiem-nho-nth24/shops", label: "Quản lý shop", icon: Store },
    { href: "/tiem-nho-nth24/marketplace-categories", label: "Danh mục diễn đàn", icon: Grid3X3 },
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
    <div className="min-h-[100dvh] bg-[#fafbf8]">


      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col bg-[#1a2e12] text-white shadow-[4px_0_24px_rgba(26,46,18,0.3)] lg:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex flex-col group">
            <span
              className="text-[22px] text-white group-hover:text-[#e3ebdd] transition-colors leading-tight"
              style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
            >
              tiệm Rêu Décor
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex-1 h-px bg-white/20" />
              <span
                className="text-[9px] tracking-wider text-white/40 whitespace-nowrap"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
              >
                Admin Dashboard
              </span>
              <div className="w-4 h-px bg-white/20" />
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
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fba6f]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2e12] ${
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon
                  className={`flex-shrink-0 ${active ? "text-[#8fba6f]" : ""}`}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                  </span>
                )}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8fba6f]" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 space-y-0.5">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fba6f]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2e12]"
          >
            <ExternalLink className="flex-shrink-0" style={{ width: "18px", height: "18px" }} />
            <span>Xem cửa hàng</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400/80 transition-colors hover:bg-red-950/40 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2e12]"
          >
            <LogOut className="flex-shrink-0" style={{ width: "18px", height: "18px" }} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-[100dvh] flex-col lg:ml-60">
        <header className="sticky top-0 z-10 border-b border-[#e3ebdd] bg-white px-4 py-3 shadow-[0_1px_8px_rgba(66,87,51,0.06)] sm:px-6 lg:px-8">
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
              className="flex min-h-10 items-center gap-2 rounded-full border border-transparent px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-[#c2d6b0] hover:bg-[#f0f4ee] hover:text-[#425733] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fba6f]/60"
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
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fba6f]/60 ${
                    active
                      ? "border-[#7fa95e] bg-[#eef5e8] text-[#2f4a23]"
                      : "border-[#e3ebdd] bg-white text-gray-600 hover:border-[#c2d6b0] hover:text-[#425733]"
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
