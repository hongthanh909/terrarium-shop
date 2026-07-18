import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { adminShopReviewSchema } from "@/lib/marketplace";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;
  const data = adminShopReviewSchema.parse(await request.json().catch(() => ({})));

  const shop = await prisma.shop.update({
    where: { id },
    data: {
      lastPriceReviewAt: new Date(),
      adminNote: data.note,
    },
  });

  await logAdminAction(admin.id, "REVIEW", "Shop", id, { priceReviewNote: data.note });
  return NextResponse.json({ shop: { ...shop, platformFeeRate: Number(shop.platformFeeRate) } });
}
