"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, Minus, Plus, Star,
  Droplets, Sun, Thermometer, Wind, AlertTriangle, Play,
  Package, Sprout, Heart, Tag, ChevronRight, Copy, Check as CheckIcon, Zap, Lightbulb, Wrench
} from "lucide-react";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/custom-toast";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ProductCard } from "@/components/ui/product-card";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { getPositiveRatingBreakdown, getProductRatingSummary } from "@/lib/product-rating";
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";
import { trackEvent } from "@/lib/analytics-client";
import { ProductAdminChat } from "@/components/chat/ProductAdminChat";

// ── Package variant constants ───────────────────────────────────────────────
const LAMP_VARIANT_TYPE = "Đèn";
const LAMP_COMBO_OPTION = "Combo bể + đèn";
const LAMP_NONE_OPTION = "Không kèm đèn";
const LAMP_PRICE_ADJUSTMENT = 100000;

// 3-tier package selection for Bể products
const PACKAGES = [
  {
    key: "basic",
    label: "Gói cơ bản",
    sub: "Không kèm đèn",
    priceAdj: 0,
    icon: "🪴",
  },
  {
    key: "standard",
    label: "Gói tiêu chuẩn",
    sub: "Đèn + đế",
    priceAdj: getProductPackagePriceAdjustment("standard"),
    icon: "💡",
  },
  {
    key: "advanced",
    label: "Gói nâng cao",
    sub: "Đèn + đế + dụng cụ",
    priceAdj: getProductPackagePriceAdjustment("advanced"),
    icon: "🔧",
  },
];

type VoucherData = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  expiresAt: string;
  description?: string;
  usageLimit: number | null;
  usageCount: number;
  applicableTo?: string;
  applicables?: { targetType: string; targetId: string }[];
};

type TabType = "details" | "care" | "reviews";

const FacebookIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12.98 2.66 1.41 4.12 1.48v3.08c-1.87-.07-3.69-.76-5.02-2.07-.05 2.76-.04 5.51-.05 8.27-.1 1.95-1.04 3.91-2.73 4.96-2.08 1.4-4.92 1.51-7.05.3-2.12-1.12-3.41-3.52-3.21-5.96.1-2.16 1.46-4.22 3.52-4.92 1.63-.59 3.5-.42 5.02.43-.01-1.39-.02-2.79-.02-4.18-1.57-.43-3.18-.33-4.66.42C5.97 7.02 4.19 8.87 3.39 11.13c-.99 2.59-.72 5.57.8 7.84 1.51 2.37 4.29 3.86 7.15 3.79 2.89.04 5.74-1.35 7.18-3.86 1.34-2.19 1.47-5.01 1.41-7.53h-3.06c.05 2.18-.01 4.38-.85 6.42-.78 1.92-2.61 3.44-4.73 3.55-2.09.16-4.26-.95-5.18-2.85-.92-1.81-.68-4.21.73-5.74.96-1.08 2.38-1.74 3.83-1.8 1.31-.08 2.68.22 3.77.96.02-3.95.01-7.9.01-11.85z" />
  </svg>
);

