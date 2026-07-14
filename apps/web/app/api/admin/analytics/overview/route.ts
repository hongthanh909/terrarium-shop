import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { maskEmail, maskPhone } from "@/lib/privacy";

export const dynamic = "force-dynamic";

const VALID_RANGES = new Set([7, 30, 90]);
const asNumber = (value: bigint | number | null | undefined) => Number(value || 0);
const RECENT_PAGE_SIZE = 12;
const RANK_PAGE_SIZE = 8;

function pageParam(request: NextRequest, name: string) {
  const value = Number(request.nextUrl.searchParams.get(name) || 1);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function pageMeta(page: number, pageSize: number, totalItems: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const requestedRange = Number(request.nextUrl.searchParams.get("range") || 7);
    const range = VALID_RANGES.has(requestedRange) ? requestedRange : 7;
    const recentPage = pageParam(request, "recentPage");
    const topPagesPage = pageParam(request, "topPagesPage");
    const topProductsPage = pageParam(request, "topProductsPage");
    const topSearchesPage = pageParam(request, "topSearchesPage");
    const now = new Date();
    const activeSince = new Date(now.getTime() - 60_000);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - range + 1);

    const [onlineVisitorRows, sessionsToday, pageViewsToday, visitorsTodayRows, registeredCustomersToday, totalRegisteredCustomers] = await Promise.all([
      prisma.analyticsSession.groupBy({ by: ["visitorId"], where: { lastSeenAt: { gte: activeSince } } }),
      prisma.analyticsSession.count({ where: { startedAt: { gte: today } } }),
      prisma.analyticsEvent.count({ where: { eventType: "PAGE_VIEW", createdAt: { gte: today } } }),
      prisma.analyticsEvent.groupBy({ by: ["visitorId"], where: { createdAt: { gte: today } } }),
      prisma.customer.count({ where: { createdAt: { gte: today } } }),
      prisma.customer.count(),
    ]);

    const topPagesWhere = { eventType: "PAGE_VIEW", createdAt: { gte: rangeStart } } as const;
    const topProductsWhere = { eventType: "PRODUCT_VIEW", productId: { not: null }, createdAt: { gte: rangeStart } } as const;
    const topSearchesWhere = { eventType: "SEARCH", searchTerm: { not: null }, createdAt: { gte: rangeStart } } as const;
    const recentWhere = { eventType: { not: "HEARTBEAT" } } as const;

    const [
      registeredSessions,
      anonymousSessions,
      topPagesTotalRows,
      topProductsTotalRows,
      topSearchesTotalRows,
      topPagesRaw,
      topProductsRaw,
      topSearchesRaw,
    ] = await Promise.all([
      prisma.analyticsSession.count({ where: { startedAt: { gte: rangeStart }, customerId: { not: null } } }),
      prisma.analyticsSession.count({ where: { startedAt: { gte: rangeStart }, customerId: null } }),
      prisma.analyticsEvent.groupBy({ by: ["path"], where: topPagesWhere }),
      prisma.analyticsEvent.groupBy({ by: ["productId"], where: topProductsWhere }),
      prisma.analyticsEvent.groupBy({ by: ["searchTerm"], where: topSearchesWhere }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: topPagesWhere,
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        skip: (topPagesPage - 1) * RANK_PAGE_SIZE,
        take: RANK_PAGE_SIZE,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["productId"],
        where: topProductsWhere,
        _count: { _all: true },
        orderBy: { _count: { productId: "desc" } },
        skip: (topProductsPage - 1) * RANK_PAGE_SIZE,
        take: RANK_PAGE_SIZE,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["searchTerm"],
        where: topSearchesWhere,
        _count: { _all: true },
        orderBy: { _count: { searchTerm: "desc" } },
        skip: (topSearchesPage - 1) * RANK_PAGE_SIZE,
        take: RANK_PAGE_SIZE,
      }),
    ]);

    const [trendRows, funnelRows, recentTotal, recentEvents, products] = await Promise.all([
      prisma.$queryRaw<Array<{ day: Date; visitors: bigint; sessions: bigint; page_views: bigint }>>(Prisma.sql`
        SELECT DATE_TRUNC('day', e."createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh') AS day,
               COUNT(DISTINCT e."visitorId") AS visitors,
               COUNT(DISTINCT e."analyticsSessionId") AS sessions,
               COUNT(*) FILTER (WHERE e."eventType" = 'PAGE_VIEW') AS page_views
        FROM "analytics_events" e
        WHERE e."createdAt" >= ${rangeStart}
        GROUP BY day ORDER BY day ASC
      `),
      prisma.$queryRaw<Array<{ event_type: string; sessions: bigint }>>(Prisma.sql`
        SELECT "eventType" AS event_type, COUNT(DISTINCT "analyticsSessionId") AS sessions
        FROM "analytics_events"
        WHERE "createdAt" >= ${rangeStart}
          AND "eventType" IN ('PRODUCT_VIEW', 'ADD_TO_CART', 'BEGIN_CHECKOUT', 'PURCHASE')
        GROUP BY "eventType"
      `),
      prisma.analyticsEvent.count({ where: recentWhere }),
      prisma.analyticsEvent.findMany({
        skip: (recentPage - 1) * RECENT_PAGE_SIZE,
        take: RECENT_PAGE_SIZE,
        orderBy: { createdAt: "desc" },
        where: recentWhere,
        select: {
          id: true, eventType: true, path: true, searchTerm: true, createdAt: true, analyticsSessionId: true,
          customer: { select: { name: true, email: true, phone: true } },
          visitor: { select: { anonymousId: true } },
          product: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.findMany({
        where: { id: { in: topProductsRaw.map((row) => row.productId).filter(Boolean) as string[] } },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    const productMap = new Map(products.map((product) => [product.id, product]));
    const funnelMap = new Map(funnelRows.map((row) => [row.event_type, asNumber(row.sessions)]));

    return NextResponse.json({
      range,
      summary: {
        onlineNow: onlineVisitorRows.length,
        visitorsToday: visitorsTodayRows.length,
        sessionsToday,
        pageViewsToday,
        registeredCustomersToday,
        totalRegisteredCustomers,
        registeredSessions,
        anonymousSessions,
      },
      trend: trendRows.map((row) => ({ day: row.day, visitors: asNumber(row.visitors), sessions: asNumber(row.sessions), pageViews: asNumber(row.page_views) })),
      funnel: [
        { key: "PRODUCT_VIEW", label: "Xem sản phẩm", value: funnelMap.get("PRODUCT_VIEW") || 0 },
        { key: "ADD_TO_CART", label: "Thêm vào giỏ", value: funnelMap.get("ADD_TO_CART") || 0 },
        { key: "BEGIN_CHECKOUT", label: "Bắt đầu thanh toán", value: funnelMap.get("BEGIN_CHECKOUT") || 0 },
        { key: "PURCHASE", label: "Tạo đơn", value: funnelMap.get("PURCHASE") || 0 },
      ],
      topPages: topPagesRaw.map((row) => ({ path: row.path, views: row._count._all })),
      topProducts: topProductsRaw.map((row) => ({
        id: row.productId,
        name: row.productId ? productMap.get(row.productId)?.name || "Sản phẩm đã ẩn" : "Sản phẩm đã ẩn",
        slug: row.productId ? productMap.get(row.productId)?.slug || "" : "",
        views: row._count._all,
      })),
      topSearches: topSearchesRaw.map((row) => ({ term: row.searchTerm, searches: row._count._all })),
      pagination: {
        recentActivity: pageMeta(recentPage, RECENT_PAGE_SIZE, recentTotal),
        topPages: pageMeta(topPagesPage, RANK_PAGE_SIZE, topPagesTotalRows.length),
        topProducts: pageMeta(topProductsPage, RANK_PAGE_SIZE, topProductsTotalRows.length),
        topSearches: pageMeta(topSearchesPage, RANK_PAGE_SIZE, topSearchesTotalRows.length),
      },
      recentActivity: recentEvents.map((event) => ({
        id: event.id,
        sessionId: event.analyticsSessionId,
        eventType: event.eventType,
        path: event.path,
        searchTerm: event.searchTerm,
        createdAt: event.createdAt,
        product: event.product,
        visitorLabel: event.customer?.name || `Khách #${event.visitor.anonymousId.slice(-4).toUpperCase()}`,
        email: maskEmail(event.customer?.email),
        phone: maskPhone(event.customer?.phone),
        registered: Boolean(event.customer),
      })),
    });
  } catch (error) {
    console.error("Admin analytics overview error:", error);
    return NextResponse.json({ error: "Không thể tải dữ liệu truy cập" }, { status: 500 });
  }
}
