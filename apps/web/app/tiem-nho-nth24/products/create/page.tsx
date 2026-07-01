"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import {
  ArrowLeft, X, Save, Upload, Image as ImageIcon, Star, Plus,
  Crop, Video, Loader2,
} from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { FormField } from "@/components/admin/ui/FormField";
import { FormSelect } from "@/components/admin/ui/FormSelect";
import { SuggestionInput } from "@/components/admin/ui/SuggestionInput";
import { compressImage } from "@/lib/image";
import { ImageCropModal } from "@/components/ui/image-crop-modal";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const formatVND = (value: string | number) => {
  if (value === undefined || value === null) return "";
  const clean = String(value).replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("vi-VN").format(parseInt(clean));
};

const MAX_VIDEO_MB = 50;
const CREATE_PRODUCT_DRAFT_KEY = "tiemreu:create-product:draft:v1";
const DRAFT_NAVIGATION_MESSAGE = "Bạn có thay đổi chưa lưu. Dữ liệu đã được giữ tạm, bạn vẫn muốn rời trang?";

const DEFAULT_FORM_DATA = {
  slug: "",
  name: "",
  basePrice: "",
  salePrice: "",
  saleEndDate: "",
  type: "PRODUCT",
  categoryId: "",
  status: "DRAFT",
  inventory: 0,
  isFeatured: false,
  size: "",
  soil: "",
  moss: "",
  driftwood: "",
  accessories: "",
};

