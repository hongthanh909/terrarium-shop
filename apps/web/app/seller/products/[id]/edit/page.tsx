import { notFound, redirect } from "next/navigation";
import { getCurrentSellerShop } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import ProductForm from "../../ProductForm";

export default async function EditSellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const seller = await getCurrentSellerShop();
  if (!seller) redirect("/seller/register");

  if (seller.shop.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#dfe8d7] bg-white p-6">
        <h1 className="text-2xl font-bold text-[#203018]">Shop chưa thể sửa sản phẩm</h1>
        <p className="mt-2 text-sm leading-6 text-[#526248]">
          Trạng thái hiện tại: <strong>{seller.shop.status}</strong>. Shop chỉ được sửa sản phẩm khi trạng thái là ACTIVE.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.marketplaceProduct.findFirst({
      where: { id, shopId: seller.shop.id },
      include: { categories: true },
    }),
    prisma.marketplaceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#203018]">Sửa sản phẩm</h1>
        <p className="mt-1 text-sm text-[#526248]">Sau khi sửa, sản phẩm sẽ được gửi lại cho admin duyệt nếu cần.</p>
      </div>
      <ProductForm categories={categories} initialProduct={product} />
    </div>
  );
}
