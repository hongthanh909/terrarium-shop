"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Heart, Star, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/store/cartStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  featured: boolean;
  pinnedUntil: string | null;
}

export default function ExplorePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [pinnedProducts, setPinnedProducts] = useState<Product[]>([]);
  const [topVotedProducts, setTopVotedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [weeklyFeatured, setWeeklyFeatured] = useState<{ product: Product; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
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
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      const [exploreRes, weeklyRes] = await Promise.all([
        fetch("/api/explore"),
        fetch("/api/explore/weekly"),
      ]);

      const [exploreData, weeklyData] = await Promise.all([
        exploreRes.json(),
        weeklyRes.json(),
      ]);

      setFeaturedProducts(exploreData.featured || []);
      setPinnedProducts(exploreData.pinned || []);
      setTopVotedProducts(exploreData.topVoted || []);
      setNewArrivals(exploreData.newArrivals || []);
      setWeeklyFeatured(weeklyData.featured || null);
    } catch (error) {
      console.error("Error fetching explore data:", error);
    } finally {
      setLoading(false);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
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
            {product.featured && (
              <Badge className="absolute top-2 left-2 bg-[hsl(45,90%,60%)] text-[hsl(45,95%,25%)]">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {product.pinnedUntil && new Date(product.pinnedUntil) > new Date() && (
              <Badge className="absolute top-2 right-2 bg-[#425733] text-white">
                <Heart className="w-3 h-3 mr-1" />
                Pinned
              </Badge>
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
  );

  const Section = ({ title, products, emptyMessage }: { title: string; products: Product[]; emptyMessage: string }) => (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-[hsl(220,14%,25%)] mb-6">{title}</h2>
      {products.length === 0 ? (
        <p className="text-[hsl(220,14%,45%)]">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-[hsl(220,14%,45%)]">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[hsl(220,14%,25%)] mb-4">Khám Phá</h1>
          <p className="text-[hsl(220,14%,45%)] max-w-2xl mx-auto">
            Khám phá bộ sưu tập terrarium tuyệt đẹp của chúng tôi, từ những sản phẩm nổi bật đến các sản phẩm mới nhất
          </p>
        </div>

        {/* Weekly Featured Highlight */}
        {weeklyFeatured && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#425733] to-[#425733] p-8 md:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-2xl" />

              <div className="relative z-10 max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <span>✨</span>
                  <span>Featured của tuần</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      {weeklyFeatured.product.name}
                    </h2>
                    {weeklyFeatured.reason && (
                      <p className="text-white/90 mb-6 text-lg">
                        {weeklyFeatured.reason}
                      </p>
                    )}
                    <p className="text-3xl font-bold mb-6">
                      {Number(weeklyFeatured.product.basePrice.toString()).toLocaleString("vi-VN")}₫
                    </p>
                    <div className="flex gap-3">
                      <Button asChild size="lg" className="bg-white text-[#425733] hover:bg-white/90 font-bold">
                        <Link href={`/products/${weeklyFeatured.product.slug}`}>
                          Xem chi tiết
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                        <Link href="/products">
                          Xem tất cả
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm p-4">
                      {weeklyFeatured.product.images.length > 0 ? (
                        <img
                          src={weeklyFeatured.product.images[0]}
                          alt={weeklyFeatured.product.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-20 h-20 text-white/50" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <Section
          title="🔥 Sản Phẩm Nổi Bật"
          products={featuredProducts}
          emptyMessage="Chưa có sản phẩm nổi bật"
        />

        <Section
          title="📌 Sản Phẩm Được Ghim"
          products={pinnedProducts.filter((p) => p.pinnedUntil && new Date(p.pinnedUntil) > new Date())}
          emptyMessage="Chưa có sản phẩm được ghim"
        />

        <Section
          title="❤️ Được Yêu Thích"
          products={topVotedProducts}
          emptyMessage="Chưa có sản phẩm nào được bình chọn"
        />

        <Section
          title="🆕 Mới Rời Xưởng"
          products={newArrivals}
          emptyMessage="Chưa có sản phẩm mới"
        />

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link href="/products">
            <Button variant="outline" className="border-[#c8d5be] hover:bg-[#e3ebdd]">
              Xem Tất Cả Sản Phẩm
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}