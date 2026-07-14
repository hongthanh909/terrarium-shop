import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function vnDayRange(daysAgo: number) {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate() - daysAgo;
  const label = new Date(Date.UTC(year, month, day));
  const start = new Date(label.getTime() - 7 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { label, start, end };
}
export async function POST(request: NextRequest) {
  const secret = process.env.ANALYTICS_CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret) return NextResponse.json({ error: "Analytics maintenance is not configured" }, { status: 503 });
  if (authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { label, start, end } = vnDayRange(1);
    const eventWhere = { createdAt: { gte: start, lt: end } };
    const sessionWhere = { startedAt: { gte: start, lt: end } };

    const [visitors, sessions, registeredSessions, pageViews, productViews, addToCarts, checkouts, purchases, chatOpens] = await Promise.all([
      prisma.analyticsEvent.groupBy({ by: ["visitorId"], where: eventWhere }).then((rows) => rows.length),
      prisma.analyticsSession.count({ where: sessionWhere }),
      prisma.analyticsSession.count({ where: { ...sessionWhere, customerId: { not: null } } }),
      prisma.analyticsEvent.count({ where: { ...eventWhere, eventType: "PAGE_VIEW" } }),
      prisma.analyticsEvent.count({ where: { ...eventWhere, eventType: "PRODUCT_VIEW" } }),
      prisma.analyticsEvent.count({ where: { ...eventWhere, eventType: "ADD_TO_CART" } }),
      prisma.analyticsEvent.count({ where: { ...eventWhere, eventType: "BEGIN_CHECKOUT" } }),
      prisma.analyticsEvent.count({ where: { ...eventWhere, eventType: "PURCHASE" } }),
      prisma.analyticsEvent.count({ where: { ...eventWhere, eventType: "CHAT_OPEN" } }),
    ]);

    await prisma.analyticsDailyStat.upsert({
      where: { date: label },
      create: { date: label, visitors, sessions, registeredSessions, anonymousSessions: Math.max(0, sessions - registeredSessions), pageViews, productViews, addToCarts, checkouts, purchases, chatOpens },
      update: { visitors, sessions, registeredSessions, anonymousSessions: Math.max(0, sessions - registeredSessions), pageViews, productViews, addToCarts, checkouts, purchases, chatOpens },
    });

    const eventCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const dailyCutoff = new Date();
    dailyCutoff.setUTCFullYear(dailyCutoff.getUTCFullYear() - 1);
    const deletedEvents = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: eventCutoff } } });
    const deletedSessions = await prisma.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: eventCutoff }, events: { none: {} } } });
    const deletedVisitors = await prisma.analyticsVisitor.deleteMany({ where: { sessions: { none: {} } } });
    const deletedDailyStats = await prisma.analyticsDailyStat.deleteMany({ where: { date: { lt: dailyCutoff } } });

    return NextResponse.json({
      aggregatedDate: label.toISOString().slice(0, 10),
      deleted: { events: deletedEvents.count, sessions: deletedSessions.count, visitors: deletedVisitors.count, dailyStats: deletedDailyStats.count },
    });
  } catch (error) {
    console.error("Analytics maintenance error:", error);
    return NextResponse.json({ error: "Analytics maintenance failed" }, { status: 500 });
  }
}
