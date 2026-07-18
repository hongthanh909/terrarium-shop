import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductReviewActions from "./ProductReviewActions";

function money(value: any) {
  return `${Number(value).toLocaleString("vi-VN")} d`;
}

export default async function AdminMarketplaceProductsPage() {
  const products = await prisma.marketplaceProduct.findMany({
    where: { status: { in: ["PENDING_REVIEW", "AI_FLAGGED"] } },
    include: { shop: { select: { id: true, name: true, slug: true, ratingPercent: true, status: true } } },
    orderBy: [{ moderationRisk: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyet san pham marketplace</h1>
        <p className="mt-1 text-sm text-gray-500">Admin duyet cuoi cung. AI/rule chi flag risk, khong auto publish.</p>
      </div>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {products.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Khong co san pham cho duyet.</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{product.title}</p>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{product.status}</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">risk {product.moderationRisk}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {money(product.price)} · shop{" "}
                  <Link href={`/tiem-nho-nth24/shops/${product.shop.id}`} className="font-semibold text-[#2f4a23]">
                    {product.shop.name}
                  </Link>
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{product.description}</p>
                {product.moderationReasons.length > 0 && (
                  <p className="mt-1 text-xs text-amber-700">{product.moderationReasons.join("; ")}</p>
                )}
              </div>
              <ProductReviewActions id={product.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
