"use client";

import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Package, ArrowRight, ShoppingBasket, Clock, Star, TrendingUp } from "lucide-react";
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

interface HeroBg {
  imageUrl: string;
  blur: number;
  opacity: number; // 0-100
}

interface ExploreProps {
  featured: Product[];
  pinned: Product[];
  topVoted: Product[];
  newArrivals: Product[];
  weeklyFeaturedItems: FeaturedItem[];
  heroBg: HeroBg;
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
        <span className="text-sm text-red-500 font-medium line-through">{base.toLocaleString("vi-VN")}₫</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

export function ExploreClient({ featured, pinned, topVoted, newArrivals, weeklyFeaturedItems, heroBg }: ExploreProps) {
  const addToCart = useAddToCart();
  const { isWished, toggleWishlist } = useWishlist();

  // Merge pinned into featured (dedup by id)
  const allFeatured = [...featured];
  const featuredIds = new Set(featured.map(p => p.id));
  pinned.filter(p => p.pinnedUntil && new Date(p.pinnedUntil) > new Date()).forEach(p => {
    if (!featuredIds.has(p.id)) allFeatured.push(p);
  });

  // Hero: all pinned weekly featured items (up to 5)
  const heroItems = weeklyFeaturedItems.slice(0, 5);
  const hasHero = heroItems.length > 0;

  // Blur + opacity from admin setting
  const blurPx = heroBg.blur ?? 12;
  const bgUrl = heroBg.imageUrl || "";
  const overlayOpacity = (heroBg.opacity ?? 50) / 100;

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#fafbf8]">

        {/* ═══ 1. HERO — Blurred Background + Product Card Gallery ════════ */}
        <section className="relative w-full min-h-[540px] overflow-hidden bg-[#1a2e12] flex items-center">

          {/* ── BG Layer: blur fill ── */}
          {bgUrl ? (
            // Admin-chosen background image
            <div className="absolute inset-0">
              <ImageWrapper
                src={bgUrl}
                alt=""
                fill
                noRound
                className="object-cover"
                sizes="100vw"
                priority
                style={{ filter: `blur(${blurPx}px)`, transform: "scale(1.08)" }}
              />
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOpacity})` }} />
            </div>
          ) : hasHero ? (
            // Fallback: use first featured product image as blurred bg
            <div className="absolute inset-0">
              <ImageWrapper
                src={heroItems[0].product.images[0] || ""}
                alt=""
                fill
                noRound
                className="object-cover"
                sizes="100vw"
                priority
                style={{ filter: `blur(${blurPx}px)`, transform: "scale(1.08)" }}
              />
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOpacity})` }} />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d3d23] to-[#1a2e12]" />
          )}

          {/* ── Foreground: cards row ── */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-16">

            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 text-center"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Sản Phẩm Nổi Bật Tuần Này</h1>
              <p className="text-white/60 text-sm mt-1">Được ghim đặc biệt bởi Tiệm Rêu Décor</p>
            </motion.div>

            {hasHero ? (
              /* ── Card row: 1–5 items ── */
              <div
                className="flex gap-4 justify-center flex-wrap sm:flex-nowrap"
              >
                {heroItems.map((item, idx) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.07 }}
                    className="group flex-shrink-0 w-[calc(50%-8px)] sm:flex-1 sm:min-w-0 sm:max-w-[220px]"
                  >
                    {/* Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] shadow-lg">
                      {/* Image */}
                      <Link href={`/products/${item.product.slug}`}>
                        <div className="relative aspect-[4/5] bg-[#dfe8da] overflow-hidden">
                          {item.product.images[0] ? (
                            <ImageWrapper
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          {/* Badge */}
                          {item.reason && (
                            <div className="absolute top-2 left-2 bg-[#425733]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                              {item.reason}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">
                          {item.product.category?.name || "Terrarium"}
                        </p>
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug hover:text-white/80 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <PriceTag product={item.product} className="text-white/90 text-sm mt-1" />

                        {/* Actions */}
                        <div className="flex gap-1.5 mt-2.5">
                          <Button
                            asChild
                            size="sm"
                            className="flex-1 bg-white text-[#1a2e12] hover:bg-white/90 font-bold rounded-xl text-xs h-8 px-2"
                          >
                            <Link href={`/products/${item.product.slug}`}>
                              <ArrowRight className="w-3 h-3 mr-1" /> Chi tiết
                            </Link>
                          </Button>
                          <button
                            onClick={() => addToCart(item.product)}
                            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/30 border border-white/20 flex items-center justify-center text-white transition-all flex-shrink-0"
                            title="Thêm vào giỏ"
                          >
                            <ShoppingBasket className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <p className="text-center text-white/50 text-sm">
                Chưa có sản phẩm nổi bật nào được ghim.
              </p>
            )}
          </div>
        </section>

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
      className={`group relative rounded-2xl overflow-hidden bg-white border border-[#e4eeda] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full ${className}`}
    >
      {/* Image Container */}
      <div className="relative w-full flex-1 bg-[#dfe8da] overflow-hidden min-h-[110px]">
        {product.images[0] ? (
          <ImageWrapper src={product.images[0]} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Package className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex flex-col flex-shrink-0">
        {showDetails && (
          <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1 block">
            {product.category?.name || "Terrarium"}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="block mb-1">
          <h3 className={`font-bold text-gray-900 group-hover:text-[#425733] transition-colors leading-snug line-clamp-2 ${showDetails ? "text-base sm:text-lg" : "text-xs sm:text-sm"}`}>
            {product.name}
          </h3>
        </Link>
        
        <PriceTag product={product} className={`text-[#2d3d23] mt-0.5 ${showDetails ? "text-base" : "text-xs"}`} />
        
        {showDetails && (
          <div className="flex gap-2 mt-3">
            <Button asChild size="sm" className="bg-[#425733] text-white hover:bg-[#364a29] font-semibold rounded-xl text-xs h-8 px-4">
              <Link href={`/products/${product.slug}`}>Xem chi tiết</Link>
            </Button>
            <button
              onClick={(e) => { e.preventDefault(); onAddToCart(); }}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-[#425733] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all h-8"
            >
              <ShoppingBasket className="w-3.5 h-3.5" />
              Thêm vào giỏ
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
