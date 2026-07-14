import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { maskEmail, maskPhone } from "@/lib/privacy";

export const dynamic = "force-dynamic";

const VALID_RANGES = new Set([7, 30, 90]);
const asNumber = (value: bigint | number | null | undefined) => Number(value || 0);

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const requestedRange = Number(request.nextUrl.searchParams.get("range") || 7);
    const range = VALID_RANGES.has(requestedRange) ? requestedRange : 7;
    const now = new Date();
    const activeSince = new Date(now.getTime() - 60_000);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - range + 1);

    const [onlineVisitorRows, sessionsToday, pageViewsToday, visitorsTodayRows] = await Promise.all([
      prisma.analyticsSession.groupBy({ by: ["visitorId"], where: { lastSeenAt: { gte: activeSince } } }),
      prisma.analyticsSession.count({ where: { startedAt: { gte: today } } }),
      prisma.analyticsEvent.count({ where: { eventType: "PAGE_VIEW", createdAt: { gte: today } } }),
      prisma.analyticsEvent.groupBy({ by: ["visitorId"], where: { createdAt: { gte: today } } }),
    ]);

    const [registeredSessions, anonymousSessions, topPagesRaw, topProductsRaw, topSearchesRaw] = await Promise.all([
      prisma.analyticsSession.count({ where: { startedAt: { gte: rangeStart }, customerId: { not: null } } }),
      prisma.analyticsSession.count({ where: { startedAt: { gte: rangeStart }, customerId: null } }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { eventType: "PAGE_VIEW", createdAt: { gte: rangeStart } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 8,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["productId"],
        where: { eventType: "PRODUCT_VIEW", productId: { not: null }, createdAt: { gte: rangeStart } },
        _count: { _all: true },
        orderBy: { _count: { productId: "desc" } },
        take: 8,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["searchTerm"],
        where: { eventType: "SEARCH", searchTerm: { not: null }, createdAt: { gte: rangeStart } },
        _count: { _all: true },
        orderBy: { _count: { searchTerm: "desc" } },
        take: 8,
      }),
    ]);

    const [trendRows, funnelRows, recentEvents, products] = await Promise.all([
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
      prisma.analyticsEvent.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        where: { eventType: { not: "HEARTBEAT" } },
        select: {
          id: true, eventType: true, path: true, createdAt: true, analyticsSessionId: true,
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
      recentActivity: recentEvents.map((event) => ({
        id: event.id,
        sessionId: event.analyticsSessionId,
        eventType: event.eventType,
        path: event.path,
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
