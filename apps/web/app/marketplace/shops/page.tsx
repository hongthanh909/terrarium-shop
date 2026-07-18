import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MarketplaceShopsPage() {
  const shops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-[100dvh] bg-[#f7faf4]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[#203018]">Danh sach shop</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link key={shop.id} href={`/marketplace/shops/${shop.slug}`} className="rounded-2xl border border-[#dfe8d7] bg-white p-5 shadow-sm hover:shadow-md">
              <p className="font-semibold text-[#203018]">{shop.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-[#526248]">{shop.description || "Shop terrarium ca nhan"}</p>
              <p className="mt-4 text-xs font-semibold text-[#3d5f2d]">{shop._count.products} san pham · rating {shop.ratingPercent}%</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
