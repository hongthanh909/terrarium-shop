import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { maskEmail, maskPhone } from "@/lib/privacy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();
    const { id } = await params;
    const session = await prisma.analyticsSession.findUnique({
      where: { id },
      include: {
        visitor: { select: { anonymousId: true, firstSeenAt: true } },
        customer: { select: { name: true, email: true, phone: true } },
        events: {
          orderBy: { createdAt: "asc" },
          take: 300,
          select: {
            id: true, eventType: true, path: true, searchTerm: true, durationMs: true,
            createdAt: true, product: { select: { name: true, slug: true } },
          },
        },
      },
    });
    if (!session) return NextResponse.json({ error: "Không tìm thấy phiên truy cập" }, { status: 404 });

    return NextResponse.json({
      id: session.id,
      visitorLabel: session.customer?.name || `Khách #${session.visitor.anonymousId.slice(-4).toUpperCase()}`,
      registered: Boolean(session.customerId),
      email: maskEmail(session.customer?.email),
      phone: maskPhone(session.customer?.phone),
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      endedAt: session.endedAt,
      entryPath: session.entryPath,
      exitPath: session.exitPath,
      referrer: session.referrer,
      deviceType: session.deviceType,
      browser: session.browser,
      operatingSystem: session.operatingSystem,
      pageViews: session.pageViews,
      events: session.events,
    });
  } catch (error) {
    console.error("Admin analytics session error:", error);
    return NextResponse.json({ error: "Không thể tải chi tiết phiên" }, { status: 500 });
  }
}
