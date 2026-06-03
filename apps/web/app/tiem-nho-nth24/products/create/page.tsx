"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, X, Save, Upload, Image as ImageIcon, Star, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/ui/FormField";
import { FormSelect } from "@/components/admin/ui/FormSelect";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const formatVND = (value: string | number) => {
  if (value === undefined || value === null) return "";
  const clean = String(value).replace(/\D/g, ""); // Keep only digits
  if (!clean) return "";
  return new Intl.NumberFormat("vi-VN").format(parseInt(clean));
};

export default function CreateProductPage() {
  const router = useRouter();
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const subImageInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub] = useState(false);

  // Main image (1 only)
  const [mainImage, setMainImage] = useState<string>("");
  // Sub images (max 10)
  const [subImages, setSubImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    basePrice: "",
    salePrice: "",       // Giá khuyến mãi (để trống nếu không có)
    saleEndDate: "",     // Thời hạn flash sale (giờ VN)
    type: "PRODUCT",
    categoryId: "",
    status: "DRAFT",
    inventory: 0,
  });

  const [careGuide, setCareGuide] = useState({
    watering: "",
    sunlight: "",
    temperature: "",
    humidity: "",
    commonIssues: "",
    videoUrl: "",
  });

  useEffect(() => {
    fetch("/api/categories?nocache=true")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : (data.categories ?? [])))
      .catch(() => {});
  }, []);

  // Auto-slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { toast.error("Upload thất bại"); return null; }
    const data = await res.json();
    return data.url;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    const url = await uploadImage(file);
    if (url) { setMainImage(url); toast.success("Đã tải ảnh chính"); }
    setUploadingMain(false);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const handleSubImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (subImages.length + files.length > 10) {
      toast.error("Tối đa 10 ảnh phụ");
      return;
    }
    setUploadingSub(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setSubImages((prev) => [...prev, ...urls]);
    if (urls.length) toast.success(`Đã tải ${urls.length} ảnh phụ`);
    setUploadingSub(false);
    if (subImageInputRef.current) subImageInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) { toast.error("Vui lòng tải ảnh chính sản phẩm"); return; }
    setLoading(true);
    try {
      const allImages = [mainImage, ...subImages.filter(Boolean)];
      
      const cleanPrice = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, "")) || 0;
      };

      const productData: Record<string, unknown> = {
        ...formData,
        basePrice: cleanPrice(formData.basePrice),
        // Sale price: chỉ gửi nếu có giá
        salePrice: formData.salePrice ? cleanPrice(formData.salePrice) : null,
        // Sale end date: datetime-local đã là giờ VN, append +07:00 để parse đúng
        saleEndDate: formData.saleEndDate
          ? new Date(formData.saleEndDate + ":00+07:00").toISOString()
          : null,
        images: allImages,
        variantOptions: [],
        careGuideData: {
          watering: careGuide.watering,
          sunlight: careGuide.sunlight,
          temperature: careGuide.temperature,
          humidity: careGuide.humidity,
          commonIssues: careGuide.commonIssues || null,
          videoUrl: careGuide.videoUrl || null,
        },
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        toast.success("Tạo sản phẩm thành công!");
        router.push("/tiem-nho-nth24/products");
      } else {
        const err = await res.json();
        toast.error(err.error || "Lỗi khi tạo sản phẩm");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/tiem-nho-nth24/products" className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Thêm Sản Phẩm Mới</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Thông tin cơ bản ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Tên sản phẩm *"
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              required
              placeholder="VD: Terrarium Thủy Tinh Tròn"
            />
            <FormField
              label="Slug (URL)"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="terrarium-thuy-tinh-tron"
            />
            <FormField
              label="Giá cơ bản (VNĐ) *"
              type="text"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: formatVND(e.target.value) })}
              required
              placeholder="299.000"
            />
            <FormField
              label="Giá khuyến mãi (VNĐ)"
              type="text"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: formatVND(e.target.value) })}
              placeholder="Để trống nếu không giảm giá"
            />
            <FormField
              label="Tồn kho"
              type="number"
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
              min="0"
            />
            {/* Sale end date - chỉ hiển thị nếu có giá KM */}
            {formData.salePrice && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Thời Hạn Flash Sale <span className="text-[10px] text-[#425733] font-normal">(Giờ VN)</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.saleEndDate}
                  onChange={(e) => setFormData({ ...formData, saleEndDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                />
                <p className="text-xs text-gray-400 mt-1">Để trống nếu flash sale không có thời hạn</p>
              </div>
            )}
            <FormSelect
              label="Danh mục"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={[{ label: "-- Chọn danh mục --", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
            />
            <FormSelect
              label="Trạng thái"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: "Nháp", value: "DRAFT" },
                { label: "Đang bán", value: "ACTIVE" },
                { label: "Lưu trữ", value: "ARCHIVED" },
              ]}
            />
          </div>
        </div>

        {/* ── Ảnh sản phẩm ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5">Ảnh sản phẩm</h3>

          {/* Ảnh chính */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-gray-700">Ảnh chính</span>
              <span className="text-xs text-gray-400">(bắt buộc · hiển thị ở listing)</span>
            </div>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className={`relative w-40 h-40 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  mainImage
                    ? "border-[#425733] shadow-md"
                    : "border-dashed border-gray-300 hover:border-[#425733] bg-gray-50"
                }`}
              >
                {mainImage ? (
                  <>
                    <Image src={mainImage} alt="Ảnh chính" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">Đổi ảnh</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" /> Chính
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    {uploadingMain ? (
                      <div className="w-6 h-6 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs text-center px-2">Nhấn để tải ảnh chính</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Ảnh chính hiển thị trong danh sách sản phẩm và trang chi tiết. Khuyến nghị: tỷ lệ 1:1, tối thiểu 600×600px.</p>
                <button
                  type="button"
                  onClick={() => mainImageInputRef.current?.click()}
                  disabled={uploadingMain}
                  className="flex items-center gap-2 bg-[#425733] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#364a29] disabled:opacity-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingMain ? "Đang tải..." : mainImage ? "Thay ảnh chính" : "Tải ảnh chính"}
                </button>
              </div>
            </div>
          </div>

          {/* Ảnh phụ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ảnh phụ</span>
                <span className="text-xs text-gray-400">(tùy chọn · tối đa 10 ảnh)</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                subImages.length >= 10 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
              }`}>
                {subImages.length}/10
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3">
              {subImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <Image src={img} alt={`Ảnh phụ ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setSubImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {subImages.length < 10 && (
                <button
                  type="button"
                  onClick={() => subImageInputRef.current?.click()}
                  disabled={uploadingSub}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#425733] bg-gray-50 hover:bg-[#f5f7f4] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#425733]"
                >
                  {uploadingSub ? (
                    <div className="w-5 h-5 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px]">Thêm</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => subImageInputRef.current?.click()}
              disabled={uploadingSub || subImages.length >= 10}
              className="flex items-center gap-2 text-sm text-[#425733] hover:text-[#364a29] font-medium disabled:opacity-40 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {uploadingSub ? "Đang tải ảnh phụ..." : "Tải nhiều ảnh phụ cùng lúc"}
            </button>
          </div>

          {/* Hidden inputs */}
          <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
          <input ref={subImageInputRef} type="file" accept="image/*" multiple onChange={handleSubImageUpload} className="hidden" />
        </div>

        {/* ── Hướng dẫn chăm sóc ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#e3ebdd] flex items-center justify-center">
              <span className="text-sm">🪴</span>
            </div>
            <h3 className="text-base font-semibold text-gray-800">Hướng Dẫn Chăm Sóc</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tưới nước" type="text" value={careGuide.watering} onChange={(e) => setCareGuide({ ...careGuide, watering: e.target.value })} placeholder="VD: Tưới 2-3 lần/tuần" />
            <FormField label="Ánh sáng" type="text" value={careGuide.sunlight} onChange={(e) => setCareGuide({ ...careGuide, sunlight: e.target.value })} placeholder="VD: Ánh sáng gián tiếp" />
            <FormField label="Nhiệt độ" type="text" value={careGuide.temperature} onChange={(e) => setCareGuide({ ...careGuide, temperature: e.target.value })} placeholder="VD: 18–25°C" />
            <FormField label="Độ ẩm" type="text" value={careGuide.humidity} onChange={(e) => setCareGuide({ ...careGuide, humidity: e.target.value })} placeholder="VD: 60–80%" />
            <div className="md:col-span-2">
              <FormField label="Vấn đề thường gặp & cách xử lý" multiline rows={3} value={careGuide.commonIssues} onChange={(e) => setCareGuide({ ...careGuide, commonIssues: e.target.value })} placeholder="VD: Lá vàng → giảm tưới; Mốc trắng → tăng thông thoáng" />
            </div>
            <div className="md:col-span-2">
              <FormField label="Video hướng dẫn (URL)" type="url" value={careGuide.videoUrl} onChange={(e) => setCareGuide({ ...careGuide, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
            </div>
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Link href="/tiem-nho-nth24/products" className="px-6 py-2.5 border border-gray-200 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow hover:-translate-y-0.5 hover:bg-[#364a29] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            {loading ? "Đang tạo..." : "Tạo sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}
