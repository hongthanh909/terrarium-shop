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
        // Ưu tiên DIRECT_URL (bypass PgBouncer) để tránh pool exhaustion.
        // DIRECT_URL dùng port 5432 (direct PostgreSQL), không qua PgBouncer (port 6543).
        // Điều này quan trọng khi nhiều API route chạy đồng thời.
        datasources: {
          db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL,
          },
        },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }));


// Cache the singleton globally so it survives hot-module replacement (dev)
// and is reused across warm serverless invocations (production).
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
