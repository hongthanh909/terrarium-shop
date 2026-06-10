"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ImageIcon, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown,
  Loader2, Save, ExternalLink, LayoutDashboard, Sparkles, Bot, Truck, Gift, Upload, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/custom-toast";
import Link from "next/link";
import { compressImage } from "@/lib/image";
import { ImageCropModal } from "@/components/ui/image-crop-modal";



interface FeatureCard {
  id: string;
  bgImage: string;
}

const FEATURE_CARD_META = [
  { id: "01", title: "Tác Phẩm Độc Bản & Cá Nhân Hóa", icon: Sparkles },
  { id: "02", title: "Bảo Hành Thực Vật & Trợ Lý Rêu 24/7", icon: Bot },
  { id: "03", title: "Vận Chuyển An Toàn", icon: Truck },
  { id: "04", title: "Quà Tặng Tinh Tế", icon: Gift },
];

interface HomeBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  order: number;
  isActive: boolean;
  productId?: string; // Hướng B: ID sản phẩm liên kết
}

function generateId() {
  return `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  alt: string;
  order: number;
  isActive: boolean;
}

function generateGalleryId() {
  return `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export default function AdminHomepagePage() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feature Cards bg state
  const [featureCards, setFeatureCards] = useState<FeatureCard[]>([
    { id: "01", bgImage: "" },
    { id: "02", bgImage: "" },
    { id: "03", bgImage: "" },
    { id: "04", bgImage: "" },
  ]);
  const [savingCards, setSavingCards] = useState(false);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const cardFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Gallery state
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [savingGallery, setSavingGallery] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Hero Background state
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [heroBgOverlay, setHeroBgOverlay] = useState(40);
  const [savingHeroBg, setSavingHeroBg] = useState(false);
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
  const heroBgFileInputRef = useRef<HTMLInputElement>(null);

  // ── Crop modal state ────────────────────────────────────────────────────────
  // Hero BG crop
  const [heroBgCropSrc, setHeroBgCropSrc] = useState<string | null>(null);
  // Feature Card crop: { cardId, src }
  const [cardCropState, setCardCropState] = useState<{ cardId: string; src: string } | null>(null);

  // Load existing banners, products & feature cards
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, prodRes, cardsRes, galleryRes, heroBgRes] = await Promise.all([
          fetch("/api/admin/homepage"),
          fetch("/api/products?limit=100&status=all"),
          fetch("/api/admin/feature-cards"),
          fetch("/api/admin/gallery"),
          fetch("/api/admin/hero-bg"),
        ]);

        const bannerData = await bannerRes.json();
        setBanners(bannerData.banners ?? []);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products ?? []);
        }

        if (cardsRes.ok) {
          const cardsData = await cardsRes.json();
          if (cardsData.cards?.length === 4) {
            setFeatureCards(cardsData.cards);
          }
        }

        if (galleryRes.ok) {
          const galleryData = await galleryRes.json();
          setGallery(
            (galleryData.images ?? []).sort(
              (a: GalleryImage, b: GalleryImage) => a.order - b.order
            )
          );
        }

        if (heroBgRes.ok) {
          const heroBgData = await heroBgRes.json();
          setHeroBgUrl(heroBgData.heroBg?.imageUrl ?? "");
          setHeroBgOverlay(heroBgData.heroBg?.overlayOpacity ?? 40);
        }
      } catch (err) {
        showToast.error("Không thể tải danh sách dữ liệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Upload image to Supabase Storage
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("Chỉ chấp nhận file ảnh");
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
      showToast.success("Đã tải ảnh lên thành công!");
    } catch (err) {
      showToast.error("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddBannerFromProduct = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;

    const newBanner: HomeBanner = {
      id: generateId(),
      imageUrl: p.images[0] || "",
      title: p.name,
      subtitle: p.category?.name || "",
      link: `/products/${p.slug}`,
      order: banners.length + 1,
      isActive: true,
      productId: p.id,
    };

    setBanners((prev) => [...prev, newBanner]);
    showToast.success(`Đã thêm banner liên kết cho sản phẩm "${p.name}"!`);
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
    showToast.info("Đã xóa banner. Nhấn Lưu để xác nhận.");
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
      showToast.success("Đã lưu banner trang chủ thành công!");
    } catch {
      showToast.error("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // ── Feature Cards handlers ─────────────────────────────────────────────
  const handleCardImageUpload = async (cardId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("Chỉ chấp nhận file ảnh");
      return;
    }
    // Open crop modal
    const objectUrl = URL.createObjectURL(file);
    setCardCropState({ cardId, src: objectUrl });
    // Reset file input
    const ref = cardFileInputRefs.current[cardId];
    if (ref) ref.value = "";
  };

  const handleCardCropConfirm = useCallback(async (blob: Blob) => {
    if (!cardCropState) return;
    const { cardId } = cardCropState;
    setCardCropState(null);
    setUploadingCardId(cardId);
    try {
      const url = await uploadBlob(blob, "banners");
      if (!url) throw new Error();
      setFeatureCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, bgImage: url } : c))
      );
      showToast.success(`Đã cắt và tải ảnh nền cho card ${cardId}!`);
    } catch {
      showToast.error("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingCardId(null);
    }
  }, [cardCropState, uploadBlob]);

  const handleCardImageRemove = (cardId: string) => {
    setFeatureCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, bgImage: "" } : c))
    );
    showToast.info(`Đã xóa ảnh nền card ${cardId}. Nhấn Lưu để xác nhận.`);
  };

  const handleSaveCards = async () => {
    setSavingCards(true);
    try {
      const res = await fetch("/api/admin/feature-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: featureCards }),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      showToast.success("Đã lưu ảnh nền feature cards thành công!");
    } catch {
      showToast.error("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSavingCards(false);
    }
  };

  // ── Gallery handlers ────────────────────────────────────────────────────────
  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 20 - gallery.length;
    if (remaining <= 0) {
      showToast.error("Đã đạt giới hạn 20 ảnh.");
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingGallery(true);
    const newImages: GalleryImage[] = [];
    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        showToast.error(`"${file.name}" vượt quá 5MB, bỏ qua.`);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("bucket", "banners");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) continue;
        const data = await res.json();
        newImages.push({
          id: generateGalleryId(),
          imageUrl: data.url,
          alt: "",
          order: gallery.length + newImages.length + 1,
          isActive: true,
        });
      } catch { /* skip */ }
    }
    if (newImages.length > 0) {
      setGallery((prev) => [...prev, ...newImages]);
      showToast.success(`Đã tải lên ${newImages.length} ảnh gallery!`);
    }
    setUploadingGallery(false);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
  };

  const handleGalleryDelete = (id: string) => {
    setGallery((prev) =>
      prev.filter((g) => g.id !== id).map((g, i) => ({ ...g, order: i + 1 }))
    );
    showToast.info("Đã xóa ảnh. Nhấn Lưu để xác nhận.");
  };

  const handleGalleryToggle = (id: string) => {
    setGallery((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g))
    );
  };

  const handleGalleryMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...gallery];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setGallery(next.map((g, i) => ({ ...g, order: i + 1 })));
  };

  const handleGalleryMoveDown = (index: number) => {
    if (index === gallery.length - 1) return;
    const next = [...gallery];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setGallery(next.map((g, i) => ({ ...g, order: i + 1 })));
  };

  const handleGalleryAltChange = (id: string, alt: string) => {
    setGallery((prev) => prev.map((g) => (g.id === id ? { ...g, alt } : g)));
  };

  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try {
      const ordered = gallery.map((g, i) => ({ ...g, order: i + 1 }));
      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: ordered }),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      setGallery(ordered);
      showToast.success("Đã lưu gallery thương hiệu thành công!");
    } catch {
      showToast.error("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSavingGallery(false);
    }
  };

  // ── Hero Background handlers ──────────────────────────────────────────────────
  const handleHeroBgUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { showToast.error("Chỉ chấp nhận file ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast.error("Ảnh tối đa 5MB"); return; }
    // Open crop modal instead of uploading directly
    const objectUrl = URL.createObjectURL(file);
    setHeroBgCropSrc(objectUrl);
  };

  const uploadBlob = useCallback(async (blob: Blob, bucket: string): Promise<string | null> => {
    const compressed = await compressImage(new File([blob], "crop.jpg", { type: blob.type || "image/jpeg" }));
    const fd = new FormData();
    fd.append("file", compressed);
    fd.append("bucket", bucket);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  }, []);

  const handleHeroBgCropConfirm = useCallback(async (blob: Blob) => {
    setHeroBgCropSrc(null);
    setUploadingHeroBg(true);
    try {
      const url = await uploadBlob(blob, "banners");
      if (!url) throw new Error();
      setHeroBgUrl(url);
      showToast.success("Đã cắt và tải ảnh nền Hero lên! Nhấn Lưu để áp dụng.");
    } catch {
      showToast.error("Upload thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingHeroBg(false);
      if (heroBgFileInputRef.current) heroBgFileInputRef.current.value = "";
    }
  }, [uploadBlob]);

  const handleSaveHeroBg = async () => {
    setSavingHeroBg(true);
    try {
      const res = await fetch("/api/admin/hero-bg", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: heroBgUrl, overlayOpacity: heroBgOverlay }),
      });
      if (!res.ok) throw new Error();
      showToast.success("Đã lưu ảnh nền Hero thành công!");
    } catch {
      showToast.error("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSavingHeroBg(false);
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
    <>
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

      {/* ── Hero Background Section ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#425733] inline-block" />
              Ảnh Nền Hero Section
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Thay thế màu xanh nhạt mặc định bằng ảnh tùy chỉnh</p>
          </div>
          <Button
            onClick={handleSaveHeroBg}
            disabled={savingHeroBg}
            size="sm"
            className="bg-[#425733] hover:bg-[#364a29] text-white gap-2"
          >
            {savingHeroBg
              ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
              : <><Save className="w-4 h-4" />Lưu nền Hero</>
            }
          </Button>
        </div>

        <div className="p-5 flex flex-col sm:flex-row gap-5">
          {/* Preview */}
          <div className="relative w-full sm:w-56 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#f0f4ec] to-[#e3ebdd] flex-shrink-0">
            {heroBgUrl && (
              <>
                <Image src={heroBgUrl} alt="Hero background preview" fill className="object-cover" sizes="224px" />
                <div className="absolute inset-0" style={{ background: `rgba(240,244,236,${heroBgOverlay / 100})` }} />
              </>
            )}
            <div className="absolute inset-0 flex items-end p-3">
              <div className="text-[#425733] font-bold text-sm leading-tight">
                <div>Một chút rêu</div>
                <div>Một chút xanh</div>
              </div>
            </div>
            {heroBgUrl && (
              <button
                onClick={() => setHeroBgUrl("")}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-4">
            {/* Upload button */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Chọn ảnh nền</label>
              <button
                onClick={() => !uploadingHeroBg && heroBgFileInputRef.current?.click()}
                disabled={uploadingHeroBg}
                className="flex items-center gap-2 border-2 border-dashed border-[#c2d6b0] rounded-xl px-4 py-3 text-sm font-medium text-[#425733] hover:bg-[#f0f4ec] transition-colors disabled:opacity-50 w-full justify-center"
              >
                {uploadingHeroBg
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Đang tải lên...</>
                  : <><Upload className="w-4 h-4" />{heroBgUrl ? "Thay ảnh nền" : "Tải ảnh nền lên"}</>
                }
              </button>
              <input
                ref={heroBgFileInputRef}
                type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroBgUpload(f); }}
              />
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WebP • Tối đa 5MB • Khuyến nghị: 1920×1080px</p>
            </div>

            {/* Overlay opacity slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Overlay (che phủ để text rõ)</label>
                <span className="text-xs font-semibold text-[#425733]">{heroBgOverlay}%</span>
              </div>
              <input
                type="range" min="0" max="80" step="5"
                value={heroBgOverlay}
                onChange={(e) => setHeroBgOverlay(Number(e.target.value))}
                className="w-full accent-[#425733]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>Trong suốt (thấy ảnh rõ)</span>
                <span>Mờ (text dễ đọc)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Banner Section (2 Options) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Custom Image Upload */}
        <div
          className="border-2 border-dashed border-[#c2d6b0] rounded-2xl bg-[#f9fbf7] hover:bg-[#f0f4ec] transition-colors cursor-pointer group flex flex-col items-center justify-center py-8 px-4"
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-[#425733] animate-spin mb-3" />
              <p className="text-sm text-gray-500 text-center">Đang tải ảnh lên Storage...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#e3ebdd] flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
                <Plus className="w-6 h-6 text-[#425733]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#425733]">Tải ảnh banner tùy chỉnh</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click để chọn ảnh • JPG, PNG, WebP • Tối đa 5MB
                </p>
              </div>
            </>
          )}
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

        {/* Option 2: Add Banner from Existing Product */}
        <div className="border-2 border-[#e3ebdd] rounded-2xl bg-white p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-xl bg-[#e3ebdd] text-[#425733] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </span>
              <h3 className="font-semibold text-gray-800">Thêm banner từ Sản phẩm</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Chọn nhanh sản phẩm từ cửa hàng. Hệ thống tự động đồng bộ ảnh đại diện, tên làm tiêu đề, danh mục làm phụ đề và tạo link liên kết.
            </p>
            
            <select
              className="w-full h-9 text-sm rounded-lg border border-gray-200 bg-white px-2 focus:ring-1 focus:ring-[#425733] focus:outline-none mb-2"
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleAddBannerFromProduct(val);
                  e.target.value = ""; // reset
                }
              }}
            >
              <option value="" disabled>-- Chọn sản phẩm có sẵn --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({Number(p.basePrice).toLocaleString("vi-VN")}₫)
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-400 italic">
            * Khuyên dùng để đảm bảo giá và thông tin luôn đồng bộ với DB.
          </div>
        </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Liên kết sản phẩm (Tự động đồng bộ Giá & Link)
                      </label>
                      <select
                        value={banner.productId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFieldChange(banner.id, "productId", val);
                          // Tự động điền link và tiêu đề khi chọn sản phẩm
                          if (val) {
                            const p = products.find((prod) => prod.id === val);
                            if (p) {
                              handleFieldChange(banner.id, "link", `/products/${p.slug}`);
                              if (!banner.title) {
                                handleFieldChange(banner.id, "title", p.name);
                              }
                            }
                          }
                        }}
                        className="w-full h-8 text-sm rounded-lg border border-gray-200 bg-white px-2 focus:ring-1 focus:ring-[#425733] focus:outline-none"
                      >
                        <option value="">-- Không liên kết --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({Number(p.basePrice).toLocaleString("vi-VN")}₫)
                          </option>
                        ))}
                      </select>
                    </div>
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
              <div className={`px-4 py-1.5 flex items-center flex-wrap gap-y-1 gap-x-2 text-xs ${
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
                {(() => {
                  const linkedP = banner.productId ? products.find(p => p.id === banner.productId) : null;
                  if (linkedP) {
                    const bp = Number(linkedP.basePrice);
                    const sp = linkedP.salePrice ? Number(linkedP.salePrice) : null;
                    return (
                      <>
                        <span className="text-gray-300 mx-1">•</span>
                        <span className="text-[#3b592d] font-semibold bg-[#eaf4e5] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#c2d6b0]/40">
                          🔗 Đã liên kết: {linkedP.name} ({sp ? `${sp.toLocaleString("vi-VN")}₫ (Khuyến mãi)` : `${bp.toLocaleString("vi-VN")}₫`})
                        </span>
                      </>
                    );
                  }
                  return null;
                })()}
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

      {/* ── Feature Cards Background ─────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#425733]" />
              Ảnh Nền Feature Cards
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Tuỳ chỉnh ảnh nền cho 4 mục &ldquo;Tại Sao Chọn Chúng Tôi&rdquo; trên trang chủ
            </p>
          </div>
          <Button
            onClick={handleSaveCards}
            disabled={savingCards}
            className="bg-[#425733] hover:bg-[#364a29] text-white gap-2"
          >
            {savingCards ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
            ) : (
              <><Save className="w-4 h-4" />Lưu ảnh nền</>              
            )}
          </Button>
        </div>

        {/* Spec guide */}
        <div className="bg-[#f0f4ec] border border-[#c8d5be] rounded-xl p-4 mb-5 text-sm text-[#364a29] flex gap-3">
          <span className="text-base flex-shrink-0">📐</span>
          <div className="space-y-0.5">
            <p className="font-semibold">Tiêu chuẩn ảnh nền để hiển thị đẹp nhất</p>
            <ul className="text-xs text-[#4b6b3a] space-y-0.5 mt-1 list-disc list-inside">
              <li>Kích thước khuyến nghị: <strong>800 × 600px</strong> (tỉ lệ 4:3 hoặc rộng hơn)</li>
              <li>Dung lượng tối đa: <strong>3MB</strong> — hệ thống tự nén xuống ~500KB</li>
              <li>Định dạng: JPG, PNG, WebP</li>
              <li>Ảnh sẽ được crop tự động (<strong>object-fit: cover</strong>), không bao giờ bị vỡ tỉ lệ</li>
              <li>Overlay trắng mờ được thêm tự động để text luôn đọc được</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURE_CARD_META.map(({ id, title, icon: Icon }) => {
            const card = featureCards.find((c) => c.id === id);
            const bgImage = card?.bgImage || "";
            const isUploading = uploadingCardId === id;

            return (
              <div
                key={id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Preview area */}
                <div className="relative h-36 bg-[#f0f4ec] overflow-hidden">
                  {bgImage ? (
                    <Image
                      src={bgImage}
                      alt={`Ảnh nền card ${id}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#a8c098]">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs">Chưa có ảnh nền</span>
                    </div>
                  )}
                  {/* Overlay preview */}
                  {bgImage && (
                    <div className="absolute inset-0 bg-white/60" />
                  )}
                  {/* Card number badge */}
                  <div className="absolute top-2 left-2 bg-[#425733] text-white text-xs font-bold px-2 py-0.5 rounded-md">
                    {id}
                  </div>
                  {/* Remove button */}
                  {bgImage && (
                    <button
                      onClick={() => handleCardImageRemove(id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Xóa ảnh nền"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Card info + upload */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#e3ebdd] flex items-center justify-center text-[#425733]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{title}</p>
                  </div>

                  <button
                    onClick={() => !isUploading && cardFileInputRefs.current[id]?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#c2d6b0] rounded-xl py-2.5 text-sm font-medium text-[#425733] hover:bg-[#f0f4ec] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Đang tải lên...</>
                    ) : (
                      <><Upload className="w-4 h-4" />{bgImage ? "Thay ảnh nền" : "Tải ảnh nền lên"}</>
                    )}
                  </button>

                  <input
                    ref={(el) => { cardFileInputRefs.current[id] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCardImageUpload(id, file);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Brand Gallery ──────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#425733]" />
              Gallery Thương Hiệu
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Ảnh gallery hiển thị ngay dưới Hero — tăng nhận diện thương hiệu ({gallery.length}/20 ảnh)
            </p>
          </div>
          <Button
            onClick={handleSaveGallery}
            disabled={savingGallery}
            className="bg-[#425733] hover:bg-[#364a29] text-white gap-2"
          >
            {savingGallery ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
            ) : (
              <><Save className="w-4 h-4" />Lưu gallery ({gallery.length})</>
            )}
          </Button>
        </div>

        {/* Spec guide */}
        <div className="bg-[#f0f4ec] border border-[#c8d5be] rounded-xl p-4 mb-5 text-sm text-[#364a29] flex gap-3">
          <span className="text-base flex-shrink-0">🖼️</span>
          <div className="space-y-0.5">
            <p className="font-semibold">Tiêu chuẩn ảnh gallery</p>
            <ul className="text-xs text-[#4b6b3a] space-y-0.5 mt-1 list-disc list-inside">
              <li>Kích thước khuyến nghị: <strong>1200 × 900px</strong> trở lên (tỉ lệ bất kỳ)</li>
              <li>Dung lượng tối đa: <strong>5MB</strong> — hệ thống tự nén</li>
              <li>Định dạng: JPG, PNG, WebP</li>
              <li>Tối đa <strong>20 ảnh</strong> — có thể upload nhiều ảnh cùng lúc</li>
              <li>Click vào ảnh trên frontend để xem lightbox toàn màn hình</li>
            </ul>
          </div>
        </div>

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed border-[#c2d6b0] rounded-2xl bg-[#f9fbf7] hover:bg-[#f0f4ec] transition-colors cursor-pointer flex flex-col items-center justify-center py-8 px-4 mb-5 ${
            gallery.length >= 20 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => gallery.length < 20 && !uploadingGallery && galleryFileInputRef.current?.click()}
        >
          {uploadingGallery ? (
            <>
              <Loader2 className="w-10 h-10 text-[#425733] animate-spin mb-3" />
              <p className="text-sm text-gray-500">Đang tải ảnh lên...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#e3ebdd] flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-[#425733]" />
              </div>
              <p className="font-semibold text-[#425733]">
                {gallery.length >= 20 ? "Đã đạt giới hạn 20 ảnh" : "Tải ảnh gallery lên"}
              </p>
              <p className="text-xs text-gray-400 mt-1">Click để chọn • Hỗ trợ chọn nhiều ảnh cùng lúc • JPG, PNG, WebP • Tối đa 5MB/ảnh</p>
            </>
          )}
          <input
            ref={galleryFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleGalleryUpload(e.target.files)}
          />
        </div>

        {/* Gallery list */}
        {gallery.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <ImageIcon className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Chưa có ảnh nào — Upload ảnh ở trên để bắt đầu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((img, index) => (
              <div
                key={img.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-opacity ${
                  img.isActive ? "border-[#daebd0]" : "border-gray-200 opacity-60"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={img.imageUrl}
                    alt={img.alt || `Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-2 space-y-1.5">
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => handleGalleryAltChange(img.id, e.target.value)}
                    placeholder="Mô tả ảnh..."
                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-[#425733]/50"
                  />
                  <div className="flex items-center justify-between gap-1">
                    {/* Move buttons */}
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => handleGalleryMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
                        title="Lên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleGalleryMoveDown(index)}
                        disabled={index === gallery.length - 1}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
                        title="Xuống"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Active toggle */}
                    <button
                      onClick={() => handleGalleryToggle(img.id)}
                      className={`p-1 rounded transition-colors ${
                        img.isActive
                          ? "bg-[#e3ebdd] text-[#425733] hover:bg-[#d0dfca]"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      title={img.isActive ? "Đang hiện — ẩn đi" : "Đang ẩn — hiện lên"}
                    >
                      {img.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleGalleryDelete(img.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {gallery.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex gap-3">
            <span className="flex-shrink-0">💡</span>
            <p>
              Nhớ nhấn <strong>Lưu gallery</strong> sau mỗi thay đổi!
              Ảnh gallery sẽ hiển thị ngay bên dưới Hero Section trên trang chủ với layout masonry đẹp.
            </p>
          </div>
        )}
      </div>
    </div>

      {/* Crop Modals */}
      {heroBgCropSrc && (
        <ImageCropModal
          src={heroBgCropSrc}
          aspect={16 / 9}
          title="Ảnh Nền Hero — Cắt theo tỉ lệ 16:9"
          onConfirm={handleHeroBgCropConfirm}
          onCancel={() => {
            URL.revokeObjectURL(heroBgCropSrc);
            setHeroBgCropSrc(null);
            if (heroBgFileInputRef.current) heroBgFileInputRef.current.value = "";
          }}
        />
      )}
      {cardCropState && (
        <ImageCropModal
          src={cardCropState.src}
          aspect={4 / 3}
          title={`Card ${cardCropState.cardId} — Cắt ảnh nền (4:3)`}
          onConfirm={handleCardCropConfirm}
          onCancel={() => {
            URL.revokeObjectURL(cardCropState.src);
            setCardCropState(null);
          }}
        />
      )}
    </>
  );
}

