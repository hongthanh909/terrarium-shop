import { redirect } from "next/navigation";
import { getCurrentSellerShop } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";

function money(value: unknown) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

export default async function SellerInquiriesPage() {
  const seller = await getCurrentSellerShop();
  if (!seller) redirect("/seller/register");

  const inquiries = await prisma.marketplaceInquiry.findMany({
    where: { shopId: seller.shop.id },
    include: { product: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#203018]">Hỏi mua</h1>
        <p className="mt-1 text-sm text-[#526248]">Người mua tự liên hệ, shop tự trao đổi và chốt giao dịch.</p>
      </div>
      <div className="divide-y divide-[#edf2e9] overflow-hidden rounded-2xl border border-[#dfe8d7] bg-white">
        {inquiries.length === 0 ? (
          <div className="p-8 text-sm text-[#526248]">Chưa có liên hệ nào.</div>
        ) : (
          inquiries.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#203018]">{item.name}</p>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{item.status}</span>
              </div>
              <p className="mt-1 text-sm text-[#526248]">{item.product.title}</p>
              {item.offerPrice && <p className="mt-2 text-sm font-bold text-primary">Trả giá: {money(item.offerPrice)}</p>}
              <p className="mt-2 text-sm text-[#203018]">{item.message}</p>
              <p className="mt-2 text-xs text-[#6f7f66]">{item.phone || "Chưa có số điện thoại"} · {item.email || "Chưa có email"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
