import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { serializeMarketplaceProduct } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const risk = searchParams.get("risk") || undefined;

  const products = await prisma.marketplaceProduct.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(risk ? { moderationRisk: risk as any } : {}),
    },
    include: {
      shop: { select: { id: true, name: true, slug: true, ratingPercent: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: products.map(serializeMarketplaceProduct) });
}
