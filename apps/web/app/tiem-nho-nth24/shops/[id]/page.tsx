import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function money(value: unknown) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: { select: { email: true, name: true, role: true } },
      products: { orderBy: { createdAt: "desc" } },
      policyViolations: { orderBy: { createdAt: "desc" } },
      _count: { select: { inquiries: true, products: true, policyViolations: true } },
    },
  });
  if (!shop) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-sm font-semibold text-[#6f8d5e]">Chi tiết shop</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{shop.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{shop.owner.email} · {shop.status} · rating {shop.ratingPercent}%</p>
        <p className="mt-3 text-sm text-gray-600">{shop.description || "Chưa có mô tả."}</p>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Sản phẩm và giá</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {shop.products.map((product) => (
            <div key={product.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold text-gray-900">{product.title}</p>
                <p className="text-sm text-gray-500">{product.status} · risk {product.moderationRisk}</p>
                {product.moderationReasons.length > 0 && <p className="text-xs text-amber-700">{product.moderationReasons.join("; ")}</p>}
              </div>
              <p className="font-semibold text-[#2f4a23]">{money(product.price)}</p>
            </div>
          ))}
          {shop.products.length === 0 && <p className="py-4 text-sm text-gray-500">Shop chưa có sản phẩm.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Lịch sử vi phạm</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {shop.policyViolations.map((item) => (
            <div key={item.id} className="py-3">
              <p className="font-semibold text-gray-900">{item.severity} · {item.action}</p>
              <p className="text-sm text-gray-600">{item.reason}</p>
            </div>
          ))}
          {shop.policyViolations.length === 0 && <p className="py-4 text-sm text-gray-500">Chưa ghi nhận vi phạm.</p>}
        </div>
      </section>
    </div>
  );
}
