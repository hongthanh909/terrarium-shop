import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    maxAge: 30 * 24 * 60 * 60, // 30 ngày (production)
    updateAge: 24 * 60 * 60,   // Refresh token mỗi 24 giờ (tránh stale session)
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
  },

  pages: {
    // Middleware redirect đúng chỗ:
    // - /admin/* → /admin/login
    // - /orders, /profile, /checkout → /login
    // error page cho customer auth (NextAuth default error)
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
