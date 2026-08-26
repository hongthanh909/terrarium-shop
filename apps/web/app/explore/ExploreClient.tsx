"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Package,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition } from "@/components/ui/page-transition";
import { showToast } from "@/components/ui/custom-toast";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { getProductRatingSummary } from "@/lib/product-rating";
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";
import { sanitizeProductImages } from "@/lib/product-images";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  salePrice?: { toString: () => string } | null;
  saleEndDate?: string | null;
  inventory?: number;
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
  opacity: number;
}

interface ExploreProps {
  featured: Product[];
  pinned: Product[];
  topVoted: Product[];
  newArrivals: Product[];
  weeklyFeaturedItems: FeaturedItem[];
  heroBg: HeroBg;
}

function getCurrentPrice(product: Product) {
  const basePrice = Number(product.basePrice.toString());
  const salePrice = product.salePrice ? Number(product.salePrice.toString()) : null;
  const saleIsValid =
    salePrice != null &&
    salePrice < basePrice &&
    (!product.saleEndDate || new Date(product.saleEndDate) > new Date());

  return saleIsValid ? salePrice : basePrice;
}

function useAddToCart() {
  const { addItem } = useCartStore();

  return (product: Product, selectedPackage = "basic", quantity = 1) => {
    const itemPrice = getCurrentPrice(product);
    const isTank =
      product.category?.name?.toLowerCase().includes("bể") ||
      product.name?.toLowerCase().includes("bể") ||
      product.slug?.toLowerCase().includes("be");
    const packageAdjustment = isTank
      ? getProductPackagePriceAdjustment(selectedPackage)
      : 0;
    const variants: Record<string, string> = {};

    if (isTank) {
      variants["Phân loại"] =
        selectedPackage === "standard"
          ? "Gói tiêu chuẩn"
          : selectedPackage === "advanced"
            ? "Gói nâng cao"
            : "Gói cơ bản";
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: itemPrice + packageAdjustment,
      quantity,
      variants,
    });
    showToast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };
}

