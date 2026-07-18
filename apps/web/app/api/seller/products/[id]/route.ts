import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marketplaceProductSchema, requireSellerShop, serializeMarketplaceProduct } from "@/lib/marketplace";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;
  const { id } = await params;

  const product = await prisma.marketplaceProduct.findFirst({
    where: { id, shopId: seller.shop.id },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product: serializeMarketplaceProduct(product) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;
  if (seller.shop.status !== "ACTIVE") {
    return NextResponse.json({ error: "Shop can dang ACTIVE moi duoc sua san pham." }, { status: 403 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.marketplaceProduct.findFirst({ where: { id, shopId: seller.shop.id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const body = await request.json();
    const data = marketplaceProductSchema.partial().parse(body);
    const { categoryIds, ...productData } = data;
    const requiresReview = existing.status === "ACTIVE";

    const product = await prisma.$transaction(async (tx) => {
      if (categoryIds) {
        await tx.marketplaceProductCategory.deleteMany({ where: { productId: id } });
      }
      return tx.marketplaceProduct.update({
        where: { id },
        data: {
          ...productData,
          ...(categoryIds
            ? { categories: { create: categoryIds.map((categoryId) => ({ categoryId })) } }
            : {}),
          ...(requiresReview ? { status: "PENDING_REVIEW", approvedAt: null, approvedById: null } : {}),
        },
      });
    });

    return NextResponse.json({ product: serializeMarketplaceProduct(product) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;
  if (seller.shop.status !== "ACTIVE") {
    return NextResponse.json({ error: "Shop can dang ACTIVE moi duoc xoa san pham." }, { status: 403 });
  }
  const { id } = await params;

  const product = await prisma.marketplaceProduct.findFirst({ where: { id, shopId: seller.shop.id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.marketplaceProduct.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ ok: true });
}
