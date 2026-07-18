import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moderateMarketplaceProduct, requireSellerShop, serializeMarketplaceProduct } from "@/lib/marketplace";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;
  if (seller.shop.status !== "ACTIVE") {
    return NextResponse.json({ error: "Shop can dang ACTIVE moi duoc gui duyet san pham." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.marketplaceProduct.findFirst({ where: { id, shopId: seller.shop.id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (existing.status === "SUSPENDED") {
    return NextResponse.json({ error: "Product is suspended" }, { status: 409 });
  }

  const moderation = moderateMarketplaceProduct({
    title: existing.title,
    description: existing.description,
  });

  const product = await prisma.marketplaceProduct.update({
    where: { id },
    data: {
      moderationRisk: moderation.riskLevel,
      moderationReasons: moderation.reasons,
      status: moderation.riskLevel === "LOW" ? "PENDING_REVIEW" : "AI_FLAGGED",
    },
  });

  return NextResponse.json({ product: serializeMarketplaceProduct(product), moderation });
}
