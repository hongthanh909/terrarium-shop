import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMarketplaceProduct } from "@/lib/marketplace";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.marketplaceProduct.findFirst({
    where: { slug, status: "ACTIVE", shop: { status: "ACTIVE" } },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          phone: true,
          email: true,
          zaloUrl: true,
          facebookUrl: true,
          province: true,
          district: true,
          ratingPercent: true,
          ratingCount: true,
          status: true,
        },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product: serializeMarketplaceProduct(product) });
}
