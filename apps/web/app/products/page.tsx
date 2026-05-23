"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Leaf, Filter, Search, ShoppingCart, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: {
    toString: () => string;
  };
  images: string[];
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        fetch("/api/categories"),
      ]);

      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);

      setProducts(productsData.products || productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    router.push(`/products?${params}`);
  };

  const filteredProducts = products;

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

        {/* ── Category Filter Bar ── */}
        <div className="mb-10 mt-2">
          {/* Divider + Label */}
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-[#425733] flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(220,14%,55%)]">
              Danh mục
            </span>
            <div className="flex-1 h-px bg-[#d4dec9]" />
            <span className="text-xs text-[hsl(220,14%,55%)]">
              {filteredProducts.length} sản phẩm
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setSelectedCategory(null);
                router.push(`/products`);
              }}
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
                onClick={() => {
                  setSelectedCategory(category.id);
                  const params = new URLSearchParams();
                  params.set("category", category.id);
                  if (searchQuery) params.set("search", searchQuery);
                  router.push(`/products?${params}`);
                }}
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

        {/* ── Products Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-2xl bg-[#f0f4ec] animate-pulse h-80" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
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
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full border-[#e3ebdd]">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-[#f0f4ec] flex items-center justify-center relative">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Leaf className="w-16 h-16 text-[#5a7a48]" />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <Badge variant="secondary" className="mb-2 w-fit bg-[#f0f4ec] text-[#425733]">
                        {product.category.name}
                      </Badge>
                      <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-[#425733] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-[#425733] mt-auto mb-4">
                        {Number(product.basePrice.toString()).toLocaleString("vi-VN")}₫
                      </p>
                      
                      {/* Action Buttons */}
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
