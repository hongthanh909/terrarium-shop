import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || "/tiem-nho-nth24";
const ADMIN_LOGIN_PATH = `${ADMIN_SECRET_PATH}/login`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: create a dedicated, short-lived PrismaClient for auth queries.
// We do NOT reuse the app-wide prisma singleton here because:
//  1. The singleton may be in a bad connection state (stale / pooled).
//  2. Auth is on the critical path — we need a guaranteed fresh connection.
//  3. Explicit $disconnect() releases the TCP connection to PgBouncer
//     immediately, preventing pool exhaustion on Supabase free tier.
// ─────────────────────────────────────────────────────────────────────────────
async function findUserByEmail(email: string) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });
  try {
    const user = await client.customer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
      },
    });

    // Tự động thăng cấp email cấu hình admin thành vai trò ADMIN nếu đang là CUSTOMER
    const adminEmail = process.env.ADMIN_EMAIL;
    if (user && adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase() && user.role !== "ADMIN") {
      const updatedUser = await client.customer.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
        },
      });
      console.log(`[Auth] Auto-promoted ${email} to ADMIN role.`);
      return updatedUser;
    }

    return user;
  } finally {
    // Always release the connection — do NOT let it linger in the pool.
    await client.$disconnect().catch(() => {});
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ─── Provider 1: ADMIN login ─────────────────────────────────────────────
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

        const user = await findUserByEmail(credentials.email);

        if (!user || !user.passwordHash) {
          throw new Error("Tài khoản không tồn tại.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Mật khẩu không chính xác.");
        }

        // Only ADMIN role is allowed through this provider
        if (user.role !== "ADMIN") {
          throw new Error("Bạn không có quyền truy cập quản trị.");
        }

        // Email whitelist — only the configured admin email
        const allowedEmail = process.env.ADMIN_EMAIL;
        if (allowedEmail && user.email !== allowedEmail) {
          throw new Error("Tài khoản này không được phép truy cập trang quản trị.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        };
      },
    }),

    // ─── Provider 2: CUSTOMER login ──────────────────────────────────────────
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

        const user = await findUserByEmail(credentials.email);

        if (!user || !user.passwordHash) {
          throw new Error("Email hoặc mật khẩu không đúng.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Email hoặc mật khẩu không đúng.");
        }

        // Block admin from logging in via customer form
        if (user.role === "ADMIN") {
          throw new Error(
            "Tài khoản quản trị viên không thể đăng nhập tại đây. Vui lòng dùng trang đăng nhập quản trị."
          );
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60,    // 1 hour
    updateAge: 15 * 60,       // refresh token every 15 min if active
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
    // Ensure admin signIn always lands on admin dashboard, never customer pages.
    async redirect({ url, baseUrl }) {
      if (url.startsWith(ADMIN_SECRET_PATH) || url.startsWith(baseUrl + ADMIN_SECRET_PATH)) {
        return url;
      }
      if (url.startsWith("/login") || url.startsWith(baseUrl + "/login")) {
        return url;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },

  pages: {
    // Gửi lỗi NextAuth chung về trang đăng nhập khách hàng (/login).
    // Trang admin login tự xử lý lỗi riêng trong page component.
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
