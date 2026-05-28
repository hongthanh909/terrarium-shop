"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, Leaf, User, X, Minus, Plus, ShoppingBag,
  ChevronDown, LogOut, Package, LayoutDashboard, Heart, Search,
} from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchPalette, SearchTrigger } from "@/components/ui/search-palette";

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

  // Global Cmd+K / Ctrl+K shortcut
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
      {/* ─── Floating Pill Navbar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex justify-center px-4 pt-3 pb-1 pointer-events-none">
        <motion.header
          initial={false}
          animate={scrolled ? { y: 0, scale: 1 } : { y: 0, scale: 1 }}
          className={`pointer-events-auto w-full max-w-6xl rounded-2xl transition-all duration-300 ${
            scrolled
              ? "bg-white/92 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-[#e3ebdd]"
              : "bg-white/80 backdrop-blur-lg shadow-[0_2px_16px_rgba(66,87,51,0.08)] border border-white/60"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-3">
            {/* Logo */}
            <Link href="/" className="flex flex-col group flex-shrink-0">
              <span
                className="text-xl text-[#425733] group-hover:text-[#364a29] transition-colors leading-tight"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex-1 h-px bg-[#8ba57a]" />
                <span
                  className="text-[9px] tracking-wider text-[#5f7d50] whitespace-nowrap px-1"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  Terrarium &amp; Moss Art
                </span>
                <div className="w-4 h-px bg-[#8ba57a]" />
              </div>
            </Link>

            {/* Center nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-[#425733] hover:bg-[#e3ebdd]/70 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="px-4 py-1.5 h-auto rounded-full text-sm font-medium text-gray-500 hover:text-[#425733] hover:bg-[#e3ebdd]/70 transition-all duration-200 flex items-center gap-1"
                  >
                    Chính sách <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl shadow-soft border border-[#e3ebdd] bg-white/95 backdrop-blur-md min-w-[160px]">
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
              {/* Search trigger */}
              <SearchTrigger onClick={() => setSearchOpen(true)} />

              {/* Mobile search */}
              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-[#425733] hover:bg-[#e3ebdd]/70 transition-colors"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* User */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-[#425733] text-white flex items-center justify-center text-sm font-bold hover:bg-[#364a29] transition-colors flex-shrink-0"
                      title={session.user?.name || "Tài khoản"}
                    >
                      {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl shadow-soft border border-[#e3ebdd] bg-white/95 backdrop-blur-md min-w-[185px]">
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
                        <Link href="/secure-cms" className="cursor-pointer flex items-center gap-2 text-[#425733] font-semibold focus:bg-[#e3ebdd]">
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
                  <button className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-[#425733] hover:bg-[#e3ebdd]/70 transition-all duration-200 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Đăng nhập</span>
                  </button>
                </Link>
              )}

              {/* Cart */}
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-[#425733] hover:bg-[#e3ebdd]/70 transition-colors"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] bg-[#425733] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow px-0.5"
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

      {/* ─── Search Palette ────────────────────────────────────────────────────── */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ─── Cart Drawer ───────────────────────────────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="sm:max-w-md flex flex-col">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-[hsl(220,14%,25%)]">
              <ShoppingBag className="w-5 h-5 text-[#425733]" />
              Giỏ Hàng
            </SheetTitle>
            <SheetDescription className="text-[hsl(220,14%,45%)]">
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
                <p className="text-sm text-gray-400 mb-5">Hãy thêm sản phẩm để bắt đầu!</p>
                <Link
                  href="/products"
                  onClick={() => setCartOpen(false)}
                  className="px-5 py-2.5 bg-[#425733] text-white rounded-full text-sm font-semibold hover:bg-[#364a29] transition-colors"
                >
                  Khám phá sản phẩm
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: CartItem) => (
                  <div key={`${item.productId}-${JSON.stringify(item.variants)}`} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#e3ebdd] flex-shrink-0">
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Leaf className="w-6 h-6 text-[#6d8c5a]" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{item.productName}</p>
                      {Object.keys(item.variants || {}).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Object.entries(item.variants).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                      <p className="text-sm font-bold text-[#425733] mt-1">{item.price.toLocaleString("vi-VN")}₫</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.productId, item.variants, item.quantity - 1)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#425733] transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.variants, item.quantity + 1)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#425733] transition-colors">
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
