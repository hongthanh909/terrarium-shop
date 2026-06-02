"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package, Settings, Home,
  ShoppingCart, Percent, FileText, LogOut,
  Grid3X3, ExternalLink, Star, ShieldCheck, LayoutDashboard, Compass,
} from "lucide-react";
import { Toaster } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  // If we are on the admin login page, render children directly without the sidebar & header
  if (pathname === "/tiem-nho-nth24/login") {
    return (
      <div className="min-h-screen bg-[#f5f7f4]">
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
            style: { fontFamily: "inherit" },
            classNames: {
              success: "font-medium",
              error: "font-medium",
            },
          }}
        />
        {children}
      </div>
    );
  }

  const menuItems = [
    { href: "/tiem-nho-nth24", label: "Bảng Điều Khiển", icon: Home },
    { href: "/tiem-nho-nth24/homepage", label: "Giao Diện", icon: LayoutDashboard },
    { href: "/tiem-nho-nth24/explore", label: "Khám Phá", icon: Compass },
    { href: "/tiem-nho-nth24/products", label: "Sản phẩm", icon: Package },
    { href: "/tiem-nho-nth24/categories", label: "Danh mục", icon: Grid3X3 },
    { href: "/tiem-nho-nth24/orders", label: "Đơn hàng", icon: ShoppingCart },
    { href: "/tiem-nho-nth24/vouchers", label: "Phiếu giảm giá", icon: Percent },
    { href: "/tiem-nho-nth24/blog", label: "Blog", icon: FileText },
    { href: "/tiem-nho-nth24/reviews", label: "Đánh giá", icon: Star },
    { href: "/tiem-nho-nth24/policies", label: "Chính sách", icon: ShieldCheck },
    { href: "/tiem-nho-nth24/settings", label: "Cài đặt", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/tiem-nho-nth24") return pathname === "/tiem-nho-nth24";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/tiem-nho-nth24/login" });
  };

  return (
    <div className="min-h-screen bg-[#f5f7f4]">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 3000,
          style: { fontFamily: "inherit" },
          classNames: {
            success: "font-medium",
            error: "font-medium",
          },
        }}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-[#2d3d23] text-white flex flex-col shadow-xl">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium ${
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon
                  className={`flex-shrink-0 ${active ? "text-[#8fba6f]" : ""}`}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8fba6f]" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <ExternalLink className="flex-shrink-0" style={{ width: "18px", height: "18px" }} />
            <span>Xem cửa hàng</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-300 hover:bg-red-950/40 transition-all text-sm"
          >
            <LogOut className="flex-shrink-0" style={{ width: "18px", height: "18px" }} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-60 min-h-screen flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-100 px-8 py-3.5 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find((m) => isActive(m.href))?.label ?? "Bảng Điều Khiển"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">tiệm Rêu Décor — Hệ thống quản lý</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#425733] transition-colors px-3 py-1.5 rounded-full hover:bg-[#f0f4ee] border border-transparent hover:border-[#c2d6b0]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Xem cửa hàng
          </Link>
        </header>
        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
