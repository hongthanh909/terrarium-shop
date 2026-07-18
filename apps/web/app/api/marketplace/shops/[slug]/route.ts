import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMarketplaceProduct } from "@/lib/marketplace";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 48,
      },
    },
  });

  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  return NextResponse.json({
    shop: {
      ...shop,
      platformFeeRate: Number(shop.platformFeeRate),
      products: shop.products.map(serializeMarketplaceProduct),
    },
  });
}
