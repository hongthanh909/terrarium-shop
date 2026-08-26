import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function money(value: any) {
  return `${Number(value).toLocaleString("vi-VN")} d`;
}

export default async function MarketplaceShopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { products: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } } },
  });
  if (!shop) notFound();

  return (
    <main className="min-h-[100dvh] bg-[#f7faf4]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#dfe8d7] bg-white p-6">
          <p className="text-sm font-semibold text-[#6f8d5e]">Shop ca nhan</p>
          <h1 className="mt-2 text-4xl font-bold text-[#203018]">{shop.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#526248]">{shop.description || "Shop chua cap nhat mo ta."}</p>
          <p className="mt-4 text-xs font-semibold text-primary">Rating {shop.ratingPercent}% · {shop.province || "Online"}</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shop.products.map((product) => (
            <Link key={product.id} href={`/marketplace/products/${product.slug}`} className="overflow-hidden rounded-2xl border border-[#dfe8d7] bg-white shadow-sm">
              <div className="aspect-[4/3] bg-[#edf2e9]">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 font-semibold text-[#203018]">{product.title}</p>
                <p className="mt-2 text-sm font-bold text-primary">{money(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
