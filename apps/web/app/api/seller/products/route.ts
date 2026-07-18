import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marketplaceProductSchema, requireSellerShop, serializeMarketplaceProduct } from "@/lib/marketplace";

export async function GET(request: Request) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const products = await prisma.marketplaceProduct.findMany({
    where: {
      shopId: seller.shop.id,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: products.map(serializeMarketplaceProduct) });
}

export async function POST(request: Request) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;
  if (seller.shop.status !== "ACTIVE") {
    return NextResponse.json({ error: "Shop can duoc admin duyet va dang ACTIVE moi duoc dang san pham." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = marketplaceProductSchema.parse(body);
    const { categoryIds, ...productData } = data;

    const product = await prisma.marketplaceProduct.create({
      data: {
        ...productData,
        shopId: seller.shop.id,
        status: "DRAFT",
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });

    return NextResponse.json({ product: serializeMarketplaceProduct(product) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid request" }, { status: 400 });
  }
}
