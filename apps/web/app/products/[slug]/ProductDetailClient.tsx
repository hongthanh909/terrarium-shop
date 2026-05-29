"use client";

import { useState, useEffect } from "react";
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

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null); // null = checking
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const { data: session } = useSession();
  const { addItem, items, getCartTotal, getCartCount, removeItem, updateQuantity } = useCartStore();

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

    // Check if logged-in user has purchased and can review
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
    
    // Check sale logic
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
        base += adjustment; // if sale, original price also increases by variant price
      }
    });
    return { price, base, isSale };
  };

  const handleAddToCart = () => {
    if (!product) return;
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

  return (
    <main className="min-h-screen bg-background">
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
                {items.map((item: CartItem) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
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
                <span className="text-primary">{getCartTotal().toLocaleString("vi-VN")}₫</span>
              </div>
              <Button className="w-full" asChild onClick={() => setCartOpen(false)}>
                <Link href="/checkout">Tiến hành thanh toán</Link>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Back */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại sản phẩm
        </Link>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[4/5] sm:aspect-square bg-[#f8faf6] rounded-3xl overflow-hidden relative border border-[#eaefeb] shadow-sm">
              <Image
                src={product.images[currentImageIndex] || "https://via.placeholder.com/800x1000?text=No+Image"}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
                priority
              />
              {isSale && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md z-10">
                  -{discountPercent}%
                </div>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 border-2 ${
                      currentImageIndex === index 
                        ? "border-[#425733] shadow-md ring-2 ring-[#425733]/20" 
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-200"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 20vw, 10vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-[#e3ebdd] text-[#425733] hover:bg-[#daebd0] px-3 py-1 rounded-full text-xs font-medium">
                  {product.category.name}
                </Badge>
                {product.inventory > 0 ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Còn hàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Hết hàng
                  </span>
                )}
              </div>
              <button
                onClick={handleVote}
                disabled={isVoting}
                className="flex flex-col items-center gap-1 p-2 -mr-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 group"
                aria-label="Yêu thích"
              >
                <Heart 
                  className={`w-7 h-7 transition-colors ${product.userVoted ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} 
                />
                {product.voteCount !== undefined && product.voteCount > 0 && (
                  <span className={`text-xs font-semibold ${product.userVoted ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'}`}>
                    {product.voteCount}
                  </span>
                )}
              </button>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a2e12] leading-tight mb-4 tracking-tight">
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-baseline gap-4 mb-8">
              <span className="text-4xl font-extrabold text-[#425733]">
                {finalPrice.toLocaleString("vi-VN")}₫
              </span>
              {isSale && (
                <span className="text-xl text-gray-400 font-medium line-through decoration-gray-300">
                  {originalPrice.toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>

            <Separator className="bg-[#eaefeb] mb-8" />

            {/* Variant Selection */}
            {product.variantOptions.length > 0 && (
              <div className="space-y-6 mb-8">
                {product.variantOptions.map((option: any) => (
                  <div key={option.id}>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-base font-bold text-[#2d3a24] uppercase tracking-wider text-xs">{option.variantType}</Label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {option.options.map((opt: string) => {
                        const isSelected = selectedVariants[option.variantType] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedVariants((prev) => ({ ...prev, [option.variantType]: opt }))}
                            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border-2 ${
                              isSelected 
                                ? "border-[#425733] bg-[#425733] text-white shadow-md transform scale-[1.02]" 
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

            {/* Actions (Quantity + Buttons) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 mt-auto">
              <div className="flex flex-col justify-center h-[56px] border-2 border-gray-200 rounded-xl px-2 w-full sm:w-auto bg-white">
                <div className="flex items-center justify-between gap-4">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold text-[#1a2e12]">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="p-2 text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 flex-1">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1 h-[56px] border-2 border-[#425733] text-[#425733] hover:bg-[#f8faf6] rounded-xl font-bold text-base shadow-sm"
                  onClick={handleAddToCart}
                  disabled={product.inventory <= 0}
                >
                  Thêm Vào Giỏ
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1 h-[56px] bg-[#425733] hover:bg-[#364a29] text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all"
                  onClick={() => { handleAddToCart(); router.push("/checkout"); }}
                  disabled={product.inventory <= 0}
                >
                  Mua Ngay
                </Button>
              </div>
            </div>

            {/* Shipping Info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Miễn phí vận chuyển</strong> cho đơn hàng từ 500.000₫
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="flex items-start gap-2.5 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                <span className="text-xl flex-shrink-0">✅</span>
                <div>
                  <p className="text-xs font-semibold text-[#2d4a1e]">100% Cây Khỏe Mạnh</p>
                  <p className="text-[11px] text-[#5a7a48] leading-snug mt-0.5">Chọn lọc kỹ, đảm bảo cây sống tốt</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                <span className="text-xl flex-shrink-0">🛡️</span>
                <div>
                  <p className="text-xs font-semibold text-[#2d4a1e]">Bảo hành 7 ngày</p>
                  <p className="text-[11px] text-[#5a7a48] leading-snug mt-0.5">Đổi trả nếu nứt vỡ khi vận chuyển</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                <span className="text-xl flex-shrink-0">💡</span>
                <div>
                  <p className="text-xs font-semibold text-[#2d4a1e]">Hỗ trợ trọn đời</p>
                  <p className="text-[11px] text-[#5a7a48] leading-snug mt-0.5">Tư vấn chăm sóc miễn phí mãi mãi</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                <span className="text-xl flex-shrink-0">🎁</span>
                <div>
                  <p className="text-xs font-semibold text-[#2d4a1e]">Tặng kèm Cẩm nang</p>
                  <p className="text-[11px] text-[#5a7a48] leading-snug mt-0.5">Hướng dẫn chăm sóc chi tiết kèm theo</p>
                </div>
              </div>
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
                {/* Watering */}
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

                {/* Sunlight */}
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

                {/* Temperature */}
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

                {/* Humidity */}
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

              {/* Common Issues */}
              {product.careGuide.commonIssues && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="font-semibold text-red-900">Vấn đề thường gặp & cách xử lý</p>
                  </div>
                  <p className="text-sm text-red-700 whitespace-pre-line">{product.careGuide.commonIssues}</p>
                </div>
              )}

              {/* Video Guide */}
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
                  Ban da gui danh gia. Dang cho admin duyet.
                </div>
              ) : canReview ? (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-[#f8faf6] border border-[#daebd0] rounded-xl">
                  <h3 className="font-semibold text-lg mb-4">Danh gia san pham cua ban</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Xep hang *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: star }))} className="p-1">
                          <Star className={`w-7 h-7 transition-colors ${star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Tieu de (tuy chon)</label>
                    <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none" placeholder="Tom tat danh gia cua ban..." />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Noi dung *</label>
                    <textarea value={reviewForm.content} onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))} rows={4} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none" placeholder="Chia se trai nghiem cua ban voi san pham..." />
                  </div>
                  <button type="submit" disabled={submittingReview} className="bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#364a29] disabled:bg-gray-300 transition-colors">
                    {submittingReview ? "Dang gui..." : "Gui Danh Gia"}
                  </button>
                </form>
              ) : !session ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
                  <a href="/login" className="underline font-medium">Dang nhap</a> de danh gia san pham (chi danh cho khach hang da mua hang)
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                  Ban can mua san pham nay de co the gui danh gia.
                </div>
              )}
              {reviewsLoading ? (
                <div className="text-center py-8 text-gray-400">Dang tai danh gia...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chua co danh gia nao.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{reviews.length} danh gia</h3>
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border rounded-xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{review.customer?.name || "Khach hang"}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Da mua hang</span>}
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
      </div>
    </main>
  );
}