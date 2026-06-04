import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Sprout, Truck, ArrowRight, Shield, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ReviewMarquee } from "@/components/ui/review-marquee";
import { StatsSection } from "@/components/ui/number-ticker";
import { prisma } from "@/lib/prisma";
import { FeaturedProductCard } from "@/components/ui/featured-product-card";
import { HeroCarousel } from "@/components/ui/hero-carousel";

// ISR: Cache page for 60 seconds, revalidate in background
// This makes the page INSTANT for most requests instead of waiting for DB every time
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Terrarium Shop | Mang Thiên Nhiên Vào Trong Nhà",
  description: "Khám phá bộ sưu tập terrarium thủ công của chúng tôi — những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.",
  openGraph: {
    title: "Terrarium Shop | Khám Phá Hệ Sinh Thái Của Bạn",
    description: "Cung cấp các sản phẩm terrarium thủ công, thiết kế độc bản.",
    type: "website",
    locale: "vi_VN",
  },
};

// ─── Async streaming sub-components ───────────────────────────────────────────

async function HeroCarouselSection() {
  // 1. Ưu tiên banner custom từ Admin → SiteSetting "hero_banners"
  try {
    const bannerSetting = await prisma.siteSetting.findUnique({
      where: { key: "hero_banners" },
    });

    if (bannerSetting && Array.isArray(bannerSetting.value)) {
      const activeBanners = (bannerSetting.value as any[])
        .filter((b: any) => b.isActive !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      if (activeBanners.length > 0) {
        // Fetch linked products from DB if any banner has a productId
        const productIds = activeBanners
          .map((b: any) => b.productId)
          .filter((id): id is string => typeof id === "string" && id !== "");

        const productsMap = new Map<string, any>();
        if (productIds.length > 0) {
          const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { category: { select: { name: true } } },
          });
          dbProducts.forEach((p) => {
            productsMap.set(p.id, p);
          });
        }

        // Convert banner → Product format cho HeroCarousel
        const bannerProducts = activeBanners.map((b: any, index: number) => {
          const linkedProduct = b.productId ? productsMap.get(b.productId) : null;
          return {
            id: b.id ?? `banner-${index}`,
            slug: linkedProduct ? linkedProduct.slug : (b.link ? b.link : "#"),
            name: b.title || linkedProduct?.name || "Khám Phá Tiệm Rêu Décor",
            basePrice: linkedProduct ? Number(linkedProduct.basePrice) : 0,
            salePrice: linkedProduct && linkedProduct.salePrice != null ? Number(linkedProduct.salePrice) : null,
            images: [b.imageUrl || linkedProduct?.images?.[0] || ""],
            category: b.subtitle ? { name: b.subtitle } : (linkedProduct?.category ? { name: linkedProduct.category.name } : undefined),
            isBanner: true, // flag để HeroCarousel biết đây là banner
          };
        });

        return <HeroCarousel products={bannerProducts as any} />;
      }
    }
  } catch (e) {
    console.error("HeroCarouselSection: Failed to load banners from DB", e);
  }

  // 2. Fallback: sản phẩm nổi bật từ DB
  let rawProducts: any[] = [];
  try {
    rawProducts = await prisma.product.findMany({
      where: { featured: true, status: "ACTIVE" },
      take: 4,
      include: {
        category: { select: { name: true } },
        reviews: { where: { approved: true }, select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (rawProducts.length === 0) {
      rawProducts = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        take: 4,
        include: {
          category: { select: { name: true } },
          reviews: { where: { approved: true }, select: { rating: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (e) {
    console.error("HeroCarouselSection: DB error", e);
  }

  // Serialize Decimal → Number và tính rating
  const products = rawProducts.length > 0
    ? rawProducts.map((p: any) => {
        const reviews = p.reviews || [];
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0;
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          basePrice: Number(p.basePrice),
          salePrice: p.salePrice != null ? Number(p.salePrice) : null,
          images: p.images,
          category: p.category ? { name: p.category.name } : undefined,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        };
      })
    : [
        {
          id: "mock-1",
          slug: "mini-forest-moss-terrarium",
          name: "Rừng Rêu Thu Nhỏ - Hệ Kín Cao Cấp",
          basePrice: 450000,
          salePrice: 380000,
          images: ["https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&auto=format&fit=crop&q=80"],
          category: { name: "Terrarium Hệ Kín" },
          rating: 5.0,
          reviewCount: 5,
        },
      ];

  return <HeroCarousel products={products as any} />;
}


async function FeaturedProductsSection() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { featured: true, status: "ACTIVE" },
      take: 4,
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
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Được Lựa Chọn Cho Bạn</p>
              <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Sản Phẩm Nổi Bật</h2>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto border-2 border-[#6d8c5a] text-[#425733] hover:bg-[#e3ebdd]">
              <Link href="/products" className="group">
                Xem Tất Cả
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
        {products.length === 0 ? (
          <ScrollReveal direction="up">
            <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
              <Sprout className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có sản phẩm nổi bật</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau nhé.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any, index: number) => {
              const reviews = product.reviews || [];
              const avgRating = reviews.length > 0
                ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
                : 0;
              return (
                <ScrollReveal key={product.id} direction="up" delay={index * 0.1} className="h-full">
                  <FeaturedProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    basePrice={Number(product.basePrice.toString())}
                    salePrice={product.salePrice != null ? Number(product.salePrice.toString()) : null}
                    saleEndDate={product.saleEndDate ? product.saleEndDate.toISOString() : null}
                    images={product.images}
                    category={product.category ? { name: product.category.name } : undefined}
                    rating={Math.round(avgRating * 10) / 10}
                    reviewCount={reviews.length}
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
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Bài Viết Mới Nhất</p>
              <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Góc Chia Sẻ</h2>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto border-2 border-[#6d8c5a] text-[#425733] hover:bg-[#e3ebdd]">
              <Link href="/blog" className="group">
                Xem Tất Cả Bài Viết
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {latestPosts.map((post: any, index: number) => (
              <ScrollReveal key={post.id} direction="up" delay={index * 0.1} className="h-full">
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <Card className="overflow-hidden hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 group border-0 rounded-2xl h-full flex flex-col">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="aspect-video relative overflow-hidden bg-[#f0f4ec]">
                        <Image src={post.thumbnail || post.images?.[0] || fallbackImages[index % 3]} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
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

function HeroCarouselSkeleton() {
  return (
    <div className="relative w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-white/40">
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-[#e3ebdd] to-[#c8d5be] animate-pulse flex items-center justify-center">
        <Sprout className="w-16 h-16 text-[#425733]/30" />
      </div>
      <div className="p-6 space-y-3">
        <div className="h-6 w-3/4 bg-[#f0f4ec] rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-[#f0f4ec] rounded animate-pulse" />
        <div className="h-7 w-1/3 bg-[#e3ebdd] rounded animate-pulse" />
      </div>
    </div>
  );
}

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

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section — renders INSTANTLY, carousel streams in */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f4ec] to-[#e3ebdd] min-h-[85vh] flex items-center">
        {/* Soft decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(66,87,51,0.05)] rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[rgba(66,87,51,0.05)] rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Text & CTA */}
          <div>
            <ScrollReveal direction="up" delay={0.2}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-gray-900">
                Mang Thiên Nhiên <br/>
                Vào Trong Nhà
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-lg leading-relaxed">
                Khám phá bộ sưu tập terrarium thủ công của chúng tôi — những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                <Button
                  size="lg"
                  className="bg-[#425733] text-white hover:bg-[#364a29] font-semibold rounded-full text-lg px-8 py-3 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
                  asChild
                >
                  <Link href="/products">
                    Mua Ngay
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#425733]/30 text-[#425733] rounded-full hover:bg-[#e3ebdd] font-medium text-lg px-8 py-3 transition-all w-full sm:w-auto"
                  asChild
                >
                  <Link href="#about">Tìm Hiểu Thêm</Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* Feature Icons */}
            <ScrollReveal direction="up" delay={0.5}>
              <div className="mt-12 flex gap-8">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="text-[#425733]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Cấp ẩm tự động</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="text-[#425733]">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Dễ chăm sóc</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="text-[#425733]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Quà tặng ý nghĩa</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Product Slider — streams in via Suspense */}
          <ScrollReveal direction="left" delay={0.3}>
            <Suspense fallback={<HeroCarouselSkeleton />}>
              <HeroCarouselSection />
            </Suspense>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#f0f4ec] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Tại Sao Chọn Chúng Tôi</p>
              <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Tất Cả Bạn Cần</h2>
            </div>
          </ScrollReveal>

          {/* Premium customized accordion styles from user code sample — Light Green theme & Square-ish cards */}
          <style dangerouslySetInnerHTML={{ __html: `
            .wi-timeline-wrapper {
              display: flex;
              width: 100%;
              height: 18rem; /* Balanced, square-ish 18rem height */
              gap: 1.5rem; /* Clean layout spacing */
              justify-content: center;
              padding: 0.5rem 0;
              overflow: hidden;
            }

            .wi-card {
              position: relative;
              flex: 0 0 18rem; /* Perfectly square (18rem x 18rem) when inactive! */
              width: 18rem;
              background: #ffffff;
              border: 1px solid #daebd0; /* Soft light green border */
              border-radius: 1.25rem;
              overflow: hidden;
              cursor: pointer;
              transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              padding: 1.5rem;
              box-shadow: 0 8px 24px rgba(66, 87, 51, 0.04);
            }

            /* Active card expands to take remaining space (making it a nice rectangle!) */
            .wi-card.active {
              flex: 1 1 auto;
              background: #e3ebdd; /* Soft light green theme */
              border-color: #c8d5be;
            }

            .wi-card:hover {
              flex: 1 1 auto !important;
              background: #e3ebdd !important;
              border-color: #c8d5be !important;
              box-shadow: 0 15px 35px rgba(66, 87, 51, 0.1) !important;
            }

            /* When hovering the wrapper, the active card that is NOT hovered shrinks back to a square */
            .wi-timeline-wrapper:hover .wi-card.active:not(:hover) {
              flex: 0 0 18rem;
              background: #ffffff;
              border-color: #daebd0;
              box-shadow: 0 8px 24px rgba(66, 87, 51, 0.04);
            }

            .wi-content {
              transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              text-align: left;
            }

            .wi-content h3 {
              color: #425733; /* Forest green title */
              margin: 0;
              font-size: 1.15rem;
              font-weight: 700;
              transition: color 0.4s;
            }
            
            .wi-card.active .wi-content h3,
            .wi-card:hover .wi-content h3 {
              color: #1e2e16; /* Darker forest green */
            }
            
            .wi-timeline-wrapper:hover .wi-card.active:not(:hover) .wi-content h3 {
              color: #425733;
            }

            .wi-content p {
              color: #4b5563; /* Gray description */
              font-size: 0.85rem;
              line-height: 1.5;
              margin: 0;
              text-align: justify;
              opacity: 0.8; /* Always visible but slightly soft for inactive cards */
              transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
              margin-top: 0.5rem;
            }
            
            .wi-card.active .wi-content p,
            .wi-card:hover .wi-content p {
              opacity: 1;
              color: #374151;
            }

            .wi-timeline-wrapper:hover .wi-card.active:not(:hover) .wi-content p {
              opacity: 0.8;
              color: #4b5563;
            }

            .wi-year {
              position: absolute;
              top: 1.5rem;
              left: 1.5rem;
              font-size: 1.8rem;
              font-weight: 800;
              color: #425733;
              transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
              z-index: 10;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            .wi-icon-wrapper {
              width: 2.8rem;
              height: 2.8rem;
              border-radius: 0.75rem;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
              background: #e3ebdd;
              color: #425733;
            }

            .wi-card.active .wi-year,
            .wi-card:hover .wi-year {
              color: rgba(66, 87, 51, 0.12); /* Subtle green number in background */
              font-size: 3.5rem;
              top: 0.75rem;
              left: auto;
              right: 1.5rem;
            }
            
            .wi-card.active .wi-icon-wrapper,
            .wi-card:hover .wi-icon-wrapper {
              background: #ffffff !important;
              color: #425733 !important;
              transform: scale(1.05);
            }
            
            .wi-timeline-wrapper:hover .wi-card.active:not(:hover) .wi-year {
              color: #425733;
              font-size: 1.8rem;
              top: 1.5rem;
              left: 1.5rem;
              right: auto;
            }
            
            .wi-timeline-wrapper:hover .wi-card.active:not(:hover) .wi-icon-wrapper {
              background: #e3ebdd !important;
              transform: scale(1);
            }

            @media (max-width: 768px) {
              .wi-timeline-wrapper {
                flex-direction: column;
                height: auto;
                overflow: visible;
                padding: 1rem 0;
                gap: 1.25rem;
              }

              .wi-card {
                width: 100% !important;
                flex: none !important;
                min-height: 10rem;
                background: #e3ebdd !important;
                border-color: #c8d5be !important;
                box-shadow: 0 8px 24px rgba(66, 87, 51, 0.08) !important;
                margin-left: 0;
                margin-right: 0;
              }

              .wi-content p {
                opacity: 1 !important;
                margin-top: 0.5rem;
              }
              
              .wi-content h3 {
                color: #1e2e16 !important;
                font-size: 1.3rem !important;
              }

              .wi-year {
                color: rgba(66, 87, 51, 0.12) !important;
                font-size: 3rem !important;
                top: 1rem;
                right: 1.5rem;
                left: auto;
              }
              
              .wi-icon-wrapper {
                background: #ffffff !important;
                color: #425733 !important;
              }

              .wi-timeline-wrapper:hover .wi-card.active:not(:hover) {
                flex: none !important;
                background: #e3ebdd !important;
              }
            }
          `}} />

          {/* Accordion Wrapper */}
          <div className="wi-timeline-wrapper">
            {[
              {
                id: "01",
                icon: <Sprout className="w-6 h-6" />,
                title: "Thân Thiện Môi Trường",
                desc: "Vật liệu được tìm nguồn bền vững và cây trồng được chọn lọc từ vườn ươm địa phương.",
                bg: "bg-[#e3ebdd]",
                color: "text-[#425733]",
                isActive: true, // First active by default
              },
              {
                id: "02",
                icon: <Truck className="w-6 h-6" />,
                title: "Vận Chuyển An Toàn",
                desc: "Đảm bảo giao hàng tận nơi với lớp chống sốc đặc biệt, cây xanh luôn tươi tốt.",
                bg: "bg-[hsl(210,50%,94%)]",
                color: "text-[hsl(210,50%,50%)]",
              },
              {
                id: "03",
                icon: <Shield className="w-6 h-6" />,
                title: "Bảo Hành Cây Sống",
                desc: "Hỗ trợ thay cây miễn phí trong 30 ngày nếu terrarium của bạn không phát triển.",
                bg: "bg-[hsl(260,40%,94%)]",
                color: "text-[hsl(260,40%,55%)]",
              },
            ].map((item) => (
              <div 
                key={item.id} 
                className={`wi-card ${item.isActive ? "active" : ""}`}
              >
                {/* Index / Icon */}
                <div className="wi-year">
                  <div className={`wi-icon-wrapper ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className="font-mono">{item.id}</span>
                </div>
                
                {/* Content */}
                <div className="wi-content">
                  <h3>{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* Stats Section (static) */}
      <StatsSection />

      {/* About Section (static) */}
      <section id="about" className="py-24 px-6 bg-gradient-to-br from-[#f0f4ec] to-[#e3ebdd]">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#a8c098] mb-6">
              <Sprout className="w-8 h-8 text-[#425733]" />
            </div>
            <h2 className="text-4xl font-bold mb-6 text-[hsl(220,14%,25%)]">Về Sản Phẩm Của Chúng Tôi</h2>
            <p className="text-lg text-[hsl(220,14%,45%)] mb-6 leading-relaxed">
              Mỗi terrarium được tạo hình tỉ mỉ, kết hợp thiết kế thủy tinh đẹp mắt
              với hệ thực vật được chọn lọc để tạo nên một hệ sinh thái tự duy trì.
              Hoàn hảo cho mọi không gian, mang lại sự hiện diện thanh tao của thiên nhiên
              ngay tại bàn làm việc hoặc phòng khách của bạn.
            </p>
            <p className="text-lg text-[hsl(220,14%,45%)] leading-relaxed">
              Dù bạn là người yêu thích sự tĩnh lặng hay đang tìm kiếm một món quà độc đáo,
              sản phẩm của chúng tôi luôn là lựa chọn hoàn hảo.
            </p>
            <Button size="lg" className="mt-10 bg-[#425733] text-white hover:bg-[#364a29] px-8 font-semibold shadow-soft-lg" asChild>
              <Link href="/products">
                Khám Phá Cửa Hàng
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#425733] to-[#364a29] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <h2 className="text-4xl font-bold mb-6">Sẵn Sàng Mang Cả Khu Rừng Về Nhà?</h2>
            <p className="text-xl mb-10 text-white/90 leading-relaxed max-w-2xl mx-auto">
              Chỉ với vài cú click, bạn đã có ngay một hệ sinh thái thu nhỏ tự duy trì, mang lại năng lượng tích cực cho không gian sống.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[#425733] hover:bg-[#f0f4ec] font-bold text-base px-8 shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
                asChild
              >
                <Link href="/products">
                  Mua Ngay
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/50 bg-transparent text-white hover:bg-white/10 hover:border-white font-bold text-base px-8 hover:-translate-y-1 transition-all duration-300"
                asChild
              >
                <Link href="/consult">Nhận Tư Vấn Cây Trồng</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
