import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ADMIN_SECRET_PATH } from "@/lib/admin-path";
import {
  buildLoginRateLimitKey,
  checkRateLimit,
  clearRateLimit,
  recordFailedAttempt,
} from "@/lib/rate-limit";


// ─────────────────────────────────────────────────────────────────────────────
// Helper: create a dedicated, short-lived PrismaClient for auth queries.
// We do NOT reuse the app-wide prisma singleton here because:
//  1. The singleton may be in a bad connection state (stale / pooled).
//  2. Auth is on the critical path — we need a guaranteed fresh connection.
//  3. Explicit $disconnect() releases the TCP connection to PgBouncer
//     immediately, preventing pool exhaustion on Supabase free tier.
// ─────────────────────────────────────────────────────────────────────────────
async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });
  try {
    const user = await client.customer.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        image: true,
      },
    });

    // Tự động thăng cấp email cấu hình admin thành vai trò ADMIN nếu đang là CUSTOMER
    const adminEmail = process.env.ADMIN_EMAIL;
    if (user && adminEmail && user.email.toLowerCase() === adminEmail.trim().toLowerCase() && user.role !== "ADMIN") {
      const updatedUser = await client.customer.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          image: true,
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

const ADMIN_LOGIN_WINDOW_MS = 10 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 30;
const ADMIN_LOGIN_ERROR = "Email hoặc mật khẩu không chính xác.";

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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu.");
        }

        const rateLimitKey = buildLoginRateLimitKey("admin-login", credentials.email, req?.headers);
        const rateLimit = checkRateLimit(
          rateLimitKey,
          ADMIN_LOGIN_MAX_ATTEMPTS,
          ADMIN_LOGIN_WINDOW_MS
        );
        if (rateLimit.limited) {
          throw new Error(
            `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.`
          );
        }

        const user = await findUserByEmail(credentials.email);

        if (!user || !user.passwordHash) {
          recordFailedAttempt(rateLimitKey, ADMIN_LOGIN_WINDOW_MS);
          throw new Error(ADMIN_LOGIN_ERROR);
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          recordFailedAttempt(rateLimitKey, ADMIN_LOGIN_WINDOW_MS);
          throw new Error(ADMIN_LOGIN_ERROR);
        }

        // Only ADMIN role is allowed through this provider
        if (user.role !== "ADMIN") {
          recordFailedAttempt(rateLimitKey, ADMIN_LOGIN_WINDOW_MS);
          throw new Error(ADMIN_LOGIN_ERROR);
        }

        // Email whitelist — only the configured admin email
        const allowedEmail = process.env.ADMIN_EMAIL;
        if (allowedEmail && user.email !== allowedEmail) {
          recordFailedAttempt(rateLimitKey, ADMIN_LOGIN_WINDOW_MS);
          throw new Error(ADMIN_LOGIN_ERROR);
        }

        clearRateLimit(rateLimitKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
          image: user.image ?? null,
          authProvider: "admin-login",
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

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
          image: user.image ?? null,
          authProvider: "customer-login",
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
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.picture = (user as any).image;
        token.authProvider = (user as any).authProvider || account?.provider;
        token.adminSession = token.role === "ADMIN" && token.authProvider === "admin-login";
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).authProvider = token.authProvider;
        (session.user as any).adminSession = token.adminSession;
        session.user.name = token.name;
        session.user.image = token.picture as string | null;
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
