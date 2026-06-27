import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import ProductsLoading from "./loading";

export const dynamic = "force-dynamic";

// Tách data fetch ra component riêng để Suspense streaming hoạt động
async function ProductsData({
  categoryId,
  search,
  page,
}: {
  categoryId: string | null;
  search: string | null;
  page: number;
}) {
  const isBrowsingAll = !categoryId && !search;
  const limit = isBrowsingAll ? 200 : 12;
  const where: any = { status: "ACTIVE", inventory: { gt: 0 } };
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
        include: { category: true, _count: { select: { reviews: true } } },
        orderBy: [
          { category: { name: "asc" } },
          { salePrice: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        skip: isBrowsingAll ? 0 : (page - 1) * limit,
        take: limit,
      }),
      prisma.category.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);
  } catch (error) {
    console.error("ProductsData: DB error", error);
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

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; page?: string };
}) {
  const categoryId = searchParams.category || null;
  const search = searchParams.search || null;
  const page = parseInt(searchParams.page || "1");

  return (
    <Suspense key={`${categoryId}-${search}-${page}`} fallback={<ProductsLoading />}>
      <ProductsData categoryId={categoryId} search={search} page={page} />
    </Suspense>
  );
}
