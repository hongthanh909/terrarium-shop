import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public paths - không cần authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/products",
  "/blog",
  "/contact",
  "/consult",
  "/policies",
  "/api/auth",
  "/api/products",
  "/api/blog",
];

// Admin paths - chỉ admin mới truy cập được
const ADMIN_PATHS = [
  "/admin",
  "/api/admin",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });

  // Check if path is public
  const isPublic = PUBLIC_PATHS.some((pattern) => {
    if (pattern.includes("[")) {
      const prefix = pattern.split("[")[0];
      return pathname.startsWith(prefix);
    }
    return pathname === pattern || pathname.startsWith(pattern);
  });

  if (isPublic) {
    return NextResponse.next();
  }

  // If not public, require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Check admin routes
  const isAdminPath = ADMIN_PATHS.some((pattern) => pathname.startsWith(pattern));

  if (isAdminPath && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
