import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const prisma = isBuildPhase
  ? new Proxy({} as any, {
      get(target, prop) {
        if (prop === '$queryRaw' || prop === '$executeRaw' || prop === '$queryRawUnsafe' || prop === '$executeRawUnsafe') {
          return async () => [];
        }
        if (prop === '$connect' || prop === '$disconnect' || prop === '$use') {
          return async () => {};
        }
        if (prop === '$transaction') {
          return async (val: any) => {
            if (typeof val === 'function') {
              return val(prisma);
            }
            return Promise.all(val);
          };
        }
        // Intercept model calls (e.g. prisma.product.findMany)
        return new Proxy({}, {
          get(subTarget, subProp) {
            return async () => {
              const name = subProp.toString();
              if (name.startsWith('findMany') || name.startsWith('groupBy')) {
                return [];
              }
              if (name.startsWith('count')) {
                return 0;
              }
              if (name.startsWith('aggregate')) {
                return { _sum: {}, _avg: {}, _count: {}, _max: {}, _min: {} };
              }
              return null;
            };
          }
        });
      }
    })
  : (globalForPrisma.prisma ??
      new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL?.includes("connection_limit")
              ? process.env.DATABASE_URL.replace(/connection_limit=\d+/, "connection_limit=1").replace(/timeout=\d+/, "timeout=60")
              : process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes("?") ? "&" : "?") + "connection_limit=1&timeout=60",
          },
        },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      }));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

