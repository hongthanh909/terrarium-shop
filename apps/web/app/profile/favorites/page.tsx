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
    <div className="mx-auto min-h-[100dvh] max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
        <Link
          href="/profile"
          className="flex h-11 w-11 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight text-foreground sm:text-4xl">
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
          <Loader2 className="h-12 w-12 animate-spin text-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải danh sách yêu thích...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center border border-border bg-muted">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="font-bold text-gray-700 text-lg">Chưa có sản phẩm yêu thích</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Nhấn biểu tượng yêu thích trên sản phẩm để lưu vào đây.
          </p>
          <Button asChild className="mt-2">
            <Link href="/products">Khám phá sản phẩm</Link>
          </Button>
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
          className="group overflow-hidden rounded-card border border-border bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary-border hover:shadow-floating"
            >
              {/* Image */}
              <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-white">
                {product.images[0] ? (
                  <ImageWrapper
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    noRound
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {/* Unvote button */}
                <button
                  onClick={(e) => { e.preventDefault(); handleUnvote(product.id); }}
                   className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
                  title="Bỏ yêu thích"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
              </Link>

              {/* Info */}
              <div className="p-3">
                <p className="mb-0.5 text-xs font-medium text-muted-foreground">{product.category.name}</p>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-800 transition-colors hover:text-foreground/70">
                    {product.name}
                  </h3>
                </Link>
                <p className="mt-1 text-sm font-extrabold tabular-nums text-primary">
                  {product.basePrice.toLocaleString("vi-VN")}₫
                </p>

                {/* Add to cart */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-control border border-primary-border bg-primary-soft py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
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
