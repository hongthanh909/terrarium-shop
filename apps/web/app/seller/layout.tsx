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
    <div className="min-h-[100dvh] bg-white">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-semibold text-primary">
              Tiệm Rêu Décor
            </Link>
            <Link href="/forum" className="rounded-control border border-primary-border bg-primary-soft px-3 py-2 text-xs font-semibold text-primary">
              Xem diễn đàn
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary-border hover:bg-primary-soft hover:text-primary"
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
