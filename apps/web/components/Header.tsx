"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, User, X, Minus, Plus, ShoppingBag,
  ChevronDown, LogOut, Package, LayoutDashboard, Heart, Lock,
} from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchPalette, SearchTrigger } from "@/components/ui/search-palette";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/explore", label: "Khám phá" },
  { href: "/blog", label: "Blog" },
];

const POLICY_LINKS = [
  { href: "/policies/warranty", label: "Bảo hành" },
  { href: "/policies/shipping", label: "Vận chuyển" },
  { href: "/policies/returns", label: "Đổi trả" },
  { href: "/policies/privacy", label: "Bảo mật" },
  { href: "/policies/faq", label: "FAQ" },
];

/** ─── Animated NavLink — expanding circle effect ─────────────────────────── */
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", display: "inline-block", overflow: "hidden" }}
      className="px-4 py-1.5 rounded-full text-sm font-medium select-none"
    >
      {/* Expanding circle background — hidden by default, expands on hover */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "0.25rem",
          transform: "translateY(-50%)",
          width: (isActive || hovered) ? "calc(100% - 0.5rem)" : "0",
          height: "1.75rem",
          background: "rgba(255,255,255,0.18)",
          borderRadius: "1rem",
          transition: "width 0.42s cubic-bezier(0.65, 0, 0.076, 1)",
          pointerEvents: "none",
        }}
      />
      {/* Label */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: (isActive || hovered) ? "#ffffff" : "rgba(255,255,255,0.72)",
          transition: "color 0.3s ease",
          display: "block",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

export default function Header() {

  const { getCartCount, items, removeItem, updateQuantity } = useCartStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const cartTotal = items.reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0);
  const cartCount = mounted ? getCartCount() : 0;

  return (
    <>
      {/* ─── Floating Pill Navbar — GREEN ────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex justify-center px-4 pt-2 pb-1 pointer-events-none">
        <motion.header
          className={`pointer-events-auto w-full max-w-6xl rounded-2xl transition-all duration-300 ${
            scrolled
              ? "bg-[#1e2e16] backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.35)] border border-[#425733]"
              : "bg-[#2d3d23] backdrop-blur-lg shadow-[0_2px_20px_rgba(0,0,0,0.25)] border border-[#3d5230]"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-3">
            {/* Logo */}
            <Link href="/" className="flex flex-col group flex-shrink-0">
              <span
                className="text-xl text-white group-hover:text-[#e3ebdd] transition-colors leading-tight"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex-1 h-px bg-white/30" />
                <span
                  className="text-[9px] tracking-wider text-white/50 whitespace-nowrap px-1"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  Terrarium &amp; Moss Art
                </span>
                <div className="w-4 h-px bg-white/30" />
              </div>
            </Link>

            {/* Center nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="px-4 py-1.5 h-auto rounded-full text-sm font-medium text-white/75 hover:text-white hover:bg-white/15 transition-all duration-200 flex items-center gap-1"
                  >
                    Chính sách <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl shadow-lg border border-[#e3ebdd] bg-white min-w-[160px]">
                  {POLICY_LINKS.map((l) => (
                    <DropdownMenuItem key={l.href} asChild>
                      <Link href={l.href} className="cursor-pointer text-sm">{l.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              {/* Search trigger — light variant for green navbar */}
              <SearchTrigger onClick={() => setSearchOpen(true)} light />

              {/* Mobile search */}
              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* User */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-white/20 text-white border border-white/30 flex items-center justify-center text-sm font-bold hover:bg-white/30 transition-colors flex-shrink-0"
                      title={session.user?.name || "Tài khoản"}
                    >
                      {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-[#e3ebdd] bg-white min-w-[185px]">
                    <div className="px-3 py-2.5">
                      <p className="font-semibold text-sm text-gray-800 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                      {(session.user as any)?.role === "ADMIN" && (
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-[#425733] text-white px-2 py-0.5 rounded-full">Admin</span>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {(session.user as any)?.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/tiem-nho-nth24" className="cursor-pointer flex items-center gap-2 text-[#425733] font-semibold focus:bg-[#e3ebdd]">
                          <LayoutDashboard className="w-4 h-4" /> Quản lý
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center gap-2"><User className="w-4 h-4" /> Tài khoản</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer flex items-center gap-2"><Package className="w-4 h-4" /> Đơn hàng</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/favorites" className="cursor-pointer flex items-center gap-2">
                        <Heart className="w-4 h-4 fill-red-400 text-red-400" /> Yêu thích
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => { useCartStore.getState().clearCart(); signOut({ callbackUrl: "/" }); }}
                      className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <button className="px-3 py-1.5 rounded-full text-sm font-medium text-white/75 hover:text-white hover:bg-white/15 transition-all duration-200 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Đăng nhập</span>
                  </button>
                </Link>
              )}

              {/* Cart */}
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-full text-white/75 hover:text-white hover:bg-white/15 transition-colors"
                onClick={() => {
                  if (!session) {
                    // Chưa đăng nhập → chuyển sang trang login
                    window.location.href = "/login?callbackUrl=/";
                    return;
                  }
                  setCartOpen(true);
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#8fba6f] text-[#1a2c12] text-[10px] font-bold rounded-full flex items-center justify-center shadow px-0.5"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </motion.header>
      </div>

      {/* ─── Search Palette ───────────────────────────────────────────────── */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ─── Cart Drawer ──────────────────────────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="sm:max-w-md flex flex-col">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <ShoppingBag className="w-5 h-5 text-[#425733]" />
              Giỏ Hàng
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              Xem lại sản phẩm và tiến hành thanh toán
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-[#e3ebdd] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-[#6d8c5a]" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">Giỏ hàng trống</p>
                {!session ? (
                  <>
                    <p className="text-sm text-gray-400 mb-5">Đăng nhập để bắt đầu mua sắm!</p>
                    <Link
                      href="/login"
                      onClick={() => setCartOpen(false)}
                      className="px-5 py-2.5 bg-[#425733] text-white rounded-full text-sm font-semibold hover:bg-[#364a29] transition-colors flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" /> Đăng nhập
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-5">Hãy thêm sản phẩm để bắt đầu!</p>
                    <Link
                      href="/products"
                      onClick={() => setCartOpen(false)}
                      className="px-5 py-2.5 bg-[#425733] text-white rounded-full text-sm font-semibold hover:bg-[#364a29] transition-colors"
                    >
                      Khám phá sản phẩm
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: CartItem) => (
                  <div key={`${item.productId}-${JSON.stringify(item.variants)}`} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#e3ebdd] flex-shrink-0">
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#6d8c5a]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{item.productName}</p>
                      {Object.keys(item.variants ?? {}).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Object.entries(item.variants ?? {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                      <p className="text-sm font-bold text-[#425733] mt-1">{item.price.toLocaleString("vi-VN")}₫</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variants)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#425733] transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variants)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#425733] transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeItem(item.productId, item.variants)} className="ml-auto w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors text-gray-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Tạm tính</span>
                <span className="text-xl font-bold text-[#425733]">{cartTotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/products"
                  onClick={() => setCartOpen(false)}
                  className="py-2.5 rounded-xl border-2 border-[#425733] text-[#425733] text-sm font-semibold text-center hover:bg-[#e3ebdd] transition-colors"
                >
                  Tiếp tục mua
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="py-2.5 rounded-xl bg-[#425733] text-white text-sm font-semibold text-center hover:bg-[#364a29] transition-colors"
                >
                  Thanh toán →
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
