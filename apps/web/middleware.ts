import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── Admin paths — chỉ role=ADMIN mới truy cập ───────────────────────────────
const ADMIN_PATHS = ["/admin", "/api/admin"];

// ─── Customer-only paths — cần login ─────────────────────────────────────────
const CUSTOMER_PROTECTED_PATHS = ["/orders", "/account", "/profile"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── 1. Chỉ chạy middleware cho admin & customer-protected paths ──────────────
  //    Tất cả paths khác → pass through ngay, không cần getToken()
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isCustomerProtected = CUSTOMER_PROTECTED_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  // Không phải protected path → next() ngay, không tốn thời gian getToken()
  if (!isAdminPath && !isCustomerProtected) {
    return NextResponse.next();
  }

  // ─── 2. Chỉ gọi getToken() khi cần ──────────────────────────────────────────
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ─── 3. Admin routes ─────────────────────────────────────────────────────────
  if (isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const response = NextResponse.next();
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
    return response;
  }

  // ─── 4. Customer-protected routes ────────────────────────────────────────────
  if (isCustomerProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Chỉ chạy middleware trên admin & customer-protected paths
  // KHÔNG chạy trên _next, static files, favicon, public API
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/profile/:path*",
  ],
};
