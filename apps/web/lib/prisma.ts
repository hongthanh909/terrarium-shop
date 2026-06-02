import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ─── Build Phase ──────────────────────────────────────────────────────────────
// During `next build`, skip real DB connections to prevent timeout failures
// in static analysis / ISR prerendering.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// ─── Runtime Singleton ────────────────────────────────────────────────────────
// Reuse the same PrismaClient across warm serverless invocations (both dev and
// production). This is the pattern recommended by Prisma for Next.js:
// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
//
// NOTE: Auth queries do NOT use this singleton — see lib/auth.ts.
//       Auth creates its own short-lived client with explicit $disconnect()
//       to guarantee connection release and prevent PgBouncer pool exhaustion.
export const prisma: PrismaClient = isBuildPhase
  ? (new Proxy({} as any, {
      get(_target, prop) {
        if (["$connect", "$disconnect", "$use", "$on", "$extends"].includes(prop as string)) {
          return async () => {};
        }
        if (["$queryRaw", "$executeRaw", "$queryRawUnsafe", "$executeRawUnsafe"].includes(prop as string)) {
          return async () => [];
        }
        if (prop === "$transaction") {
          return async (val: any) => {
            if (typeof val === "function") return val(prisma);
            return Promise.all(val);
          };
        }
        // All model calls return safe empty results during build
        return new Proxy({}, {
          get(_sub, method) {
            return async () => {
              const m = method.toString();
              if (m.startsWith("findMany") || m.startsWith("groupBy")) return [];
              if (m.startsWith("count")) return 0;
              if (m.startsWith("aggregate")) return { _sum: {}, _avg: {}, _count: {}, _max: {}, _min: {} };
              return null;
            };
          },
        });
      },
    }) as PrismaClient)
  : (globalForPrisma.prisma ??
      new PrismaClient({
        // Supabase + Prisma official recommendation:
        // - DATABASE_URL: PgBouncer (port 6543, transaction mode) với pgbouncer=true
        //   → Prisma tắt prepared statements, PgBouncer quản lý connection pool
        // - connection_limit=1: Prisma chỉ giữ 1 connection trong pool riêng của nó,
        //   để PgBouncer làm nhiệm vụ multiplexing — tránh pool exhaustion
        // Ref: https://supabase.com/docs/guides/database/connecting-to-postgres#prisma
        datasources: {
          db: {
            url: (() => {
              const base = process.env.DATABASE_URL ?? "";
              // Thêm connection_limit=1 nếu chưa có (tránh duplicate)
              if (base.includes("connection_limit")) return base;
              const sep = base.includes("?") ? "&" : "?";
              return `${base}${sep}connection_limit=1`;
            })(),
          },
        },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }));



// Cache the singleton globally so it survives hot-module replacement (dev)
// and is reused across warm serverless invocations (production).
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
