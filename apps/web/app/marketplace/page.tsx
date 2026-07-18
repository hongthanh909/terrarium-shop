import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(value: any) {
  return `${Number(value).toLocaleString("vi-VN")} d`;
}

export default async function MarketplacePage() {
  const products = await prisma.marketplaceProduct.findMany({
    where: { status: "ACTIVE", shop: { status: "ACTIVE" } },
    include: { shop: { select: { name: true, slug: true, province: true, ratingPercent: true } } },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <main className="min-h-[100dvh] bg-[#f7faf4]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#6f8d5e]">Marketplace</p>
            <h1 className="mt-2 text-4xl font-bold text-[#203018]">Shop ca nhan terrarium</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526248]">
              San pham do cac shop ca nhan dang ban. Nguoi mua va shop tu thoa thuan thanh toan, giao hang va bao hanh.
            </p>
          </div>
          <Link href="/marketplace/shops" className="rounded-full border border-[#c6d8ba] px-5 py-2.5 text-sm font-semibold text-[#3d5f2d]">
            Xem shop
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/marketplace/products/${product.slug}`} className="overflow-hidden rounded-2xl border border-[#dfe8d7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="aspect-[4/3] bg-[#edf2e9]">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <span className="rounded-full bg-[#eef5e8] px-2.5 py-1 text-xs font-semibold text-[#3d5f2d]">Shop ca nhan</span>
                <h2 className="mt-3 line-clamp-2 font-semibold text-[#203018]">{product.title}</h2>
                <p className="mt-2 text-sm font-bold text-[#2f4a23]">{money(product.price)}</p>
                <p className="mt-1 text-xs text-[#6f7f66]">{product.shop.name} · {product.shop.province || "Online"}</p>
              </div>
            </Link>
          ))}
        </div>
        {products.length === 0 && <div className="mt-8 rounded-2xl border border-[#dfe8d7] bg-white p-8 text-sm text-[#526248]">Chua co san pham marketplace da duyet.</div>}
      </section>
    </main>
  );
}
