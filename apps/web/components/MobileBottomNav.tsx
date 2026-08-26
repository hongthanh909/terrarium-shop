"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Compass, Home, MessageCircle, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ", icon: Home, requiresAuth: false },
  { href: "/products", label: "Sản phẩm", icon: Package, requiresAuth: false },
  { href: "/explore", label: "Khám phá", icon: Compass, requiresAuth: false },
  { href: "/messages", label: "Tin nhắn", icon: MessageCircle, requiresAuth: true },
  { href: "/profile", label: "Tài khoản", icon: User, requiresAuth: true },
] as const;

function shouldHideMobileNav(pathname: string) {
  const hiddenPrefixes = [
    "/checkout",
    "/messages",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/consult",
    "/tiem-nho-nth24",
    "/seller",
    "/marketplace",
    "/forum",
  ];

  return (
    hiddenPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    /^\/products\/[^/]+\/?$/.test(pathname)
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();

  if (shouldHideMobileNav(pathname)) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(6rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label="Điều hướng chính trên điện thoại"
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[512px] -translate-x-1/2 rounded-nav border border-border bg-white/95 shadow-bottom-nav backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid h-16 grid-cols-5 gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const href = item.requiresAuth && !session
              ? `/login?callbackUrl=${encodeURIComponent(item.href)}`
              : item.href;
            const isAccountRoute = item.href === "/profile" && (
              pathname.startsWith("/profile") || pathname.startsWith("/orders")
            );
            const isActive = item.href === "/"
              ? pathname === "/"
              : isAccountRoute || pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "my-2 flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[11px] font-medium leading-[14px] text-muted-foreground transition-[background-color,color,transform] duration-150 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40",
                  isActive && "bg-[#e5e5e5] font-bold text-foreground"
                )}
              >
                <Icon aria-hidden="true" className={cn("h-5 w-5 stroke-[1.8]", isActive && "stroke-[2.4]")} />
                <span className="w-full truncate text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
