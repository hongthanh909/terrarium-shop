import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; page?: string };
}) {
  const categoryId = searchParams.category || null;
  const search = searchParams.search || null;
  const page = parseInt(searchParams.page || "1");
  const limit = 12;

  const where: any = { status: "ACTIVE" };
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  let products: any[] = [];
  let categories: any[] = [];
  let total = 0;

  try {
    [products, categories, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          _count: { select: { reviews: true } },
        },
        orderBy: [
          { salePrice: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);
  } catch (error) {
    console.error("ProductsPage: failed to load products", error);
    // Return empty state instead of crashing
  }

  return (
    <ProductsClient
      initialProducts={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
      totalProducts={total}
      initialCategory={categoryId}
      initialSearch={search || ""}
    />
  );
}
