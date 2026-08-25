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
        className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label="Điều hướng chính trên điện thoại"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_22px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid h-[4.5rem] max-w-lg grid-cols-5 px-1">
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
                  "relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[10.5px] font-semibold leading-none text-muted-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground",
                  isActive && "text-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-transparent",
                    isActive && "bg-foreground"
                  )}
                />
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} />
                <span className="w-full truncate text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
