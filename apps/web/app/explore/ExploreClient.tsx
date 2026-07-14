"use client";

import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Clock, Star, TrendingUp } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { getProductRatingSummary } from "@/lib/product-rating";
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  salePrice?: { toString: () => string } | null;
  saleEndDate?: string | null;
  images: string[];
  category: { id: string; name: string };
  displayRating?: number | string | null;
  displayReviewCount?: number | null;
  reviews?: { rating: number }[];
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
    const saleIsValid =
      sale != null &&
      sale < base &&
      (!product.saleEndDate || new Date(product.saleEndDate) > new Date());
    const itemPrice = saleIsValid ? sale : base;

    const isBể = 
      product.category?.name?.toLowerCase().includes("bể") ||
      product.name?.toLowerCase().includes("bể") ||
      product.slug?.toLowerCase().includes("be");

    const pkgPriceAdjustment = isBể
      ? getProductPackagePriceAdjustment(selectedPackage)
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
      <main className="min-h-[100dvh] bg-[#fafbf8]">

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

          {/* Foreground: unified product cards */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 py-12 md:px-6 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7 text-center"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Sản Phẩm Nổi Bật Tuần Này</h1>
              <p className="text-white/70 text-sm mt-1">Được ghim đặc biệt bởi Tiệm Rêu Décor</p>
            </motion.div>

            {hasHero ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {heroItems.map((item, idx) => {
                  const ratingSummary = getProductRatingSummary(item.product);
                  return (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: idx * 0.06 }}
                    className="h-full"
                  >
                    <ProductCard
                      id={item.product.id}
                      slug={item.product.slug}
                      name={item.product.name}
                      basePrice={parseFloat(item.product.basePrice.toString())}
                      salePrice={item.product.salePrice ? parseFloat(item.product.salePrice.toString()) : null}
                      saleEndDate={item.product.saleEndDate ?? null}
                      images={item.product.images}
                      category={item.product.category}
                      rating={ratingSummary.rating}
                      reviewCount={ratingSummary.reviewCount}
                      onAddToCart={(pkg, qty) => addToCart(item.product, pkg, qty)}
                      wished={isWished(item.product.id)}
                      onToggleWishlist={() => toggleWishlist(item.product.id, item.product.name)}
                    />
                  </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-white/70 text-sm">
                Chưa có sản phẩm nổi bật nào được ghim.
              </p>
            )}
          </div>
        </section>

        {/* Featured products: same card system as /products */}
        {allFeatured.length > 0 && (
          <section className="py-14 px-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                icon={<Star className="w-4 h-4" />}
                title="Sản Phẩm Nổi Bật"
                subtitle="Được yêu thích và lựa chọn nhiều nhất"
              />

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {allFeatured.slice(0, 8).map(product => {
                  const ratingSummary = getProductRatingSummary(product);
                  return (
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
                    rating={ratingSummary.rating}
                    reviewCount={ratingSummary.reviewCount}
                    onAddToCart={(pkg, qty) => addToCart(product, pkg, qty)}
                    wished={isWished(product.id)}
                    onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                  />
                  );
                })}
              </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {topVoted.slice(0, 8).map(product => {
                  const ratingSummary = getProductRatingSummary(product);
                  return (
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
                    rating={ratingSummary.rating}
                    reviewCount={ratingSummary.reviewCount}
                    onAddToCart={(pkg, qty) => addToCart(product, pkg, qty)}
                    wished={isWished(product.id)}
                    onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                  />
                  );
                })}
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {newArrivals.slice(0, 8).map(product => {
                  const ratingSummary = getProductRatingSummary(product);
                  return (
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
                    rating={ratingSummary.rating}
                    reviewCount={ratingSummary.reviewCount}
                    isNew
                    onAddToCart={(pkg, qty) => addToCart(product, pkg, qty)}
                    wished={isWished(product.id)}
                    onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                  />
                  );
                })}
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
