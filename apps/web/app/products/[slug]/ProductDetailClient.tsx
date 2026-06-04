"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, Minus, Plus, Star,
  Droplets, Sun, Thermometer, Wind, AlertTriangle, Play,
  Package, Sprout, Heart
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface ProductVariant {
  id: string;
  variantType: string;
  value: string;
  priceAdjustment: { toString: () => string };
  inventory: number;
}

interface ProductVariantOption {
  id: string;
  variantType: string;
  options: string[];
  image?: string;
}

interface CareGuide {
  watering: string;
  sunlight: string;
  temperature: string;
  humidity: string;
  commonIssues?: string | null;
  videoUrl?: string | null;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  type: string;
  inventory: number;
  images: string[];
  category: { id: string; name: string; slug: string };
  variants: ProductVariant[];
  variantOptions: ProductVariantOption[];
  careGuide?: CareGuide | null;
  voteCount?: number;
  userVoted?: boolean;
}

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  images: string[];
  category: { name: string };
}

type TabType = "details" | "care" | "reviews";

export function ProductDetailClient({ initialProduct, initialRelated }: { initialProduct: any; initialRelated: any[] }) {
  const router = useRouter();

  const [product, setProduct] = useState<any>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<any[]>(initialRelated);
  const [loading, setLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isVoting, setIsVoting] = useState(false);

  // ── Lightbox & Zoom state ─────────────────────────────────────────────
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 }); // percent
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setZoomOrigin({ x: 50, y: 50 });
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard controls for Lightbox
  useEffect(() => {
    if (!lightboxOpen || !product || !product.images) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxOpen(false); resetZoom(); }
      else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
        resetZoom();
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
        resetZoom();
      } else if (e.key === "+" || e.key === "=") {
        setZoomScale((s) => Math.min(s + 0.5, 5));
      } else if (e.key === "-") {
        setZoomScale((s) => { const next = Math.max(s - 0.5, 1); if (next === 1) { setPanOffset({ x: 0, y: 0 }); } return next; });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, product?.images?.length, resetZoom]);

  // Wheel to zoom
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

  // Drag to pan
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

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    resetZoom();
  };

  const closeLightbox = () => { setLightboxOpen(false); resetZoom(); };

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const { data: session } = useSession();
  const { addItem, items, getCartTotal, getCartCount, removeItem, updateQuantity, toggleSelectItem, selectAllItems, getSelectedTotal, getSelectedItems } = useCartStore();

  // Load reviews when tab changes to "reviews"
  useEffect(() => {
    if (activeTab !== "reviews" || !product) return;
    setReviewsLoading(true);
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      })
      .finally(() => setReviewsLoading(false));

    const customerId = (session?.user as any)?.id;
    if (customerId) {
      fetch(`/api/reviews/can-review?productId=${product.id}&customerId=${customerId}`)
        .then((r) => r.json())
        .then((d) => {
          setCanReview(d.canReview ?? false);
          setAlreadyReviewed(d.alreadyReviewed ?? false);
        })
        .catch(() => setCanReview(false));
    } else {
      setCanReview(false);
    }
  }, [activeTab, product, session]);

  // Also load reviews on mount to show rating in product info
  useEffect(() => {
    if (!product) return;
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      });
  }, [product?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerId = (session?.user as any)?.id;
    if (!customerId) { toast.error("Vui lòng đăng nhập"); return; }
    if (!reviewForm.content.trim()) { toast.error("Vui lòng nhập nội dung đánh giá"); return; }

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerId,
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Đánh giá đã được gửi! Đang chờ admin duyệt.");
        setReviewForm({ rating: 5, title: "", content: "" });
        setAlreadyReviewed(true);
        setCanReview(false);
      } else {
        toast.error(data.error || "Lỗi khi gửi đánh giá");
      }
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getPriceWithVariants = () => {
    if (!product) return { price: 0, base: 0, isSale: false };
    
    let base = parseFloat(product.basePrice.toString());
    let currentBase = base;
    
    const hasSale = product.salePrice && product.salePrice !== null;
    const isSaleValid = hasSale && (!product.saleEndDate || new Date(product.saleEndDate) > new Date());
    let isSale = false;

    if (isSaleValid) {
      currentBase = parseFloat(product.salePrice.toString());
      isSale = true;
    }

    let price = currentBase;

    product.variantOptions?.forEach((variant: any) => {
      const selectedValue = selectedVariants[variant.variantType];
      if (selectedValue && variant.value === selectedValue) {
        const adjustment = parseFloat(variant.priceAdjustment.toString());
        price += adjustment;
        base += adjustment;
      }
    });
    return { price, base, isSale };
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!session) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      router.push(`/login?callbackUrl=/products/${product.slug}`);
      return;
    }
    const { price } = getPriceWithVariants();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: price,
      quantity,
      variants: selectedVariants,
    });
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!session) {
      toast.error("Vui lòng đăng nhập để mua hàng");
      router.push(`/login?callbackUrl=/products/${product.slug}`);
      return;
    }
    const { price } = getPriceWithVariants();
    
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: price,
      quantity,
      variants: selectedVariants,
    });

    if (items.length === 0) {
      router.push("/checkout");
    } else {
      setCartOpen(true);
    }
  };

  const handleVote = async () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để bình chọn");
      router.push("/login");
      return;
    }

    if (!product || isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch(`/api/products/${product.id}/vote`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Lỗi khi bình chọn");
      }

      const data = await res.json();
      setProduct((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          userVoted: data.voted,
          voteCount: (prev.voteCount || 0) + (data.voted ? 1 : -1)
        };
      });
      
      if (data.voted) {
        toast.success("Đã thêm vào mục yêu thích!");
      } else {
        toast.info("Đã bỏ bình chọn sản phẩm.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </main>
    );
  }

  if (!product) return null;

  const { price: finalPrice, base: originalPrice, isSale } = getPriceWithVariants();
  const discountPercent = isSale && originalPrice > 0 ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;
  const hasCareGuide = !!(
    product.careGuide &&
    (product.careGuide.watering || product.careGuide.sunlight ||
     product.careGuide.temperature || product.careGuide.humidity)
  );

  const avgRating = reviews.length > 0
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <main className="min-h-screen bg-background">

      {/* ── Lightbox Modal with Zoom ──────────────────────────────────────── */}
      {lightboxOpen && product?.images && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Zoom controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/40 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <button
              onClick={() => setZoomScale((s) => { const n = Math.max(s - 0.5, 1); if (n === 1) setPanOffset({ x: 0, y: 0 }); return n; })}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors text-lg font-bold"
              aria-label="Thu nhỏ"
            >−</button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center select-none">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((s) => Math.min(s + 0.5, 5))}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors text-lg font-bold"
              aria-label="Phóng to"
            >+</button>
            {zoomScale > 1 && (
              <button
                onClick={resetZoom}
                className="ml-1 px-3 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white text-xs font-medium transition-colors"
              >Reset</button>
            )}
          </div>

          {/* Prev / Next arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={() => { setLightboxIndex((p) => (p === 0 ? product.images.length - 1 : p - 1)); resetZoom(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                aria-label="Ảnh trước"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button
                onClick={() => { setLightboxIndex((p) => (p === product.images.length - 1 ? 0 : p + 1)); resetZoom(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                aria-label="Ảnh tiếp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}

          {/* Image */}
          <div
            ref={imgContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
            style={{ cursor: zoomScale > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[lightboxIndex]}
              alt={product.name}
              draggable={false}
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                transition: isPanning ? "none" : "transform 0.15s ease",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => { setLightboxIndex(i); resetZoom(); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          {product.images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {product.images.length}
            </div>
          )}
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Giỏ hàng ({getCartCount()})</SheetTitle>
            <SheetDescription>Xem lại sản phẩm và tiến hành thanh toán</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <input 
                    type="checkbox" 
                    id="selectAll"
                    className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
                    checked={items.length > 0 && items.every(i => i.selected)}
                    onChange={(e) => selectAllItems(e.target.checked)}
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">Chọn tất cả</label>
                </div>
                {items.map((item: CartItem) => (
                  <Card key={item.id} className={item.selected ? "border-[#425733] bg-[#f8faf6]" : "opacity-80"}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input 
                          type="checkbox" 
                          className="mt-2 w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
                          checked={item.selected || false}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                        <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={item.productImage || "https://via.placeholder.com/80x80"}
                            alt={item.productName}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.productName}</h3>
                          {item.variants && Object.keys(item.variants).length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {Object.entries(item.variants ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ")}
                            </p>
                          )}
                          <p className="text-primary font-bold mt-1">
                            {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variants)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variants)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => removeItem(item.productId, item.variants)}>
                              Xóa
                            </Button>
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
              <div className="flex justify-between text-lg font-semibold mb-4">
                <span>Tổng cộng:</span>
                <span className="text-primary">{getSelectedTotal().toLocaleString("vi-VN")}₫</span>
              </div>
              <Button 
                className="w-full bg-[#425733] hover:bg-[#364a29]" 
                asChild={getSelectedItems().length > 0}
                disabled={getSelectedItems().length === 0}
                onClick={() => {
                  if (getSelectedItems().length > 0) {
                    setCartOpen(false);
                  }
                }}
              >
                {getSelectedItems().length > 0 ? (
                  <Link href="/checkout">Tiến hành thanh toán</Link>
                ) : (
                  <span>Vui lòng chọn sản phẩm</span>
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại sản phẩm
        </Link>
      </div>

      {/* ── Product Details ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ── Left: Gallery with thumbnail strip ── */}
          <div className="flex gap-3">
            {/* Vertical thumbnail strip (only when multiple images) */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-col gap-2 w-[72px] flex-shrink-0">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative w-[72px] h-[72px] rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                      i === currentImageIndex
                        ? "border-[#425733] shadow-md ring-2 ring-[#425733]/20"
                        : "border-gray-200 opacity-65 hover:opacity-100 hover:border-[#425733]/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} - ảnh ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 min-w-0">
              {product.images && product.images.length > 0 ? (
                <div
                  className="relative rounded-2xl overflow-hidden bg-[#f8faf6] border border-[#eaefeb] shadow-sm cursor-zoom-in group"
                  style={{ aspectRatio: "4/5" }}
                  onClick={() => handleOpenLightbox(currentImageIndex)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {/* Sale badge */}
                  {isSale && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow z-10">
                      -{discountPercent}%
                    </div>
                  )}

                  {/* Hover nav arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev: number) => (prev === 0 ? product.images.length - 1 : prev - 1));
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev: number) => (prev === product.images.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {product.images.map((_: string, i: number) => (
                        <span
                          key={i}
                          className={`block rounded-full transition-all duration-200 ${
                            i === currentImageIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/5] bg-muted rounded-2xl flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Chưa có ảnh</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Product Info ── */}
          <div className="flex flex-col">

            {/* Badges row + wishlist */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#e3ebdd] text-[#425733] px-3 py-1 rounded-full text-xs font-semibold">
                  {product.category.name}
                </span>
                {product.inventory > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Còn hàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Hết hàng
                  </span>
                )}
              </div>
              <button
                onClick={handleVote}
                disabled={isVoting}
                className="flex flex-col items-center gap-0.5 p-2 -mr-1 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 group"
                aria-label="Yêu thích"
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${product.userVoted ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-500"}`}
                />
                {product.voteCount !== undefined && product.voteCount > 0 && (
                  <span className={`text-[10px] font-bold leading-none ${product.userVoted ? "text-red-500" : "text-gray-400"}`}>
                    {product.voteCount}
                  </span>
                )}
              </button>
            </div>

            {/* Rating stars */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviews.length} đánh giá)</span>
              </div>
            )}

            {/* Product name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e12] leading-tight mb-3 tracking-tight">
              {product.name}
            </h1>

            {/* Short description */}
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Bể kính terrarium với thiết kế tinh tế, kết hợp cây sống và tiểu cảnh thiên nhiên thu nhỏ, mang lại không gian xanh mát, thư giãn. Phù hợp trang trí bàn làm việc hoặc làm quà tặng ý nghĩa.
            </p>

            {/* Price block */}
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              {isSale && (
                <span className="text-lg text-gray-400 font-medium line-through">
                  {originalPrice.toLocaleString("vi-VN")}₫
                </span>
              )}
              <span className="text-3xl sm:text-4xl font-extrabold text-[#425733]">
                {finalPrice.toLocaleString("vi-VN")}₫
              </span>
              {isSale && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  -{discountPercent}% Ưu đãi giới hạn
                </span>
              )}
            </div>

            {/* Variant Selection */}
            {product.variantOptions.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.variantOptions.map((option: any) => (
                  <div key={option.id}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{option.variantType}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.options.map((opt: string) => {
                        const isSelected = selectedVariants[option.variantType] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedVariants((prev) => ({ ...prev, [option.variantType]: opt }))}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 border-2 ${
                              isSelected
                                ? "border-[#425733] bg-[#425733] text-white shadow-md"
                                : "border-gray-200 bg-white text-gray-700 hover:border-[#425733]/50 hover:bg-[#f8faf6]"
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

            {/* Quantity + Action buttons */}
            <div className="flex items-center gap-3 mb-5">
              {/* Quantity stepper */}
              <div className="flex items-center h-12 border-2 border-gray-200 rounded-xl px-1 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-base font-bold text-[#1a2e12]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Thêm vào giỏ */}
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 border-2 border-[#425733] text-[#425733] hover:bg-[#f8faf6] rounded-xl font-bold text-sm"
                onClick={handleAddToCart}
                disabled={product.inventory <= 0}
              >
                Thêm Vào Giỏ
              </Button>

              {/* Mua ngay */}
              <Button
                size="lg"
                className="flex-1 h-12 bg-[#425733] hover:bg-[#364a29] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                onClick={handleBuyNow}
                disabled={product.inventory <= 0}
              >
                Mua Ngay
              </Button>
            </div>

            {/* Shipping info */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
              <svg className="w-4 h-4 text-[#425733] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l-.867 12.142A2 2 0 006.128 22h11.744a2 2 0 001.994-1.858L19 8M10 12v6m4-6v6" />
              </svg>
              Miễn phí vận chuyển cho đơn hàng từ <strong className="text-gray-700 ml-0.5">500.000₫</strong>
            </div>

            {/* Trust badges 2×2 */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: "✅", title: "Chất lượng tuyển chọn", sub: "Cây khỏe mạnh, dễ chăm sóc" },
                { icon: "📦", title: "Đóng gói an toàn", sub: "Đảm bảo nguyên vẹn khi vận chuyển" },
                { icon: "💡", title: "Tư vấn tận tâm", sub: "Hỗ trợ chăm sóc miễn phí mãi mãi" },
                { icon: "🎁", title: "Quà tặng ý nghĩa", sub: "Thiết kế tinh tế, sang trọng" },
              ].map((badge) => (
                <div key={badge.title} className="flex items-start gap-2.5 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                  <span className="text-lg flex-shrink-0 leading-none mt-0.5">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#2d4a1e] leading-tight">{badge.title}</p>
                    <p className="text-[11px] text-[#5a7a48] leading-snug mt-0.5">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Tab Section ─────────────────────────────────────────────────────── */}
        <div className="mt-12">
          {/* Tab Headers */}
          <div className="flex border-b border-border mb-0">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="w-4 h-4" />
              Thông tin sản phẩm
            </button>
            {hasCareGuide && (
              <button
                onClick={() => setActiveTab("care")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === "care"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sprout className="w-4 h-4" />
                Hướng dẫn chăm sóc
              </button>
            )}
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === "reviews"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="w-4 h-4" />
              Đánh giá {reviews.length > 0 && `(${reviews.length})`}
            </button>
          </div>

          {/* Tab: Product Details */}
          {activeTab === "details" && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-border p-8">
              <p className="text-muted-foreground mb-5 leading-relaxed">
                {product.name} là sản phẩm terrarium được chế tác thủ công, mang vẻ đẹp thiên nhiên thu nhỏ vào không gian sống của bạn. Mỗi sản phẩm đều được chăm chút tỉ mỉ và đi kèm đầy đủ những gì bạn cần.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Bình thủy tinh chất lượng cao</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Đất trồng và lớp thoát nước cao cấp</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Cây được chọn lọc kỹ càng</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Phụ kiện trang trí (đá, rêu, v.v.)</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Hướng dẫn chăm sóc kèm theo</li>
              </ul>
            </div>
          )}

          {/* Tab: Care Guide */}
          {activeTab === "care" && hasCareGuide && product.careGuide && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-border p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {product.careGuide.watering && (
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">Tưới nước</p>
                      <p className="text-sm text-blue-700">{product.careGuide.watering}</p>
                    </div>
                  </div>
                )}
                {product.careGuide.sunlight && (
                  <div className="flex gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Sun className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Ánh sáng</p>
                      <p className="text-sm text-yellow-700">{product.careGuide.sunlight}</p>
                    </div>
                  </div>
                )}
                {product.careGuide.temperature && (
                  <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Thermometer className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-orange-900 mb-1">Nhiệt độ</p>
                      <p className="text-sm text-orange-700">{product.careGuide.temperature}</p>
                    </div>
                  </div>
                )}
                {product.careGuide.humidity && (
                  <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Wind className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 mb-1">Độ ẩm</p>
                      <p className="text-sm text-green-700">{product.careGuide.humidity}</p>
                    </div>
                  </div>
                )}
              </div>
              {product.careGuide.commonIssues && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="font-semibold text-red-900">Vấn đề thường gặp & cách xử lý</p>
                  </div>
                  <p className="text-sm text-red-700 whitespace-pre-line">{product.careGuide.commonIssues}</p>
                </div>
              )}
              {product.careGuide.videoUrl && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-purple-600" />
                    <p className="font-semibold text-purple-900">Video hướng dẫn chăm sóc</p>
                  </div>
                  <a
                    href={product.careGuide.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm underline"
                  >
                    <Play className="w-4 h-4" />
                    Xem video hướng dẫn
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tab: Reviews */}
          {activeTab === "reviews" && (
            <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-border p-8">
              {alreadyReviewed ? (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                  Bạn đã gửi đánh giá. Đang chờ admin duyệt.
                </div>
              ) : canReview ? (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-[#f8faf6] border border-[#daebd0] rounded-xl">
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
                    <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none" placeholder="Tóm tắt đánh giá của bạn..." />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Nội dung *</label>
                    <textarea value={reviewForm.content} onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))} rows={4} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none" placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm..." />
                  </div>
                  <button type="submit" disabled={submittingReview} className="bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#364a29] disabled:bg-gray-300 transition-colors">
                    {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                  </button>
                </form>
              ) : !session ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
                  <a href="/login" className="underline font-medium">Đăng nhập</a> để đánh giá sản phẩm (chỉ dành cho khách hàng đã mua hàng)
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                  Bạn cần mua sản phẩm này để có thể gửi đánh giá.
                </div>
              )}
              {reviewsLoading ? (
                <div className="text-center py-8 text-gray-400">Đang tải đánh giá...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có đánh giá nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{reviews.length} đánh giá</h3>
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border rounded-xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{review.customer?.name || "Khách hàng"}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={(relatedProduct as any).id} href={`/products/${relatedProduct.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {relatedProduct.images.length > 0 ? (
                          <Image src={relatedProduct.images[0]} alt={relatedProduct.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" />
                        ) : (
                          <span className="text-muted-foreground">Chưa có ảnh</span>
                        )}
                      </div>
                      <div className="p-4">
                        <Badge variant="secondary" className="mb-2">{relatedProduct.category.name}</Badge>
                        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{relatedProduct.name}</h3>
                        <p className="text-lg font-bold text-primary">{Number(relatedProduct.basePrice.toString()).toLocaleString("vi-VN")}₫</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox Modal (fullscreen) */}
        {lightboxOpen && product.images && product.images.length > 0 && (
          <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white z-10 bg-gradient-to-b from-black/50 to-transparent">
              <span className="text-sm font-semibold tracking-wider font-mono bg-white/10 px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {product.images.length}
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white"
                aria-label="Đóng"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-between px-4 sm:px-12 relative">
              <button
                onClick={() => setLightboxIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all backdrop-blur-sm z-10"
                aria-label="Ảnh trước"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative max-w-4xl max-h-[75vh] w-full aspect-square flex items-center justify-center">
                <Image
                  src={product.images[lightboxIndex]}
                  alt={`${product.name} - Phóng to`}
                  fill
                  className="object-contain transition-all duration-300"
                  sizes="100vw"
                  priority
                />
              </div>

              <button
                onClick={() => setLightboxIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all backdrop-blur-sm z-10"
                aria-label="Ảnh sau"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Bottom Thumbnails */}
            <div className="p-6 bg-black/40 border-t border-white/10 backdrop-blur-sm z-10">
              <div className="flex justify-center gap-3 overflow-x-auto max-w-2xl mx-auto py-2 scrollbar-none">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all border-2 ${
                      lightboxIndex === idx
                        ? "border-[#a8c098] scale-105 ring-2 ring-[#a8c098]/30"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}