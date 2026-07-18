import { redirect } from "next/navigation";
import { getCurrentSellerShop } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";

export default async function NewSellerProductPage() {
  const seller = await getCurrentSellerShop();
  if (!seller) redirect("/seller/register");

  if (seller.shop.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#dfe8d7] bg-white p-6">
        <h1 className="text-2xl font-bold text-[#203018]">Shop chưa thể đăng sản phẩm</h1>
        <p className="mt-2 text-sm leading-6 text-[#526248]">
          Trạng thái hiện tại: <strong>{seller.shop.status}</strong>. Shop chỉ được đăng sản phẩm khi admin đã duyệt và trạng thái là ACTIVE.
        </p>
      </div>
    );
  }

  const categories = await prisma.marketplaceCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#203018]">Đăng sản phẩm mới</h1>
        <p className="mt-1 text-sm text-[#526248]">Sau khi gửi, sản phẩm sẽ vào hàng đợi admin review.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
