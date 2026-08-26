import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSellerShop } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";

export default async function SellerDashboardPage() {
  const seller = await getCurrentSellerShop();
  if (!seller) redirect("/seller/register");

  const [products, inquiries] = await Promise.all([
    prisma.marketplaceProduct.count({ where: { shopId: seller.shop.id } }),
    prisma.marketplaceInquiry.count({ where: { shopId: seller.shop.id, status: "NEW" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#dfe8d7] bg-white p-6">
        <p className="text-sm font-semibold text-[#6f8d5e]">Shop của tôi</p>
        <h1 className="mt-2 text-3xl font-bold text-[#203018]">{seller.shop.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#526248]">
          Shop đang ở trạng thái <strong>{seller.shop.status}</strong>. Sản phẩm chỉ hiển thị công khai sau khi admin duyệt.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#dfe8d7] bg-white p-5">
          <p className="text-sm text-[#526248]">Tổng sản phẩm</p>
          <p className="mt-2 text-3xl font-bold text-[#203018]">{products}</p>
        </div>
        <div className="rounded-2xl border border-[#dfe8d7] bg-white p-5">
          <p className="text-sm text-[#526248]">Hỏi mua mới</p>
          <p className="mt-2 text-3xl font-bold text-[#203018]">{inquiries}</p>
        </div>
        <div className="rounded-2xl border border-[#dfe8d7] bg-white p-5">
          <p className="text-sm text-[#526248]">Điểm shop</p>
          <p className="mt-2 text-3xl font-bold text-[#203018]">{seller.shop.ratingPercent}%</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/seller/products/new" className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
          Đăng sản phẩm
        </Link>
        <Link href={`/marketplace/shops/${seller.shop.slug}`} className="inline-flex min-h-11 items-center rounded-control border border-primary-border bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft">
          Xem trang shop
        </Link>
      </div>
    </div>
  );
}
