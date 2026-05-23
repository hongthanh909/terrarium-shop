import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weeklyFeatured = await prisma.weeklyFeatured.findFirst({
      where: {
        weekStart,
        isActive: true,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!weeklyFeatured) {
      return NextResponse.json({ featured: null });
    }

    return NextResponse.json({
      featured: {
        id: weeklyFeatured.id,
        product: weeklyFeatured.product,
        reason: weeklyFeatured.reason,
        weekStart: weeklyFeatured.weekStart,
      },
    });
  } catch (error) {
    console.error("Error fetching weekly featured:", error);
    return NextResponse.json({ error: "Failed to fetch weekly featured" }, { status: 500 });
  }
}
