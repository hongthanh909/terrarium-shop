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
    showToast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
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
      <main className="min-h-[100dvh] bg-[#fafbf8] py-6 px-4 sm:py-10 sm:px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <SlideInHeading className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#1a2e12]">Sản Phẩm</h1>
                <p className="text-gray-500 text-sm mt-1">{totalProducts} sản phẩm đang có</p>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex w-full items-center gap-2 md:w-auto">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 flex-1 rounded-full border-[#c8d5be] focus:border-[#425733] md:w-64"
                />
                <Button type="submit" size="sm" className="h-11 w-11 rounded-full bg-[#425733] hover:bg-[#364a29]">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </SlideInHeading>

          {/* Category Filter */}
          <motion.div
            className="mb-10"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-4 h-4 text-[#425733] flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5f7057]">
                Danh mục
              </span>
              <div className="flex-1 h-px bg-[#d4dec9]" />
            </div>

            <div className="flex flex-nowrap sm:flex-wrap gap-2.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`min-h-11 whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 border-2 ${
                  selectedCategory === null
                    ? "bg-[#425733] text-white border-[#425733] shadow-[0_4px_14px_rgba(66,87,51,0.35)]"
                    : "bg-white text-gray-500 border-[#c8d5be] hover:border-[#425733] hover:text-[#425733] hover:bg-[#f3f7ef]"
                }`}
              >
                Tất Cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`min-h-11 whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 border-2 ${
                    selectedCategory === cat.id
                      ? "bg-[#425733] text-white border-[#425733] shadow-[0_4px_14px_rgba(66,87,51,0.35)]"
                      : "bg-white text-gray-500 border-[#c8d5be] hover:border-[#425733] hover:text-[#425733] hover:bg-[#f3f7ef]"
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
              <Package className="w-16 h-16 mx-auto text-[#a8c098] mb-4" />
              <p className="text-[#5f7057] mb-4">Không tìm thấy sản phẩm nào.</p>
              <Button
                variant="outline"
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); router.push("/products"); }}
                className="border-[#425733] text-[#425733] hover:bg-[#f0f4ed]"
              >
                Xem tất cả sản phẩm
              </Button>
            </motion.div>
          ) : isGroupedView ? (
            <div className="space-y-10 sm:space-y-14">
              {groupedProducts.map((group, groupIndex) => (
                <motion.section
                  key={group.category.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + groupIndex * 0.05, duration: 0.4 }}
                  className="scroll-mt-24"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-5 border-t border-[#d4dec9] pt-5">
                    <div>
                      <h2 className="text-2xl font-bold text-[#1f3518]">
                        {group.category.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {group.products.length} sản phẩm trong danh mục này
                      </p>
                    </div>
                    <button
                      onClick={() => handleCategoryChange(group.category.id)}
                      className="self-start sm:self-auto px-4 py-2 rounded-full border border-[#c8d5be] bg-white text-sm font-semibold text-[#425733] hover:bg-[#f3f7ef] transition-colors"
                    >
                      Xem riêng danh mục
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {group.products.map((product) => {
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {initialProducts.map((product) => {
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
      </main>
    </PageTransition>
  );
}
