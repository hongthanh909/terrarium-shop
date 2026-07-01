import { Metadata } from "next";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Suspense } from "react";
import {
  Sprout,
  Truck,
  ArrowRight,
  FileText,
  Calendar,
  Gift,
  Sparkles,
  Bot,
  Leaf,
  HandHeart,
  Flower2,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ReviewMarquee } from "@/components/ui/review-marquee";
import { prisma } from "@/lib/prisma";
import { FeaturedProductCard } from "@/components/ui/featured-product-card";
import { BrandGallery } from "@/components/ui/brand-gallery";

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
                    inventory={product.inventory}
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

      {/* ── Hero Section: 16:9 editorial product banner ───────────────────── */}
      <section
        id="about"
        className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
        style={{ background: "linear-gradient(145deg, #ECEEE5 0%, #F7F4EE 62%, #FBFAF6 100%)" }}
      >
        <div className="mx-auto max-w-7xl">
          <div
            className="relative overflow-hidden rounded-[2rem] lg:aspect-video"
            style={{
              background:
                "radial-gradient(circle at 78% 28%, rgba(206,218,188,0.72), transparent 28%), linear-gradient(135deg, #fbf8f1 0%, #eee9dc 48%, #f8f6ef 100%)",
              boxShadow: "0 30px 90px rgba(38, 58, 31, 0.16)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.82), transparent 30%), radial-gradient(circle at 76% 68%, rgba(91,111,75,0.14), transparent 26%)",
              }}
            />
            <div className="relative z-10 grid min-h-[720px] grid-cols-1 lg:min-h-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="flex flex-col justify-center px-6 pb-10 pt-12 sm:px-10 lg:px-14 lg:pb-44 lg:pt-12">
                <ScrollReveal direction="up" initiallyVisible>
                  <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6f845d]">
                    Terrarium & Moss Art
                  </p>
                  <h1 className="max-w-[12ch] text-[2.8rem] font-serif leading-[1.05] tracking-[-0.04em] text-[#263b20] sm:text-6xl lg:text-[4rem]">
                    Mang đến một chút rêu - một chút xanh
                  </h1>
                  <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-[#3f5134] sm:text-lg">
                    Chúng mình sẽ mang đến sự bình yên trong không gian nhỏ của bạn
                  </p>

                  <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link
                      href="/products"
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#263b20] px-9 text-base font-semibold text-white shadow-[0_14px_28px_rgba(38,59,32,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#314d28] active:scale-[0.98]"
                    >
                      Mua ngay
                    </Link>
                    <Link
                      href="/products"
                      className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl px-2 text-base font-semibold text-[#263b20] transition-all duration-200 hover:translate-x-1 active:scale-[0.98]"
                    >
                      Khám phá bộ sưu tập
                      <ArrowRight className="h-5 w-5 stroke-[1.7]" />
                    </Link>
                  </div>

                  <div className="mt-8 grid max-w-xl grid-cols-4 gap-3 text-[#2f4328] sm:gap-4">
                    {[
                      { label: "Thủ công", Icon: HandHeart },
                      { label: "Phong thủy", Icon: Flower2 },
                      { label: "Dễ chăm", Icon: Leaf },
                      { label: "Quà tặng", Icon: Gift },
                    ].map(({ label, Icon }) => (
                      <div key={label} className="flex flex-col items-center gap-3 border-[#c7cfba] sm:border-r sm:last:border-r-0">
                        <Icon className="h-7 w-7 stroke-[1.45] sm:h-8 sm:w-8" />
                        <span className="text-xs font-medium sm:text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              <div className="relative flex min-h-[520px] items-end justify-center px-4 pb-28 lg:min-h-0 lg:pb-24 lg:pr-8">
                <div className="absolute bottom-28 left-4 hidden h-28 w-28 rounded-full bg-[#d8d0bf]/55 blur-[1px] lg:block" />
                <div className="absolute right-8 top-10 h-64 w-44 rotate-12 rounded-[45%] border border-[#c9c0aa] bg-[#e7dfcf]/72 shadow-inner lg:right-12 lg:top-16" />
                <div className="absolute bottom-24 right-0 h-56 w-40 rotate-[-18deg] rounded-[45%] border border-[#c9c0aa] bg-[#efe8d9]/70 shadow-inner lg:right-6" />
                <div className="absolute right-0 top-10 h-72 w-28 rotate-12 rounded-full bg-[#7b875f]/25 blur-2xl" />

                <div className="pointer-events-none absolute bottom-24 left-8 h-20 w-52 rotate-[-8deg] rounded-full bg-[#5b3b20]/16 blur-2xl lg:left-20" />

                <div className="absolute left-[8%] top-[10%] hidden text-white drop-shadow-[0_1px_8px_rgba(54,67,45,0.4)] lg:block">
                  <span className="text-lg font-medium">Nhỏ gọn</span>
                  <div className="mt-2 h-12 w-24 rounded-bl-[42px] border-b-2 border-l-2 border-white/90" />
                </div>
                <div className="absolute left-[2%] top-[44%] hidden text-white drop-shadow-[0_1px_8px_rgba(54,67,45,0.45)] lg:block">
                  <span className="text-lg font-medium">Dễ chăm sóc</span>
                  <div className="ml-20 mt-2 h-12 w-28 rounded-br-[48px] border-b-2 border-r-2 border-white/90" />
                </div>
                <div className="absolute right-[2%] top-[48%] hidden text-right text-white drop-shadow-[0_1px_8px_rgba(54,67,45,0.45)] lg:block">
                  <div className="mb-2 ml-auto h-14 w-24 rounded-tl-[48px] border-l-2 border-t-2 border-white/90" />
                  <span className="text-lg font-medium">Sản phẩm<br />độc đáo</span>
                </div>

                <img
                  src="/hero-terrarium-product-cutout.png"
                  alt="Terrarium rêu decor nguyên bản từ ảnh sản phẩm của Tiệm Rêu Décor"
                  className="relative z-10 max-h-[590px] w-auto max-w-[86%] object-contain drop-shadow-[0_28px_36px_rgba(28,40,24,0.24)] lg:max-h-[760px] lg:max-w-[72%]"
                />
              </div>
            </div>

            <div className="relative z-20 grid gap-5 bg-[#6d7b5e] px-6 py-6 text-white sm:grid-cols-3 sm:px-10 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-14">
              {[
                { title: "Giao Hàng Nhanh", text: "Toàn quốc nhanh chóng", Icon: Truck },
                { title: "Hướng Dẫn Chăm Sóc", text: "Mẹo để terrarium luôn xanh", Icon: BookOpen },
                { title: "Bảo Mật Thanh Toán", text: "Thanh toán an toàn 100%", Icon: ShieldCheck },
              ].map(({ title, text, Icon }) => (
                <div key={title} className="flex items-center gap-4 sm:border-r sm:border-white/28 sm:pr-6 sm:last:border-r-0">
                  <Icon className="h-8 w-8 shrink-0 stroke-[1.35]" />
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
                    <p className="mt-1 text-sm text-white/82">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards Section ─────────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: "#ECEEE5" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ScrollReveal direction="up" delay={0.1} className="h-full">
              <div
                className="bg-white rounded-2xl p-6 md:p-7 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ boxShadow: "0 4px 24px rgba(41,74,32,0.07)", border: "1px solid #e4eeda" }}
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "#f0f5eb", color: "#3d5a2a" }}
                >
                  <Sprout className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "#1e3112" }}>Thiết kế theo cá nhân</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#5a7060" }}>
                    Terrarium được tạo riêng theo phong cách và nhu cầu của bạn.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2} className="h-full">
              <div
                className="bg-white rounded-2xl p-6 md:p-7 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ boxShadow: "0 4px 24px rgba(41,74,32,0.07)", border: "1px solid #e4eeda" }}
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "#f0f5eb", color: "#3d5a2a" }}
                >
                  <Leaf className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "#1e3112" }}>Thủ công tỉ mỉ</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#5a7060" }}>
                    Mỗi sản phẩm handmade được chăm chút trong từng chi tiết.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3} className="h-full">
              <div
                className="bg-white rounded-2xl p-6 md:p-7 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ boxShadow: "0 4px 24px rgba(41,74,32,0.07)", border: "1px solid #e4eeda" }}
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "#f0f5eb", color: "#3d5a2a" }}
                >
                  <Gift className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "#1e3112" }}>Quà tặng &amp; trang trí</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#5a7060" }}>
                    Phù hợp cho bàn làm việc, phòng khách hoặc những món quà tinh tế.
                  </p>
                </div>
              </div>
            </ScrollReveal>
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
