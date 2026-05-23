import Link from 'next/link';
import { Leaf, Package, ShoppingBag, Settings, Home, ShoppingCart, Percent, FileText, MessageSquare } from 'lucide-react';
import { Toaster } from 'sonner';
interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const menuItems = [
    { href: '/admin', label: 'Bảng Điều Khiển', icon: Home },
    { href: '/admin/products', label: 'Sản phẩm', icon: Package },
    { href: '/admin/categories', label: 'Danh mục', icon: Leaf },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
    { href: '/admin/vouchers', label: 'Phiếu giảm giá', icon: Percent },
    { href: '/admin/blog', label: 'Blog', icon: FileText },
    { href: '/admin/reviews', label: 'Đánh giá', icon: MessageSquare },
    { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f4]">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'inherit',
          },
        }}
      />
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#425733] text-white">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Leaf className="w-8 h-8 text-[#e3ebdd]" />
            <span>Quản Trị Terrarium</span>
          </Link>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 hover:bg-[#364a29] transition-colors border-l-4 border-transparent hover:border-[#e3ebdd]"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-6 py-3 text-[#c8d5be] hover:text-white transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Xem Cửa Hàng</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm border-b px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">Bảng Điều Khiển Admin</h1>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}