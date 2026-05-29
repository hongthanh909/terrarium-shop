"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition, SlideInHeading } from "@/components/ui/page-transition";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "sonner";
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const { addItem } = useCartStore();

  const handleAddToCart = (product: Product) => {
    const basePrice = parseFloat(product.basePrice.toString());
    const salePrice = product.salePrice ? parseFloat(product.salePrice.toString()) : null;
    const price = salePrice != null && salePrice < basePrice ? salePrice : basePrice;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price,
      quantity: 1,
      variants: {},
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
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
      <main className="min-h-screen bg-[#fafbf8] py-10 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <SlideInHeading className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-[#1a2e12]">Sản Phẩm</h1>
                <p className="text-gray-500 text-sm mt-1">{totalProducts} sản phẩm đang có</p>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-full border-[#c8d5be] focus:border-[#425733]"
                />
                <Button type="submit" size="sm" className="rounded-full bg-[#425733] hover:bg-[#364a29]">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </SlideInHeading>

          {/* Category Filter */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-4 h-4 text-[#425733] flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Danh mục
              </span>
              <div className="flex-1 h-px bg-[#d4dec9]" />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
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
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Package className="w-16 h-16 mx-auto text-[#a8c49a] mb-4" />
              <p className="text-gray-400 mb-4">Không tìm thấy sản phẩm nào.</p>
              <Button
                variant="outline"
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); router.push("/products"); }}
                className="border-[#425733] text-[#425733] hover:bg-[#f0f4ed]"
              >
                Xem tất cả sản phẩm
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {initialProducts.map((product) => (
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
                  reviewCount={product._count?.reviews ?? 0}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
