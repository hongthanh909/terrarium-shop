import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Build phase: bypass all DB calls to prevent connection timeouts during static generation
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const prisma = isBuildPhase
  ? (new Proxy({} as any, {
      get(_target, prop) {
        if (["$connect", "$disconnect", "$use"].includes(prop as string)) {
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
        // All model calls (prisma.product.findMany etc.) return empty results
        return new Proxy({}, {
          get(_sub, method) {
            return async () => {
              const m = method.toString();
              if (m.startsWith("findMany") || m.startsWith("groupBy")) return [];
              if (m.startsWith("count")) return 0;
              if (m.startsWith("aggregate")) return { _sum: {}, _avg: {}, _count: {}, _max: {}, _min: {} };
              return null;
            };
          }
        });
      }
    }) as PrismaClient)
  : (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }));

// Development: cache globally to prevent too many instances during HMR
// Production/serverless: do NOT cache globally — each invocation gets a fresh client
// so PgBouncer connections are released when the lambda finishes.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

