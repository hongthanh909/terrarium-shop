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
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", display: "inline-block" }}
      className="px-3 py-1.5 text-sm select-none"
    >
      {/* Underline indicator */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: "0.75rem",
          right: "0.75rem",
          height: "2px",
          background: "#3d5a2a",
          borderRadius: "2px",
          opacity: (isActive || hovered) ? 1 : 0,
          transform: (isActive || hovered) ? "scaleX(1)" : "scaleX(0)",
          transition: "opacity 0.25s ease, transform 0.3s cubic-bezier(0.65, 0, 0.076, 1)",
          transformOrigin: "left",
          pointerEvents: "none",
        }}
      />
      {/* Label */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: isActive ? "#2d4520" : hovered ? "#3d5a2a" : "#4a5e38",
          fontWeight: isActive ? 600 : 500,
          transition: "color 0.25s ease",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
      {/* ─── CSS Marquee left-to-right ───────────────────────────────────── */}
      <style>{`
        @keyframes cw-marquee {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .cw-marquee-track {
          display: flex;
          width: max-content;
          animation: cw-marquee 30s linear infinite;
        }
        .cw-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ─── Full-Width Navbar — LIGHT CREAM ──────────────────────────────── */}
      <motion.header
        className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
          scrolled
            ? "bg-white/96 backdrop-blur-xl shadow-[0_1px_16px_rgba(61,90,42,0.08)] border-b border-[#dde5d3]/80"
            : "bg-[#faf9f7]/95 backdrop-blur-md border-b border-[#e8ede0]/60"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 max-w-7xl mx-auto">
          {/* Left section: Hamburger (mobile) / Nav links (desktop) */}
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            {/* Hamburger — chỉ hiện trên mobile */}
            <button
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-full text-[#425733]/80 hover:text-[#293a20] hover:bg-[#eceee5] transition-colors flex-shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
              <NavLink href="/policies" label="Chính sách" />
            </nav>
          </div>

          {/* Center section: Logo */}
          <Link href="/" className="flex flex-col items-center group flex-shrink-0 mx-1 sm:mx-4">
            <span
              className="text-lg sm:text-xl text-[#2d4520] group-hover:text-[#3d5a2a] transition-colors leading-tight"
              style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
            >
              tiệm Rêu Décor
            </span>
            <div className="flex items-center gap-1 mt-0.5 w-full">
              <div className="flex-1 h-px bg-[#c5d4b5]/60" />
              <span
              className="hidden sm:inline text-[9px] tracking-wider text-[#5a7a48]/60 whitespace-nowrap px-1"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                Terrarium &amp; Decor
              </span>
              <div className="flex-1 h-px bg-[#c5d4b5]/60" />
            </div>
          </Link>

          {/* Right section: Icons */}
          <div className="flex items-center justify-end gap-1 flex-1">
            {/* Search trigger — desktop */}
            <button
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-[#4a5e38]/70 hover:text-[#293a20] hover:bg-[#eceee5] transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Search — mobile */}
            <button
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-full text-[#4a5e38]/80 hover:text-[#293a20] hover:bg-[#eceee5] transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Mở tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Separator 1 — desktop only */}
            <div className="hidden md:block w-px h-5 bg-[#c5d4b5]/80 mx-1" />

            {isCustomerSession && (
              <Link
                href="/messages"
                className="relative hidden h-9 w-9 items-center justify-center rounded-full text-[#4a5e38]/80 transition-colors hover:bg-[#eceee5] hover:text-[#293a20] md:flex"
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
              className="relative w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-full text-[#4a5e38]/80 hover:text-[#293a20] hover:bg-[#eceee5] transition-colors"
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
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#5f7a45] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow px-0.5"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Separator 2 — desktop only */}
            <div className="hidden md:block w-px h-5 bg-[#c5d4b5]/80 mx-1" />

            {/* User - desktop only */}
            <div className="hidden md:flex items-center">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 hover:bg-[#eceee5] transition-colors focus:outline-none py-1 px-2.5 rounded-full flex-shrink-0 text-[#293a20] border border-[#c5d4b5]/60"
                      aria-label="Mở menu tài khoản"
                      title={session.user?.name || "Tài khoản"}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-[#dde8d0] flex items-center justify-center relative flex-shrink-0 text-[#2d4520] font-bold text-xs">
                        {session.user?.image ? (
                          <ImageWrapper src={session.user.image} alt={session.user.name || "Avatar"} fill sizes="24px" noRound className="object-cover" />
                        ) : (
                          <span>{(session.user?.name || "U").substring(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="hidden sm:inline-block text-xs font-semibold max-w-[100px] truncate text-[#293a20] leading-none">
                        {session.user?.name}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#4a5e38]/70 flex-shrink-0" />
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
                        <Link
                          href={(session.user as any)?.adminSession === true ? "/tiem-nho-nth24" : "/tiem-nho-nth24/login"}
                          className="cursor-pointer flex items-center gap-2 text-[#425733] font-semibold focus:bg-[#e3ebdd]"
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
                <Link href="/login">
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-full text-[#4a5e38]/80 hover:text-[#293a20] hover:bg-[#eceee5] transition-colors flex-shrink-0"
                    aria-label="Đăng nhập"
                    title="Đăng nhập"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Marquee contact bar — light #ECEEE5 ──────────────────────────── */}
        <div
          className="hidden sm:block w-full overflow-hidden"
          style={{
            background: "#ECEEE5",
            borderTop: "1px solid rgba(61, 90, 42, 0.10)",
          }}
        >
          <div className="cw-marquee-track py-1.5">
            {[0, 1].map((dup) => (
              <span
                key={dup}
                className="flex items-center gap-8 text-xs text-[#3d5a2a] whitespace-nowrap px-8 font-medium"
                style={{ fontFamily: "inherit" }}
                aria-hidden={dup === 1}
              >
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3 text-[#3d5a2a]/70" />
                  <span>Fanpage: <strong className="text-[#2d4520] font-semibold">tiemreudecor</strong></span>
                </span>
                <span className="text-[#3d5a2a]/20">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#3d5a2a]/70" />
                  <span>Long Trường, Hồ Chí Minh</span>
                </span>
                <span className="text-[#3d5a2a]/20">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Sprout className="w-3 h-3 text-[#3d5a2a]/70" />
                  <span>Thiết kế Terrarium theo yêu cầu</span>
                </span>
                <span className="text-[#3d5a2a]/20">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-[#3d5a2a]/70" />
                  <span>Giao hàng toàn quốc</span>
                </span>
                <span className="text-[#3d5a2a]/20">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#3d5a2a]/70" />
                  <span>Bảo hành thực vật miễn phí</span>
                </span>
              </span>
            ))}
          </div>
        </div>
      </motion.header>

      {/* ─── Search Palette ───────────────────────────────────────────────── */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ─── Mobile Menu Drawer ────────────────────────────────────────────── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-0">
          <div className="flex flex-col h-full bg-[#faf9f7]">
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#e0e8d5]">
              <SheetTitle className="text-left">
                <span
                  className="text-xl text-[#2d4520]"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
                >
                  tiệm Rêu Décor
                </span>
              </SheetTitle>
              <SheetDescription className="text-[#5a7a48]/60 text-xs text-left">
                Terrarium & Decor
              </SheetDescription>
            </SheetHeader>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              <p className="text-[10px] uppercase tracking-wider text-[#3d5a2a]/40 font-semibold px-3 mb-2">Điều hướng</p>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-[#eceee5] text-[#2d4520]"
                        : "text-[#4a5e38]/80 hover:text-[#2d4520] hover:bg-[#eceee5]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="h-px bg-[#e0e8d5]" />

              <Link
                href="/policies"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold text-[#4a5e38]/80 hover:text-[#2d4520] hover:bg-[#eceee5] transition-colors duration-200"
              >
                Chính sách
              </Link>
            </nav>

            {/* Bottom actions */}
            <div className="px-4 py-4 border-t border-[#e0e8d5] space-y-2">
              {session ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-[#2d4520] truncate">{session.user?.name}</p>
                    <p className="text-xs text-[#5a7a48]/60 truncate">{session.user?.email}</p>
                  </div>
                  {SHOP_FORUM_ENABLED && (session.user as any)?.role !== "ADMIN" && (
                    <Link
                      href={sellerStatus?.href || "/seller/register"}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl text-base font-semibold text-[#4a5e38]/80 hover:text-[#2d4520] hover:bg-[#eceee5] transition-colors duration-200"
                    >
                      <Store className="w-4 h-4" /> {sellerStatus?.label || "Mở shop"}
                    </Link>
                  )}
                  {(session.user as any)?.role !== "ADMIN" && (
                    <Link
                      href="/messages"
                      className="flex items-center gap-2 px-3 py-3 rounded-xl text-base font-semibold text-[#4a5e38]/80 hover:text-[#2d4520] hover:bg-[#eceee5] transition-colors duration-200"
                    >
                      <MessageCircle className="w-4 h-4" /> Tin nhắn với admin
                      {chatUnread > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#d93434] px-1.5 py-0.5 text-[10px] font-bold text-white">{chatUnread > 99 ? "99+" : chatUnread}</span>}
                    </Link>
                  )}
                  <Link
                    href="/profile/favorites"
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-base font-semibold text-[#4a5e38]/80 hover:text-[#2d4520] hover:bg-[#eceee5] transition-colors duration-200"
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
                  className="w-full flex items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-base font-semibold bg-[#3d5a2a] text-white hover:bg-[#2d4520] transition-colors"
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
        <SheetContent className="w-full sm:max-w-md flex flex-col p-4 sm:p-6">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <ShoppingBasket className="w-5 h-5 text-[#425733]" />
              Giỏ Hàng
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              Xem lại sản phẩm và tiến hành thanh toán
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 -mx-1 px-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-[#e3ebdd] flex items-center justify-center mb-4">
                  <ShoppingBasket className="w-10 h-10 text-[#6d8c5a]" />
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
                  <div key={`${item.productId}-${JSON.stringify(item.variants)}`} className="flex gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#e3ebdd] flex-shrink-0">
                      {item.productImage ? (
                        <ImageWrapper src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#6d8c5a]" />
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
                      <p className="text-sm font-bold text-[#425733] mt-1">{item.price.toLocaleString("vi-VN")}₫</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variants)} className="min-w-11 min-h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#425733] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425733]/30" aria-label={`Giảm số lượng ${item.productName}`}>
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variants)} className="min-w-11 min-h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#425733] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425733]/30" aria-label={`Tăng số lượng ${item.productName}`}>
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
                <span className="text-xl font-bold text-[#425733]">{cartTotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/products"
                  onClick={() => setCartOpen(false)}
                  className="py-3.5 rounded-xl border-2 border-[#425733] text-[#425733] text-sm font-semibold text-center hover:bg-[#e3ebdd] transition-colors"
                >
                  Tiếp tục mua
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="py-3.5 rounded-xl bg-[#425733] text-white text-sm font-semibold text-center hover:bg-[#364a29] transition-colors"
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
