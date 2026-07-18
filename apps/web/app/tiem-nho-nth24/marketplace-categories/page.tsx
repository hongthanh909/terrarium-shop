import { prisma } from "@/lib/prisma";
import MarketplaceCategoryManager from "./MarketplaceCategoryManager";

export default async function AdminMarketplaceCategoriesPage() {
  const categories = await prisma.marketplaceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Danh mục diễn đàn</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý các filter như Mini, Vừa, To, Bể mới, Thanh lý và Phụ kiện. Shop chỉ được chọn tối đa 2 danh mục cho mỗi sản phẩm.
        </p>
      </div>
      <MarketplaceCategoryManager initialCategories={categories} />
    </div>
  );
}