export function ExploreClient({
  featured,
  pinned,
  topVoted,
  newArrivals,
  weeklyFeaturedItems,
  heroBg,
}: ExploreProps) {
  const addToCart = useAddToCart();
  const { isWished, toggleWishlist } = useWishlist();
  const prefersReducedMotion = useReducedMotion();

  const allFeatured = [...featured];
  const featuredIds = new Set(featured.map((product) => product.id));
  pinned
    .filter((product) => product.pinnedUntil && new Date(product.pinnedUntil) > new Date())
    .forEach((product) => {
      if (!featuredIds.has(product.id)) allFeatured.push(product);
    });

  const fallbackProducts = [...allFeatured, ...topVoted, ...newArrivals].filter(
    (product, index, products) =>
      products.findIndex((candidate) => candidate.id === product.id) === index,
  );
  const heroItems =
    weeklyFeaturedItems.length > 0
      ? weeklyFeaturedItems.slice(0, 5)
      : fallbackProducts.slice(0, 5).map((product) => ({ product, reason: null }));
  const leadItem = heroItems[0];
  const supportingItems = heroItems.slice(1);
  const hasAnyProduct = fallbackProducts.length > 0 || weeklyFeaturedItems.length > 0;

  const renderProductCard = (product: Product, isNew = false) => {
    const ratingSummary = getProductRatingSummary(product);

    return (
      <ProductCard
        key={product.id}
        id={product.id}
        slug={product.slug}
        name={product.name}
        basePrice={Number(product.basePrice.toString())}
        salePrice={product.salePrice ? Number(product.salePrice.toString()) : null}
        saleEndDate={product.saleEndDate ?? null}
        inventory={product.inventory}
        images={product.images}
        category={product.category}
        rating={ratingSummary.rating}
        reviewCount={ratingSummary.reviewCount}
        isNew={isNew}
        onAddToCart={(selectedPackage, quantity) =>
          addToCart(product, selectedPackage, quantity)
        }
        wished={isWished(product.id)}
        onToggleWishlist={() => toggleWishlist(product.id, product.name)}
      />
    );
  };

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-white">
        <section className="border-b border-border bg-white px-4 pb-10 pt-5 sm:px-6 sm:pb-16 sm:pt-10">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
            >
              <div>
                <p className="mb-1.5 text-xs font-semibold text-primary">
                  Tuyển chọn từ Tiệm Rêu
                </p>
                <h1 className="max-w-3xl text-2xl font-bold leading-tight text-foreground sm:text-4xl">
                  Khám phá những khoảng xanh đáng chú ý
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground sm:mt-3 sm:text-base sm:leading-6">
                  Những thiết kế được yêu thích, sản phẩm mới và lựa chọn nổi bật trong tuần.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center gap-2 self-start rounded-control border border-primary-border bg-primary-soft px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 md:self-end"
              >
                Xem tất cả sản phẩm
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {leadItem ? (
              <div>
                <motion.article
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 }}
                  className="grid overflow-hidden rounded-card border border-border bg-white shadow-[0_1px_3px_rgba(38,38,38,0.06)] lg:grid-cols-[1.35fr_0.65fr]"
                >
                  <Link
                    href={`/products/${leadItem.product.slug}`}
                    className="relative block aspect-[4/3] overflow-hidden bg-muted sm:aspect-[16/10] lg:min-h-[500px] lg:aspect-auto"
                  >
                    <ProductArtwork
                      product={leadItem.product}
                      fallbackSrc={heroBg.imageUrl}
                      priority
                      sizes="(max-width: 1023px) 100vw, 68vw"
                      className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                    />
                  </Link>
                  <div className="flex flex-col justify-between p-4 sm:p-7 lg:p-10">
                    <div>
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-primary">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-primary">
                        {leadItem.product.category?.name || "Sản phẩm nổi bật"}
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-foreground sm:text-3xl">
                        {leadItem.product.name}
                      </h2>
                      <p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground sm:mt-3 sm:leading-6">
                        {leadItem.reason ||
                          "Một thiết kế được Tiệm Rêu lựa chọn để mang thêm chiều sâu và sự thư thái cho không gian sống."}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 sm:mt-8 sm:block sm:pt-6">
                      <p className="text-xl font-extrabold tabular-nums text-primary sm:mb-4 sm:text-2xl">
                        {getCurrentPrice(leadItem.product).toLocaleString("vi-VN")}₫
                      </p>
                      <Link
                        href={`/products/${leadItem.product.slug}`}
                        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto sm:px-5"
                      >
                        Xem chi tiết
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>

                {supportingItems.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-5">
                    {supportingItems.map((item) => (
                      <Link
                        key={item.product.id}
                        href={`/products/${item.product.slug}`}
                        className="group min-w-0 border-t border-border pt-3"
                      >
                        <div className="relative mb-2.5 aspect-[4/3] overflow-hidden rounded-tile bg-muted">
                          <ProductArtwork
                            product={item.product}
                            sizes="(max-width: 639px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {item.product.category?.name || "Terrarium"}
                        </p>
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                            {item.product.name}
                          </h3>
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-border bg-[#f7f8f6] px-6 py-20 text-center sm:py-28">
                {heroBg.imageUrl && (
                  <div className="absolute inset-0 opacity-[0.08]">
                    <ImageWrapper
                      src={heroBg.imageUrl}
                      alt=""
                      fill
                      noRound
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="relative mx-auto max-w-lg">
                  <Package className="mx-auto mb-5 h-10 w-10 text-muted-foreground" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Bộ sưu tập đang được cập nhật
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Tiệm đang chuẩn bị thêm những thiết kế mới. Bạn có thể xem toàn bộ sản phẩm hiện có trong cửa hàng.
                  </p>
                  <Link
                    href="/products"
                    className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-control bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
                  >
                    Đến trang sản phẩm
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {allFeatured.length > 0 && (
          <ProductSection
            icon={<Star className="h-4 w-4" />}
            title="Sản phẩm nổi bật"
            subtitle="Những thiết kế được lựa chọn nhiều nhất tại Tiệm Rêu."
            background="muted"
          >
            {allFeatured.slice(0, 8).map((product) => renderProductCard(product))}
          </ProductSection>
        )}

        {topVoted.length > 0 && (
          <ProductSection
            icon={<TrendingUp className="h-4 w-4" />}
            title="Được cộng đồng yêu thích"
            subtitle="Các sản phẩm nhận được nhiều bình chọn từ khách hàng."
          >
            {topVoted.slice(0, 8).map((product) => renderProductCard(product))}
          </ProductSection>
        )}

        {newArrivals.length > 0 && (
          <ProductSection
            icon={<Clock className="h-4 w-4" />}
            title="Mới rời xưởng"
            subtitle="Những thiết kế vừa hoàn thiện và sẵn sàng đến không gian mới."
            background="muted"
          >
            {newArrivals.slice(0, 8).map((product) => renderProductCard(product, true))}
          </ProductSection>
        )}

        {!hasAnyProduct && <div className="h-12 bg-white" />}
      </div>
    </PageTransition>
  );
}

function ProductArtwork({
  product,
  fallbackSrc = "",
  priority = false,
  sizes,
  className,
}: {
  product: Product;
  fallbackSrc?: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const sources = sanitizeProductImages(product.images);
  const [imageIndex, setImageIndex] = useState(0);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const source = sources[imageIndex] || (!fallbackFailed ? fallbackSrc : "");

  if (!source) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-4 text-center text-muted-foreground">
        <Package className="h-9 w-9" />
        <span className="text-xs font-medium">Ảnh đang được cập nhật</span>
      </div>
    );
  }

  return (
    <ImageWrapper
      src={source}
      alt={product.name}
      fill
      noRound
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
      className={className}
      onError={() => {
        if (imageIndex < sources.length) {
          setImageIndex((current) => current + 1);
        } else {
          setFallbackFailed(true);
        }
      }}
    />
  );
}

function ProductSection({
  icon,
  title,
  subtitle,
  background = "white",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  background?: "white" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`border-b border-border px-4 py-10 sm:px-6 sm:py-16 ${
        background === "muted" ? "bg-muted/45" : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-5 max-w-2xl sm:mb-7"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-control bg-primary-soft text-primary">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1.5 text-sm leading-5 text-muted-foreground sm:mt-2 sm:text-base sm:leading-6">{subtitle}</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">{children}</div>
      </div>
    </section>
  );
}
