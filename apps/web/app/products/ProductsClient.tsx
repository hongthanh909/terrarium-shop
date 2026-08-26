"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition, SlideInHeading } from "@/components/ui/page-transition";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/custom-toast";
import { motion, useReducedMotion } from "framer-motion";
import { getProductRatingSummary } from "@/lib/product-rating";
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";
import { trackEvent } from "@/lib/analytics-client";
import { getPrimaryProductImage } from "@/lib/product-images";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  salePrice?: { toString: () => string } | null;
  saleEndDate?: string | null;
  inventory: number;
  images: string[];
  category: { id: string; name: string };
  displayRating?: number | string | null;
  displayReviewCount?: number | null;
  reviews?: { rating: number }[];
  _count?: { reviews: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProductsClient({
  initialProducts,
  categories,
  totalProducts,
  initialCategory,
  initialSearch,
}: {
  initialProducts: Product[];
  categories: Category[];
  totalProducts: number;
  initialCategory: string | null;
  initialSearch: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const { addItem } = useCartStore();
  const { isWished, toggleWishlist } = useWishlist();
  const prefersReducedMotion = useReducedMotion();
  const isGroupedView = !selectedCategory && !initialSearch.trim();
  const groupedProducts = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        products: initialProducts.filter((product) => product.category?.id === category.id),
      }))
      .filter((group) => group.products.length > 0);
  }, [categories, initialProducts]);

  const handleAddToCart = (product: Product, selectedPackage = "basic", quantity = 1) => {
    // Yêu cầu đăng nhập trước khi thêm vào giỏ hàng
    if (!session) {
      showToast.warning("Đăng nhập để thêm sản phẩm vào giỏ hàng!");
      router.push(`/login?callbackUrl=/products`);
      return;
    }
    if (product.inventory <= 0) {
      showToast.error("Sản phẩm hiện đã hết hàng");
      return;
    }
    const basePrice = parseFloat(product.basePrice.toString());
    const salePrice = product.salePrice ? parseFloat(product.salePrice.toString()) : null;
    const saleIsValid =
      salePrice != null &&
      salePrice < basePrice &&
      (!product.saleEndDate || new Date(product.saleEndDate) > new Date());
    const base = saleIsValid ? salePrice : basePrice;

    const isBể = 
      product.category?.name?.toLowerCase().includes("bể") ||
      product.name?.toLowerCase().includes("bể") ||
      product.slug?.toLowerCase().includes("be");

    const pkgPriceAdjustment = isBể
      ? getProductPackagePriceAdjustment(selectedPackage)
      : 0;

    const price = base + pkgPriceAdjustment;

    const variants: Record<string, string> = {};
    if (isBể) {
      variants["Phân loại"] = selectedPackage === "standard" ? "Gói tiêu chuẩn" :
                              selectedPackage === "advanced" ? "Gói nâng cao" : "Gói cơ bản";
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: getPrimaryProductImage(product.images),
      price,
      quantity,
      variants,
    });
    showToast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) trackEvent({ type: "SEARCH", searchTerm: term, path: "/products" });
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (term) params.set("search", term);
    router.push(`/products?${params}`);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (searchQuery) params.set("search", searchQuery);
    router.push(`/products?${params}`);
  };

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-white px-4 pb-28 pt-5 sm:px-6 sm:pb-24 sm:pt-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <SlideInHeading className="mb-5 sm:mb-10">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-primary sm:mb-2">Bộ sưu tập Tiệm Rêu</p>
                <h1 className="max-w-xl text-2xl font-bold leading-tight text-foreground sm:text-4xl">Terrarium cho từng khoảng sống</h1>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground sm:mt-3 sm:text-base sm:leading-6">
                  Khám phá {totalProducts} thiết kế thủ công, từ những bể nhỏ để bàn đến hệ sinh thái làm theo yêu cầu.
                </p>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex w-full items-center gap-2 md:w-auto" role="search">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 flex-1 rounded-input border-border bg-white text-base md:w-72 md:text-sm"
                />
                <Button type="submit" size="icon" className="h-12 w-12 rounded-control" aria-label="Tìm kiếm sản phẩm">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </SlideInHeading>

          {/* Category Filter */}
          <motion.div
            className="sticky top-[57px] z-20 -mx-4 mb-7 border-y border-border bg-white/95 px-4 py-2.5 backdrop-blur-md sm:top-[89px] sm:mx-0 sm:mb-10 sm:rounded-input sm:border sm:px-4 sm:py-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <div className="mb-3 hidden items-center gap-3 sm:flex">
              <Filter className="h-4 w-4 flex-shrink-0 text-foreground" />
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Danh mục
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="-mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`min-h-11 whitespace-nowrap rounded-control border px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                  selectedCategory === null
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary-border hover:bg-primary-soft hover:text-primary"
                }`}
              >
                Tất Cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`min-h-11 whitespace-nowrap rounded-control border px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                    selectedCategory === cat.id
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-muted-foreground hover:border-primary-border hover:bg-primary-soft hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Products Grid — using unified ProductCard */}
          {initialProducts.length === 0 ? (
            <motion.div
              className="text-center py-24"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
              <Button
                variant="outline"
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); router.push("/products"); }}
                className="border-foreground text-foreground hover:bg-muted"
              >
                Xem tất cả sản phẩm
              </Button>
            </motion.div>
          ) : isGroupedView ? (
            <div className="space-y-10 sm:space-y-16">
              {groupedProducts.map((group, groupIndex) => (
                <motion.section
                  key={group.category.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + groupIndex * 0.05, duration: 0.4 }}
                  className="scroll-mt-24"
                >
                  <div className="mb-4 flex items-end justify-between gap-3 border-t border-border pt-5 sm:mb-6 sm:pt-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                        {group.category.name}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        {group.products.length} sản phẩm trong danh mục này
                      </p>
                    </div>
                    <button
                      onClick={() => handleCategoryChange(group.category.id)}
                      className="min-h-11 shrink-0 rounded-control border border-primary-border bg-primary-soft px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:px-4 sm:text-sm"
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                    {group.products.map((product, productIndex) => {
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
                        inventory={product.inventory}
                        images={product.images}
                        imagePriority={groupIndex === 0 && productIndex < 2}
                        category={product.category}
                        rating={ratingSummary.rating}
                        reviewCount={ratingSummary.reviewCount}
                        onAddToCart={(pkg, qty) => handleAddToCart(product, pkg, qty)}
                        wished={isWished(product.id)}
                        onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                      />
                      );
                    })}
                  </div>
                </motion.section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {initialProducts.map((product, productIndex) => {
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
                  inventory={product.inventory}
                  images={product.images}
                  imagePriority={productIndex < 2}
                  category={product.category}
                  rating={ratingSummary.rating}
                  reviewCount={ratingSummary.reviewCount}
                  onAddToCart={(pkg, qty) => handleAddToCart(product, pkg, qty)}
                  wished={isWished(product.id)}
                  onToggleWishlist={() => toggleWishlist(product.id, product.name)}
                />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
