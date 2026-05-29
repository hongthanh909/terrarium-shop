import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import { unstable_cache } from "next/cache";

// ISR: cache 60 giây per combination
export const revalidate = 60;

// Cache factory theo từng combination category+search+page
function getCachedProducts(categoryId: string | null, search: string | null, page: number) {
  const cacheKey = `products-${categoryId || "all"}-${search || "none"}-${page}`;
  return unstable_cache(
    async () => {
      const limit = 12;
      const where: any = { status: "ACTIVE" };
      if (categoryId) where.categoryId = categoryId;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ];
      }

      const [products, categories, total] = await Promise.all([
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

      return { products, categories, total };
    },
    [cacheKey],
    { revalidate: 60 }
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; page?: string };
}) {
  const categoryId = searchParams.category || null;
  const search = searchParams.search || null;
  const page = parseInt(searchParams.page || "1");

  const { products, categories, total } = await getCachedProducts(categoryId, search, page)();

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
