import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Chạy song song 4 queries thay vì tuần tự (giảm latency ~3x)
    const [featured, pinned, topVoted, newArrivals] = await Promise.all([
      // Featured products
      prisma.product.findMany({
        where: { status: "ACTIVE", featured: true },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      // Pinned products (pinnedUntil > now)
      prisma.product.findMany({
        where: { status: "ACTIVE", pinnedUntil: { gt: now } },
        include: { category: true },
        orderBy: { pinnedUntil: "desc" },
        take: 8,
      }),
      // Top voted products
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: {
          category: true,
          _count: { select: { votes: true } },
        },
        orderBy: { votes: { _count: "desc" } },
        take: 8,
      }),
      // New arrivals (last 30 days)
      prisma.product.findMany({
        where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      featured,
      pinned,
      topVoted: topVoted.map((p) => ({ ...p, voteCount: p._count.votes })),
      newArrivals,
    }, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
