import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSellerShop } from "@/lib/marketplace";

export async function GET(request: Request) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const inquiries = await prisma.marketplaceInquiry.findMany({
    where: {
      shopId: seller.shop.id,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      product: { select: { id: true, title: true, slug: true, images: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    inquiries: inquiries.map((item) => ({
      ...item,
      offerPrice: item.offerPrice != null ? Number(item.offerPrice) : item.offerPrice,
      product: item.product ? { ...item.product, price: Number(item.product.price) } : item.product,
    })),
  });
}
