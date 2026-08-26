import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Suspense } from "react";
import {
  Sprout,
  ArrowRight,
  BookOpen,
  FileText,
  Calendar,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ReviewMarquee } from "@/components/ui/review-marquee";
import { prisma } from "@/lib/prisma";
import { FeaturedProductCard } from "@/components/ui/featured-product-card";
import { BrandGallery } from "@/components/ui/brand-gallery";
import { getProductRatingSummary } from "@/lib/product-rating";

// ISR: Cache page for 60 seconds, revalidate in background
// This makes the page INSTANT for most requests instead of waiting for DB every time
export const revalidate = 60;



export const metadata: Metadata = {
  title: "Tiệm Rêu Décor | Một Chút Rêu, Một Chút Xanh",
  description:
    "Khám phá bộ sưu tập terrarium thủ công, những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tiệm Rêu Décor | Một Chút Rêu, Một Chút Xanh",
    description:
      "Terrarium thủ công, moss art và góc xanh nhỏ cho bàn làm việc, quà tặng và không gian sống.",
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "Tiệm Rêu Décor",
    images: [
      {
        url: "/home-hero-full-banner.png?v=20260714",
        width: 1680,
        height: 900,
        alt: "Tiệm Rêu Décor - Một chút rêu, một chút xanh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiệm Rêu Décor | Một Chút Rêu, Một Chút Xanh",
    description:
      "Terrarium thủ công, moss art và góc xanh nhỏ cho bàn làm việc, quà tặng và không gian sống.",
    images: ["/home-hero-full-banner.png?v=20260714"],
  },
};

// ─── Async streaming sub-components ───────────────────────────────────────────



// ─── Brand Gallery Section ─────────────────────────────────────────────────
async function BrandGallerySection() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "brand_gallery" },
    });
    if (setting && Array.isArray(setting.value)) {
      const active = (setting.value as any[])
        .filter((img: any) => img.isActive !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      if (active.length > 0) {
        return (
          <section className="bg-white px-4 py-10 sm:px-6 sm:py-14">
            <div className="max-w-7xl mx-auto">

              <BrandGallery images={active as any} />
            </div>
          </section>
        );
      }
    }
  } catch (e) {
    console.error("BrandGallerySection error", e);
  }
  return null;
}

