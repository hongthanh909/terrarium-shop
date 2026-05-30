/**
 * Logout endpoint.
 * NextAuth quản lý việc xóa cookie session (next-auth.session-token).
 * Client nên gọi signOut() từ next-auth/react thay vì POST trực tiếp.
 * Route này giữ lại để tương thích với các call từ server-side.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  // Xóa NextAuth session cookie bằng cách set expires về quá khứ
  const response = NextResponse.json({ success: true, message: "Đã đăng xuất" });
  
  // Xóa cookie của NextAuth (tên mặc định)
  response.cookies.set("next-auth.session-token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  // Secure cookie name (dùng trong production với HTTPS)
  response.cookies.set("__Secure-next-auth.session-token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });

  return response;
}

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  );

  response.cookies.set("next-auth.session-token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
