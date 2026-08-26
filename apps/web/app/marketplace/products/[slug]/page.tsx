import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Heart, MapPin, MessageCircle, MoreVertical, Share2, Star, Store, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductAdminChat } from "@/components/chat/ProductAdminChat";

function money(value: any) {
  return `${Number(value).toLocaleString("vi-VN")} d`;
}

function relativeTime(date: Date) {
  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `Cap nhat ${minutes} phut truoc`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Cap nhat ${hours} gio truoc`;
  const days = Math.floor(hours / 24);
  return `Cap nhat ${days} ngay truoc`;
}

function locationText(
  product: { province: string | null; district: string | null },
  shop: { province: string | null; district: string | null },
) {
  const district = product.district || shop.district;
  const province = product.province || shop.province;
  return [district, province].filter(Boolean).join(", ") || "Online";
}

export default async function MarketplaceProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.marketplaceProduct.findFirst({
    where: { slug, status: "ACTIVE", shop: { status: "ACTIVE" } },
    include: {
      shop: {
        include: {
          _count: { select: { products: true, ratings: true } },
        },
      },
    },
  });
  if (!product) notFound();

  const activeProductCount = await prisma.marketplaceProduct.count({
    where: { shopId: product.shopId, status: "ACTIVE" },
  });
  const location = locationText(product, product.shop);
  const rating = Math.round((product.shop.ratingPercent / 100) * 5 * 10) / 10;
  const thumbnails = product.images.slice(0, 4);

  return (
    <main className="min-h-[100dvh] bg-[#f4f4f3]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.55fr] lg:px-8">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-white">
            <div className="aspect-square bg-[#e9ece5]">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-[#77806f]">Chua co anh</div>
              )}
            </div>
            <button aria-label="Chia se" className="absolute right-16 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#111611] shadow-sm">
              <Share2 className="h-5 w-5" />
            </button>
            <button aria-label="Them tuy chon" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#111611] shadow-sm">
              <MoreVertical className="h-5 w-5" />
            </button>
            {product.images.length > 0 && (
              <span className="absolute bottom-4 right-4 rounded bg-black/60 px-2 py-1 text-sm font-bold text-white">
                1/{product.images.length}
              </span>
            )}
          </div>

          {thumbnails.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {thumbnails.map((image, index) => (
                <div key={`${image}-${index}`} className="aspect-square overflow-hidden rounded-lg border-2 border-transparent bg-white first:border-[#111611]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-snug text-[#111611] sm:text-3xl">{product.title}</h1>
              {product.condition && <p className="mt-3 text-sm text-[#4d5549]">{product.condition}</p>}
            </div>
            <button className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-border bg-white px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted">
              <Heart className="h-5 w-5" />
              Luu
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="mr-2 text-3xl font-extrabold text-[#e3193a]">{money(product.price)}</p>
            <span className="rounded bg-[#dff5e5] px-2 py-1 text-xs font-bold text-[#087a35]">Gia tot</span>
            {product.priceNote && <span className="rounded bg-[#f1f2ef] px-2 py-1 text-xs font-semibold text-[#4d5549]">{product.priceNote}</span>}
          </div>

          <div className="mt-5 grid gap-4 text-sm text-[#111611]">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#3c4438]" />
              <div>
                <p>{location}</p>
                {product.shop.address && <p className="mt-1 text-[#80867b]">{product.shop.address}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-[#3c4438]" />
              <span>{relativeTime(product.updatedAt)}</span>
            </div>
          </div>

          <div className="mt-8">
            <ProductAdminChat
              productType="MARKETPLACE"
              productId={product.id}
              productName={product.title}
              productImage={product.images[0]}
              buttonLabel="Chat trực tiếp với admin"
            />
          </div>

          <div className="mt-6 grid gap-4 border-t border-[#e7ece2] pt-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#eef1eb]">
                {product.shop.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.shop.logoUrl} alt={product.shop.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-6 w-6 text-[#6d7666]" />
                )}
              </div>
              <div>
                <Link href={`/marketplace/shops/${product.shop.slug}`} className="font-bold text-[#111611]">
                  {product.shop.name}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#5f675b]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#0a9b4b]" />
                  Dang hoat dong
                  <span>Phan hoi can do</span>
                </p>
              </div>
            </div>
            <div className="text-left sm:text-center">
              <p className="text-lg font-extrabold text-[#111611]">{activeProductCount}</p>
              <p className="text-sm text-[#4d5549]">San pham</p>
            </div>
            <div className="text-left sm:text-center">
              <p className="inline-flex items-center gap-1 text-lg font-extrabold text-[#111611]">
                {rating}
                <Star className="h-4 w-4 fill-[#f5a400] text-[#f5a400]" />
              </p>
              <p className="text-sm text-[#4d5549]">{product.shop.ratingCount || product.shop._count.ratings} danh gia</p>
            </div>
            <Link href={`/marketplace/shops/${product.shop.slug}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border bg-secondary px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">
              <Store className="h-4 w-4" />
              Xem trang
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Moi tin nhan va tra gia duoc luu lai de admin kiem soat. Giao dich marketplace hien do nguoi mua va shop tu thoa thuan thanh toan, giao hang va bao hanh.
          </div>
        </div>

        <div className="lg:col-start-2">
          <section className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-[#111611]">Mo ta san pham</h2>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#4d5549]">{product.description}</p>
          </section>
        </div>
      </section>
    </main>
  );
}
