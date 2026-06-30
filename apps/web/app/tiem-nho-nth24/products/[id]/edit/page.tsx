"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import {
  ArrowLeft, X, Save, Upload, Image as ImageIcon, Star, Plus, Loader2,
  Crop, Video,
} from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { FormField } from "@/components/admin/ui/FormField";
import { FormSelect } from "@/components/admin/ui/FormSelect";
import { SuggestionInput } from "@/components/admin/ui/SuggestionInput";
import { compressImage } from "@/lib/image";
import { ImageCropModal } from "@/components/ui/image-crop-modal";

const MAX_VIDEO_MB = 50;

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

// Convert UTC date to VN datetime-local input value
const toVNDatetimeLocal = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  // Add 7 hours for VN timezone
  const vnDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${vnDate.getFullYear()}-${pad(vnDate.getMonth() + 1)}-${pad(vnDate.getDate())}T${pad(vnDate.getHours())}:${pad(vnDate.getMinutes())}`;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const subImageInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef     = useRef<HTMLInputElement>(null);

  const [categories, setCategories]       = useState<Category[]>([]);
  const [loading, setLoading]             = useState(false);
  const [fetching, setFetching]           = useState(true);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub]   = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Crop state
  const [subCropQueue, setSubCropQueue] = useState<string[]>([]);
  const [reCropIdx, setReCropIdx]       = useState<number | null>(null);

  // Images
  const [mainImage, setMainImage] = useState<string>("");
  const [subImages, setSubImages] = useState<string[]>([]);
  // Video
  const [productVideo, setProductVideo] = useState<string>("");

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    basePrice: "",
    salePrice: "",
    saleEndDate: "",
    type: "PRODUCT",
    categoryId: "",
    status: "DRAFT",
    inventory: "",
    isFeatured: false,
    size: "",
    soil: "",
    moss: "",
    driftwood: "",
    accessories: "",
  });

  const [careGuide, setCareGuide] = useState({
    watering: "",
    sunlight: "",
    temperature: "",
    humidity: "",
    commonIssues: "",
    videoUrl: "",
  });

  const [tempMin, setTempMin] = useState(18);
  const [tempMax, setTempMax] = useState(25);
  const [humidityMin, setHumidityMin] = useState(60);
  const [humidityMax, setHumidityMax] = useState(80);

  const [suggestions, setSuggestions] = useState<{
    watering: string[];
    sunlight: string[];
    commonIssues: string[];
    size: string[];
    soil: string[];
    moss: string[];
    driftwood: string[];
    accessories: string[];
  }>({
    watering: [],
    sunlight: [],
    commonIssues: [],
    size: [],
    soil: [],
    moss: [],
    driftwood: [],
    accessories: [],
  });

  const parseRange = (val: string | null | undefined, defaultMin: number, defaultMax: number): [number, number] => {
    if (!val) return [defaultMin, defaultMax];
    const match = val.match(/(\d+)\s*[-–~to]\s*(\d+)/i);
    if (match) {
      return [parseInt(match[1]) || defaultMin, parseInt(match[2]) || defaultMax];
    }
    const singleMatch = val.match(/(\d+)/);
    if (singleMatch) {
      const num = parseInt(singleMatch[1]) || defaultMin;
      return [num, num];
    }
    return [defaultMin, defaultMax];
  };

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories?nocache=true")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : (data.categories ?? [])))
      .catch(() => {});

    fetch("/api/admin/care-guides/suggestions")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSuggestions(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch existing product data
  useEffect(() => {
    if (!productId) return;
    setFetching(true);
    fetch(`/api/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((product) => {
        // Pre-fill form
        setFormData({
          slug: product.slug || "",
          name: product.name || "",
          basePrice: formatVND(product.basePrice?.toString() || "0"),
          salePrice: product.salePrice ? formatVND(product.salePrice.toString()) : "",
          saleEndDate: toVNDatetimeLocal(product.saleEndDate),
          type: product.type || "PRODUCT",
          categoryId: product.categoryId || "",
          status: product.status || "DRAFT",
          inventory: product.inventory != null ? String(product.inventory) : "",
          isFeatured: product.featured ?? false,
          size: product.size || "",
          soil: product.soil || "",
          moss: product.moss || "",
          driftwood: product.driftwood || "",
          accessories: product.accessories || "",
        });

        // Pre-fill images
        if (product.images && product.images.length > 0) {
          setMainImage(product.images[0]);
          setSubImages(product.images.slice(1));
        }
        // Pre-fill video
        if (product.careGuide?.videoUrl) {
          const url = product.careGuide.videoUrl;
          // If it looks like an uploaded file URL (not YouTube/TikTok), show as productVideo
          if (!url.includes("youtube") && !url.includes("youtu.be") && !url.includes("tiktok")) {
            setProductVideo(url);
          }
        }

        // Pre-fill care guide
        if (product.careGuide) {
          const watering = product.careGuide.watering || "";
          const sunlight = product.careGuide.sunlight || "";
          const temperature = product.careGuide.temperature || "";
          const humidity = product.careGuide.humidity || "";
          const commonIssues = product.careGuide.commonIssues || "";
          const videoUrl = product.careGuide.videoUrl || "";

          setCareGuide({
            watering,
            sunlight,
            temperature,
            humidity,
            commonIssues,
            videoUrl,
          });

          // Parse range values
          const [tMin, tMax] = parseRange(temperature, 18, 25);
          setTempMin(tMin);
          setTempMax(tMax);

          const [hMin, hMax] = parseRange(humidity, 60, 80);
          setHumidityMin(hMin);
          setHumidityMax(hMax);
        }
      })
      .catch(() => {
        showToast.error("Không tìm thấy sản phẩm");
        router.push("/tiem-nho-nth24/products");
      })
      .finally(() => setFetching(false));
  }, [productId, router]);

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
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append("file", compressed);
    fd.append("bucket", "products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { showToast.error("Upload thất bại"); return null; }
    const data = await res.json();
    return data.url;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setMainImage(url);
        showToast.success("Đã tải ảnh chính");
      }
    } finally {
      setUploadingMain(false);
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
    }
  };

  const handleSubImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (subImages.length + files.length > 10) { showToast.error("Tối đa 10 ảnh phụ"); return; }
    // Build crop queue — crop lần lượt từng ảnh
    const queue = files.map((f) => URL.createObjectURL(f));
    setSubCropQueue(queue);
    if (subImageInputRef.current) subImageInputRef.current.value = "";
  };

  const handleSubCropConfirm = async (blob: Blob) => {
    setUploadingSub(true);
    const url = await uploadImage(new File([blob], "sub.jpg", { type: "image/jpeg" }));
    if (url) setSubImages((prev) => [...prev, url]);
    setSubCropQueue((prev) => prev.slice(1));
    setUploadingSub(false);
  };

  const handleSubCropCancel = () => {
    subCropQueue.forEach((u) => URL.revokeObjectURL(u));
    setSubCropQueue([]);
  };

  // Re-crop ảnh phụ đã upload
  const handleReCropSelect = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReCropIdx(idx);
    setSubCropQueue([URL.createObjectURL(file)]);
    e.target.value = "";
  };

  const handleReCropConfirm = async (blob: Blob) => {
    if (reCropIdx === null) return;
    setUploadingSub(true);
    const url = await uploadImage(new File([blob], "sub.jpg", { type: "image/jpeg" }));
    if (url) {
      setSubImages((prev) => prev.map((img, i) => (i === reCropIdx ? url : img)));
      showToast.success("Đã cập nhật ảnh phụ");
    }
    setReCropIdx(null);
    setSubCropQueue([]);
    setUploadingSub(false);
  };

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showToast.error(`Video quá lớn! Tối đa ${MAX_VIDEO_MB}MB`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    setUploadingVideo(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setProductVideo(data.url);
      setCareGuide((prev) => ({ ...prev, videoUrl: data.url }));
      showToast.success("Đã tải video lên thành công!");
    } else {
      showToast.error("Upload video thất bại");
    }
    setUploadingVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) { showToast.error("Vui lòng tải ảnh chính sản phẩm"); return; }
    setLoading(true);
    try {
      const allImages = [mainImage, ...subImages.filter(Boolean)];
      
      const cleanPrice = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, "")) || 0;
      };

      const base = cleanPrice(formData.basePrice);
      const sale = formData.salePrice ? cleanPrice(formData.salePrice) : null;
      if (sale !== null && sale >= base) {
        showToast.error("Giá khuyến mãi phải nhỏ hơn giá gốc");
        setLoading(false);
        return;
      }

      const inventoryVal = formData.inventory === "" ? 0 : parseInt(formData.inventory) || 0;

      const productData: Record<string, unknown> = {
        ...formData,
        inventory: inventoryVal,
        basePrice: cleanPrice(formData.basePrice),
        salePrice: formData.salePrice ? cleanPrice(formData.salePrice) : null,
        saleEndDate: formData.saleEndDate
          ? new Date(formData.saleEndDate + ":00+07:00").toISOString()
          : null,
        images: allImages,
        size: formData.size || null,
        soil: formData.soil || null,
        moss: formData.moss || null,
        driftwood: formData.driftwood || null,
        accessories: formData.accessories || null,
        careGuideData: {
          watering: careGuide.watering,
          sunlight: careGuide.sunlight,
          temperature: careGuide.temperature,
          humidity: careGuide.humidity,
          commonIssues: careGuide.commonIssues || null,
          videoUrl: careGuide.videoUrl || null,
        },
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        showToast.success("Cập nhật sản phẩm thành công!");
        router.push("/tiem-nho-nth24/products");
      } else {
        const err = await res.json();
        showToast.error(err.error || "Lỗi khi cập nhật sản phẩm");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#425733]" />
        <p className="text-sm text-gray-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  return (
    <>
    <div>
      <div className="mb-6">
        <Link href="/tiem-nho-nth24/products" className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Sản Phẩm</h2>
        <p className="text-sm text-gray-400 mt-1">Cập nhật thông tin sản phẩm hiện tại</p>
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
              onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
              min="0"
              placeholder="Nhập số lượng tồn kho"
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
            <div className="flex items-center gap-2 md:col-span-2 py-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
              />
              <label htmlFor="isFeatured" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Sản phẩm nổi bật (Featured) 🔥
              </label>
            </div>
          </div>
        </div>

        {/* ── Ảnh sản phẩm ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5">Ảnh & Video Sản Phẩm</h3>

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
                    <ImageWrapper src={mainImage} alt="Ảnh chính" fill noRound className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
                      <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">Đổi ảnh</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" /> Chính
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    {uploadingMain ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#425733]" />
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
                <p className="text-xs text-gray-500 mb-2">Ảnh chính hiển thị trong danh sách sản phẩm và trang chi tiết. Khuyến nghị: tỷ lệ 1:1, tối thiểu 600×600px. Hệ thống sẽ tải ảnh trực tiếp, không cần cắt thủ công.</p>
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ảnh phụ</span>
                <span className="text-xs text-gray-400">(tùy chọn · tối đa 10 ảnh · click ✏️ để crop lại)</span>
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
                  <ImageWrapper src={img} alt={`Ảnh phụ ${idx + 1}`} fill noRound className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                    <label className="opacity-0 group-hover:opacity-100 cursor-pointer w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-all" title="Crop lại ảnh này">
                      <Crop className="w-3.5 h-3.5 text-[#425733]" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReCropSelect(e, idx)} />
                    </label>
                    <button type="button" onClick={() => setSubImages((prev) => prev.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow transition-all" title="Xóa ảnh này">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {subImages.length < 10 && (
                <button type="button" onClick={() => subImageInputRef.current?.click()} disabled={uploadingSub} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#425733] bg-gray-50 hover:bg-[#f5f7f4] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#425733]">
                  {uploadingSub ? <Loader2 className="w-5 h-5 animate-spin text-[#425733]" /> : <><Plus className="w-5 h-5" /><span className="text-[10px]">Thêm</span></>}
                </button>
              )}
            </div>

            <button type="button" onClick={() => subImageInputRef.current?.click()} disabled={uploadingSub || subImages.length >= 10} className="flex items-center gap-2 text-sm text-[#425733] hover:text-[#364a29] font-medium disabled:opacity-40 transition-colors">
              <Upload className="w-4 h-4" />
              {uploadingSub ? `Đang crop & tải (còn ${subCropQueue.length} ảnh)...` : "Tải nhiều ảnh phụ cùng lúc (sẽ crop từng ảnh)"}
            </button>
          </div>

          {/* Video sản phẩm */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-[#425733]" />
              <span className="text-sm font-medium text-gray-700">Video sản phẩm</span>
              <span className="text-xs text-gray-400">(tùy chọn · tối đa {MAX_VIDEO_MB}MB · MP4/WebM/MOV)</span>
            </div>
            {productVideo && (
              <div className="relative mb-3 rounded-xl overflow-hidden border border-[#425733]/30 bg-black aspect-video max-w-sm">
                <video src={productVideo} controls className="w-full h-full object-contain" />
                <button type="button" onClick={() => { setProductVideo(""); setCareGuide((p) => ({ ...p, videoUrl: careGuide.videoUrl === productVideo ? "" : careGuide.videoUrl })); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors" title="Xóa video">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo} className="flex items-center gap-2 px-4 py-2 border-2 border-[#425733] text-[#425733] rounded-full text-sm font-semibold hover:bg-[#f0f4ee] disabled:opacity-50 transition-colors">
                {uploadingVideo ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải video...</> : <><Upload className="w-4 h-4" /> {productVideo ? "Thay video" : "Upload video"}</>}
              </button>
              {!productVideo && <span className="text-xs text-gray-400">hoặc dán URL YouTube</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Upload video trực tiếp ≤{MAX_VIDEO_MB}MB (MP4/WebM/MOV). URL YouTube đặt ở mục Chăm Sóc bên dưới.</p>
          </div>

          {/* Hidden inputs */}
          <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
          <input ref={subImageInputRef} type="file" accept="image/*" multiple onChange={handleSubImageUpload} className="hidden" />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/mov" onChange={handleVideoUpload} className="hidden" />
        </div>

        {/* ── Thông số chi tiết ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#e3ebdd] flex items-center justify-center">
              <span className="text-sm">📐</span>
            </div>
            <h3 className="text-base font-semibold text-gray-800">Thông Số Chi Tiết</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SuggestionInput 
              label="Size bể" 
              value={formData.size} 
              onChange={(val) => setFormData({ ...formData, size: val })} 
              placeholder="VD: 15x15x20cm, D18cm" 
              suggestions={suggestions.size}
            />

            <SuggestionInput 
              label="Loại đất" 
              value={formData.soil} 
              onChange={(val) => setFormData({ ...formData, soil: val })} 
              placeholder="VD: Đất bán cạn chuyên dụng, Akadama" 
              suggestions={suggestions.soil}
            />

            <SuggestionInput 
              label="Dùng rêu gì" 
              value={formData.moss} 
              onChange={(val) => setFormData({ ...formData, moss: val })} 
              placeholder="VD: Rêu đầu trắng, rêu cỏ, rêu nhung" 
              suggestions={suggestions.moss}
            />

            <SuggestionInput 
              label="Bố cục lũa" 
              value={formData.driftwood} 
              onChange={(val) => setFormData({ ...formData, driftwood: val })} 
              placeholder="VD: Lũa linh sam, lũa đỗ quyên" 
              suggestions={suggestions.driftwood}
            />

            <div className="md:col-span-2">
              <SuggestionInput 
                label="Phụ kiện kèm theo" 
                multiline 
                rows={2}
                value={formData.accessories} 
                onChange={(val) => setFormData({ ...formData, accessories: val })} 
                placeholder="VD: Đèn LED, tượng trang trí, nhíp gắp" 
                suggestions={suggestions.accessories}
              />
            </div>
          </div>
        </div>

        {/* ── Hướng dẫn chăm sóc ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#e3ebdd] flex items-center justify-center">
              <span className="text-sm">🪴</span>
            </div>
            <h3 className="text-base font-semibold text-gray-800">Hướng Dẫn Chăm Sóc</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SuggestionInput 
              label="Tưới nước" 
              value={careGuide.watering} 
              onChange={(val) => setCareGuide({ ...careGuide, watering: val })} 
              placeholder="VD: Tưới 2-3 lần/tuần" 
              suggestions={suggestions.watering}
            />

            <SuggestionInput 
              label="Ánh sáng" 
              value={careGuide.sunlight} 
              onChange={(val) => setCareGuide({ ...careGuide, sunlight: val })} 
              placeholder="VD: Ánh sáng gián tiếp" 
              suggestions={suggestions.sunlight}
            />

            {/* Range slider for Temperature */}
            <div className="flex flex-col gap-1 w-full bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700">
                Nhiệt độ thích hợp: <span className="text-[#425733] font-bold text-base">{tempMin}°C - {tempMax}°C</span>
              </label>
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>Tối thiểu</span>
                    <span className="font-semibold">{tempMin}°C</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={tempMin} 
                    onChange={(e) => {
                      const minVal = Math.min(parseInt(e.target.value) || 0, tempMax);
                      setTempMin(minVal);
                      setCareGuide(prev => ({ ...prev, temperature: `${minVal}-${tempMax}°C` }));
                    }}
                    className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>Tối đa</span>
                    <span className="font-semibold">{tempMax}°C</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={tempMax} 
                    onChange={(e) => {
                      const maxVal = Math.max(parseInt(e.target.value) || 0, tempMin);
                      setTempMax(maxVal);
                      setCareGuide(prev => ({ ...prev, temperature: `${tempMin}-${maxVal}°C` }));
                    }}
                    className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" 
                  />
                </div>
              </div>
            </div>

            {/* Range slider for Humidity */}
            <div className="flex flex-col gap-1 w-full bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700">
                Độ ẩm thích hợp: <span className="text-[#425733] font-bold text-base">{humidityMin}% - {humidityMax}%</span>
              </label>
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>Tối thiểu</span>
                    <span className="font-semibold">{humidityMin}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={humidityMin} 
                    onChange={(e) => {
                      const minVal = Math.min(parseInt(e.target.value) || 0, humidityMax);
                      setHumidityMin(minVal);
                      setCareGuide(prev => ({ ...prev, humidity: `${minVal}-${humidityMax}%` }));
                    }}
                    className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>Tối đa</span>
                    <span className="font-semibold">{humidityMax}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={humidityMax} 
                    onChange={(e) => {
                      const maxVal = Math.max(parseInt(e.target.value) || 0, humidityMin);
                      setHumidityMax(maxVal);
                      setCareGuide(prev => ({ ...prev, humidity: `${humidityMin}-${maxVal}%` }));
                    }}
                    className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" 
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <SuggestionInput 
                label="Vấn đề thường gặp & cách xử lý" 
                multiline 
                rows={3}
                value={careGuide.commonIssues} 
                onChange={(val) => setCareGuide({ ...careGuide, commonIssues: val })} 
                placeholder="VD: Lá vàng → giảm tưới; Mốc trắng → tăng thông thoáng" 
                suggestions={suggestions.commonIssues}
              />
            </div>

            <div className="md:col-span-2">
              <FormField 
                label="Video hướng dẫn (URL)" 
                type="url" 
                value={careGuide.videoUrl} 
                onChange={(e) => setCareGuide({ ...careGuide, videoUrl: e.target.value })} 
                placeholder="https://youtube.com/..." 
              />
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
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>

      {/* Crop Modal: Ảnh phụ queue */}
      {subCropQueue[0] && reCropIdx === null && (
        <ImageCropModal src={subCropQueue[0]}
          title={`Ảnh Phụ — Kéo để cắt ${subCropQueue.length > 1 ? `(còn ${subCropQueue.length} ảnh)` : ""}`}
          onConfirm={handleSubCropConfirm}
          onCancel={handleSubCropCancel} />
      )}

      {/* Crop Modal: Re-crop ảnh phụ đã upload */}
      {subCropQueue[0] && reCropIdx !== null && (
        <ImageCropModal src={subCropQueue[0]} title={`Cắt lại Ảnh Phụ #${reCropIdx + 1}`}
          onConfirm={handleReCropConfirm}
          onCancel={() => { URL.revokeObjectURL(subCropQueue[0]); setSubCropQueue([]); setReCropIdx(null); }} />
      )}
    </>
  );
}

