"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Filter, Search, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  images: string[];
  category: { id: string; name: string };
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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: parseFloat(product.basePrice.toString()),
      quantity: 1,
      variants: {},
    });
  };

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: parseFloat(product.basePrice.toString()),
      quantity: 1,
      variants: {},
    });
    router.push("/checkout");
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
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-4xl font-bold text-[hsl(220,14%,25%)] mb-4 md:mb-0">Sản Phẩm</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4 md:mb-0">
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border-[#c8d5be]"
            />
            <Button type="submit" size="sm" className="rounded-full bg-[#425733] hover:bg-[#364a29]">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Category Filter Bar */}
        <div className="mb-10 mt-2">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-[#425733] flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(220,14%,55%)]">
              Danh mục
            </span>
            <div className="flex-1 h-px bg-[#d4dec9]" />
            <span className="text-xs text-[hsl(220,14%,55%)]">
              {totalProducts} sản phẩm
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                selectedCategory === null
                  ? "bg-[#425733] text-white border-[#425733] shadow-[0_4px_14px_rgba(66,87,51,0.35)]"
                  : "bg-white text-[hsl(220,14%,45%)] border-[#c8d5be] hover:border-[#425733] hover:text-[#425733] hover:bg-[#f3f7ef]"
              }`}
            >
              Tất Cả
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                  selectedCategory === category.id
                    ? "bg-[#425733] text-white border-[#425733] shadow-[0_4px_14px_rgba(66,87,51,0.35)]"
                    : "bg-white text-[hsl(220,14%,45%)] border-[#c8d5be] hover:border-[#425733] hover:text-[#425733] hover:bg-[#f3f7ef]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {initialProducts.length === 0 ? (
          <div className="text-center py-20">
            <Leaf className="w-16 h-16 mx-auto text-[#6d8c5a] mb-4" />
            <p className="text-[hsl(220,14%,45%)] mb-4">Không tìm thấy sản phẩm nào.</p>
            <Button
              variant="outline"
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); router.push("/products"); }}
            >
              Xem tất cả sản phẩm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {initialProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="block h-full">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full border-[#e3ebdd] flex flex-col">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="aspect-square bg-[#f0f4ec] flex items-center justify-center relative">
                      {product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <Leaf className="w-16 h-16 text-[#5a7a48]" />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <Badge variant="secondary" className="mb-2 w-fit bg-[#f0f4ec] text-[#425733]">
                        {product.category.name}
                      </Badge>
                      <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-[#425733] transition-colors min-h-[3rem]">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-[#425733] mt-auto mb-4">
                        {Number(product.basePrice.toString()).toLocaleString("vi-VN")}₫
                      </p>
                      
                      <div className="flex gap-2 mt-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-[#425733] text-[#425733] hover:bg-[#425733] hover:text-white"
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" /> Giỏ
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-[#425733] hover:bg-[#364a29]"
                          onClick={(e) => handleBuyNow(e, product)}
                        >
                          Mua Ngay
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
