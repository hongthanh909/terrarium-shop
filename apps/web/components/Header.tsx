"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Leaf, User, X, Minus, Plus, ShoppingBag, ChevronDown, LogOut, Package } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { getCartCount, items, removeItem, updateQuantity } = useCartStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-lg shadow-soft border-b border-[#e3ebdd]"
            : "bg-white/70 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex flex-col group">
              <span 
                className="text-2xl text-[#425733] group-hover:text-[#364a29] transition-colors leading-tight"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-px bg-[#8ba57a]" />
                <span 
                  className="text-[10px] tracking-wider text-[#5f7d50] whitespace-nowrap"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
                >
                  Terrarium &amp; Moss Art
                </span>
                <div className="w-6 h-px bg-[#8ba57a]" />
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-5 py-2 rounded-full text-sm font-semibold text-[hsl(220,14%,45%)] hover:text-[#425733] hover:bg-[#e3ebdd]/80 transition-all duration-200"
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className="px-5 py-2 rounded-full text-sm font-semibold text-[hsl(220,14%,45%)] hover:text-[#425733] hover:bg-[#e3ebdd]/80 transition-all duration-200"
              >
                Sản phẩm
              </Link>
              <Link
                href="/explore"
                className="px-5 py-2 rounded-full text-sm font-semibold text-[hsl(220,14%,45%)] hover:text-[#425733] hover:bg-[#e3ebdd]/80 transition-all duration-200"
              >
                Khám phá
              </Link>
              <Link
                href="/blog"
                className="px-5 py-2 rounded-full text-sm font-semibold text-[hsl(220,14%,45%)] hover:text-[#425733] hover:bg-[#e3ebdd]/80 transition-all duration-200"
              >
                Blog
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-5 py-2 rounded-full text-sm font-semibold text-[hsl(220,14%,45%)] hover:text-[#425733] hover:bg-[#e3ebdd]/80 transition-all duration-200 flex items-center gap-1">
                    Chính sách
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl shadow-soft border-0">
                  <DropdownMenuItem asChild>
                    <Link href="/policies/warranty" className="cursor-pointer">Bảo hành</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/policies/shipping" className="cursor-pointer">Vận chuyển</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/policies/returns" className="cursor-pointer">Đổi trả</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/policies/privacy" className="cursor-pointer">Bảo mật</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/policies/faq" className="cursor-pointer">FAQ</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* User menu */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-10 h-10 hover:bg-[#e3ebdd]/60"
                      title={session.user?.name || "Tài khoản"}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#425733] text-white flex items-center justify-center text-xs font-bold">
                        {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl shadow-soft border-0 min-w-[180px]">
                    <div className="px-3 py-2">
                      <p className="font-semibold text-sm text-gray-800 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                        <User className="w-4 h-4" /> Tài khoản
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer flex items-center gap-2">
                        <Package className="w-4 h-4" /> Đơn hàng
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-[#e3ebdd]/60 text-sm font-semibold text-[hsl(220,14%,45%)] hover:text-[#425733]"
                  >
                    <User className="w-4 h-4 mr-1.5" />
                    Đăng nhập
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-10 h-10 relative hover:bg-[#e3ebdd]/60"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5 text-[hsl(220,14%,45%)]" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#425733] text-[#ffffff] text-xs font-bold rounded-full flex items-center justify-center shadow-soft">
                    {getCartCount()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
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
          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            <CartItems items={items} removeItem={removeItem} updateQuantity={updateQuantity} />
          </div>
          <div className="mt-4 pt-4 border-t space-y-3">
            <CartTotal items={items} />
            <Button asChild className="w-full font-bold shadow-soft-lg" size="lg">
              <Link href="/checkout" onClick={() => setCartOpen(false)}>
                Thanh toán
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-[hsl(220,14%,45%)] hover:bg-[#e3ebdd]/60"
              onClick={() => setCartOpen(false)}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CartTotal({ items }: { items: any[] }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) return null;

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[hsl(220,14%,45%)] font-medium">Tổng cộng</span>
      <span className="text-xl font-bold text-[#425733]">
        {total.toLocaleString("vi-VN")}₫
      </span>
    </div>
  );
}

function CartItems({ items, removeItem, updateQuantity }: { items: any[]; removeItem: any; updateQuantity: any }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f0f4ec] flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-[#4d6b3d]" />
        </div>
        <p className="font-bold text-[hsl(220,14%,25%)] mb-1">Giỏ hàng trống</p>
        <p className="text-sm text-[hsl(220,14%,45%)] mb-6">
          Khám phá những terrarium tuyệt vời của chúng tôi
        </p>
        <Button asChild variant="outline" className="font-semibold">
          <Link href="/products">Xem Sản Phẩm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 p-4 rounded-2xl bg-[#f0f4ec]/60 hover:bg-[#f0f4ec] transition-all shadow-soft"
        >
          <div className="w-18 h-18 flex-shrink-0 rounded-xl overflow-hidden bg-[#eaf0e5]">
            {item.productImage ? (
              <Image
                src={item.productImage}
                alt={item.productName}
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#e3ebdd] to-[#f0f4ec] flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#5a7a48]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[hsl(220,14%,25%)] truncate">{item.productName}</h3>
            {item.variants && Object.keys(item.variants).length > 0 && (
              <p className="text-xs text-[hsl(220,14%,45%)] mt-0.5">
                {Object.entries(item.variants)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}
              </p>
            )}
            <p className="text-[#425733] font-bold text-sm mt-1">
              {(item.price * item.quantity).toLocaleString("vi-VN")}₫
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full border-[#c8d5be]"
                onClick={() =>
                  updateQuantity(item.productId, item.quantity - 1, item.variants)
                }
              >
                <Minus className="w-3 h-3 text-[hsl(220,14%,45%)]" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-[hsl(220,14%,25%)]">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full border-[#c8d5be]"
                onClick={() =>
                  updateQuantity(item.productId, item.quantity + 1, item.variants)
                }
              >
                <Plus className="w-3 h-3 text-[hsl(220,14%,45%)]" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-xs text-[hsl(220,14%,45%)] hover:text-[hsl(0,75%,40%)] hover:bg-[hsl(0,75%,96%)]"
                onClick={() => removeItem(item.productId, item.variants)}
              >
                <X className="w-3 h-3 mr-1" />
                Xóa
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
