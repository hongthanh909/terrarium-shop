"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Heart, ShoppingBag, ArrowLeft, Loader2, Package } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { showToast } from "@/components/ui/custom-toast";
import { Button } from "@/components/ui/button";

interface FavoriteProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  images: string[];
  category: { name: string };
  _count: { votes: number };
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile/favorites");
      return;
    }
    if (status === "authenticated") {
      fetchFavorites();
    }
  }, [status, router]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/profile/favorites");
      if (!res.ok) throw new Error("Lỗi tải danh sách yêu thích");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      showToast.error("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };

  const handleUnvote = async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}/vote`, { method: "POST" });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast.success("Đã bỏ khỏi danh sách yêu thích");
    } catch {
      showToast.error("Có lỗi xảy ra");
    }
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: product.basePrice,
      quantity: 1,
    });
    showToast.success("Đã thêm vào giỏ hàng!");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/profile"
          className="p-2 rounded-full hover:bg-[#e3ebdd] text-[#425733] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 fill-red-500 text-red-500" />
            Sản phẩm yêu thích
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Đang tải..." : `${products.length} sản phẩm đã lưu`}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 text-[#425733] animate-spin" />
          <p className="text-sm text-[#6d8c5a] font-medium">Đang tải danh sách yêu thích...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#f0f4ec] flex items-center justify-center">
            <Heart className="w-10 h-10 text-[#6d8c5a]" />
          </div>
          <p className="font-bold text-gray-700 text-lg">Chưa có sản phẩm yêu thích</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Hãy nhấn vào biểu tượng ❤️ trên các sản phẩm để lưu vào đây.
          </p>
          <Button asChild className="rounded-full mt-2 bg-[#425733] hover:bg-[#364a29]">
            <Link href="/products">Khám phá sản phẩm</Link>
          </Button>
        </div>
                {/* Unvote button */}
                <button
                  onClick={(e) => { e.preventDefault(); handleUnvote(product.id); }}
                  className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-colors"
                  title="Bỏ yêu thích"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
              </Link>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-[#6d8c5a] font-medium mb-0.5">{product.category.name}</p>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-[#425733] transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-[#425733] font-bold mt-1 text-sm">
                  {product.basePrice.toLocaleString("vi-VN")}₫
                </p>

                {/* Add to cart */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-[#425733] text-white text-xs font-semibold rounded-full hover:bg-[#364a29] transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
