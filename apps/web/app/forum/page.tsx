import Link from "next/link";
import type { ElementType } from "react";
import { Boxes, Maximize2, MapPin, PackageOpen, Search, ShoppingBag, Sofa, Sprout, Tag, Waves } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VIETNAM_PROVINCES_2025 } from "@/lib/vietnam-locations";

function money(value: unknown) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

const iconMap: Record<string, ElementType> = {
  mini: Sprout,
  medium: Sofa,
  large: Maximize2,
  tank: Waves,
  sale: Tag,
  accessory: Boxes,
  tag: PackageOpen,
};

type ForumSearchParams = {
  q?: string;
  min?: string;
  max?: string;
  category?: string;
  province?: string;
  sort?: string;
};

export default async function ForumPage({ searchParams }: { searchParams?: Promise<ForumSearchParams> }) {
  const params = (await searchParams) || {};
  const q = (params.q || "").trim();
  const category = (params.category || "").trim();
  const province = (params.province || "").trim();
  const min = Number(params.min || 0);
  const max = Number(params.max || 0);
  const sort = params.sort || "newest";

  const where: any = {
    status: "ACTIVE",
    shop: { status: "ACTIVE" },
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { condition: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categories = { some: { category: { slug: category, isActive: true } } };
  }

  if (province) {
    where.province = province;
  }

  if (min > 0 || max > 0) {
    where.price = {
      ...(min > 0 ? { gte: min } : {}),
      ...(max > 0 ? { lte: max } : {}),
    };
  }

  const [products, shopsCount, categories] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where,
      include: {
        shop: { select: { id: true, name: true, slug: true, province: true, ratingPercent: true } },
        categories: { include: { category: true } },
      },
      orderBy:
        sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
            ? { price: "desc" }
            : { createdAt: "desc" },
      take: 60,
    }),
    prisma.shop.count({ where: { status: "ACTIVE" } }),
    prisma.marketplaceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="min-h-[100dvh] bg-[#f7faf4]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#203018] sm:text-4xl">Diễn đàn shop terrarium</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526248]">
              Tìm sản phẩm từ shop cá nhân theo khu vực, giá và danh mục. Xem không cần đăng nhập.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe8d7] bg-white px-4 py-3 text-sm text-[#526248]">
            <span className="font-semibold text-[#203018]">{products.length}</span> sản phẩm ·{" "}
            <span className="font-semibold text-[#203018]">{shopsCount}</span> shop
          </div>
        </div>

        <form className="mt-6 rounded-[22px] border border-[#dfe8d7] bg-white p-4 shadow-[0_16px_40px_rgba(47,74,35,0.08)]" action="/forum">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.75fr_auto]">
            <label className="relative min-h-12">
              <span className="sr-only">Tìm sản phẩm</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78906b]" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm sản phẩm..."
                className="h-12 w-full rounded-2xl border border-[#d6e2ce] pl-10 pr-3 text-sm outline-none focus:border-[#7fa95e]"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Chọn khu vực</span>
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d59b00]" />
              <select name="province" defaultValue={province} className="h-12 w-full rounded-2xl border border-[#d6e2ce] bg-white pl-10 pr-3 text-sm font-semibold text-[#203018] outline-none focus:border-[#7fa95e]">
                <option value="">Chọn khu vực</option>
                {VIETNAM_PROVINCES_2025.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="h-12 rounded-control bg-primary px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover">
              Tìm kiếm
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_0.8fr]">
            <input name="min" defaultValue={params.min || ""} inputMode="numeric" placeholder="Giá từ" className="h-11 rounded-xl border border-[#d6e2ce] px-3 text-sm outline-none focus:border-[#7fa95e]" />
            <input name="max" defaultValue={params.max || ""} inputMode="numeric" placeholder="Giá đến" className="h-11 rounded-xl border border-[#d6e2ce] px-3 text-sm outline-none focus:border-[#7fa95e]" />
            <select name="sort" defaultValue={sort} className="h-11 rounded-xl border border-[#d6e2ce] px-3 text-sm outline-none focus:border-[#7fa95e]">
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto rounded-2xl bg-[#f8faf6] p-3">
            <Link href="/forum" className={`flex min-w-[86px] flex-col items-center gap-2 rounded-2xl px-3 py-2 text-center text-xs font-semibold ${!category ? "bg-white text-primary shadow-sm" : "text-[#526248]"}`}>
              <ShoppingBag className="h-7 w-7" />
              Tất cả
            </Link>
            {categories.map((item) => {
              const Icon = iconMap[item.icon] || PackageOpen;
              const href = `/forum?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(params.min ? { min: params.min } : {}),
                ...(params.max ? { max: params.max } : {}),
                ...(province ? { province } : {}),
                category: item.slug,
                ...(sort ? { sort } : {}),
              }).toString()}`;
              const active = category === item.slug;

              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`flex min-w-[86px] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-2 text-center text-xs font-semibold ${
                    active ? "bg-white text-primary shadow-sm" : "text-[#526248] hover:bg-white"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </form>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/marketplace/products/${product.slug}`} className="group overflow-hidden rounded-2xl border border-[#dfe8d7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="aspect-square bg-[#edf2e9]">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#78906b]">Chưa có ảnh</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">Shop cá nhân</span>
                  <span className="text-xs font-semibold text-[#78906b]">{product.shop.ratingPercent}%</span>
                </div>
                {product.categories.length > 0 && (
                  <p className="mt-2 truncate text-xs font-semibold text-[#78906b]">
                    {product.categories.map((item) => item.category.name).join(" · ")}
                  </p>
                )}
                <h2 className="mt-3 line-clamp-2 min-h-10 font-semibold leading-5 text-[#203018]">{product.title}</h2>
                <p className="mt-2 text-base font-bold text-primary">{money(product.price)}</p>
                <p className="mt-1 truncate text-xs text-[#6f7f66]">{product.shop.name} · {product.shop.province || "Online"}</p>
              </div>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <div className="mt-6 rounded-2xl border border-[#dfe8d7] bg-white p-8 text-center text-sm text-[#526248]">
            Chưa có sản phẩm phù hợp bộ lọc. Thử đổi từ khóa hoặc khoảng giá.
          </div>
        )}
      </section>
    </main>
  );
}
