import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { adminShopReviewSchema, serializeMarketplaceProduct } from "@/lib/marketplace";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;
  const data = adminShopReviewSchema.parse(await request.json().catch(() => ({})));

  const product = await prisma.marketplaceProduct.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: data.note,
      rejectedAt: new Date(),
      approvedAt: null,
      approvedById: null,
    },
    include: { shop: true },
  });

  await logAdminAction(admin.id, "REJECT", "MarketplaceProduct", id, { note: data.note });
  return NextResponse.json({ product: serializeMarketplaceProduct(product) });
}
