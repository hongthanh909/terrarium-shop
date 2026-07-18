import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSellerShop } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import ProductRowActions from "./ProductRowActions";

function money(value: unknown) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

export default async function SellerProductsPage() {
  const seller = await getCurrentSellerShop();
  if (!seller) redirect("/seller/register");

  const products = await prisma.marketplaceProduct.findMany({
    where: { shopId: seller.shop.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#203018]">Sản phẩm shop</h1>
          <p className="mt-1 text-sm text-[#526248]">Sản phẩm cần admin duyệt trước khi hiển thị công khai.</p>
        </div>
        <Link href="/seller/products/new" className="rounded-full bg-[#2f4a23] px-5 py-2.5 text-sm font-semibold text-white">
          Đăng sản phẩm
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#dfe8d7] bg-white">
        {products.length === 0 ? (
          <div className="p-8 text-sm text-[#526248]">Chưa có sản phẩm nào.</div>
        ) : (
          <div className="divide-y divide-[#edf2e9]">
            {products.map((product) => (
              <div key={product.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-[#203018]">{product.title}</p>
                  <p className="mt-1 text-sm text-[#526248]">{money(product.price)} · {product.status} · risk {product.moderationRisk}</p>
                  {product.moderationReasons.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">{product.moderationReasons.join("; ")}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link href={`/marketplace/products/${product.slug}`} className="rounded-full border border-[#c6d8ba] px-3 py-2 text-sm font-semibold text-[#3d5f2d]">
                    Xem công khai
                  </Link>
                  <ProductRowActions id={product.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
