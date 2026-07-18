import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { serializeMarketplaceProduct } from "@/lib/marketplace";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const product = await prisma.marketplaceProduct.update({
    where: { id },
    data: {
      status: "ACTIVE",
      approvedById: admin.id,
      approvedAt: new Date(),
      rejectedAt: null,
    },
    include: { shop: true },
  });

  await logAdminAction(admin.id, "APPROVE", "MarketplaceProduct", id, {});
  return NextResponse.json({ product: serializeMarketplaceProduct(product) });
}
