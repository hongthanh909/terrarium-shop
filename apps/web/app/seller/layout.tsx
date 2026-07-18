import Link from "next/link";
import { Store, PackageSearch, Inbox, Settings } from "lucide-react";

const nav = [
  { href: "/seller", label: "Tổng quan", icon: Store },
  { href: "/seller/products", label: "Sản phẩm", icon: PackageSearch },
  { href: "/seller/inquiries", label: "Hỏi mua", icon: Inbox },
  { href: "/seller/profile", label: "Hồ sơ shop", icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f7faf4]">
      <header className="border-b border-[#dfe8d7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-semibold text-[#2f4a23]">
              Tiệm Rêu Décor
            </Link>
            <Link href="/forum" className="rounded-full border border-[#c6d8ba] px-3 py-2 text-xs font-semibold text-[#3d5f2d]">
              Xem diễn đàn
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#dfe8d7] bg-white px-3 py-2 text-sm font-medium text-[#526248] hover:border-[#9fbe8d] hover:text-[#2f4a23]"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
