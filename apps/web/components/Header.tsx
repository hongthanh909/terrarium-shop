"use client";

import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import {
  ShoppingBasket, User, X, Minus, Plus, ShoppingBag,
  LogOut, Package, LayoutDashboard, Heart, Lock,
  Menu, ChevronDown, MessageCircle, MapPin, Sprout, Truck, ShieldCheck, Store,
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
import { SearchPalette } from "@/components/ui/search-palette";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { SHOP_FORUM_ENABLED } from "@/lib/features";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/explore", label: "Khám phá" },
  ...(SHOP_FORUM_ENABLED ? [{ href: "/forum", label: "Diễn đàn" }] : []),
  { href: "/blog", label: "Blog" },
];

/** ─── Animated NavLink — light theme underline effect ─────────────────────── */
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`group relative inline-flex min-h-10 items-center px-3 text-sm font-medium transition-colors ${
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 bottom-0 h-px origin-left bg-foreground transition-transform duration-200 ${
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
      <span className="relative z-10 whitespace-nowrap">{label}</span>
    </Link>
  );
}

export default function Header() {

  const { getCartCount, items, removeItem, updateQuantity } = useCartStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [sellerStatus, setSellerStatus] = useState<{
    state: string;
    label: string;
    href: string;
    description?: string;
  } | null>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isCustomerSession = Boolean(session?.user && (session.user as any).role !== "ADMIN");

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setMounted(true);
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

  useEffect(() => {
    let cancelled = false;

    if (!SHOP_FORUM_ENABLED || !session) {
      setSellerStatus(null);
      return;
    }

    fetch("/api/seller/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setSellerStatus(data);
      })
      .catch(() => {
        if (!cancelled) setSellerStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session?.user || (session.user as any).role !== "ADMIN" || (session.user as any).adminSession === true) return;
    void signOut({ callbackUrl: "/login" });
  }, [session]);

  useEffect(() => {
    if (!isCustomerSession) {
      setChatUnread(0);
      return;
    }

    let active = true;
    const loadUnread = async () => {
      const response = await fetch("/api/chat/conversations", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (active) {
        setChatUnread((data.conversations || []).reduce(
          (total: number, conversation: { customerUnreadCount?: number }) => total + (conversation.customerUnreadCount || 0),
          0,
        ));
      }
    };

    void loadUnread();
    const events = new EventSource("/api/chat/events?scope=customer");
    const updateUnread = (event: Event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        if (active) setChatUnread(payload.unreadCount || 0);
      } catch {}
    };
    events.addEventListener("update", updateUnread);

    return () => {
      active = false;
      events.removeEventListener("update", updateUnread);
      events.close();
    };
  }, [isCustomerSession]);

  const cartTotal = items.reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0);
  const cartCount = mounted ? getCartCount() : 0;

  return (
    <>
      <motion.header
        className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto grid h-14 max-w-[512px] grid-cols-[44px_minmax(0,1fr)_88px] items-center px-2 md:flex md:h-auto md:max-w-7xl md:px-6 md:py-3">
          {/* Left section: mobile menu, desktop logo */}
          <div className="flex min-w-0 items-center md:flex-1">
            {/* Hamburger — chỉ hiện trên mobile */}
            <button
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop logo */}
            <Link href="/" className="group hidden min-h-11 flex-shrink-0 flex-col items-start justify-center md:flex">
              <span
                className="whitespace-nowrap text-lg leading-tight text-foreground transition-colors group-hover:text-foreground/75 sm:text-xl"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1 mt-0.5 w-full">
                <div className="h-px flex-1 bg-border" />
                <span
                  className="hidden whitespace-nowrap px-1 text-[9px] text-muted-foreground sm:inline"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  Terrarium &amp; Decor
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </Link>
          </div>

          {/* Mobile logo */}
          <Link
            href="/"
            className="min-w-0 justify-self-center whitespace-nowrap px-2 text-lg leading-none text-foreground md:hidden"
            style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
            aria-label="Tiệm Rêu Décor - Trang chủ"
          >
            tiệm Rêu Décor
          </Link>

          {/* Center section: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1 min-w-0">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
            <NavLink href="/policies" label="Chính sách" />
          </nav>

          {/* Right section: Action Icons */}
          <div className="flex min-w-0 items-center justify-self-end md:flex-1 md:justify-end md:gap-1.5">
            {/* Search trigger — desktop */}
            <button
              className="hidden h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Search — mobile */}
            <button
              className="flex h-11 w-11 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 md:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Mở tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Separator 1 — desktop only */}
            <div className="mx-0.5 hidden h-5 w-px bg-border md:block" />

            {isCustomerSession && (
              <Link
                href="/messages"
                className="relative hidden h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
                aria-label={`Tin nhắn với admin${chatUnread > 0 ? `, ${chatUnread} tin chưa đọc` : ""}`}
                title="Tin nhắn với admin"
              >
                <MessageCircle className="h-5 w-5" />
                {chatUnread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[#d93434] px-1 text-[10px] font-bold text-white">
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 md:h-10 md:w-10"
              onClick={() => {
                if (!session) {
                  window.location.href = "/login?callbackUrl=/";
                  return;
                }
                setCartOpen(true);
              }}
              aria-label={`Giỏ hàng${cartCount > 0 ? `, ${cartCount} sản phẩm` : ""}`}
              title="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-white shadow"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Separator 2 — desktop only */}
            <div className="mx-0.5 hidden h-5 w-px bg-border md:block" />

            {/* User - desktop only */}
            <div className="hidden md:flex items-center">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-foreground transition-colors hover:bg-muted focus:outline-none"
                      aria-label="Mở menu tài khoản"
                      title={session.user?.name || "Tài khoản"}
                    >
                      <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-foreground">
                        {session.user?.image ? (
                          <ImageWrapper src={session.user.image} alt={session.user.name || "Avatar"} fill sizes="24px" noRound className="object-cover" />
                        ) : (
                          <span>{(session.user?.name || "U").substring(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="hidden max-w-[100px] truncate text-xs font-semibold leading-none text-foreground sm:inline-block">
                        {session.user?.name}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[185px] rounded-lg border border-border bg-white shadow-lg">
                    <div className="px-3 py-2.5">
                      <p className="font-semibold text-sm text-gray-800 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                      {(session.user as any)?.role === "ADMIN" && (
                        <span className="mt-1 inline-block rounded bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {(session.user as any)?.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={(session.user as any)?.adminSession === true ? "/tiem-nho-nth24" : "/tiem-nho-nth24/login"}
                          className="flex cursor-pointer items-center gap-2 font-semibold text-foreground focus:bg-muted"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Quản lý
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center gap-2"><User className="w-4 h-4" /> Tài khoản</Link>
                    </DropdownMenuItem>
                    {(session.user as any)?.role !== "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/messages" className="cursor-pointer flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" /> Tin nhắn với admin
                          {chatUnread > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#d93434] px-1.5 py-0.5 text-[10px] font-bold text-white">{chatUnread > 99 ? "99+" : chatUnread}</span>}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {SHOP_FORUM_ENABLED && (session.user as any)?.role !== "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href={sellerStatus?.href || "/seller/register"} className="cursor-pointer flex items-center gap-2">
                          <Store className="w-4 h-4" /> {sellerStatus?.label || "Mở shop"}
                        </Link>
                      </DropdownMenuItem>
                    )}
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
                <Link
                  href="/login"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Đăng nhập"
                  title="Đăng nhập"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="hidden w-full border-t border-border bg-[#fafafa] md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-hidden px-6 py-2 text-[11px] font-medium text-muted-foreground lg:gap-10">
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Long Trường, TP.HCM
            </span>
            <span className="hidden shrink-0 items-center gap-1.5 md:inline-flex">
              <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
              Thiết kế terrarium theo yêu cầu
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Ngoài TP.HCM: tư vấn phí qua tin nhắn
            </span>
            <span className="hidden shrink-0 items-center gap-1.5 lg:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Bảo hành thực vật miễn phí
            </span>
          </div>
        </div>
      </motion.header>

      {/* ─── Search Palette ───────────────────────────────────────────────── */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ─── Mobile Menu Drawer ────────────────────────────────────────────── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="h-[100dvh] w-[min(88vw,340px)] border-0 p-0">
          <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <SheetHeader className="border-b border-border px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <SheetTitle className="text-left">
                <span
                  className="text-xl text-foreground"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
                >
                  tiệm Rêu Décor
                </span>
              </SheetTitle>
              <SheetDescription className="text-left text-xs text-muted-foreground">
                Terrarium & Decor
              </SheetDescription>
            </SheetHeader>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Điều hướng</p>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex min-h-12 items-center gap-3 rounded-md px-3 py-3 text-base font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="h-px bg-border" />

              <Link
                href="/policies"
                className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                Chính sách
              </Link>
            </nav>

            {/* Bottom actions */}
            <div className="space-y-1 border-t border-border px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              {session ? (
                <>
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-foreground">{session.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                  {SHOP_FORUM_ENABLED && (session.user as any)?.role !== "ADMIN" && (
                    <Link
                      href={sellerStatus?.href || "/seller/register"}
                      className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    >
                      <Store className="w-4 h-4" /> {sellerStatus?.label || "Mở shop"}
                    </Link>
                  )}
                  {(session.user as any)?.role !== "ADMIN" && (
                    <Link
                      href="/messages"
                      className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    >
                      <MessageCircle className="w-4 h-4" /> Tin nhắn với admin
                      {chatUnread > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#d93434] px-1.5 py-0.5 text-[10px] font-bold text-white">{chatUnread > 99 ? "99+" : chatUnread}</span>}
                    </Link>
                  )}
                  <Link
                    href="/profile/favorites"
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  >
                    <Heart className="w-4 h-4 fill-red-400 text-red-400" /> Sản phẩm yêu thích
                  </Link>
                  <button
                    onClick={() => { useCartStore.getState().clearCart(); signOut({ callbackUrl: "/" }); }}
                    className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-base font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-3 py-3.5 text-base font-semibold text-white transition-colors hover:bg-foreground/85"
                >
                  <User className="w-4 h-4" /> Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Cart Drawer ──────────────────────────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex h-[100dvh] w-full flex-col p-4 sm:max-w-md sm:p-6">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <ShoppingBasket className="h-5 w-5 text-foreground" />
              Giỏ Hàng
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              Xem lại sản phẩm và tiến hành thanh toán
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 -mx-1 px-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">Giỏ hàng trống</p>
                {!session ? (
                  <>
                    <p className="text-sm text-gray-400 mb-5">Đăng nhập để bắt đầu mua sắm!</p>
                    <Link
                      href="/login"
                      onClick={() => setCartOpen(false)}
                      className="flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-foreground/85"
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
                      className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-foreground/85"
                    >
                      Khám phá sản phẩm
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: CartItem) => (
                  <div key={`${item.productId}-${JSON.stringify(item.variants)}`} className="flex gap-3 rounded-lg border border-border bg-muted/60 p-3.5">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted sm:h-16 sm:w-16">
                      {item.productImage ? (
                        <ImageWrapper src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{item.productName}</p>
                      {Object.keys(item.variants ?? {}).filter(k => k !== "Đèn").length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Object.entries(item.variants ?? {})
                            .filter(([k]) => k !== "Đèn")
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-bold text-foreground">{item.price.toLocaleString("vi-VN")}₫</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variants)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-white transition-colors hover:border-foreground/30" aria-label={`Giảm số lượng ${item.productName}`}>
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variants)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-white transition-colors hover:border-foreground/30" aria-label={`Tăng số lượng ${item.productName}`}>
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeItem(item.productId, item.variants)} className="ml-auto min-w-11 min-h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200" aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] border-t bg-white/95 backdrop-blur space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Tạm tính</span>
                <span className="text-xl font-bold text-foreground">{cartTotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/products"
                  onClick={() => setCartOpen(false)}
                  className="rounded-md border border-foreground py-3.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Tiếp tục mua
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="rounded-md bg-foreground py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-foreground/85"
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
