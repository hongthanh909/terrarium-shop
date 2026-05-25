"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Leaf, Package, ShoppingBag, Settings, Home,
  ShoppingCart, Percent, FileText, MessageSquare, LogOut
} from "lucide-react";
import { Toaster } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin", label: "Bảng Điều Khiển", icon: Home },
    { href: "/admin/products", label: "Sản phẩm", icon: Package },
    { href: "/admin/categories", label: "Danh mục", icon: Leaf },
    { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
    { href: "/admin/vouchers", label: "Phiếu giảm giá", icon: Percent },
    { href: "/admin/blog", label: "Blog", icon: FileText },
    { href: "/admin/reviews", label: "Đánh giá", icon: MessageSquare },
    { href: "/admin/settings", label: "Cài đặt", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-[#f5f7f4]">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 3000, style: { fontFamily: "inherit" } }}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#425733] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#364a29]">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Leaf className="w-8 h-8 text-[#e3ebdd]" />
            <span>Quản Trị Terrarium</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${
                isActive(item.href)
                  ? "bg-[#364a29] border-[#e3ebdd] text-white"
                  : "border-transparent hover:bg-[#364a29] hover:border-[#e3ebdd] text-[#c8d5be] hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#364a29] p-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-[#c8d5be] hover:text-white hover:bg-[#364a29] rounded-lg transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm">Xem Cửa Hàng</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 min-h-screen flex flex-col">
        <header className="bg-white shadow-sm border-b px-8 py-4 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-800">
            {menuItems.find((m) => isActive(m.href))?.label ?? "Bảng Điều Khiển"}
          </h1>
        </header>
        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}