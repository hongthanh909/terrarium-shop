"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Package, ArrowRight, ShoppingBasket, ChevronLeft, ChevronRight, Flame, Clock, Star, TrendingUp } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

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

/* ── Helper: add to cart ── */
function useAddToCart() {
  const { addItem } = useCartStore();
  return (product: Product, selectedPackage = "basic", quantity = 1) => {
    const base = parseFloat(product.basePrice.toString());
    const sale = product.salePrice ? parseFloat(product.salePrice.toString()) : null;
    const itemPrice = sale != null && sale < base ? sale : base;

    const isBể = 
      product.category?.name?.toLowerCase().includes("bể") ||
      product.name?.toLowerCase().includes("bể") ||
      product.slug?.toLowerCase().includes("be");

    const pkgPriceAdjustment = isBể
      ? (selectedPackage === "standard" ? 150000 : selectedPackage === "advanced" ? 180000 : 0)
      : 0;

    const price = itemPrice + pkgPriceAdjustment;

    const variants: Record<string, string> = {};
    if (isBể) {
      variants["Phân loại"] = selectedPackage === "standard" ? "Gói tiêu chuẩn" :
                              selectedPackage === "advanced" ? "Gói nâng cao" : "Gói cơ bản";
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price,
      quantity,
      variants,
    });
    showToast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
  };
}

