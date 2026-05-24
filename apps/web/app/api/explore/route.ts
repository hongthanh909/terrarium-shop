import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
  try {
    const now = new Date();

    // Featured products
    const featured = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        featured: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    // Pinned products (pinnedUntil > now)
    const pinned = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        pinnedUntil: {
          gt: now,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        pinnedUntil: "desc",
      },
      take: 8,
    });

    // Top voted products (count votes)
    const topVoted = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        category: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        votes: {
          _count: "desc",
        },
      },
      take: 8,
    });

    // New arrivals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newArrivals = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return NextResponse.json({
      featured,
      pinned,
      topVoted: topVoted.map((p) => ({ ...p, voteCount: p._count.votes })),
      newArrivals,
    });
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}