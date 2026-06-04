"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Star, StarOff, Search, Trash2, Plus, RefreshCw, ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  basePrice: number;
  status: string;
  category: { name: string };
}

interface FeaturedItem {
  id: string;
  weekStart: string;
  reason: string | null;
  isActive: boolean;
  product: Product;
}

export default function AdminExplorePage() {
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pinning, setPinning] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  // New state for rotation index
  const [currentIndex, setCurrentIndex] = useState(0);



  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/explore", { credentials: "include" });
      if (res.ok) setFeatured(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (q = "") => {
    try {
      const url = `/api/products?status=all&limit=20${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // Auto‑rotate featured items every 10 seconds
  useEffect(() => {
    if (featured.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [featured]);

  useEffect(() => {
    if (showProductPicker) fetchProducts(search);
  }, [showProductPicker, search, fetchProducts]);

  const handlePin = async (productId: string) => {
    setPinning(productId);
    try {
      const res = await fetch("/api/admin/explore", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, reason: reason || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã ghim sản phẩm lên trang Khám Phá!");
      setShowProductPicker(false);
      setReason("");
      await fetchFeatured();
    } catch {
      toast.error("Ghim thất bại, vui lòng thử lại.");
    } finally {
      setPinning(null);
    }
  };

  const handleUnpin = async (id: string, name: string) => {
    if (!confirm(`Bỏ ghim "${name}" khỏi trang Khám Phá?`)) return;
    try {
      const res = await fetch(`/api/admin/explore?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("Đã bỏ ghim sản phẩm.");
      await fetchFeatured();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // Danh sách sản phẩm chưa được ghim
  const pinnedIds = new Set(featured.map((f) => f.product.id));
  const unpinnedProducts = products.filter((p) => !pinnedIds.has(p.id));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Trang Khám Phá</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ghim sản phẩm nổi bật lên trang Khám Phá để thu hút khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFeatured}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại
          </Button>
          <Link href="/explore" target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Xem trang
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-1.5 bg-[#425733] hover:bg-[#364a29]"
            onClick={() => setShowProductPicker(true)}
          >
            <Plus className="w-4 h-4" />
            Ghim sản phẩm
          </Button>
        </div>
      </div>

      {/* Danh sách đang ghim (auto‑rotated) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="font-semibold text-gray-700">Đang ghim ({featured.length})</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : featured.length === 0 ? (
          <div className="py-12 text-center">
            <StarOff className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Chưa có sản phẩm nào được ghim</p>
            <p className="text-gray-300 text-xs mt-1">
              Nhấn &ldquo;Ghim sản phẩm&rdquo; để thêm vào trang Khám Phá
            </p>
          </div>
        ) : (
          <div className="relative h-36 flex items-center justify-center overflow-hidden">
            {/* Fade transition using opacity */}
            {featured.map((item, idx) => (
              <div
                key={item.id}
                className={`absolute inset-0 flex items-center gap-4 px-5 py-3.5 transition-opacity duration-500 ${idx === currentIndex ? "opacity-100" : "opacity-0"}`}
              >
                {/* Ảnh */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.product.category.name} · {Number(item.product.basePrice).toLocaleString("vi-VN")}₫
                  </p>
                  {item.reason && (
                    <p className="text-xs text-[#425733] mt-0.5 font-medium truncate">Tiêu đề nổi bật: &ldquo;{item.reason}&rdquo;</p>
                  )}
                </div>

                {/* Week badge */}
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap hidden sm:block">
                  Tuần {new Date(item.weekStart).toLocaleDateString("vi-VN")}
                </div>

                {/* Status */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {item.product.status === "ACTIVE" ? "Đang bán" : item.product.status}
                </span>

                {/* Unpin */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-opacity"
                  onClick={() => handleUnpin(item.id, item.product.name)}
                  title="Bỏ ghim"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal chọn sản phẩm để ghim */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Chọn sản phẩm để ghim</h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Reason input */}
            <div className="px-5 py-3 border-b border-gray-50">
              <label className="text-xs text-gray-500 font-medium">
                Tiêu đề nổi bật (Badge) (ví dụ: Sản phẩm được đánh giá cao nhất, Bán chạy nhất...)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mặc định: Featured của tuần"
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#425733]"
              />
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#425733]"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {unpinnedProducts.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  {products.length === 0
                    ? "Đang tải sản phẩm..."
                    : "Tất cả sản phẩm đã được ghim"}
                </div>
              ) : (
                unpinnedProducts.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f0f4ec] transition-colors text-left"
                    onClick={() => handlePin(p.id)}
                    disabled={pinning === p.id}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {p.images?.[0] ? (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.category.name} · {Number(p.basePrice).toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                    {pinning === p.id ? (
                      <span className="text-xs text-[#425733]">Đang ghim...</span>
                    ) : (
                      <Plus className="w-4 h-4 text-[#425733] flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-gray-100">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowProductPicker(false)}
              >
                Huỷ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