/* ── Helper: price display ── */
function PriceTag({ product, className = "" }: { product: Product; className?: string }) {
  const base = Number(product.basePrice.toString());
  const sale = product.salePrice ? Number(product.salePrice.toString()) : null;
  const isOnSale = sale != null && sale < base && (product.saleEndDate == null || new Date(product.saleEndDate) > new Date());
  const displayPrice = isOnSale ? sale! : base;
  const discountPct = isOnSale ? Math.round(((base - sale!) / base) * 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isOnSale && (
        <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-500 to-rose-400 text-white text-xs font-bold">
          -{discountPct}%
        </span>
      )}
      <span className="font-bold">{displayPrice.toLocaleString("vi-VN")}₫</span>
      {isOnSale && (
        <span className="text-sm line-through opacity-50">{base.toLocaleString("vi-VN")}₫</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

export function ExploreClient({ featured, pinned, topVoted, newArrivals, weeklyFeaturedItems }: ExploreProps) {
  const addToCart = useAddToCart();
  const { isWished, toggleWishlist } = useWishlist();
  const [heroIndex, setHeroIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Merge pinned into featured (dedup by id)
  const allFeatured = [...featured];
  const featuredIds = new Set(featured.map(p => p.id));
  pinned.filter(p => p.pinnedUntil && new Date(p.pinnedUntil) > new Date()).forEach(p => {
    if (!featuredIds.has(p.id)) allFeatured.push(p);
  });

  // Auto-rotate hero
  const heroItems = weeklyFeaturedItems.length > 0 ? weeklyFeaturedItems : [];
  const currentHero = heroItems[heroIndex] || null;

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % heroItems.length), 7000);
    return () => clearInterval(timer);
  }, [heroItems.length]);

  // Horizontal scroll helpers
  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#fafbf8]">

        {/* ═══ 1. EDITORIAL HERO ═══════════════════════════════════════════ */}
        {currentHero ? (
          <section className="relative w-full h-[70vh] min-h-[480px] max-h-[720px] overflow-hidden bg-[#1a2e12]">
            {/* Background image */}
            {currentHero.product.images[0] && (
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <ImageWrapper
                  src={currentHero.product.images[0]}
                  alt={currentHero.product.name}
                  fill
                  noRound
                  className="object-cover object-[center_15%]"
                  sizes="100vw"
                  priority
                />
              </motion.div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-12 md:pb-16">
              <motion.div
                key={`hero-content-${heroIndex}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-xl"
              >
                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                  <Flame className="w-3.5 h-3.5" />
                  {currentHero.reason || "Featured của tuần"}
                </span>

                {/* Category */}
                <p className="text-white/60 text-sm font-medium mb-1">
                  {currentHero.product.category?.name || "Terrarium"}
                </p>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight">
                  {currentHero.product.name}
                </h1>

                {/* Price */}
                <PriceTag product={currentHero.product} className="text-white text-xl mb-6" />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-white text-[#1a2e12] hover:bg-white/90 font-bold px-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <Link href={`/products/${currentHero.product.slug}`}>
                      Xem chi tiết <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <button
                    onClick={() => addToCart(currentHero.product)}
                    className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  >
                    <ShoppingBasket className="w-4 h-4" />
                    Thêm vào giỏ
                  </button>
                </div>
              </motion.div>

              {/* Dots */}
              {heroItems.length > 1 && (
                <div className="flex gap-2 mt-6">
                  {heroItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === heroIndex ? "bg-white w-8" : "bg-white/40 w-4 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Nav arrows */}
            {heroItems.length > 1 && (
              <>
                <button
                  onClick={() => setHeroIndex(i => (i === 0 ? heroItems.length - 1 : i - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setHeroIndex(i => (i + 1) % heroItems.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </section>
        ) : (
          /* Fallback hero when no weekly featured */
          <section className="relative bg-gradient-to-br from-[#2d3d23] to-[#1a2e12] py-20 px-6">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Khám Phá</h1>
              <p className="text-white/70 max-w-xl mx-auto">
                Khám phá bộ sưu tập terrarium tuyệt đẹp — từ sản phẩm nổi bật đến những thiết kế mới nhất
              </p>
            </div>
          </section>
        )}

        {/* ═══ 2. HORIZONTAL SCROLL — Other featured items ═══════════════ */}
        {heroItems.length > 1 && (
          <section className="py-10 bg-white border-b border-[#e3ebdd]">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#1a2e12]">Bộ Sưu Tập Nổi Bật</h2>
                  <p className="text-sm text-gray-500">Được lựa chọn đặc biệt mỗi tuần</p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <button onClick={scrollLeft} className="w-9 h-9 rounded-full border border-[#c8d5be] flex items-center justify-center text-[#425733] hover:bg-[#e3ebdd] transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={scrollRight} className="w-9 h-9 rounded-full border border-[#c8d5be] flex items-center justify-center text-[#425733] hover:bg-[#e3ebdd] transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-6 px-6 snap-x snap-mandatory"
              >
                {heroItems.map((item, idx) => (
                  <Link
                    key={item.product.id}
                    href={`/products/${item.product.slug}`}
                    className="group flex-shrink-0 w-64 snap-start"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
                       {item.product.images[0] ? (
                         <ImageWrapper src={item.product.images[0]} alt={item.product.name} fill className="object-contain bg-[#f8faf6] p-2" />
                       ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      {idx === heroIndex && (
                        <div className="absolute top-2 left-2 bg-[#425733] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Đang hiển thị
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-[#425733] transition-colors">
                      {item.product.name}
                    </p>
                    <PriceTag product={item.product} className="text-sm text-[#2d3d23]" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ 3. BENTO GRID — Sản Phẩm Nổi Bật ═════════════════════════ */}
        {allFeatured.length > 0 && (
          <section className="py-14 px-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                icon={<Star className="w-4 h-4" />}
                title="Sản Phẩm Nổi Bật"
                subtitle="Được yêu thích và lựa chọn nhiều nhất"
              />

              {/* Bento layout: 1 large + small cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
                {allFeatured.slice(0, 5).map((product, idx) => {
                  const isLarge = idx === 0;
                  return (
                    <BentoCard
                      key={product.id}
                      product={product}
                      className={isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}
                      onAddToCart={() => addToCart(product)}
                      showDetails={isLarge}
                    />
                  );
                })}
              </div>

              {/* Remaining items as standard grid */}
              {allFeatured.length > 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {allFeatured.slice(5, 9).map(product => (
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
                      onAddToCart={(pkg, qty) => addToCart(product, pkg, qty)}
                      wished={isWished(product.id)}
                      onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ 4. ĐƯỢC YÊU THÍCH ═════════════════════════════════════════ */}
        {topVoted.length > 0 && (
          <section className="py-14 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                icon={<TrendingUp className="w-4 h-4" />}
                title="Được Yêu Thích"
                subtitle="Bình chọn cao nhất từ cộng đồng"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {topVoted.slice(0, 8).map(product => (
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
                    onAddToCart={(pkg, qty) => addToCart(product, pkg, qty)}
                    wished={isWished(product.id)}
                    onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ 5. MỚI RỜI XƯỞNG ═════════════════════════════════════════ */}
        {newArrivals.length > 0 && (
          <section className="py-14 px-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                icon={<Clock className="w-4 h-4" />}
                title="Mới Rời Xưởng"
                subtitle="Vừa ra mắt, sẵn sàng khám phá"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newArrivals.slice(0, 8).map(product => (
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
                    isNew
                    onAddToCart={(pkg, qty) => addToCart(product, pkg, qty)}
                    wished={isWished(product.id)}
                    onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ CTA ═══════════════════════════════════════════════════════ */}
        <section className="py-16 px-6 bg-gradient-to-br from-[#2d3d23] to-[#1a2e12]">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Chưa tìm thấy sản phẩm ưng ý?</h2>
              <p className="text-white/70 mb-8 max-w-lg mx-auto">
                Xem toàn bộ bộ sưu tập của chúng tôi hoặc liên hệ để được tư vấn thiết kế terrarium riêng.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-white text-[#1a2e12] hover:bg-white/90 font-bold px-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                  <Link href="/products">
                    Xem Tất Cả <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm font-bold px-8 rounded-xl">
                  <Link href="/consult">Nhận Tư Vấn</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </PageTransition>
  );
}


/* ═══════════════════════════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-lg bg-[#e3ebdd] flex items-center justify-center text-[#425733]">
          {icon}
        </span>
        <h2 className="text-2xl font-bold text-[#1a2e12] tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 ml-10">{subtitle}</p>
    </motion.div>
  );
}

function BentoCard({
  product,
  className = "",
  onAddToCart,
  showDetails = false,
}: {
  product: Product;
  className?: string;
  onAddToCart: () => void;
  showDetails?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`group relative rounded-2xl overflow-hidden bg-gray-100 ${className}`}
    >
      {/* Image */}
      {product.images[0] ? (
        <ImageWrapper src={product.images[0]} alt={product.name} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-300" />
        </div>
      )}

      {/* Gradient overlay — lighter on small cards so image breathes */}
      <div className={`absolute inset-0 bg-gradient-to-t to-transparent transition-opacity ${
        showDetails
          ? "from-black/65 via-black/15 opacity-80 group-hover:opacity-90"
          : "from-black/55 via-black/5 opacity-70 group-hover:opacity-80"
      }`} />

      {/* Content */}
      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
        {/* Category eyebrow only on large card — taste-skill: max 1 eyebrow per 3 sections */}
        {showDetails && (
          <span className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-1">
            {product.category?.name || "Terrarium"}
          </span>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className={`font-bold text-white group-hover:text-white/90 transition-colors leading-snug ${showDetails ? "text-lg sm:text-xl" : "text-sm"} line-clamp-2`}>
            {product.name}
          </h3>
        </Link>
        <PriceTag product={product} className={`text-white mt-1.5 ${showDetails ? "text-lg" : "text-sm"}`} />

        {/* Add to cart — only on large card or hover */}
        {showDetails ? (
          <div className="flex gap-2 mt-3">
            <Button asChild size="sm" className="bg-white text-[#1a2e12] hover:bg-white/90 font-semibold rounded-lg shadow-md text-xs">
              <Link href={`/products/${product.slug}`}>Xem chi tiết</Link>
            </Button>
            <button
              onClick={(e) => { e.preventDefault(); onAddToCart(); }}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/25 transition-all"
            >
              <ShoppingBasket className="w-3.5 h-3.5" />
              Thêm
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); onAddToCart(); }}
            className="mt-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/30 transition-all w-fit"
          >
            <ShoppingBasket className="w-3.5 h-3.5" />
            Thêm vào giỏ
          </button>
        )}
      </div>
    </motion.div>
  );
}
