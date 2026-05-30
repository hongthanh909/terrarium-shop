import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || "/tiem-nho-nth24";
const ADMIN_LOGIN_PATH = `${ADMIN_SECRET_PATH}/login`;


export const authOptions: NextAuthOptions = {
  providers: [
    // ─── Provider 1: ADMIN login (chỉ dành cho /admin) ───────────────────────
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu.");
        }

        const user = await prisma.customer.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Tài khoản không tồn tại.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Mật khẩu không chính xác.");
        }

        // Chỉ cho phép ADMIN đăng nhập qua provider này
        if (user.role !== "ADMIN") {
          throw new Error("Bạn không có quyền truy cập quản trị.");
        }

        // Whitelist: chỉ email được cấu hình mới được vào Admin
        const allowedAdminEmail = process.env.ADMIN_EMAIL;
        if (allowedAdminEmail && user.email !== allowedAdminEmail) {
          throw new Error("Tài khoản này không được phép truy cập trang quản trị.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),

    // ─── Provider 2: CUSTOMER login (dành cho /login trang khách hàng) ────────
    CredentialsProvider({
      id: "customer-login",
      name: "Customer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu.");
        }

        const user = await prisma.customer.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Email hoặc mật khẩu không đúng.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Email hoặc mật khẩu không đúng.");
        }

        // 🔒 Chặn ADMIN đăng nhập qua form khách hàng
        // Admin phải dùng trang đăng nhập quản trị riêng
        if (user.role === "ADMIN") {
          throw new Error("Tài khoản quản trị viên không thể đăng nhập tại đây. Vui lòng dùng trang đăng nhập quản trị.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,   // 24 giờ (thay vì 30 ngày) — bảo mật hơn
    updateAge: 15 * 60,     // Refresh token mỗi 15 phút nếu đang dùng
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
    // Ensure admin login always lands on admin dashboard, not customer pages
    async redirect({ url, baseUrl }) {
      // If the URL is the admin path or a subpath, allow it
      if (url.startsWith(ADMIN_SECRET_PATH) || url.startsWith(baseUrl + ADMIN_SECRET_PATH)) {
        return url;
      }
      // For customer login paths, allow them
      if (url.startsWith("/login") || url.startsWith(baseUrl + "/login")) {
        return url;
      }
      // Default: return to the provided URL if on same origin, else baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },

  pages: {
    // When NextAuth encounters an unhandled error, redirect to ADMIN login (not customer login)
    error: ADMIN_LOGIN_PATH,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
