"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package, Home,
  ShoppingCart, Percent, FileText, LogOut,
  Grid3X3, ExternalLink, Star, ShieldCheck, Compass, Brain, Store, BarChart3, MessagesSquare, TicketPercent, Menu,
} from "lucide-react";
import { AdminChatNotifier } from "@/components/chat/AdminChatNotifier";
import { AI_CHAT_ENABLED, SHOP_FORUM_ENABLED } from "@/lib/features";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";


interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    ...(AI_CHAT_ENABLED ? [
      { href: "/tiem-nho-nth24/ai-knowledge", label: "Kiến thức AI", icon: Brain },
    ] : []),
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
          <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 lg:hidden" aria-label="Mở menu quản trị">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(88vw,340px)] flex-col p-0" aria-describedby="admin-mobile-nav-description">
                <SheetHeader className="border-b border-gray-200 px-5 py-5 text-left">
                  <SheetTitle className="font-serif text-xl font-semibold">Tiệm Rêu Admin</SheetTitle>
                  <SheetDescription id="admin-mobile-nav-description">Điều hướng hệ thống quản lý</SheetDescription>
                </SheetHeader>
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" aria-label="Menu quản trị">
                  {menuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-gray-950 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"}`}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        <span>{item.label}</span>
                        {(item.badge ?? 0) > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{(item.badge ?? 0) > 99 ? "99+" : item.badge}</span>}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-gray-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Link href="/" onClick={() => setMobileNavOpen(false)} className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-950">
                    <ExternalLink className="h-[18px] w-[18px]" /> Xem cửa hàng
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-[18px] w-[18px]" /> Đăng xuất
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-800 sm:text-lg">
                {menuItems.find((m) => isActive(m.href))?.label ?? "Bảng Điều Khiển"}
              </h1>
              <p className="mt-0.5 hidden text-xs text-gray-400 sm:block">tiệm Rêu Décor · Hệ thống quản lý</p>
            </div>
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
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
