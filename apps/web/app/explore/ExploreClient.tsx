"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Leaf, Heart, Star, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  images: string[];
  category: { id: string; name: string };
  featured: boolean;
  pinnedUntil: string | null;
  voteCount?: number;
  userVoted?: boolean;
}

interface ExploreProps {
  featured: Product[];
  pinned: Product[];
  topVoted: Product[];
  newArrivals: Product[];
  weeklyFeatured: { product: Product; reason?: string | null } | null;
}

export function ExploreClient({ featured, pinned, topVoted, newArrivals, weeklyFeatured }: ExploreProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { data: session } = useSession();

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

  const ProductCard = ({ product: initialProduct }: { product: Product }) => {
    const [product, setProduct] = useState(initialProduct);
    const [isLoading, setIsLoading] = useState(false);

    const handleVote = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!session) {
        toast.error("Vui lòng đăng nhập để bình chọn");
        router.push("/login");
        return;
      }

      if (isLoading) return;
      setIsLoading(true);

      try {
        const res = await fetch(`/api/products/${product.id}/vote`, {
          method: "POST",
        });

        if (!res.ok) {
          throw new Error("Lỗi khi bình chọn");
        }

        const data = await res.json();
        setProduct(prev => ({
          ...prev,
          userVoted: data.voted,
          voteCount: (prev.voteCount || 0) + (data.voted ? 1 : -1)
        }));
        
        if (data.voted) {
          toast.success("Đã thêm vào mục yêu thích!");
        } else {
          toast.info("Đã bỏ bình chọn sản phẩm.");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Link href={`/products/${product.slug}`} className="block h-full">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col relative">
          <CardContent className="p-0 flex-1 flex flex-col">
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
              {product.featured && (
                <Badge className="absolute top-2 left-2 bg-[hsl(45,90%,60%)] text-[hsl(45,95%,25%)]">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {product.pinnedUntil && new Date(product.pinnedUntil) > new Date() && (
                <Badge className="absolute top-2 left-2 bg-[#425733] text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              <button
                onClick={handleVote}
                disabled={isLoading}
                aria-label={product.userVoted ? "Bỏ bình chọn sản phẩm" : "Bình chọn sản phẩm yêu thích"}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm disabled:opacity-50"
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${product.userVoted ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} 
                />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="w-fit bg-[#f0f4ec] text-[#425733]">
                  {product.category.name}
                </Badge>
                {product.voteCount !== undefined && product.voteCount > 0 && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500" />
                    {product.voteCount}
                  </div>
                )}
              </div>
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
    );
  };

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
                        <Image
                          src={weeklyFeatured.product.images[0]}
                          alt={weeklyFeatured.product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover rounded-xl"
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

        <Section title="🔥 Sản Phẩm Nổi Bật" products={featured} emptyMessage="Chưa có sản phẩm nổi bật" />
        <Section title="📌 Sản Phẩm Được Ghim" products={pinned.filter((p) => p.pinnedUntil && new Date(p.pinnedUntil) > new Date())} emptyMessage="Chưa có sản phẩm được ghim" />
        <Section title="❤️ Được Yêu Thích" products={topVoted} emptyMessage="Chưa có sản phẩm nào được bình chọn" />
        <Section title="🆕 Mới Rời Xưởng" products={newArrivals} emptyMessage="Chưa có sản phẩm mới" />

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
