import { Metadata } from "next";
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
  description: "Khám phá bộ sưu tập terrarium thủ công, những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.",
  openGraph: {
    title: "Terrarium Shop | Khám Phá Hệ Sinh Thái Của Bạn",
    description: "Cung cấp các sản phẩm terrarium thủ công, thiết kế độc bản.",
    type: "website",
    locale: "vi_VN",
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
          <section className="py-14 px-6 bg-white">
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
    <section className="py-14 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4">
          {["h-56", "h-40", "h-64", "h-48"].map((h, i) => (
            <div key={i} className={`flex-1 ${h} rounded-2xl bg-[#f0f4ec] animate-pulse`} />
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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Được Lựa Chọn Cho Bạn</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sản Phẩm Nổi Bật</h2>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto border-2 border-[#6d8c5a] text-[#425733] hover:bg-[#e3ebdd]">
              <Link href="/products" className="group">
                Xem Tất Cả
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="w-full h-[1.5px] bg-gradient-to-r from-[#daebd0] via-[#a8c098]/40 to-transparent mb-12" />
        </ScrollReveal>
        {products.length === 0 ? (
          <ScrollReveal direction="up" initiallyVisible>
            <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
              <Sprout className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có sản phẩm nổi bật</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau nhé.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>

              <h2 className="text-3xl md:text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Góc Chia Sẻ</h2>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto border-2 border-[#6d8c5a] text-[#425733] hover:bg-[#e3ebdd]">
              <Link href="/blog" className="group">
                Xem Tất Cả Bài Viết
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="w-full h-[1.5px] bg-gradient-to-r from-[#daebd0] via-[#a8c098]/40 to-transparent mb-12" />
        </ScrollReveal>
        {latestPosts.length === 0 ? (
          <ScrollReveal direction="up">
            <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
              <FileText className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có bài viết nào</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau!</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {latestPosts.map((post: any, index: number) => (
              <ScrollReveal key={post.id} direction="up" delay={index * 0.1} className="h-full">
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <Card className="overflow-hidden hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 group border-0 rounded-2xl h-full flex flex-col">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="aspect-video relative overflow-hidden bg-[#f0f4ec]">
                        <ImageWrapper src={post.thumbnail || post.images?.[0] || fallbackImages[index % 3]} alt={post.title} fill noRound className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        {post.category && (
                          <Badge variant="secondary" className="text-xs mb-3 w-fit bg-[#e3ebdd] text-[#425733]">{post.category.name}</Badge>
                        )}
                        <h3 className="font-bold text-xl text-[hsl(220,14%,25%)] mb-3 line-clamp-2 group-hover:text-[#425733] transition-colors min-h-[3.5rem]">{post.title}</h3>
                        <p className="text-sm text-[hsl(220,14%,45%)] line-clamp-3 mb-4 flex-1">{(post.content || post.intro || post.body || '').replace(/<[^>]*>/g, '').slice(0, 150)}...</p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#6d8c5a] uppercase tracking-wider">
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
        <div className="h-8 w-52 bg-[#f0f4ec] rounded-lg animate-pulse mb-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-[#e3ebdd] overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-[#f0f4ec] animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-14 bg-[#e8efe2] rounded animate-pulse" />
                <div className="h-5 w-full bg-[#e8efe2] rounded animate-pulse" />
                <div className="h-6 w-24 bg-[#e8efe2] rounded animate-pulse" />
                <div className="h-9 w-full bg-[#e8efe2] rounded-lg animate-pulse" />
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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-[#f0f4ec] rounded-lg animate-pulse mb-16" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-[#e3ebdd] overflow-hidden shadow-sm">
              <div className="aspect-video bg-[#f0f4ec] animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-20 bg-[#e8efe2] rounded-full animate-pulse" />
                <div className="h-6 w-full bg-[#e8efe2] rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-[#e8efe2] rounded animate-pulse" />
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
    <main className="min-h-[100dvh]" style={{ background: "#ECEEE5" }}>

      {/* ── Hero Section: full-width image banner, preserving original artwork ── */}
      <section
        id="about"
        className="relative overflow-hidden bg-[#ECEEE5]"
      >
        <div className="relative min-h-[calc(100dvh-96px)] w-full">
          <img
            src="/home-hero-full-banner.png"
            alt="Banner terrarium Tiệm Rêu Décor với sản phẩm rêu decor và lời giới thiệu"
            className="block h-[calc(100dvh-96px)] w-full select-none object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute left-6 right-6 top-[15%] z-10 sm:left-[5.8%] sm:right-auto sm:top-[19%] sm:w-[39%] lg:w-[36%]">
            <h1 className="max-w-[11ch] font-serif text-4xl font-semibold leading-[1.08] tracking-[0] text-[#263b20] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-5xl lg:text-6xl">
              Một chút rêu - một chút xanh
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[#2f3f2b] sm:text-lg lg:text-xl">
              Mang đến không gian bình yên cho riêng bạn
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <Link
                href="/products"
                className="group relative flex h-11 min-w-[124px] items-center justify-center overflow-hidden rounded-full bg-[#3f5d33] px-6 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(39,59,33,0.16)] ring-1 ring-white/15 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#314d28] hover:shadow-[0_12px_24px_rgba(39,59,33,0.22)] focus:outline-none focus:ring-2 focus:ring-[#3f5d33] focus:ring-offset-2 active:translate-y-0 active:scale-[0.985] sm:h-12 sm:min-w-[148px] sm:px-8"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/16 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Mua ngay</span>
              </Link>
              <Link
                href="/explore"
                className="group flex h-11 min-w-[190px] items-center justify-center rounded-full border border-[#3f5d33]/20 bg-[#fffaf0] px-5 text-[13px] font-semibold text-[#263b20] shadow-[0_5px_14px_rgba(55,70,44,0.08)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#3f5d33]/35 hover:bg-white hover:shadow-[0_10px_22px_rgba(39,59,33,0.12)] focus:outline-none focus:ring-2 focus:ring-[#3f5d33] focus:ring-offset-2 active:translate-y-0 active:scale-[0.985] sm:h-12 sm:min-w-[216px] sm:bg-[#fffaf0]/92 sm:px-7 sm:text-sm sm:backdrop-blur-[2px]"
              >
                Khám phá bộ sưu tập
                <ArrowRight className="ml-2 h-4 w-4 stroke-[1.8] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-[#526044]/88 text-white shadow-[0_-6px_18px_rgba(30,45,26,0.12)] backdrop-blur-sm">
            <div className="mx-auto grid max-w-6xl grid-cols-3">
              {[
                { icon: Truck, title: "Giao Hàng Nhanh", subtitle: "Toàn quốc nhanh chóng" },
                { icon: BookOpen, title: "Hướng Dẫn Chăm Sóc", subtitle: "Mẹo để terrarium luôn xanh" },
                { icon: ShieldCheck, title: "Bảo Mật Thanh Toán", subtitle: "Thanh toán an toàn 100%" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    href="/policies"
                    key={item.title}
                    className={`group flex min-h-[58px] flex-col items-center justify-center gap-1 px-2 py-2 text-center transition-all duration-300 hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.985] sm:min-h-[66px] sm:flex-row sm:gap-3 sm:px-5 sm:text-left ${index > 0 ? "border-l border-white/20 sm:border-white/28" : ""}`}
                  >
                    <Icon className="h-5 w-5 shrink-0 stroke-[1.55] text-white/90 transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-6 sm:w-6" />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold leading-tight tracking-[0] sm:text-[15px]">{item.title}</span>
                      <span className="mt-0.5 hidden text-xs leading-snug text-white/78 sm:block">{item.subtitle}</span>
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




    </main>
  );
}
