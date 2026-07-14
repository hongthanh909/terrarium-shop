import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_LOGIN_PATH, ADMIN_SECRET_PATH } from "@/lib/admin-path";

// ─── 🔐 SECRET ADMIN PATH — không dùng /admin nữa ────────────────────────────
//   Thay đổi giá trị này nếu muốn đổi URL admin.
//   Admin path cố định ở lib/admin-path.ts vì Next middleware matcher là static.

// API admin path vẫn giữ /api/admin vì chỉ gọi server-to-server
const API_ADMIN_PATH = "/api/admin";

// ─── Customer-only paths ───────────────────────────────────────────────────────
const CUSTOMER_PROTECTED_PATHS = ["/orders", "/account", "/profile", "/checkout"];

// ─── Security Headers (áp dụng cho mọi response) ─────────────────────────────
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Chặn clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Chặn MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Tắt các API không cần thiết
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=()"
  );
  // HSTS — chỉ HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  // Ẩn server fingerprint
  response.headers.delete("X-Powered-By");
  return response;
}

// ─── Rate limiting state (in-memory, Edge-compatible) ─────────────────────────
// Lưu ý: In-memory sẽ reset khi cold start. Dùng Upstash Redis ở Phase 2
//        Tuy nhiên đây vẫn tạo thêm một lớp bảo vệ.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 phút

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

function hasAdminSession(token: any): boolean {
  return token?.role === "ADMIN" && token?.authProvider === "admin-login" && token?.adminSession === true;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // ─── 1. Người dùng gõ /admin → 404 (không lộ URL mới) ──────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const response = new NextResponse(null, { status: 404 });
    return applySecurityHeaders(response);
  }

  // ─── 2. Cho qua trang login admin (xử lý rate limit riêng) ─────────────────
  if (pathname === ADMIN_LOGIN_PATH) {
    const response = NextResponse.next();
    // Always allow the login page to render. Redirecting an existing session
    // here can bounce forever when an old customer/admin cookie is present.
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    return applySecurityHeaders(response);
  }

  // ─── 3. Rate limit cho API auth (đặc biệt login) ─────────────────────────────
  const shouldRateLimitAuth =
    pathname === "/api/auth/callback/admin-login" ||
    pathname === "/api/auth/signin" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/register" ||
    pathname === "/api/auth/forgot-password" ||
    pathname === "/api/auth/reset-password";

  if (shouldRateLimitAuth) {
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      const response = new NextResponse(
        JSON.stringify({ error: "Quá nhiều lần thử. Vui lòng thử lại sau.", retryAfter: rateCheck.retryAfter }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) } }
      );
      return applySecurityHeaders(response);
    }
  }

  const isAdminPath = pathname.startsWith(ADMIN_SECRET_PATH);
  const isApiAdmin = pathname.startsWith(API_ADMIN_PATH);
  const isCustomerProtected = CUSTOMER_PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // Không phải protected path → next() ngay
  if (!isAdminPath && !isApiAdmin && !isCustomerProtected) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // ─── 4. Lấy token ────────────────────────────────────────────────────────────
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ─── 5. Admin routes (UI) ────────────────────────────────────────────────────
  if (isAdminPath) {
    // Enforce fresh login: require a valid admin token
    if (!token) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
    // Verify role + admin-login provider. A storefront customer-login session
    // with ADMIN role must not unlock the admin panel directly.
    if (!hasAdminSession(token)) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
    // Referer is not a security boundary and can create redirect loops after
    // login or browser session restore. Token + optional IP whitelist protect access.
    // Verify IP whitelist if configured
    const whitelistEnv = process.env.ADMIN_IP_WHITELIST;
    if (whitelistEnv) {
      const allowedIps = whitelistEnv.split(",").map(ip => ip.trim());
      if (ip && !allowedIps.includes(ip)) {
        const response = new NextResponse(JSON.stringify({ error: "Unauthorized IP" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
        return applySecurityHeaders(response);
      }
    }
    const response = NextResponse.next();
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
    response.headers.set("x-pathname", pathname);
    // Prevent browser caching of admin pages
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    return applySecurityHeaders(response);
  }

  // ─── 6. API Admin routes ─────────────────────────────────────────────────────
  if (isApiAdmin) {
    if (!token || !hasAdminSession(token)) {
      const response = new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
      return applySecurityHeaders(response);
    }
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // ─── 7. Customer-protected routes ────────────────────────────────────────────
  if (isCustomerProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    // ⚠️  Matcher là STATIC — không đọc được env var.
    // Admin path is fixed in code; keep this matcher aligned with lib/admin-path.ts.
    "/admin/:path*",
    "/tiem-nho-nth24/:path*",
    "/api/admin/:path*",
    // Auth endpoints (rate limit)
    "/api/auth/:path*",
    // Customer protected
    "/orders/:path*",
    "/account/:path*",
    "/profile/:path*",
    "/checkout",
    "/checkout/:path*",
    // Apply security headers + idle-logout everywhere (static files excluded)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};