function BrandGallerySkeleton() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4">
          {["h-56", "h-40", "h-64", "h-48"].map((h, i) => (
            <div key={i} className={`flex-1 ${h} rounded-lg bg-muted animate-pulse`} />
          ))}
        </div>
      </div>
    </section>
  );
}
async function FeaturedProductsSection() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { featured: true, status: "ACTIVE", inventory: { gt: 0 } },
      include: {
        category: true,
        reviews: { where: { approved: true }, select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("FeaturedProductsSection: DB error", e);
  }

  return (
    <section className="border-t border-border bg-white px-4 py-10 sm:px-6 sm:py-16">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-primary">Được lựa chọn cho bạn</p>
              <h2 className="text-xl font-bold text-foreground sm:text-3xl">Sản phẩm nổi bật</h2>
            </div>
            <Button variant="soft" size="sm" asChild className="shrink-0">
              <Link href="/products" className="group">
                Xem tất cả
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
        {products.length === 0 ? (
          <ScrollReveal direction="up" initiallyVisible>
            <div className="rounded-card bg-muted py-16 text-center sm:py-24">
              <Sprout className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có sản phẩm nổi bật</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau nhé.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {products.map((product: any, index: number) => {
              const ratingSummary = getProductRatingSummary(product);
              return (
                <ScrollReveal key={product.id} direction="up" delay={index * 0.1} className="h-full">
                  <FeaturedProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    basePrice={Number(product.basePrice.toString())}
                    salePrice={product.salePrice != null ? Number(product.salePrice.toString()) : null}
                    saleEndDate={product.saleEndDate ? product.saleEndDate.toISOString() : null}
                    inventory={product.inventory}
                    images={product.images}
                    category={product.category ? { name: product.category.name } : undefined}
                    rating={ratingSummary.rating}
                    reviewCount={ratingSummary.reviewCount}
                    isNew={product.isNew || false}
                    isBestseller={product.isBestseller || false}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

async function LatestBlogSection() {
  let latestPosts: any[] = [];
  try {
    latestPosts = await prisma.blogPost.findMany({
      where: { published: true },
      take: 3,
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    });
  } catch (e) {
    console.error("LatestBlog fetch error", e);
  }

  const fallbackImages = [
    "https://images.unsplash.com/photo-1595086862145-2be916325514?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1416879598056-cb6f64d0a3d4?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=800&auto=format&fit=crop&q=80",
  ];

  return (
    <section className="border-t border-border bg-muted/45 px-4 py-10 sm:px-6 sm:py-16">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
            <div>

              <p className="mb-1.5 text-xs font-semibold text-primary">Chăm sóc khoảng xanh</p>
              <h2 className="text-xl font-bold text-foreground sm:text-3xl">Góc chia sẻ</h2>
            </div>
            <Button variant="soft" size="sm" asChild className="shrink-0">
              <Link href="/blog" className="group">
                Xem tất cả
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
        {latestPosts.length === 0 ? (
          <ScrollReveal direction="up">
            <div className="rounded-lg bg-white py-24 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có bài viết nào</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau!</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {latestPosts.map((post: any, index: number) => (
              <ScrollReveal key={post.id} direction="up" delay={index * 0.1} className="h-full">
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <Card className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-white transition-[border-color,box-shadow] duration-200 hover:border-primary-border hover:shadow-floating">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <ImageWrapper src={post.thumbnail || post.images?.[0] || fallbackImages[index % 3]} alt={post.title} fill noRound className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                      </div>
                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        {post.category && (
                          <Badge variant="secondary" className="mb-3 w-fit bg-muted text-xs text-foreground">{post.category.name}</Badge>
                        )}
                        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-6 text-foreground transition-colors group-hover:text-primary sm:text-lg">{post.title}</h3>
                        <p className="text-sm text-[hsl(220,14%,45%)] line-clamp-3 mb-4 flex-1">{(post.content || post.intro || post.body || '').replace(/<[^>]*>/g, '').slice(0, 150)}...</p>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : "Mới đây"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Skeleton Fallbacks ────────────────────────────────────────────────────────



function ProductsSkeleton() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 h-8 w-52 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="aspect-[4/3] animate-pulse bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-14 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogSkeleton() {
  return (
    <section className="bg-[#f7f8f6] px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="aspect-video animate-pulse bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page (SYNC — no DB fetches here) ────────────────────────────────────

export default async function Home() {
  return (
    <div className="min-h-[100dvh] bg-white">

      {/* ── Hero Section: full-width image banner, preserving original artwork ── */}
      <section
        id="about"
        className="relative overflow-hidden bg-white"
      >
        <div className="relative min-h-[520px] w-full sm:min-h-[calc(100dvh-96px)] sm:max-h-[780px]">
          <Image
            src="/home-hero-full-banner.png"
            alt="Banner terrarium Tiệm Rêu Décor với sản phẩm rêu decor và lời giới thiệu"
            fill
            priority
            sizes="100vw"
            className="select-none object-cover object-[61%_center] sm:object-center"
          />
          <div className="absolute left-4 right-4 top-[10%] z-10 sm:left-[5.8%] sm:right-auto sm:top-[19%] sm:w-[39%] lg:w-[36%]">
            <h1 className="max-w-[11ch] text-[2rem] font-bold leading-[1.1] text-foreground drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] sm:text-5xl lg:text-6xl">
              Một chút rêu - một chút xanh
            </h1>
            <p className="mt-3 max-w-[24rem] text-sm font-medium leading-relaxed text-foreground/80 sm:mt-4 sm:max-w-xl sm:text-lg lg:text-xl">
              Một góc xanh nhỏ, một khoảng bình yên riêng
            </p>
            <div className="mt-5 flex max-w-full items-center gap-2.5 sm:mt-8 sm:gap-3">
              <Link
                href="/products"
                className="group relative flex h-12 min-w-[112px] items-center justify-center overflow-hidden rounded-control bg-primary px-5 text-sm font-semibold text-white shadow-primary-floating transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98] sm:min-w-[148px] sm:px-8"
              >
                <span className="relative">Mua ngay</span>
              </Link>
              <Link
                href="/explore"
                className="group flex h-12 min-w-0 flex-1 items-center justify-center rounded-control border border-primary-border bg-white/92 px-3 text-[13px] font-semibold text-primary shadow-sm backdrop-blur-sm transition-[background-color,border-color,transform] duration-150 hover:bg-primary-soft active:scale-[0.98] sm:min-w-[216px] sm:flex-none sm:px-7 sm:text-sm"
              >
                Khám phá bộ sưu tập
                <ArrowRight className="ml-2 h-4 w-4 stroke-[1.8] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-white/94 text-foreground shadow-[0_-6px_18px_rgba(25,28,24,0.07)] backdrop-blur-md">
            <div className="mx-auto grid max-w-6xl grid-cols-3">
              {[
                { icon: Truck, title: "Giao hàng TP.HCM", subtitle: "Khu vực khác sẽ được tư vấn phí" },
                { icon: BookOpen, title: "Hướng Dẫn Chăm Sóc", subtitle: "Mẹo để terrarium luôn xanh" },
                { icon: ShieldCheck, title: "Bảo Mật Thanh Toán", subtitle: "Thanh toán an toàn 100%" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    href="/policies"
                    key={item.title}
                    className={`group flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 py-2 text-center transition-colors duration-200 hover:bg-primary-soft sm:min-h-[66px] sm:flex-row sm:gap-3 sm:px-5 sm:text-left ${index > 0 ? "border-l border-border" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 stroke-[1.7] text-primary sm:h-6 sm:w-6" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold leading-tight tracking-[0] sm:text-[15px]">{item.title}</span>
                      <span className="mt-0.5 hidden text-xs leading-snug text-muted-foreground sm:block">{item.subtitle}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Brand Gallery — streams in, hidden if no images */}
      <Suspense fallback={<BrandGallerySkeleton />}>
        <BrandGallerySection />
      </Suspense>



      {/* Featured Products — streams in */}
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProductsSection />
      </Suspense>

      {/* Blog Section — streams independently */}
      <Suspense fallback={<BlogSkeleton />}>
        <LatestBlogSection />
      </Suspense>

      {/* Testimonial / Social Proof — Marquee (static, no DB) */}
      <ReviewMarquee />




    </div>
  );
}
