"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/custom-toast";
import {
  Star, StarOff, Search, Trash2, Plus, RefreshCw, ExternalLink, ImageIcon, Save,
} from "lucide-react";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
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

  // Hero background settings
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [heroBgBlur, setHeroBgBlur] = useState(12);
  const [bgSaving, setBgSaving] = useState(false);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/explore", { credentials: "include" });
      if (res.ok) setFeatured(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHeroBg = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/explore-hero");
      if (res.ok) {
        const data = await res.json();
        setHeroBgUrl(data.heroBg?.imageUrl || "");
        setHeroBgBlur(data.heroBg?.blur ?? 12);
      }
    } catch { /* silent */ }
  }, []);

  const saveHeroBg = async () => {
    setBgSaving(true);
    try {
      const res = await fetch("/api/admin/explore-hero", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: heroBgUrl, blur: heroBgBlur }),
      });
      if (!res.ok) throw new Error();
      showToast.success("Đã lưu cài đặt ảnh nền hero!");
    } catch {
      showToast.error("Lưu thất bại, vui lòng thử lại.");
    } finally {
      setBgSaving(false);
    }
  };

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
    fetchHeroBg();
  }, [fetchFeatured, fetchHeroBg]);

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
      showToast.success("Đã ghim sản phẩm lên trang Khám Phá!");
      setShowProductPicker(false);
      setReason("");
      await fetchFeatured();
    } catch {
      showToast.error("Ghim thất bại, vui lòng thử lại.");
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
      showToast.success("Đã bỏ ghim sản phẩm.");
      await fetchFeatured();
    } catch {
      showToast.error("Có lỗi xảy ra, vui lòng thử lại.");
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

      {/* ── Hero Background Settings ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#425733]" />
          <h3 className="font-semibold text-gray-700">Cài đặt ảnh nền Hero</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* URL input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              URL ảnh nền (để trống = tự dùng ảnh sản phẩm đầu tiên)
            </label>
            <input
              type="text"
              value={heroBgUrl}
              onChange={(e) => setHeroBgUrl(e.target.value)}
              placeholder="https://... hoặc đường dẫn ảnh"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#425733] transition-colors"
            />
          </div>

          {/* Blur slider */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Độ mờ nền (blur): <span className="font-bold text-[#425733]">{heroBgBlur}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={heroBgBlur}
              onChange={(e) => setHeroBgBlur(Number(e.target.value))}
              className="w-full accent-[#425733] h-2 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>0 (không mờ)</span>
              <span>20 (mờ tối đa)</span>
            </div>
          </div>

          {/* Preview */}
          {heroBgUrl && (
            <div className="rounded-xl overflow-hidden h-28 relative border border-gray-100">
              <ImageWrapper
                src={heroBgUrl}
                alt="Preview"
                fill
                noRound
                className="object-cover"
                style={{ filter: `blur(${heroBgBlur}px)`, transform: "scale(1.1)" }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-xs font-medium">Preview — blur {heroBgBlur}px</span>
              </div>
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={saveHeroBg}
            disabled={bgSaving}
            className="gap-1.5 bg-[#425733] hover:bg-[#364a29] w-full sm:w-auto"
            size="sm"
          >
            <Save className="w-3.5 h-3.5" />
            {bgSaving ? "Đang lưu..." : "Lưu cài đặt nền"}
          </Button>
        </div>
      </div>

      {/* Danh sách đang ghim */}
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
          <div className="divide-y divide-gray-50">
            {featured.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product.images?.[0] ? (
                    <ImageWrapper src={item.product.images[0]} alt={item.product.name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.product.category.name} · {Number(item.product.basePrice).toLocaleString("vi-VN")}₫
                  </p>
                  {item.reason && (
                    <p className="text-xs text-[#425733] mt-0.5 font-medium truncate">Tiêu đề: &ldquo;{item.reason}&rdquo;</p>
                  )}
                </div>
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap hidden sm:block">
                  Tuần {new Date(item.weekStart).toLocaleDateString("vi-VN")}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.product.status === "ACTIVE" ? "Đang bán" : item.product.status}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
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
                        <ImageWrapper
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
