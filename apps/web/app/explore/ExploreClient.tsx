"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Package, Compass, Sparkles, Check, Sprout, Gift, ShoppingBasket, ChevronLeft, ChevronRight } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { useCartStore } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition, SlideInHeading } from "@/components/ui/page-transition";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  salePrice?: { toString: () => string } | null;
  saleEndDate?: string | null;
  images: string[];
  category: { id: string; name: string };
  featured: boolean;
  pinnedUntil: string | null;
  voteCount?: number;
  userVoted?: boolean;
}

interface FeaturedItem {
  product: Product;
  reason?: string | null;
}

interface ExploreProps {
  featured: Product[];
  pinned: Product[];
  topVoted: Product[];
  newArrivals: Product[];
  weeklyFeaturedItems: FeaturedItem[];
}

export function ExploreClient({ featured, pinned, topVoted, newArrivals, weeklyFeaturedItems }: ExploreProps) {
  const { addItem } = useCartStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  // Current featured item
  const currentFeatured = weeklyFeaturedItems.length > 0 ? weeklyFeaturedItems[activeFeaturedIndex] : null;

  // Auto-rotate featured product every 8s
  useEffect(() => {
    if (weeklyFeaturedItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFeaturedIndex((idx) => (idx + 1) % weeklyFeaturedItems.length);
      setActiveImageIndex(0); // Reset image index on product change
    }, 8000);
    return () => clearInterval(interval);
  }, [weeklyFeaturedItems.length]);

  // Auto-rotate images of current featured product every 10s
  useEffect(() => {
    if (!currentFeatured?.product?.images?.length) return;
    const interval = setInterval(() => {
      setActiveImageIndex((idx) => (idx + 1) % currentFeatured.product.images.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentFeatured?.product?.images, activeFeaturedIndex]);

  const goToPrevFeatured = () => {
    setActiveFeaturedIndex((idx) => (idx === 0 ? weeklyFeaturedItems.length - 1 : idx - 1));
    setActiveImageIndex(0);
  };
  const goToNextFeatured = () => {
    setActiveFeaturedIndex((idx) => (idx + 1) % weeklyFeaturedItems.length);
    setActiveImageIndex(0);
  };

  const Section = ({
    title,
    subtitle,
    products,
    emptyMessage,
  }: {
    title: string;
    subtitle?: string;
    products: Product[];
    emptyMessage: string;
  }) => (
    <section className="mb-20">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-[#1a2e12] tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        <div className="mt-3 h-[2px] w-12 bg-gradient-to-r from-[#425733] to-[#a8c49a] rounded-full" />
      </motion.div>
      {products.length === 0 ? (
        <p className="text-gray-400 py-8 text-center">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              basePrice={parseFloat(product.basePrice.toString())}
              salePrice={product.salePrice ? parseFloat(product.salePrice.toString()) : null}
              saleEndDate={product.saleEndDate ?? null}
              images={product.images}
              category={product.category}
              onAddToCart={() => {
                const base = parseFloat(product.basePrice.toString());
                const sale = product.salePrice ? parseFloat(product.salePrice.toString()) : null;
                const price = sale != null && sale < base ? sale : base;
                addItem({ productId: product.id, productName: product.name, productImage: product.images[0] || "", price, quantity: 1, variants: {} });
                showToast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );

  // Scroll-based hero animation: slide left and fade out on scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroX = useTransform(scrollYProgress, [0, 0.6], [0, -300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-to-b from-[#eef4e8] to-[#f5f9f2] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero — slides left and fades on scroll */}
          <div ref={heroRef}>
            <motion.div
              className="text-center mb-14"
              style={{ x: heroX, opacity: heroOpacity }}
            >
              <div className="inline-flex items-center gap-2 bg-[#e3ebdd] px-4 py-2 rounded-full text-sm font-medium text-[#425733] mb-4">
                <Compass className="w-4 h-4" />
                <span>Khám phá bộ sưu tập</span>
              </div>
              <h1 className="text-5xl font-bold text-[#1a2e12] mb-4">Khám Phá</h1>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Khám phá bộ sưu tập terrarium tuyệt đẹp — từ sản phẩm nổi bật đến những thiết kế mới nhất
              </p>
            </motion.div>
          </div>

          {/* Weekly Featured Highlight — Carousel */}
          {currentFeatured && (
            <motion.section
              className="mb-16 relative"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-[#48593e] p-8 md:p-12 text-white border border-[#55694b] shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl" />
                
                {/* Prev / Next arrows for multiple featured items */}
                {weeklyFeaturedItems.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevFeatured}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
                      aria-label="Sản phẩm trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNextFeatured}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
                      aria-label="Sản phẩm tiếp"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="relative z-10 max-w-5xl mx-auto">
                  {/* Category / Reason Badge */}
                  <div className="inline-flex items-center gap-1.5 bg-[#5b6e51] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 text-white/90 shadow-sm border border-white/10">
                    <span>🔧 {currentFeatured.reason || "Featured của tuần"}</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Product Info & Actions */}
                    <div className="lg:col-span-7 text-left space-y-4 lg:min-h-[320px]">
                      <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{currentFeatured.product.name}</h2>
                      
                      {(() => {
                        const base = Number(currentFeatured.product.basePrice.toString());
                        const sale = currentFeatured.product.salePrice ? Number(currentFeatured.product.salePrice.toString()) : null;
                        const isOnSale = sale != null && sale < base && (currentFeatured.product.saleEndDate == null || new Date(currentFeatured.product.saleEndDate) > new Date());
                        const discountPct = isOnSale ? Math.round(((base - sale!) / base) * 100) : 0;
                        const displayPrice = isOnSale ? sale! : base;
                        return (
                          <div className="flex items-center gap-3">
                            {isOnSale && (
                              <span className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-sm font-bold shadow-md animate-pulse">
                                -{discountPct}%
                              </span>
                            )}
                            <p className="text-3xl font-extrabold text-[#c3dfb2] tracking-wide">
                              {displayPrice.toLocaleString("vi-VN")}₫
                            </p>
                            {isOnSale && (
                              <p className="text-lg text-white/50 line-through">
                                {base.toLocaleString("vi-VN")}₫
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <p className="text-white/80 text-xs md:text-sm leading-relaxed max-w-xl line-clamp-3">
                        Terrarium {currentFeatured.product.name.toLowerCase()} mô phỏng một khu rừng tự nhiên thu nhỏ với hệ thực vật phong phú, rêu xanh và bố cục hài hòa. Được chế tác thủ công tinh xảo, mỗi sản phẩm mang vẻ đẹp nghệ thuật độc nhất vô nhị giúp thư giãn và trang trí sang trọng cho không gian của bạn.
                      </p>

                      {/* 4 Feature Badges Row — clean buttons with hover bounce */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        {[
                          "Cây thật 100%",
                          "Hệ sinh thái khép kín",
                          "Dễ chăm sóc ít bảo trì",
                          "Thiết kế thủ công tinh xảo"
                        ].map((text, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-center bg-white/10 backdrop-blur-sm px-3 py-2.5 rounded-xl text-[11px] font-semibold border border-white/20 text-white/90 cursor-default transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-white/5"
                          >
                            <span className="truncate">{text}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3.5 pt-3">
                        <Button asChild size="lg" className="bg-white text-[#48593e] hover:bg-gray-100 font-bold px-8 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
                          <Link href={`/products/${currentFeatured.product.slug}`}>Xem chi tiết &rarr;</Link>
                        </Button>
                        <button
                          onClick={() => {
                            const base = parseFloat(currentFeatured.product.basePrice.toString());
                            const sale = currentFeatured.product.salePrice ? parseFloat(currentFeatured.product.salePrice.toString()) : null;
                            const price = sale != null && sale < base ? sale : base;
                            addItem({
                              productId: currentFeatured.product.id,
                              productName: currentFeatured.product.name,
                              productImage: currentFeatured.product.images[0] || "",
                              price,
                              quantity: 1,
                              variants: {}
                            });
                            showToast.success(`Đã thêm "${currentFeatured.product.name}" vào giỏ hàng 🛒`);
                          }}
                          className="flex items-center gap-2 bg-[#55694b]/20 border-2 border-white/30 hover:border-white text-white hover:bg-white/10 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
                        >
                          <ShoppingBasket className="w-4 h-4" />
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Visual Showcase */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-start gap-4">
                      <div className="flex md:flex-row flex-col items-center justify-center gap-4 w-full">
                        {/* Main Image View — fixed size */}
                        <div className="relative w-full max-w-[340px] h-[340px] rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm p-3 border border-white/20 group flex-shrink-0">
                          {/* Floating leaf tag */}
                          <div className="absolute top-4 right-4 z-10 bg-[#3a5229]/95 border border-[#ddeedd]/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 text-white/90">
                            <Sprout className="w-3.5 h-3.5 text-[#a3e288]" />
                            <span>Cây thật 100%</span>
                          </div>

                          {/* Discount badge in image corner */}
                          {(() => {
                            const base = Number(currentFeatured.product.basePrice.toString());
                            const sale = currentFeatured.product.salePrice ? Number(currentFeatured.product.salePrice.toString()) : null;
                            const isOnSale = sale != null && sale < base && (currentFeatured.product.saleEndDate == null || new Date(currentFeatured.product.saleEndDate) > new Date());
                            const discountPct = isOnSale ? Math.round(((base - sale!) / base) * 100) : 0;
                            return isOnSale ? (
                              <div className="absolute bottom-4 right-4 z-10 bg-red-500 text-white px-3 py-1.5 rounded-xl text-sm font-extrabold shadow-lg shadow-red-500/30 animate-pulse">
                                -{discountPct}%
                              </div>
                            ) : null;
                          })()}
                          
                          {currentFeatured.product.images.length > 0 ? (
                            <Image
                              src={currentFeatured.product.images[activeImageIndex] || currentFeatured.product.images[0]}
                              alt={currentFeatured.product.name}
                              fill
                              sizes="340px"
                              className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                              priority
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-16 h-16 text-white/40" />
                            </div>
                          )}
                        </div>

                        {/* Vertical thumbnails stack */}
                        {currentFeatured.product.images.length > 1 && (
                          <div className="flex md:flex-col flex-row gap-2 max-w-full overflow-x-auto py-1 scrollbar-none justify-center">
                            {currentFeatured.product.images.slice(0, 3).map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                                  activeImageIndex === idx
                                    ? "border-white scale-105 shadow-md"
                                    : "border-white/20 hover:border-white/50"
                                }`}
                              >
                                <Image
                                  src={img}
                                  alt={`Thumbnail ${idx}`}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dot indicators for featured products */}
                      {weeklyFeaturedItems.length > 1 && (
                        <div className="flex gap-1.5 mt-2">
                          {weeklyFeaturedItems.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setActiveFeaturedIndex(idx); setActiveImageIndex(0); }}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                idx === activeFeaturedIndex
                                  ? "bg-white w-5"
                                  : "bg-white/40 w-2 hover:bg-white/60"
                              }`}
                              aria-label={`Sản phẩm ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specifications, why choose, and gift row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-8 border-t border-white/10 mt-8">
                    <div className="lg:col-span-4 bg-[#3e5035]/50 border border-[#506646] p-6 rounded-2xl space-y-4 shadow-sm">
                      <h3 className="text-base font-bold text-green-200 flex items-center gap-2">
                        📐 Thông số sản phẩm
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs text-white/95">
                        <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Kích thước</span>
                          <span className="font-bold mt-0.5">20 x 12 x 30 cm</span>
                        </div>
                        <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Ánh sáng</span>
                          <span className="font-bold mt-0.5">Đèn LED cảm ứng</span>
                        </div>
                        <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Bảo hành</span>
                          <span className="font-bold mt-0.5">6 tháng (đèn & PK)</span>
                        </div>
                        <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Giao hàng</span>
                          <span className="font-bold mt-0.5">Toàn quốc 2-3 ngày</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-[#3e5035]/50 border border-[#506646] p-6 rounded-2xl flex flex-col justify-between shadow-sm">
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-green-200">
                          💡 Vì sao bạn nên chọn {currentFeatured.product.name}?
                        </h3>
                        <ul className="space-y-2 text-xs md:text-sm text-white/90">
                          {[
                            "Mang thiên nhiên và sinh khí vào không gian sống của bạn",
                            "Thanh lọc không khí xung quanh, giảm căng thẳng mệt mỏi",
                            "Thiết kế độc bản, sang trọng, phù hợp làm quà tặng ý nghĩa",
                            "Sản phẩm chế tác thủ công hoàn toàn, mang giá trị nghệ thuật cao"
                          ].map((text, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
                              <span>{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="lg:col-span-3 bg-[#3e5035]/50 border border-[#506646] p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                      <div className="w-14 h-14 rounded-full bg-[#2d3a27] border border-[#3e5035] flex items-center justify-center mb-3.5 shadow-md">
                        <Gift className="w-6 h-6 text-red-300" />
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1.5">Quà tặng ý nghĩa</h4>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Phù hợp tặng bạn bè, đối tác, đồng nghiệp và những người thân yêu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          <Section title="Sản Phẩm Nổi Bật" subtitle="Được yêu thích và lựa chọn nhiều nhất" products={featured} emptyMessage="Chưa có sản phẩm nổi bật" />
          <Section title="Sản Phẩm Được Ghim" subtitle="Được admin đề xuất đặc biệt" products={pinned.filter((p) => p.pinnedUntil && new Date(p.pinnedUntil) > new Date())} emptyMessage="Chưa có sản phẩm được ghim" />
          <Section title="Được Yêu Thích" subtitle="Bình chọn cao nhất từ cộng đồng" products={topVoted} emptyMessage="Chưa có sản phẩm nào được bình chọn" />
          <Section title="Mới Rời Xưởng" subtitle="Vừa ra mắt, sẵn sàng khám phá" products={newArrivals} emptyMessage="Chưa có sản phẩm mới" />

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/products">
              <Button variant="outline" className="border-[#c8d5be] hover:bg-[#e3ebdd] hover:border-[#425733] transition-all">
                Xem Tất Cả Sản Phẩm
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </PageTransition>
  );
}