export function ProductDetailClient({
  initialProduct,
  initialRelated,
}: {
  initialProduct: any;
  initialRelated: any[];
}) {
  const router = useRouter();

  const [product, setProduct] = useState<any>(initialProduct);
  const [relatedProducts] = useState<any[]>(initialRelated);
  const [loading] = useState(false);
  const { isWished, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (initialProduct?.id) {
      trackEvent({ type: "PRODUCT_VIEW", productId: initialProduct.id, path: `/products/${initialProduct.slug}` });
    }
  }, [initialProduct?.id, initialProduct?.slug]);

  const isBểProduct = initialProduct?.category?.name?.toLowerCase().includes("bể") || 
                       initialProduct?.category?.slug?.toLowerCase().includes("be") ||
                       initialProduct?.name?.toLowerCase().includes("bể");

  // 3-tier package selection (replaces old 2-button lamp selector)
  const [selectedPackage, setSelectedPackage] = useState<string>("basic");

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    if (isBểProduct) {
      return { [LAMP_VARIANT_TYPE]: LAMP_NONE_OPTION } as Record<string, string>;
    }
    return {} as Record<string, string>;
  });
  const [quantity, setQuantity] = useState(1);

  // ── Voucher section ──────────────────────────────────────────────────────
  const [publicVouchers, setPublicVouchers] = useState<VoucherData[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherData | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    fetch("/api/discount-campaigns?status=ACTIVE&limit=50")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.campaigns || []);
        const productId = product.id;
        const categoryId = product.category?.id || product.categoryId;

        const filtered = list.filter((v: any) => {
          // Basic active checks
          if (v.status !== "ACTIVE") return false;
          if (new Date(v.expiresAt) <= new Date()) return false;
          if (v.usageLimit !== null && v.usageCount >= v.usageLimit) return false;

          // Filter by applicableTo
          if (v.applicableTo === "ALL") return true;

          if (v.applicableTo === "PRODUCTS" && v.applicables?.length > 0) {
            const targetProductIds = v.applicables
              .filter((a: any) => a.targetType === "PRODUCT")
              .map((a: any) => a.targetId);
            return targetProductIds.includes(productId);
          }

          if (v.applicableTo === "CATEGORIES" && v.applicables?.length > 0) {
            const targetCategoryIds = v.applicables
              .filter((a: any) => a.targetType === "CATEGORY")
              .map((a: any) => a.targetId);
            return targetCategoryIds.includes(categoryId);
          }

          // COMBOS or unknown — hide for now
          return false;
        });

        setPublicVouchers(filtered);
      })
      .catch(() => {});
  }, [product]);

  const handleApplyVoucher = async (code?: string) => {
    const useCode = (code || voucherInput).trim().toUpperCase();
    if (!useCode) return;
    setVoucherLoading(true);
    try {
      const res = await fetch("/api/validate-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: useCode, orderAmount: finalPrice * quantity }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedVoucher(data.campaign);
        setVoucherInput(useCode);
        showToast.success(`Áp dụng voucher "${useCode}" thành công!`);
      } else {
        showToast.error(data.error || "Mã voucher không hợp lệ");
      }
    } catch {
      showToast.error("Lỗi khi kiểm tra voucher");
    } finally {
      setVoucherLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    showToast.success(`Đã sao chép mã "${code}"`);
  };

  // Best voucher = voucher gives highest discount for current price
  const getBestVoucher = (price: number): VoucherData | null => {
    if (!publicVouchers.length) return null;
    let best: VoucherData | null = null;
    let bestDiscount = 0;
    for (const v of publicVouchers) {
      if (!isVoucherEligible(v, price)) continue;
      const discount = getVoucherDiscountAmount(v, price);
      if (discount > bestDiscount) { bestDiscount = discount; best = v; }
    }
    return best;
  };

  const isVoucherEligible = (voucher: VoucherData | null, amount: number) => {
    if (!voucher) return false;
    return !voucher.minOrderAmount || amount >= Number(voucher.minOrderAmount);
  };

  const getVoucherDiscountAmount = (voucher: VoucherData | null, amount: number) => {
    if (!voucher || voucher.type === "FREE_SHIPPING" || !isVoucherEligible(voucher, amount)) {
      return 0;
    }

    let discount = 0;
    if (voucher.type === "PERCENTAGE") {
      discount = amount * (Number(voucher.value) / 100);
      if (voucher.maxDiscountAmount) {
        discount = Math.min(discount, Number(voucher.maxDiscountAmount));
      }
    } else {
      discount = Number(voucher.value);
    }

    return Math.max(0, Math.min(amount, Math.round(discount)));
  };

  const productImages: string[] = Array.isArray(product?.images) ? product.images : [];
  const productVideoUrl = typeof product?.careGuide?.videoUrl === "string"
    ? product.careGuide.videoUrl.trim()
    : "";
  const isDirectProductVideo = Boolean(
    productVideoUrl &&
    !/(youtube\.com|youtu\.be|tiktok\.com)/i.test(productVideoUrl)
  );
  const galleryMedia = [
    ...productImages.map((url) => ({ type: "image" as const, url })),
    ...(isDirectProductVideo ? [{ type: "video" as const, url: productVideoUrl }] : []),
  ];

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isVoting, setIsVoting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const linkText = `${window.location.origin}/san-pham/${product.slug}`;
    navigator.clipboard.writeText(linkText).then(() => {
      setCopiedLink(true);
      showToast.success("Đã sao chép liên kết sản phẩm!");
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      showToast.error("Không thể sao chép liên kết");
    });
  };

  // ── Lightbox & Zoom ───────────────────────────────────────────────────
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setZoomOrigin({ x: 50, y: 50 });
    setPanOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!lightboxOpen || !product?.images) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxOpen(false); resetZoom(); }
      else if (e.key === "ArrowLeft") { setLightboxIndex((p) => (p === 0 ? product.images.length - 1 : p - 1)); resetZoom(); }
      else if (e.key === "ArrowRight") { setLightboxIndex((p) => (p === product.images.length - 1 ? 0 : p + 1)); resetZoom(); }
      else if (e.key === "+" || e.key === "=") setZoomScale((s) => Math.min(s + 0.5, 5));
      else if (e.key === "-") setZoomScale((s) => { const n = Math.max(s - 0.5, 1); if (n === 1) setPanOffset({ x: 0, y: 0 }); return n; });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, product.images, resetZoom]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = imgContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ox = ((e.clientX - rect.left) / rect.width) * 100;
    const oy = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomScale((prev) => {
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      const next = Math.min(Math.max(prev + delta, 1), 5);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
    setZoomOrigin({ x: ox, y: oy });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  }, [zoomScale, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleOpenLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); resetZoom(); };
  const closeLightbox = () => { setLightboxOpen(false); resetZoom(); };

  // ── Reviews ───────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const { data: session } = useSession();
  const { addItem, items, getCartCount, removeItem, updateQuantity, toggleSelectItem, selectAllItems, getSelectedTotal, getSelectedItems } = useCartStore();

  // Load reviews on mount (for rating display)
  useEffect(() => {
    if (!product?.id) return;
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []));
  }, [product?.id]);

  // Load reviews when switching to reviews tab
  useEffect(() => {
    if (activeTab !== "reviews" || !product) return;
    setReviewsLoading(true);
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .finally(() => setReviewsLoading(false));
    const customerId = (session?.user as any)?.id;
    if (customerId) {
      fetch(`/api/reviews/can-review?productId=${product.id}`)
        .then((r) => r.json())
        .then((d) => { setCanReview(d.canReview ?? false); setAlreadyReviewed(d.alreadyReviewed ?? false); })
        .catch(() => setCanReview(false));
    } else {
      setCanReview(false);
    }
  }, [activeTab, product, session]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerId = (session?.user as any)?.id;
    if (!customerId) { showToast.error("Vui lòng đăng nhập"); return; }
    if (!reviewForm.content.trim()) { showToast.error("Vui lòng nhập nội dung đánh giá"); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, rating: reviewForm.rating, title: reviewForm.title, content: reviewForm.content }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast.success("Đánh giá đã được gửi! Đang chờ admin duyệt.");
        setReviewForm({ rating: 5, title: "", content: "" });
        setAlreadyReviewed(true); setCanReview(false);
      } else {
        showToast.error(data.error || "Lỗi khi gửi đánh giá");
      }
    } catch { showToast.error("Lỗi kết nối. Vui lòng thử lại."); }
    finally { setSubmittingReview(false); }
  };

  // ── Price calculation ─────────────────────────────────────────────────
  const getPriceWithVariants = () => {
    if (!product) return { price: 0, base: 0, isSale: false };
    let base = parseFloat(product.basePrice.toString());
    const hasSale = product.salePrice && product.salePrice !== null && parseFloat(product.salePrice.toString()) < base;
    const isSaleValid = hasSale && (!product.saleEndDate || new Date(product.saleEndDate) > new Date());
    let isSale = false;
    let currentBase = base;
    if (isSaleValid) { currentBase = parseFloat(product.salePrice.toString()); isSale = true; }
    let price = currentBase;

    // Package adjustment for Bể products (replaces old lamp toggle)
    if (isBểProduct) {
      const pkg = PACKAGES.find(p => p.key === selectedPackage);
      if (pkg) {
        price += pkg.priceAdj;
        base += pkg.priceAdj;
      }
    } else if (selectedVariants[LAMP_VARIANT_TYPE] === LAMP_COMBO_OPTION) {
      // Fallback: keep old logic for non-Bể with lamp variant
      price += LAMP_PRICE_ADJUSTMENT;
      base += LAMP_PRICE_ADJUSTMENT;
    }

    // DB variants
    product.variantOptions?.forEach((variant: any) => {
      const selectedValue = selectedVariants[variant.variantType];
      if (selectedValue && variant.value === selectedValue) {
        const adj = parseFloat(variant.priceAdjustment.toString());
        price += adj; base += adj;
      }
    });
    return { price, base, isSale };
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!session) { showToast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng"); router.push(`/login?callbackUrl=/products/${product.slug}`); return; }
    const { price } = getPriceWithVariants();
    const cartVariants = { ...selectedVariants };
    if (isBểProduct) {
      const pkgLabel = selectedPackage === "standard" ? "Gói tiêu chuẩn" :
                       selectedPackage === "advanced" ? "Gói nâng cao" : "Gói cơ bản";
      cartVariants["Phân loại"] = pkgLabel;
    }
    delete cartVariants[LAMP_VARIANT_TYPE];
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price,
      discountCode: appliedVoucher?.code,
      quantity,
      variants: cartVariants,
    });
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!session) { showToast.error("Vui lòng đăng nhập để mua hàng"); router.push(`/login?callbackUrl=/products/${product.slug}`); return; }
    const { price } = getPriceWithVariants();
    const cartVariants = { ...selectedVariants };
    if (isBểProduct) {
      const pkgLabel = selectedPackage === "standard" ? "Gói tiêu chuẩn" :
                       selectedPackage === "advanced" ? "Gói nâng cao" : "Gói cơ bản";
      cartVariants["Phân loại"] = pkgLabel;
    }
    delete cartVariants[LAMP_VARIANT_TYPE];
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price,
      discountCode: appliedVoucher?.code,
      quantity,
      variants: cartVariants,
    });
    if (items.length === 0) { router.push("/checkout"); } else { setCartOpen(true); }
  };

  const handleVote = async () => {
    if (!session) { showToast.error("Vui lòng đăng nhập để bình chọn"); router.push("/login"); return; }
    if (!product || isVoting) return;
    setIsVoting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/vote`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProduct((prev: any) => prev ? { ...prev, userVoted: data.voted, voteCount: (prev.voteCount || 0) + (data.voted ? 1 : -1) } : prev);
      data.voted ? showToast.success("Đã thêm vào mục yêu thích!") : showToast.info("Đã bỏ bình chọn.");
    } catch { showToast.error("Có lỗi xảy ra, vui lòng thử lại sau."); }
    finally { setIsVoting(false); }
  };

  if (loading) return <div className="flex min-h-[70dvh] items-center justify-center"><p className="text-muted-foreground">Đang tải...</p></div>;
  if (!product) return null;

  const { price: finalPrice, base: originalPrice, isSale } = getPriceWithVariants();
  const discountPercent = isSale && originalPrice > 0 ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;
  const voucherDiscountAmount = getVoucherDiscountAmount(appliedVoucher, finalPrice);
  const priceAfterVoucher = Math.max(0, finalPrice - voucherDiscountAmount);
  const hasPriceVoucher = voucherDiscountAmount > 0;
  const priceBeforeDisplayedDiscount = hasPriceVoucher ? finalPrice : originalPrice;
  const hasCareGuide = !!(product.careGuide && (product.careGuide.watering || product.careGuide.sunlight || product.careGuide.temperature || product.careGuide.humidity));
  const ratingSummary = getProductRatingSummary({ ...product, reviews });
  const ratingBreakdown = getPositiveRatingBreakdown(ratingSummary.rating, ratingSummary.reviewCount);



  // DB variants excluding lamp type (in case it exists in DB)
  const dbVariants = (product.variantOptions || []).filter((v: any) => v.variantType !== LAMP_VARIANT_TYPE);

  return (
    <div className="min-h-[100dvh] bg-background pb-28 lg:pb-0">

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxOpen && product?.images && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
        >
          <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80" aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/40 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <button onClick={() => setZoomScale((s) => { const n = Math.max(s - 0.5, 1); if (n === 1) setPanOffset({ x: 0, y: 0 }); return n; })} className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80" aria-label="Thu nhỏ ảnh">−</button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center select-none">{Math.round(zoomScale * 100)}%</span>
            <button onClick={() => setZoomScale((s) => Math.min(s + 0.5, 5))} className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80" aria-label="Phóng to ảnh">+</button>
            {zoomScale > 1 && <button onClick={resetZoom} className="ml-1 px-4 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">Reset</button>}
          </div>
          {product.images.length > 1 && (
            <>
              <button onClick={() => { setLightboxIndex((p) => (p === 0 ? product.images.length - 1 : p - 1)); resetZoom(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" aria-label="Ảnh trước">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={() => { setLightboxIndex((p) => (p === product.images.length - 1 ? 0 : p + 1)); resetZoom(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" aria-label="Ảnh tiếp">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}
          <div
            ref={imgContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
            style={{ cursor: zoomScale > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in" }}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          >
            <ImageWrapper
              src={product.images[lightboxIndex]}
              alt={product.name}
              fill
              sizes="100vw"
              noRound
              draggable={false}
              className="object-contain"
              style={{ transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`, transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`, transition: isPanning ? "none" : "transform 0.15s ease", userSelect: "none", pointerEvents: "none" }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => { setLightboxIndex(i); resetZoom(); }} className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${i === lightboxIndex ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"}`} aria-label={`Xem ảnh ${i + 1}`}>
                  <ImageWrapper src={img} alt={`${product.name} ${i + 1}`} fill sizes="48px" noRound className="object-cover" />
                </button>
              ))}
            </div>
          )}
          {product.images.length > 1 && <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">{lightboxIndex + 1} / {product.images.length}</div>}
        </div>
      )}

      {/* ── Cart Sheet ────────────────────────────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Giỏ hàng ({getCartCount()})</SheetTitle>
            <SheetDescription>Xem lại sản phẩm và tiến hành thanh toán</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {items.length === 0 ? (
              <div className="text-center py-12"><ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground">Giỏ hàng trống</p></div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" id="selectAll" className="w-4 h-4 rounded border-gray-300" checked={items.length > 0 && items.every((i: CartItem) => i.selected)} onChange={(e) => selectAllItems(e.target.checked)} />
                  <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">Chọn tất cả</label>
                </div>
                {items.map((item: CartItem) => (
                  <Card key={item.id} className={item.selected ? "border-foreground bg-muted/40" : "opacity-80"}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input type="checkbox" className="mt-2 w-4 h-4 rounded border-gray-300" checked={item.selected || false} onChange={() => toggleSelectItem(item.id)} />
                        <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                          <ImageWrapper src={item.productImage || "/placeholder.png"} alt={item.productName} fill sizes="80px" noRound className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{item.productName}</h3>
                          {item.variants && Object.keys(item.variants).filter(k => k !== "Đèn").length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {Object.entries(item.variants ?? {})
                                .filter(([k]) => k !== "Đèn")
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                            </p>
                          )}
                          <p className="text-primary font-bold mt-1">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variants)} aria-label={`Giảm số lượng ${item.productName}`}><Minus className="w-4 h-4" /></Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variants)} aria-label={`Tăng số lượng ${item.productName}`}><Plus className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="ml-auto min-h-11 px-3 text-destructive text-sm" onClick={() => removeItem(item.productId, item.variants)} aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}>Xóa</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-semibold mb-4"><span>Tổng cộng:</span><span className="text-primary">{getSelectedTotal().toLocaleString("vi-VN")}₫</span></div>
              <Button className="w-full" asChild={getSelectedItems().length > 0} disabled={getSelectedItems().length === 0} onClick={() => { if (getSelectedItems().length > 0) setCartOpen(false); }}>
                {getSelectedItems().length > 0 ? <Link href="/checkout">Tiến hành thanh toán</Link> : <span>Vui lòng chọn sản phẩm</span>}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <Link href="/products" className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại sản phẩm
        </Link>
      </div>

      {/* ── Product Layout ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-12 xl:gap-16">

          {/* ── LEFT: Gallery ── */}
          <div className="flex flex-col gap-4">
            {/* Main media — square so images and video share one stable viewport */}
            <div className="w-full">
              {galleryMedia.length > 0 ? (
                <div
                  className={`group relative w-full overflow-hidden border border-border bg-muted/30 shadow-sm ${galleryMedia[currentMediaIndex]?.type === "image" ? "cursor-zoom-in" : ""}`}
                  style={{ aspectRatio: "1/1", maxHeight: "min(550px, 72dvh)" }}
                  onClick={() => {
                    if (galleryMedia[currentMediaIndex]?.type === "image") {
                      handleOpenLightbox(currentMediaIndex);
                    }
                  }}
                >
                  {galleryMedia[currentMediaIndex]?.type === "video" ? (
                    <video
                      key={galleryMedia[currentMediaIndex].url}
                      src={galleryMedia[currentMediaIndex].url}
                      poster={productImages[0] || undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 h-full w-full bg-black object-contain"
                      aria-label={`Video sản phẩm ${product.name}`}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : (
                    productImages.map((imageUrl, imageIndex) => {
                      const isActive = imageIndex === currentMediaIndex;
                      return (
                        <ImageWrapper
                          key={imageUrl}
                          src={imageUrl}
                          alt={isActive ? product.name : ""}
                          aria-hidden={!isActive}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          loading="eager"
                          fetchPriority={imageIndex === 0 ? "high" : "low"}
                          noRound
                          wrapperClassName={`absolute inset-0 transition-opacity duration-150 ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
                          className={`object-contain transition-transform duration-300 ${isActive ? "group-hover:scale-[1.03]" : ""}`}
                        />
                      );
                    })
                  )}

                  {/* Sale badge */}
                  {isSale && (
                    <div className="absolute left-3 top-3 z-10 flex items-center space-x-1 bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                      <span>-{discountPercent}%</span>
                      {product.saleEndDate && (
                        <CountdownTimer endsAt={product.saleEndDate} className="ml-1" />
                      )}
                    </div>
                  )}

                  {/* Prev/Next arrows (appear on hover) */}
                  {galleryMedia.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((p: number) => (p === 0 ? galleryMedia.length - 1 : p - 1)); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-[opacity,background-color] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Nội dung trước"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((p: number) => (p === galleryMedia.length - 1 ? 0 : p + 1)); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-[opacity,background-color] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Nội dung tiếp theo"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {galleryMedia.length > 1 && (
                    <div className={`absolute flex gap-1.5 ${galleryMedia[currentMediaIndex]?.type === "video" ? "right-3 top-3 rounded-full bg-black/35 px-2 py-1" : "bottom-3 left-1/2 -translate-x-1/2"}`}>
                      {galleryMedia.map((media, i: number) => (
                        <span key={`${media.type}-${media.url}`} className={`block rounded-full transition-all duration-200 ${i === currentMediaIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex w-full animate-pulse items-center justify-center border border-border bg-muted" style={{ aspectRatio: "1/1", maxHeight: "550px" }}>
                  <span className="text-muted-foreground text-sm">Chưa có ảnh hoặc video</span>
                </div>
              )}
            </div>

            {/* Horizontal thumbnail strip */}
            {galleryMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {galleryMedia.map((media, i: number) => (
                  <button
                    key={`${media.type}-${media.url}`}
                    onClick={() => setCurrentMediaIndex(i)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border transition-[opacity,border-color,box-shadow] duration-200 sm:h-[70px] sm:w-[70px] ${
                      i === currentMediaIndex
                        ? "border-foreground bg-white shadow-sm"
                        : "border-border bg-white opacity-60 hover:border-foreground/40 hover:opacity-100"
                    }`}
                    aria-label={media.type === "video" ? "Xem video sản phẩm" : `Xem ảnh sản phẩm ${i + 1}`}
                  >
                    {media.type === "video" ? (
                      <>
                        {productImages[0] && (
                          <ImageWrapper src={productImages[0]} alt="" fill sizes="80px" noRound className="object-cover" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white" aria-hidden="true">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground shadow-sm">
                            <Play className="h-4 w-4 fill-current" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <ImageWrapper src={media.url} alt={`${product.name} - ${i + 1}`} fill sizes="80px" noRound className="object-contain p-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="flex flex-col lg:sticky lg:top-28 lg:self-start">

            {/* Top Row: Badges & Wishlist */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {product.category.name}
                </span>
                {product.inventory > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Còn hàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500" />Hết hàng
                  </span>
                )}
              </div>
              
              <button 
                onClick={handleVote} 
                disabled={isVoting} 
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-100 transition-colors hover:border-red-200 hover:bg-red-50/50 disabled:opacity-50"
                aria-label="Yêu thích"
              >
                <Heart className={`w-5 h-5 transition-colors ${product.userVoted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
            </div>

            {/* Rating Row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${ratingSummary.rating > 0 && s <= Math.round(ratingSummary.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
              {ratingSummary.reviewCount > 0 ? (
                <>
                  <span className="text-sm font-bold text-gray-700">{ratingSummary.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({ratingSummary.reviewCount} đánh giá)</span>
                </>
              ) : (
                <span className="text-xs text-gray-400 font-medium">Chưa có đánh giá</span>
              )}
            </div>

            {/* Title */}
            <h1 className="mb-3 font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              {product.name}
            </h1>

            {/* Short Description */}
            <p className="text-[15px] text-gray-600 leading-relaxed mb-5">
              Bể kính terrarium với thiết kế tinh tế, kết hợp cây sống và tiểu cảnh thiên nhiên thu nhỏ, mang lại không gian xanh mát, thư giãn. Phù hợp trang trí bàn làm việc hoặc làm quà tặng ý nghĩa.
            </p>

            {/* Price section */}
            <div className="mb-6 flex flex-wrap items-baseline gap-3 border-y border-border py-5">
              {/* Old price */}
              {(isSale || hasPriceVoucher) && (
                <span className="text-base text-red-500 font-semibold line-through">
                  {priceBeforeDisplayedDiscount.toLocaleString("vi-VN")}₫
                </span>
              )}
              
              {/* Main Price */}
              <span className={`text-3xl sm:text-4xl font-extrabold ${
                hasPriceVoucher ? "text-emerald-700" : "text-foreground"
              }`}>
                {priceAfterVoucher.toLocaleString("vi-VN")}₫
              </span>

              {/* Promo tag */}
              {isSale && !appliedVoucher && (
                <span className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  -{discountPercent}% Ưu đãi giới hạn
                </span>
              )}

              {appliedVoucher && appliedVoucher.type === "FREE_SHIPPING" && (
                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Miễn phí vận chuyển
                </span>
              )}
              {hasPriceVoucher && (
                <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                  Đã giảm {voucherDiscountAmount.toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>

            {/* 3-tier Package selector */}
            {isBểProduct && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Chọn phiên bản</p>
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPackage === pkg.key;
                    return (
                      <button
                        key={pkg.key}
                        type="button"
                        onClick={() => setSelectedPackage(pkg.key)}
                        className={`flex min-h-14 flex-col items-center gap-1 border px-3 py-3 text-sm font-semibold transition-colors duration-200 sm:text-xs ${
                          isSelected
                            ? "border-foreground bg-foreground text-white shadow-sm"
                            : "border-border bg-white text-gray-600 hover:border-foreground/60 hover:bg-muted/40"
                        }`}
                      >
                        <span className="font-bold leading-tight text-center">{pkg.label}</span>
                        <span className={`text-[10px] leading-tight text-center ${
                          isSelected ? "text-white/70" : "text-gray-400"
                        }`}>{pkg.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DB Variants selection */}
            {dbVariants.length > 0 && (
              <div className="space-y-4 mb-5">
                {dbVariants.map((option: any) => (
                  <div key={option.id}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{option.variantType}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.options.map((opt: string) => {
                        const isSelected = selectedVariants[option.variantType] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedVariants((prev) => ({ ...prev, [option.variantType]: opt }))}
                            className={`min-h-11 border px-4 py-2 text-sm font-medium transition-colors ${
                              isSelected ? "border-foreground bg-foreground text-white shadow-sm" : "border-border bg-white text-gray-700 hover:border-foreground/50 hover:bg-muted/40"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Voucher Section */}
            <div className="mb-6 overflow-hidden border border-border bg-white">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/35 px-4 py-3">
                <Tag className="h-4 w-4 flex-shrink-0 text-foreground" />
                <span className="text-sm font-bold text-foreground">Ưu đãi & Voucher</span>
                {(() => {
                  const best = getBestVoucher(finalPrice);
                  if (!best) return null;
                  return (
                    <span className="ml-auto hidden max-w-[48%] truncate bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 sm:block">
                      Tiết kiệm thêm với {best.code}!
                    </span>
                  );
                })()}
              </div>

              {/* Manual input */}
              <div className="px-4 py-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleApplyVoucher()}
                  placeholder="Nhập mã voucher..."
                  className="min-h-12 flex-1 border border-border px-3 py-2 text-base outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground/20 sm:text-sm"
                />
                <button
                  onClick={() => handleApplyVoucher()}
                  disabled={voucherLoading || !voucherInput.trim()}
                  className="min-h-12 bg-foreground px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {voucherLoading ? "..." : "Áp dụng"}
                </button>
              </div>

              {/* Applied voucher confirmation */}
              {appliedVoucher && (
                <div className="mx-4 mb-3 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-green-700 flex-1">
                    Đã áp dụng <strong>{appliedVoucher.code}</strong>
                    {appliedVoucher.type === "FREE_SHIPPING"
                      ? " (Miễn phí vận chuyển)"
                      : ` (Giảm ${voucherDiscountAmount.toLocaleString("vi-VN")}₫)`}
                  </span>
                  <button onClick={() => { setAppliedVoucher(null); setVoucherInput(""); }} className="flex min-h-11 shrink-0 items-center px-2 text-xs font-medium text-gray-500 hover:text-gray-700">
                    Bỏ chọn
                  </button>
                </div>
              )}

              {/* Available vouchers — radio-selectable list */}
              {publicVouchers.length > 0 && (
                <div className="px-4 pb-4 space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
                  <p className="text-[11px] text-gray-400 mb-1">Chọn 1 voucher cho đơn hàng này:</p>
                  {publicVouchers.map((v) => {
                    const best = getBestVoucher(finalPrice);
                    const isBest = best?.id === v.id;
                    const isApplied = appliedVoucher?.id === v.id;
                    const isFreeShip = v.type === "FREE_SHIPPING";
                    const meetsMin = isVoucherEligible(v, finalPrice);
                    const expDate = new Date(v.expiresAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                    const discountAmt = getVoucherDiscountAmount(v, finalPrice);
                    return (
                      <label
                        key={v.id}
                        className={`grid min-h-20 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border p-3 transition-all sm:grid-cols-[auto_minmax(0,1fr)_auto] ${
                          isApplied
                            ? "border-foreground bg-muted/35 shadow-sm"
                            : isBest
                            ? "border-orange-300 bg-orange-50/50 hover:border-orange-400"
                            : meetsMin
                            ? "border-border bg-white hover:border-foreground/40 hover:bg-muted/35"
                            : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          if (!meetsMin) {
                            e.preventDefault();
                            showToast.warning(`Đơn hàng tối thiểu ${Number(v.minOrderAmount).toLocaleString("vi-VN")}₫`);
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="voucher-select"
                          checked={isApplied}
                          onChange={() => {
                            if (meetsMin) {
                              if (isApplied) {
                                setAppliedVoucher(null);
                                setVoucherInput("");
                              } else {
                                handleApplyVoucher(v.code);
                              }
                            }
                          }}
                          disabled={!meetsMin}
                          className="h-4 w-4 flex-shrink-0 border-gray-300 accent-foreground focus:ring-foreground"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isApplied ? "text-foreground" : "text-gray-800"}`}>
                              {isFreeShip
                                ? `Miễn phí ship ${Number(v.value) === 50000 ? "nhanh" : "tiêu chuẩn"}`
                                : v.type === "PERCENTAGE"
                                ? `Giảm ${v.value}%`
                                : `Giảm ${(Number(v.value) / 1000).toFixed(0)}K`}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{v.code}</span>
                            {isBest && !isApplied && (
                              <span className="text-[9px] bg-orange-400 text-white font-bold px-1.5 py-0.5 rounded-full">Tốt nhất</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {v.minOrderAmount && (
                              <span className="text-[10px] text-gray-400">Đơn từ {(Number(v.minOrderAmount) / 1000).toFixed(0)}k₫</span>
                            )}
                            <span className="text-[10px] text-gray-400">HSD: {expDate}</span>
                          </div>
                        </div>

                        <div className="col-start-2 flex min-w-0 items-center justify-between gap-3 sm:col-start-auto sm:flex-col sm:items-end">
                          {meetsMin ? (
                            <span className={`text-sm font-bold ${isApplied ? "text-emerald-700" : "text-foreground"}`}>
                              {isFreeShip ? "Miễn phí" : `-${discountAmt.toLocaleString("vi-VN")}₫`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-400">Chưa đủ ĐK</span>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyCode(v.code); }}
                            className="flex min-h-11 items-center gap-1 px-2 text-xs text-gray-500 hover:text-foreground sm:-mr-2 sm:min-h-0 sm:px-2 sm:text-[10px]"
                          >
                            {copiedCode === v.code ? <CheckIcon className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            Sao chép
                          </button>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quantity Selector & CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              {/* Qty stepper */}
              <div className="flex h-12 flex-shrink-0 items-center justify-between border border-border bg-white px-2 sm:justify-start">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-11 w-11 items-center justify-center text-gray-500 transition-colors hover:bg-muted hover:text-foreground" aria-label="Giảm số lượng"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center text-base font-bold text-foreground">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="flex h-11 w-11 items-center justify-center text-gray-500 transition-colors hover:bg-muted hover:text-foreground" aria-label="Tăng số lượng"><Plus className="w-4 h-4" /></button>
              </div>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 w-full border-foreground text-sm font-bold text-foreground hover:bg-muted sm:flex-1"
                onClick={handleAddToCart} 
                disabled={product.inventory <= 0}
              >
                Thêm Vào Giỏ
              </Button>
              <Button 
                size="lg" 
                className="h-12 w-full bg-foreground text-sm font-bold text-white shadow-sm transition-colors hover:bg-foreground/85 sm:flex-1"
                onClick={handleBuyNow} 
                disabled={product.inventory <= 0}
              >
                Mua Ngay
              </Button>
            </div>

            <div className="mb-5 hidden lg:block">
              <ProductAdminChat
                productType="CATALOG"
                productId={product.id}
                productName={product.name}
                productImage={product.images?.[0]}
              />
            </div>

            {/* Shipping line */}
            <div className="flex items-center gap-2.5 text-xs text-gray-500 mb-5 pb-3">
              <svg className="h-5 w-5 flex-shrink-0 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l-.867 12.142A2 2 0 006.128 22h11.744a2 2 0 001.994-1.858L19 8M10 12v6m4-6v6" />
              </svg>
              <span>Giao trong TP.HCM; địa chỉ ngoài khu vực sẽ được shop báo phí qua tin nhắn.</span>
            </div>

            {/* Share product row */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500">Chia sẻ:</span>
              <div className="flex items-center gap-1.5">
                <button className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-gray-50" title="Chia sẻ Facebook" aria-label="Chia sẻ Facebook">
                  <FacebookIcon />
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-gray-50" title="Chia sẻ Instagram" aria-label="Chia sẻ Instagram">
                  <InstagramIcon />
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-gray-50" title="Chia sẻ TikTok" aria-label="Chia sẻ TikTok">
                  <TikTokIcon />
                </button>
              </div>
              <div className="flex-1" />
              <div 
                onClick={handleCopyLink}
                className="inline-flex cursor-pointer items-center gap-2 border border-border bg-muted/35 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <span className="font-mono truncate max-w-[150px] sm:max-w-none">/san-pham/{product.slug}</span>
                {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs & Review Column Layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
          {/* Cột trái: Tabs Content (8/12) */}
          <div className="lg:col-span-8">
            <div className="flex border-b border-border mb-0">
              {(["details", "care", "reviews"] as TabType[]).map((tab) => {
                if (tab === "care" && !hasCareGuide) return null;
                const labels: Record<TabType, string> = { details: "Thông tin sản phẩm", care: "Hướng dẫn chăm sóc", reviews: `Đánh giá${reviews.length > 0 ? ` (${reviews.length})` : ""}` };
                const icons: Record<TabType, React.ReactNode> = {
                  details: <Package className="w-4 h-4" />,
                  care: <Sprout className="w-4 h-4" />,
                  reviews: <Star className="w-4 h-4" />,
                };
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {icons[tab]}{labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Details tab */}
            {activeTab === "details" && (
              <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-border p-6 sm:p-8">
                <p className="text-muted-foreground mb-5 leading-relaxed">
                  {product.name} là sản phẩm terrarium được chế tác thủ công, mang vẻ đẹp thiên nhiên thu nhỏ vào không gian sống của bạn.
                </p>
                {(product.size || product.soil || product.moss || product.driftwood || product.accessories) ? (
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {product.size && (
                      <li className="flex items-start gap-2.5">
                        <span className="text-primary font-bold mt-0.5">✓</span>
                        <div>
                          <strong className="text-gray-700 font-semibold">Kích thước bể:</strong> {product.size}
                        </div>
                      </li>
                    )}
                    {product.soil && (
                      <li className="flex items-start gap-2.5">
                        <span className="text-primary font-bold mt-0.5">✓</span>
                        <div>
                          <strong className="text-gray-700 font-semibold">Loại đất sử dụng:</strong> {product.soil}
                        </div>
                      </li>
                    )}
                    {product.moss && (
                      <li className="flex items-start gap-2.5">
                        <span className="text-primary font-bold mt-0.5">✓</span>
                        <div>
                          <strong className="text-gray-700 font-semibold">Loại rêu sử dụng:</strong> {product.moss}
                        </div>
                      </li>
                    )}
                    {product.driftwood && (
                      <li className="flex items-start gap-2.5">
                        <span className="text-primary font-bold mt-0.5">✓</span>
                        <div>
                          <strong className="text-gray-700 font-semibold">Bố cục lũa:</strong> {product.driftwood}
                        </div>
                      </li>
                    )}
                    {product.accessories && (
                      <li className="flex items-start gap-2.5">
                        <span className="text-primary font-bold mt-0.5">✓</span>
                        <div>
                          <strong className="text-gray-700 font-semibold">Phụ kiện đi kèm:</strong> {product.accessories}
                        </div>
                      </li>
                    )}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-muted-foreground">
                    {["Bình thủy tinh chất lượng cao", "Đất trồng và lớp thoát nước cao cấp", "Cây được chọn lọc kỹ càng", "Phụ kiện trang trí (đá, rêu, v.v.)", "Hướng dẫn chăm sóc kèm theo"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-primary font-bold">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Care Guide tab */}
            {activeTab === "care" && hasCareGuide && product.careGuide && (
              <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-border p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {product.careGuide.watering && (
                    <div className="flex gap-4 border border-blue-100/50 bg-blue-50/50 p-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Droplets className="w-5 h-5 text-blue-600" /></div>
                      <div><p className="font-semibold text-blue-900 mb-1">Tưới nước</p><p className="text-sm text-blue-700 leading-relaxed">{product.careGuide.watering}</p></div>
                    </div>
                  )}
                  {product.careGuide.sunlight && (
                    <div className="flex gap-4 border border-yellow-100/50 bg-yellow-50/50 p-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0"><Sun className="w-5 h-5 text-yellow-600" /></div>
                      <div><p className="font-semibold text-yellow-900 mb-1">Ánh sáng</p><p className="text-sm text-yellow-700 leading-relaxed">{product.careGuide.sunlight}</p></div>
                    </div>
                  )}
                  {product.careGuide.temperature && (
                    <div className="flex gap-4 border border-orange-100/50 bg-orange-50/50 p-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><Thermometer className="w-5 h-5 text-orange-600" /></div>
                      <div><p className="font-semibold text-orange-900 mb-1">Nhiệt độ</p><p className="text-sm text-orange-700 leading-relaxed">{product.careGuide.temperature}</p></div>
                    </div>
                  )}
                  {product.careGuide.humidity && (
                    <div className="flex gap-4 border border-green-100/50 bg-green-50/50 p-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><Wind className="w-5 h-5 text-green-600" /></div>
                      <div><p className="font-semibold text-green-900 mb-1">Độ ẩm</p><p className="text-sm text-green-700 leading-relaxed">{product.careGuide.humidity}</p></div>
                    </div>
                  )}
                </div>
                {product.careGuide.commonIssues && (
                  <div className="mb-6 border border-red-100/50 bg-red-50/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><p className="font-semibold text-red-900">Vấn đề thường gặp & cách xử lý</p></div>
                    <p className="text-sm text-red-700 whitespace-pre-line leading-relaxed">{product.careGuide.commonIssues}</p>
                  </div>
                )}
                {product.careGuide.videoUrl && (
                  <div className="border border-purple-100/50 bg-purple-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3"><Play className="w-5 h-5 text-purple-600" /><p className="font-semibold text-purple-900">Video hướng dẫn chăm sóc</p></div>
                    <a href={product.careGuide.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm underline"><Play className="w-4 h-4" />Xem video hướng dẫn</a>
                  </div>
                )}
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "reviews" && (
              <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-border p-6 sm:p-8">
                {alreadyReviewed ? (
                  <div className="mb-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Bạn đã gửi đánh giá. Đang chờ admin duyệt.</div>
                ) : canReview ? (
                  <form onSubmit={handleSubmitReview} className="mb-8 border border-border bg-muted/35 p-6">
                    <h3 className="font-semibold text-lg mb-4">Đánh giá sản phẩm của bạn</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Xếp hạng *</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: star }))} className="p-1">
                            <Star className={`w-7 h-7 transition-colors ${star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Tiêu đề (tùy chọn)</label>
                      <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none" placeholder="Tóm tắt đánh giá..." />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Nội dung *</label>
                      <textarea value={reviewForm.content} onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))} rows={4} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none" placeholder="Chia sẻ trải nghiệm của bạn..." />
                    </div>
                    <button type="submit" disabled={submittingReview} className="bg-foreground px-6 py-2.5 font-semibold text-white transition-colors hover:bg-foreground/85 disabled:bg-gray-300">
                      {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                    </button>
                  </form>
                ) : !session ? (
                  <div className="mb-6 border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><a href="/login" className="font-medium underline">Đăng nhập</a> để đánh giá sản phẩm (chỉ dành cho khách hàng đã mua hàng)</div>
                ) : (
                  <div className="mb-6 border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">Bạn cần mua sản phẩm này để có thể gửi đánh giá.</div>
                )}
                {reviewsLoading ? (
                  <div className="text-center py-8 text-gray-400">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-400"><Star className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Chưa có đánh giá nào.</p></div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{reviews.length} đánh giá</h3>
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{review.customer?.name || "Khách hàng"}</p>
                            <div className="flex gap-0.5 mt-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã mua hàng</span>}
                            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                        {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                        <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cột phải: Đánh giá khách hàng (4/12) */}
          <div className="lg:col-span-4">
            <div className="border border-border bg-white p-6">
              <h3 className="font-bold text-lg text-[#1a2e12] mb-4">Đánh giá khách hàng</h3>
              
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 mb-6">
                <div className="w-full border border-border bg-muted/35 px-5 py-4 text-center sm:w-auto lg:w-full">
                  <p className="text-5xl font-extrabold text-[#1a2e12]">{ratingSummary.rating.toFixed(1)}</p>
                  <div className="flex gap-0.5 mt-1.5 justify-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${ratingSummary.rating > 0 && s <= Math.round(ratingSummary.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">
                    {ratingSummary.reviewCount > 0 ? `${ratingSummary.reviewCount} lượt đánh giá` : "Chưa có đánh giá"}
                  </p>
                </div>
                
                <div className="flex-1 w-full space-y-1.5">
                  {ratingBreakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2 text-xs">
                      <span className="w-10 text-gray-500 font-semibold text-right">{row.stars} Sao</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${row.percent}%` }} />
                      </div>
                      <span className="w-6 text-gray-400 text-right">{row.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 text-center">
                <p className="text-xs text-gray-400 py-4 font-medium">
                  {reviews.length > 0 ? `${reviews.length} đánh giá đã được duyệt.` : "Chưa có nội dung đánh giá được duyệt."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products — using unified ProductCard */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((rel: any) => {
                const relRatingSummary = getProductRatingSummary(rel);
                return (
                <ProductCard
                  key={rel.id}
                  id={rel.id}
                  slug={rel.slug}
                  name={rel.name}
                  basePrice={Number(rel.basePrice.toString())}
                  salePrice={rel.salePrice ? Number(rel.salePrice.toString()) : null}
                  saleEndDate={rel.saleEndDate ?? null}
                  images={rel.images}
                  category={rel.category}
                  rating={relRatingSummary.rating}
                  reviewCount={relRatingSummary.reviewCount}
                  onAddToCart={(pkg, qty) => {
                    if (!session) {
                      showToast.warning("Vui lòng đăng nhập để thêm sản phẩm");
                      router.push(`/login?callbackUrl=/products/${rel.slug}`);
                      return;
                    }
                    const relBasePrice = parseFloat(rel.basePrice.toString());
                    const relSalePrice = rel.salePrice ? parseFloat(rel.salePrice.toString()) : null;
                    const relSaleValid =
                      relSalePrice != null &&
                      relSalePrice < relBasePrice &&
                      (!rel.saleEndDate || new Date(rel.saleEndDate) > new Date());
                    const base = relSaleValid ? relSalePrice : relBasePrice;
                    const price = base + getProductPackagePriceAdjustment(pkg);
                    const pkgLabel = pkg === "standard" ? "Gói tiêu chuẩn" : pkg === "advanced" ? "Gói nâng cao" : "Gói cơ bản";
                    addItem({
                      productId: rel.id,
                      productName: rel.name,
                      productImage: rel.images[0] || "",
                      price,
                      quantity: qty,
                      variants: { "Phân loại": pkgLabel },
                    });
                    showToast.success(`Đã thêm "${rel.name}" vào giỏ hàng 🛒`);
                  }}
                  wished={isWished(rel.id)}
                  onToggleWishlist={() => toggleWishlist(rel.id, rel.name)}
                />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8e4cf] bg-white/95 px-4 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] shadow-[0_-12px_30px_rgba(26,46,18,0.10)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#526248]">{product.name}</p>
            <p className="whitespace-nowrap text-[clamp(1.05rem,5vw,1.25rem)] font-extrabold leading-tight text-foreground">
              {priceAfterVoucher.toLocaleString("vi-VN")}₫
            </p>
          </div>
          <ProductAdminChat
            productType="CATALOG"
            productId={product.id}
            productName={product.name}
            productImage={product.images?.[0]}
            compact
          />
          <Button
            className="h-12 min-w-[122px] shrink-0 bg-foreground px-3 text-sm font-bold text-white hover:bg-foreground/85 min-[380px]:min-w-[140px] min-[380px]:px-4"
            onClick={handleAddToCart}
            disabled={product.inventory <= 0}
          >
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Thêm giỏ
          </Button>
        </div>
      </div>
    </div>
  );
}
