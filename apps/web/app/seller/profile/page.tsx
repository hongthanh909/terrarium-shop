import { redirect } from "next/navigation";
import { getCurrentSellerShop } from "@/lib/marketplace";

export default async function SellerProfilePage() {
  const seller = await getCurrentSellerShop();
  if (!seller) redirect("/seller/register");

  return (
    <div className="max-w-3xl rounded-2xl border border-[#dfe8d7] bg-white p-6">
      <h1 className="text-2xl font-bold text-[#203018]">Hồ sơ shop</h1>
      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className="font-semibold text-[#526248]">Tên shop</dt>
          <dd className="mt-1 text-[#203018]">{seller.shop.name}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#526248]">Liên hệ</dt>
          <dd className="mt-1 text-[#203018]">{seller.shop.phone || "Chưa cập nhật"} · {seller.shop.email || "Chưa cập nhật"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#526248]">Mô tả</dt>
          <dd className="mt-1 text-[#203018]">{seller.shop.description || "Chưa có mô tả."}</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm text-[#526248]">API cập nhật hồ sơ đã có tại `/api/seller/shop`; form chỉnh sửa chi tiết sẽ bổ sung ở bước tiếp theo.</p>
    </div>
  );
}
