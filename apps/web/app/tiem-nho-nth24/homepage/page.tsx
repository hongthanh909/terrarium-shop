"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ImageIcon, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown,
  Loader2, Save, ExternalLink, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { compressImage } from "@/lib/image";

interface HomeBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  order: number;
  isActive: boolean;
}

function generateId() {
  return `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export default function AdminHomepagePage() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/admin/homepage");
        const data = await res.json();
        setBanners(data.banners ?? []);
      } catch {
        toast.error("Không thể tải danh sách banner");
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Upload image to Supabase Storage
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("bucket", "banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload thất bại");
      const data = await res.json();

      const newBanner: HomeBanner = {
        id: generateId(),
        imageUrl: data.url,
        title: "",
        subtitle: "",
        link: "",
        order: banners.length + 1,
        isActive: true,
      };

      setBanners((prev) => [...prev, newBanner]);
      toast.success("Đã tải ảnh lên thành công!");
    } catch (err) {
      toast.error("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFieldChange = (id: string, field: keyof HomeBanner, value: any) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleToggleActive = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const handleDelete = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    toast.info("Đã xóa banner. Nhấn Lưu để xác nhận.");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...banners];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setBanners(next.map((b, i) => ({ ...b, order: i + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const next = [...banners];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setBanners(next.map((b, i) => ({ ...b, order: i + 1 })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ordered = banners.map((b, i) => ({ ...b, order: i + 1 }));
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: ordered }),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      setBanners(ordered);
      toast.success("Đã lưu banner trang chủ thành công!");
    } catch {
      toast.error("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#425733]" />
            Giao Diện Trang Chủ
          </h2>
          <p className="text-gray-500 mt-1">
            Quản lý ảnh banner Hero — tự động hiển thị trên trang chủ theo thứ tự
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#425733] border border-gray-200 px-3 py-2 rounded-lg hover:border-[#c2d6b0] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Xem trang chủ
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#425733] hover:bg-[#364a29] text-white gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu tất cả ({banners.length} banner)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-[#c2d6b0] rounded-2xl bg-[#f9fbf7] hover:bg-[#f0f4ec] transition-colors cursor-pointer group"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-[#425733] animate-spin" />
              <p className="text-sm text-gray-500">Đang tải ảnh lên Supabase...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#e3ebdd] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-7 h-7 text-[#425733]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#425733]">Thêm banner mới</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click để chọn ảnh • JPG, PNG, WebP • Tối đa 5MB
                </p>
              </div>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-500">Chưa có banner nào</p>
          <p className="text-sm text-gray-400 mt-1">
            Thêm banner ở trên để hiển thị trên trang chủ
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                banner.isActive
                  ? "border-[#daebd0]"
                  : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex gap-0 sm:gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-36 h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title || `Banner ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                  <div className="absolute top-1 left-1">
                    <span className="bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0 space-y-2.5 pl-4 sm:pl-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Tiêu đề banner (tuỳ chọn)
                      </label>
                      <Input
                        value={banner.title ?? ""}
                        onChange={(e) => handleFieldChange(banner.id, "title", e.target.value)}
                        placeholder="VD: Khám Phá Terrarium Mới"
                        className="h-8 text-sm border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Link điều hướng (tuỳ chọn)
                      </label>
                      <Input
                        value={banner.link ?? ""}
                        onChange={(e) => handleFieldChange(banner.id, "link", e.target.value)}
                        placeholder="VD: /products hoặc /products/slug"
                        className="h-8 text-sm border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Phụ đề (tuỳ chọn)
                    </label>
                    <Input
                      value={banner.subtitle ?? ""}
                      onChange={(e) => handleFieldChange(banner.id, "subtitle", e.target.value)}
                      placeholder="VD: Bộ sưu tập mới — Sen Đá & Rêu Tự Nhiên"
                      className="h-8 text-sm border-gray-200"
                    />
                  </div>

                  {/* URL readonly */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      URL ảnh
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={banner.imageUrl}
                        readOnly
                        className="h-8 text-xs border-gray-200 bg-gray-50 text-gray-400 font-mono"
                      />
                      <a
                        href={banner.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-[#425733] transition-colors"
                        title="Xem ảnh"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col justify-between items-center pl-3 border-l border-gray-100 ml-2">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Lên"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === banners.length - 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Xuống"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 mt-2">
                    <button
                      onClick={() => handleToggleActive(banner.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        banner.isActive
                          ? "bg-[#e3ebdd] text-[#425733] hover:bg-[#d0dfca]"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      title={banner.isActive ? "Đang hiện — click để ẩn" : "Đang ẩn — click để hiện"}
                    >
                      {banner.isActive ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Xóa banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status strip */}
              <div className={`px-4 py-1.5 flex items-center gap-2 text-xs ${
                banner.isActive
                  ? "bg-[#f5fbf0] border-t border-[#daebd0] text-[#5a7a48]"
                  : "bg-gray-50 border-t border-gray-100 text-gray-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? "bg-[#6aad4a]" : "bg-gray-300"}`} />
                {banner.isActive ? "Đang hiển thị trên trang chủ" : "Đang bị ẩn"}
                {banner.link && (
                  <>
                    <span className="text-gray-300 mx-1">•</span>
                    <span>Link: {banner.link}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info note */}
      {banners.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex gap-3">
          <span className="text-base flex-shrink-0">💡</span>
          <div>
            <p className="font-medium">Lưu ý về thứ tự hiển thị</p>
            <p className="mt-0.5 text-amber-600">
              Banner <strong>#1</strong> sẽ hiển thị đầu tiên trên carousel trang chủ.
              Nếu không có banner nào được kích hoạt, trang chủ sẽ tự động hiển thị các sản phẩm nổi bật.
              Nhớ nhấn <strong>Lưu</strong> sau mỗi thay đổi!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
