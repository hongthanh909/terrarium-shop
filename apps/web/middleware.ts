import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── Admin paths — chỉ role=ADMIN + email whitelist mới truy cập ──────────────
const ADMIN_PATHS = ["/admin", "/api/admin"];

// ─── Customer-only paths — cần login ─────────────────────────────────────────
const CUSTOMER_PROTECTED_PATHS = ["/orders", "/account", "/profile", "/checkout"];

// ─── Trang login của từng bên (không cần middleware) ─────────────────────────
const ADMIN_LOGIN_PATH = "/admin/login";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── 1. Bỏ qua trang /admin/login (không cần token) ──────────────────────
  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  // ─── 2. Kiểm tra admin & customer-protected paths ─────────────────────────
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isCustomerProtected = CUSTOMER_PROTECTED_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  // Không phải protected path → next() ngay, không tốn thời gian getToken()
  if (!isAdminPath && !isCustomerProtected) {
    return NextResponse.next();
  }

  // ─── 3. Chỉ gọi getToken() khi cần ──────────────────────────────────────
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ─── 4. Admin routes ────────────────────────────────────────────────────────
  if (isAdminPath) {
    // Chưa login → về trang admin login
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Đã login nhưng không phải ADMIN → về trang chủ (không lộ thông tin)
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // ✅ Là ADMIN → cho vào, đính kèm headers để server components dùng
    const response = NextResponse.next();
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
    return response;
  }

  // ─── 5. Customer-protected routes ────────────────────────────────────────────
  if (isCustomerProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/profile/:path*",
    "/checkout",
    "/checkout/:path*",
  ],
};
