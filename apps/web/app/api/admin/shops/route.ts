import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const ratingBelow = searchParams.get("ratingBelow");
  const hasViolations = searchParams.get("hasViolations") === "true";

  const where: any = {};
  if (status) where.status = status;
  if (ratingBelow) where.ratingPercent = { lt: Number(ratingBelow) };
  if (hasViolations) where.policyViolationCount = { gt: 0 };

  const shops = await prisma.shop.findMany({
    where,
    include: {
      owner: { select: { id: true, email: true, name: true, role: true } },
      _count: { select: { products: true, inquiries: true, policyViolations: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({
    shops: shops.map((shop) => ({ ...shop, platformFeeRate: Number(shop.platformFeeRate) })),
  });
}
