import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 365;

function rangeParam(request: NextRequest) {
  const value = Number(request.nextUrl.searchParams.get("range") || 7);
  if (!Number.isFinite(value)) return 7;
  return Math.min(MAX_RANGE_DAYS, Math.max(1, Math.floor(value)));
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const range = rangeParam(request);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - range + 1);

    const users = await prisma.customer.findMany({
      where: { createdAt: { gte: rangeStart } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        image: true,
        role: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, reviews: true, wishlist: true } },
      },
    });

    return NextResponse.json({
      range,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        image: user.image,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        password: user.passwordHash ? "********" : "Chưa đặt mật khẩu",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        counts: user._count,
      })),
    });
  } catch (error) {
    console.error("Admin analytics users error:", error);
    return NextResponse.json({ error: "Không thể tải tài khoản đã tạo" }, { status: 500 });
  }
}
