import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ─── Build Phase ──────────────────────────────────────────────────────────────
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// ─── URL helper ───────────────────────────────────────────────────────────────
// Chỉ thêm connection_limit=1 khi dùng Supabase PgBouncer (pooler.supabase.com)
// Với PostgreSQL local (localhost) hoặc VPS thì KHÔNG thêm — để Prisma dùng pool mặc định
function buildDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  const isSupabasePgBouncer =
    url.includes("pooler.supabase.com") && url.includes("pgbouncer=true");
  if (isSupabasePgBouncer && !url.includes("connection_limit")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}connection_limit=1`;
  }
  return url; // local PostgreSQL or VPS — use as-is, no artificial limits
}

// ─── Runtime Singleton ────────────────────────────────────────────────────────
// Reuse the same PrismaClient across warm serverless invocations (dev & prod).
// Ref: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
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
        datasources: {
          db: { url: buildDatabaseUrl() },
        },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }));

// Cache singleton globally — survives HMR in dev, reused in production
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
