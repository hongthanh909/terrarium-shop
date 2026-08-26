import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id;

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const pointsHistory = await prisma.loyaltyPoint.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.loyaltyPoint.count({
      where: { customerId },
    });

    // Tính tổng điểm hiện tại (nếu database đã có)
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { loyaltyPoints: true },
    });

    return NextResponse.json({
      history: pointsHistory,
      currentPoints: customer?.loyaltyPoints || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching points history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
