import { Metadata } from "next";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Suspense } from "react";
import { Sprout, Truck, ArrowRight, FileText, Calendar, Gift, Sparkles, Bot, Leaf } from "lucide-react";
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
              <h2 className="text-3xl md:text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sản Phẩm Nổi Bật</h2>
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

              <h2 className="text-3xl md:text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Góc Chia Sẻ</h2>
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
    <main className="min-h-screen">
      {/* Hero / About Section (Static Background) */}
      <section
        id="about"
        className="relative pt-36 pb-48 px-6 overflow-hidden bg-cover bg-center min-h-[75vh] flex items-center"
        style={{
          backgroundImage: "url('/about_us_bg.png')",
        }}
      >
        <div className="absolute inset-0 bg-[#1c2c16]/75 z-0 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white py-12">
          <ScrollReveal direction="up">
            <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#c3d3ba] uppercase mb-4">VỀ CHÚNG TÔI</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Tạo nên những thiết kế terrarium mang dấu ấn riêng
            </h1>
            <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Mỗi terrarium được tạo hình tỉ mỉ, kết hợp thiết kế thủy tinh đẹp mắt với hệ thực vật được chọn lọc để mang thiên nhiên thanh tao vào không gian sống của bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-[#5f7454] text-white hover:bg-[#4d6043] px-8 font-semibold rounded-full hover:-translate-y-0.5 transition-all shadow-lg w-full sm:w-auto"
                asChild
              >
                <Link href="/products">
                  Khám Phá Cửa Hàng
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white font-semibold rounded-full px-8 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                asChild
              >
                <Link href="/consult">Nhận Tư Vấn Ngay</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* About Overlapping Cards Section */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 -mt-24 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal direction="up" delay={0.1} className="h-full">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(41,58,32,0.08)] border border-[#daebd0] flex items-start gap-4 hover:shadow-[0_15px_40px_rgba(41,58,32,0.15)] hover:-translate-y-1 transition-all duration-300 h-full">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#f4f7f2] border border-[#daebd0] flex items-center justify-center text-[#425733]">
                <Sprout className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#293a20] mb-2">Thiết kế theo cá nhân</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Terrarium được tạo riêng theo phong cách và nhu cầu của bạn.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2} className="h-full">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(41,58,32,0.08)] border border-[#daebd0] flex items-start gap-4 hover:shadow-[0_15px_40px_rgba(41,58,32,0.15)] hover:-translate-y-1 transition-all duration-300 h-full">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#f4f7f2] border border-[#daebd0] flex items-center justify-center text-[#425733]">
                <Leaf className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#293a20] mb-2">Thủ công tỉ mỉ</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Mỗi sản phẩm handmade được chăm chút trong từng chi tiết.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3} className="h-full">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(41,58,32,0.08)] border border-[#daebd0] flex items-start gap-4 hover:shadow-[0_15px_40px_rgba(41,58,32,0.15)] hover:-translate-y-1 transition-all duration-300 h-full">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#f4f7f2] border border-[#daebd0] flex items-center justify-center text-[#425733]">
                <Gift className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#293a20] mb-2">Quà tặng & trang trí</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Phù hợp cho bàn làm việc, phòng khách hoặc những món quà tinh tế.
                </p>
              </div>
            </div>
          </ScrollReveal>
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
