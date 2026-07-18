import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMarketplaceProduct } from "@/lib/marketplace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const province = searchParams.get("province") || "";
  const category = searchParams.get("category") || "";
  const min = Number(searchParams.get("min") || 0);
  const max = Number(searchParams.get("max") || 0);
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") || 12)));

  const where: any = {
    status: "ACTIVE",
    shop: { status: "ACTIVE" },
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (province) where.province = province;
  if (category) where.categories = { some: { category: { slug: category, isActive: true } } };
  if (min > 0 || max > 0) {
    where.price = {
      ...(min > 0 ? { gte: min } : {}),
      ...(max > 0 ? { lte: max } : {}),
    };
  }

  const [products, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where,
      include: {
        shop: { select: { id: true, name: true, slug: true, province: true, status: true, ratingPercent: true } },
        categories: { include: { category: true } },
      },
      orderBy:
        sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
            ? { price: "desc" }
            : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceProduct.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map(serializeMarketplaceProduct),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
