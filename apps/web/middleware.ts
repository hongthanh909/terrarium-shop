import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  const path = request.nextUrl.pathname;

  // Protect /admin routes (pages)
  // /admin/login is the login page, so we don't protect it here
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect /api/admin routes (API endpoints)
  if (path.startsWith("/api/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
  }

  // Protect /orders and /profile routes
  if (path.startsWith("/orders") || path.startsWith("/profile")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect logged in users away from auth pages
  if (path === "/admin/login" || path === "/login" || path === "/register") {
    if (token) {
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/login",
    "/admin/login",
    "/register"
  ],
};