export default function CreateProductPage() {
  const router = useRouter();
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const subImageInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef     = useRef<HTMLInputElement>(null);
  const draftHydratedRef = useRef(false);
  const allowNavigationRef = useRef(false);

  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub]   = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Crop states
  const [subCropQueue, setSubCropQueue] = useState<string[]>([]);   // queue of objectURLs
  const [reCropIdx, setReCropIdx]       = useState<number | null>(null); // index to re-crop

  // Images
  const [mainImage, setMainImage] = useState<string>("");
  const [subImages, setSubImages] = useState<string[]>([]);

  // Video
  const [productVideo, setProductVideo] = useState<string>("");

  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA });

  const [careGuide, setCareGuide] = useState({
    watering: "",
    sunlight: "",
    temperature: "18-25°C",
    humidity: "60-80%",
    commonIssues: "",
    videoUrl: "",
  });

  const [tempMin, setTempMin]       = useState(18);
  const [tempMax, setTempMax]       = useState(25);
  const [humidityMin, setHumidityMin] = useState(60);
  const [humidityMax, setHumidityMax] = useState(80);

  const [suggestions, setSuggestions] = useState<{
    watering: string[]; sunlight: string[]; commonIssues: string[];
    size: string[]; soil: string[]; moss: string[];
    driftwood: string[]; accessories: string[];
  }>({ watering: [], sunlight: [], commonIssues: [], size: [], soil: [], moss: [], driftwood: [], accessories: [] });

  useEffect(() => {
    fetch("/api/categories?nocache=true")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : (data.categories ?? [])))
      .catch(() => {});

    fetch("/api/admin/care-guides/suggestions")
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setSuggestions(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(CREATE_PRODUCT_DRAFT_KEY);
      if (!rawDraft) {
        draftHydratedRef.current = true;
        return;
      }

      const draft = JSON.parse(rawDraft);
      if (draft?.formData) setFormData((prev) => ({ ...prev, ...draft.formData }));
      if (draft?.careGuide) setCareGuide((prev) => ({ ...prev, ...draft.careGuide }));
      if (typeof draft?.mainImage === "string") setMainImage(draft.mainImage);
      if (Array.isArray(draft?.subImages)) setSubImages(draft.subImages);
      if (typeof draft?.productVideo === "string") setProductVideo(draft.productVideo);
      if (typeof draft?.tempMin === "number") setTempMin(draft.tempMin);
      if (typeof draft?.tempMax === "number") setTempMax(draft.tempMax);
      if (typeof draft?.humidityMin === "number") setHumidityMin(draft.humidityMin);
      if (typeof draft?.humidityMax === "number") setHumidityMax(draft.humidityMax);

      showToast.success("Đã khôi phục bản nháp sản phẩm chưa lưu");
    } catch {
      window.localStorage.removeItem(CREATE_PRODUCT_DRAFT_KEY);
    } finally {
      draftHydratedRef.current = true;
    }
  }, []);

  const hasUnsavedDraft = useCallback(() => {
    if (allowNavigationRef.current) return false;
    return Boolean(
      formData.name ||
      formData.slug ||
      formData.basePrice ||
      formData.salePrice ||
      formData.saleEndDate ||
      formData.categoryId ||
      formData.inventory ||
      formData.isFeatured ||
      formData.size ||
      formData.soil ||
      formData.moss ||
      formData.driftwood ||
      formData.accessories ||
      careGuide.watering ||
      careGuide.sunlight ||
      careGuide.commonIssues ||
      careGuide.videoUrl ||
      mainImage ||
      subImages.length > 0 ||
      productVideo
    );
  }, [formData, careGuide, mainImage, subImages, productVideo]);

  useEffect(() => {
    if (!draftHydratedRef.current || allowNavigationRef.current) return;

    const draft = {
      formData,
      careGuide,
      mainImage,
      subImages,
      productVideo,
      tempMin,
      tempMax,
      humidityMin,
      humidityMax,
      savedAt: new Date().toISOString(),
    };

    if (hasUnsavedDraft()) {
      window.localStorage.setItem(CREATE_PRODUCT_DRAFT_KEY, JSON.stringify(draft));
    } else {
      window.localStorage.removeItem(CREATE_PRODUCT_DRAFT_KEY);
    }
  }, [formData, careGuide, mainImage, subImages, productVideo, tempMin, tempMax, humidityMin, humidityMax, hasUnsavedDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedDraft()) return;
      event.preventDefault();
      event.returnValue = DRAFT_NAVIGATION_MESSAGE;
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedDraft()) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const confirmed = window.confirm(DRAFT_NAVIGATION_MESSAGE);
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [formData, careGuide, mainImage, subImages, productVideo, tempMin, tempMax, humidityMin, humidityMax, hasUnsavedDraft]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append("file", compressed);
    fd.append("bucket", "products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { showToast.error("Upload ảnh thất bại"); return null; }
    return (await res.json()).url;
  };

  // ── Ảnh chính ─────────────────────────────────────────
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

  // ── Ảnh phụ — upload trực tiếp, crop lại là tùy chọn ──
  const handleSubImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (subImages.length + files.length > 10) { showToast.error("Tối đa 10 ảnh phụ"); return; }
    setUploadingSub(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadImage(file);
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        setSubImages((prev) => [...prev, ...uploadedUrls]);
        showToast.success(`Đã tải thêm ${uploadedUrls.length} ảnh phụ`);
      }
    } finally {
      setUploadingSub(false);
      if (subImageInputRef.current) subImageInputRef.current.value = "";
    }
  };

  // ── Re-crop ảnh phụ đã upload ─────────────────────────
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

  // ── Video upload ──────────────────────────────────────
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showToast.error(`Video quá lớn! Tối đa ${MAX_VIDEO_MB}MB`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.url) {
        setProductVideo(data.url);
        setCareGuide((prev) => ({ ...prev, videoUrl: data.url }));
        showToast.success("Đã tải video lên thành công!");
      } else {
        showToast.error(data?.error || "Upload video thất bại");
      }
    } catch (error) {
      showToast.error("Không kết nối được server upload. Vui lòng thử lại.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) { showToast.error("Vui lòng tải ảnh chính sản phẩm"); return; }
    setLoading(true);
    try {
      const allImages = [mainImage, ...subImages.filter(Boolean)];
      const cleanPrice = (val: string) => !val ? 0 : parseFloat(val.replace(/\./g, "")) || 0;
      const base = cleanPrice(formData.basePrice);
      const sale = formData.salePrice ? cleanPrice(formData.salePrice) : null;
      if (sale !== null && sale >= base) {
        showToast.error("Giá khuyến mãi phải nhỏ hơn giá gốc");
        setLoading(false);
        return;
      }
      const productData: Record<string, unknown> = {
        ...formData,
        basePrice: cleanPrice(formData.basePrice),
        salePrice: formData.salePrice ? cleanPrice(formData.salePrice) : null,
        saleEndDate: formData.saleEndDate ? new Date(formData.saleEndDate + ":00+07:00").toISOString() : null,
        images: allImages,
        variantOptions: [],
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
          videoUrl: productVideo || careGuide.videoUrl || null,
        },
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        allowNavigationRef.current = true;
        window.localStorage.removeItem(CREATE_PRODUCT_DRAFT_KEY);
        showToast.success("Tạo sản phẩm thành công!");
        router.push("/tiem-nho-nth24/products");
      } else {
        const err = await res.json();
        const detail = Array.isArray(err.details) && err.details[0]?.message ? err.details[0].message : "";

        if (err.existingProduct?.id) {
          const shouldOpenExisting = window.confirm(
            `${err.error}\n\nBạn có muốn mở sản phẩm đang giữ slug "${err.existingProduct.slug}" để kiểm tra không?`
          );

          if (shouldOpenExisting) {
            allowNavigationRef.current = true;
            router.push(`/tiem-nho-nth24/products/${err.existingProduct.id}/edit`);
          }

          return;
        }
        showToast.error(err.error || detail || "Lỗi khi tạo sản phẩm");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  // Crop src hiện tại (queue item đầu tiên, hoặc re-crop)
  const currentSubCropSrc = subCropQueue[0] ?? null;

  return (
    <>
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
            <FormField label="Tên sản phẩm *" type="text" value={formData.name} onChange={handleNameChange} required placeholder="VD: Terrarium Thủy Tinh Tròn" />
            <FormField label="Slug (URL)" type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required placeholder="terrarium-thuy-tinh-tron" />
            <FormField label="Giá cơ bản (VNĐ) *" type="text" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: formatVND(e.target.value) })} required placeholder="299.000" />
            <FormField label="Giá khuyến mãi (VNĐ)" type="text" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: formatVND(e.target.value) })} placeholder="Để trống nếu không giảm giá" />
            <FormField label="Tồn kho" type="number" value={formData.inventory} onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })} min="0" />
            {formData.salePrice && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời Hạn Flash Sale <span className="text-[10px] text-[#425733] font-normal">(Giờ VN)</span></label>
                <input type="datetime-local" value={formData.saleEndDate} onChange={(e) => setFormData({ ...formData, saleEndDate: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50" />
                <p className="text-xs text-gray-400 mt-1">Để trống nếu flash sale không có thời hạn</p>
              </div>
            )}
            <FormSelect label="Danh mục" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} options={[{ label: "-- Chọn danh mục --", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]} />
            <FormSelect label="Trạng thái" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ label: "Nháp", value: "DRAFT" }, { label: "Đang bán", value: "ACTIVE" }, { label: "Lưu trữ", value: "ARCHIVED" }]} />
            <div className="flex items-center gap-2 md:col-span-2 py-2">
              <input type="checkbox" id="isFeatured" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]" />
              <label htmlFor="isFeatured" className="text-sm font-semibold text-gray-700 cursor-pointer">Sản phẩm nổi bật (Featured) 🔥</label>
            </div>
          </div>
        </div>

        {/* ── Ảnh & Video sản phẩm ──────────────────────────── */}
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
              <div onClick={() => mainImageInputRef.current?.click()} className={`relative w-40 h-40 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${mainImage ? "border-[#425733] shadow-md" : "border-dashed border-gray-300 hover:border-[#425733] bg-gray-50"}`}>
                {mainImage ? (
                  <>
                    <ImageWrapper src={mainImage} alt="Ảnh chính" fill noRound className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                      <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">Đổi ảnh</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" /> Chính
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    {uploadingMain ? <Loader2 className="w-6 h-6 animate-spin text-[#425733]" /> : <><ImageIcon className="w-8 h-8" /><span className="text-xs text-center px-2">Nhấn để tải ảnh chính</span></>}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Ảnh chính hiển thị trong danh sách sản phẩm và trang chi tiết. Khuyến nghị: tỷ lệ 1:1, tối thiểu 600×600px. Hệ thống sẽ tải ảnh trực tiếp, không cần cắt thủ công.</p>
                <button type="button" onClick={() => mainImageInputRef.current?.click()} disabled={uploadingMain} className="flex items-center gap-2 bg-[#425733] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#364a29] disabled:opacity-50 transition-colors">
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
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subImages.length >= 10 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                {subImages.length}/10
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3">
              {subImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <ImageWrapper src={img} alt={`Ảnh phụ ${idx + 1}`} fill noRound className="object-cover" />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                    {/* Re-crop button */}
                    <label className="opacity-0 group-hover:opacity-100 cursor-pointer w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-all" title="Crop lại ảnh này">
                      <Crop className="w-3.5 h-3.5 text-[#425733]" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReCropSelect(e, idx)} />
                    </label>
                    {/* Delete button */}
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
              {uploadingSub ? "Đang tải ảnh phụ..." : "Tải nhiều ảnh phụ cùng lúc"}
            </button>
          </div>

          {/* Video sản phẩm */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-[#425733]" />
              <span className="text-sm font-medium text-gray-700">Video sản phẩm</span>
              <span className="text-xs text-gray-400">(tùy chọn · tối đa {MAX_VIDEO_MB}MB · MP4/WebM/MOV)</span>
            </div>

            {/* Video preview */}
            {productVideo && (
              <div className="relative mb-3 rounded-xl overflow-hidden border border-[#425733]/30 bg-black aspect-video max-w-sm">
                <video src={productVideo} controls className="w-full h-full object-contain" />
                <button type="button" onClick={() => { setProductVideo(""); setCareGuide((p) => ({ ...p, videoUrl: "" })); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors" title="Xóa video">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#425733] text-[#425733] rounded-full text-sm font-semibold hover:bg-[#f0f4ee] disabled:opacity-50 transition-colors">
                {uploadingVideo ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải video...</> : <><Upload className="w-4 h-4" /> {productVideo ? "Thay video" : "Upload video"}</>}
              </button>
              {!productVideo && <span className="text-xs text-gray-400">hoặc</span>}
              {!productVideo && (
                <div className="flex-1 min-w-[200px]">
                  <input type="url" value={careGuide.videoUrl} onChange={(e) => setCareGuide({ ...careGuide, videoUrl: e.target.value })}
                    placeholder="Dán URL YouTube / TikTok..." className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Upload video trực tiếp ≤{MAX_VIDEO_MB}MB, hoặc dán URL YouTube/TikTok.</p>
          </div>

          {/* Hidden inputs */}
          <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
          <input ref={subImageInputRef} type="file" accept="image/*" multiple onChange={handleSubImageUpload} className="hidden" />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/mov" onChange={handleVideoUpload} className="hidden" />
        </div>

        {/* ── Thông số chi tiết ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#e3ebdd] flex items-center justify-center"><span className="text-sm">📐</span></div>
            <h3 className="text-base font-semibold text-gray-800">Thông Số Chi Tiết</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SuggestionInput label="Size bể" value={formData.size} onChange={(val) => setFormData({ ...formData, size: val })} placeholder="VD: 15x15x20cm, D18cm" suggestions={suggestions.size} />
            <SuggestionInput label="Loại đất" value={formData.soil} onChange={(val) => setFormData({ ...formData, soil: val })} placeholder="VD: Đất bán cạn chuyên dụng, Akadama" suggestions={suggestions.soil} />
            <SuggestionInput label="Dùng rêu gì" value={formData.moss} onChange={(val) => setFormData({ ...formData, moss: val })} placeholder="VD: Rêu đầu trắng, rêu cỏ, rêu nhung" suggestions={suggestions.moss} />
            <SuggestionInput label="Bố cục lũa" value={formData.driftwood} onChange={(val) => setFormData({ ...formData, driftwood: val })} placeholder="VD: Lũa linh sam, lũa đỗ quyên" suggestions={suggestions.driftwood} />
            <div className="md:col-span-2">
              <SuggestionInput label="Phụ kiện kèm theo" multiline rows={2} value={formData.accessories} onChange={(val) => setFormData({ ...formData, accessories: val })} placeholder="VD: Đèn LED, tượng trang trí, nhíp gắp" suggestions={suggestions.accessories} />
            </div>
          </div>
        </div>

        {/* ── Hướng dẫn chăm sóc ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#e3ebdd] flex items-center justify-center"><span className="text-sm">🪴</span></div>
            <h3 className="text-base font-semibold text-gray-800">Hướng Dẫn Chăm Sóc</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SuggestionInput label="Tưới nước" value={careGuide.watering} onChange={(val) => setCareGuide({ ...careGuide, watering: val })} placeholder="VD: Tưới 2-3 lần/tuần" suggestions={suggestions.watering} />
            <SuggestionInput label="Ánh sáng" value={careGuide.sunlight} onChange={(val) => setCareGuide({ ...careGuide, sunlight: val })} placeholder="VD: Ánh sáng gián tiếp" suggestions={suggestions.sunlight} />

            {/* Temperature range */}
            <div className="flex flex-col gap-1 w-full bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700">Nhiệt độ thích hợp: <span className="text-[#425733] font-bold text-base">{tempMin}°C - {tempMax}°C</span></label>
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>Tối thiểu</span><span className="font-semibold">{tempMin}°C</span></div>
                  <input type="range" min="0" max="50" value={tempMin} onChange={(e) => { const v = Math.min(parseInt(e.target.value)||0, tempMax); setTempMin(v); setCareGuide(p => ({ ...p, temperature: `${v}-${tempMax}°C` })); }} className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>Tối đa</span><span className="font-semibold">{tempMax}°C</span></div>
                  <input type="range" min="0" max="50" value={tempMax} onChange={(e) => { const v = Math.max(parseInt(e.target.value)||0, tempMin); setTempMax(v); setCareGuide(p => ({ ...p, temperature: `${tempMin}-${v}°C` })); }} className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" />
                </div>
              </div>
            </div>

            {/* Humidity range */}
            <div className="flex flex-col gap-1 w-full bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700">Độ ẩm thích hợp: <span className="text-[#425733] font-bold text-base">{humidityMin}% - {humidityMax}%</span></label>
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>Tối thiểu</span><span className="font-semibold">{humidityMin}%</span></div>
                  <input type="range" min="0" max="100" value={humidityMin} onChange={(e) => { const v = Math.min(parseInt(e.target.value)||0, humidityMax); setHumidityMin(v); setCareGuide(p => ({ ...p, humidity: `${v}-${humidityMax}%` })); }} className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>Tối đa</span><span className="font-semibold">{humidityMax}%</span></div>
                  <input type="range" min="0" max="100" value={humidityMax} onChange={(e) => { const v = Math.max(parseInt(e.target.value)||0, humidityMin); setHumidityMax(v); setCareGuide(p => ({ ...p, humidity: `${humidityMin}-${v}%` })); }} className="w-full accent-[#425733] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <SuggestionInput label="Vấn đề thường gặp & cách xử lý" multiline rows={3} value={careGuide.commonIssues} onChange={(val) => setCareGuide({ ...careGuide, commonIssues: val })} placeholder="VD: Lá vàng → giảm tưới; Mốc trắng → tăng thông thoáng" suggestions={suggestions.commonIssues} />
            </div>
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Link href="/tiem-nho-nth24/products" className="px-6 py-2.5 border border-gray-200 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</Link>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow hover:-translate-y-0.5 hover:bg-[#364a29] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <Save className="w-4 h-4" />
            {loading ? "Đang tạo..." : "Tạo sản phẩm"}
          </button>
        </div>
      </form>
    </div>

    {/* Crop Modal: Re-crop ảnh phụ đã upload */}
    {currentSubCropSrc && reCropIdx !== null && (
      <ImageCropModal src={currentSubCropSrc} title={`Cắt lại Ảnh Phụ #${reCropIdx + 1}`}
        onConfirm={handleReCropConfirm}
        onCancel={() => { URL.revokeObjectURL(currentSubCropSrc); setSubCropQueue([]); setReCropIdx(null); }} />
    )}
    </>
  );
}
