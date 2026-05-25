"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, Minus, Plus, Star,
  Droplets, Sun, Thermometer, Wind, AlertTriangle, Play,
  Package, Leaf, Heart
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

type TabType = "details" | "care";

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

  const { data: session } = useSession();
  const { addItem, items, getCartTotal, getCartCount, removeItem, updateQuantity } = useCartStore();


  const getPriceWithVariants = () => {
    if (!product) return 0;
    let price = parseFloat(product.basePrice.toString());

    product.variantOptions?.forEach((variant: any) => {
      const selectedValue = selectedVariants[variant.variantType];
      if (selectedValue && variant.value === selectedValue) {
        price += parseFloat(variant.priceAdjustment.toString());
      }
    });
    return price;
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price: getPriceWithVariants(),
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

  const finalPrice = getPriceWithVariants();
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
                              {Object.entries(item.variants).map(([k, v]) => `${k}: ${v}`).join(", ")}
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
          <div>
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-4 relative">
              <Image
                src={product.images[currentImageIndex] || "https://via.placeholder.com/600x600?text=No+Image"}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                      currentImageIndex === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="secondary">{product.category.name}</Badge>
              <button
                onClick={handleVote}
                disabled={isVoting}
                className="flex items-center gap-1 p-2 -mt-2 -mr-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50 group"
                aria-label="Yêu thích"
              >
                <Heart 
                  className={`w-6 h-6 transition-colors ${product.userVoted ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover:text-red-500'}`} 
                />
                {product.voteCount !== undefined && product.voteCount > 0 && (
                  <span className={`text-sm font-medium ${product.userVoted ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {product.voteCount}
                  </span>
                )}
              </button>
            </div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="text-3xl font-bold text-primary mb-6">
              {finalPrice.toLocaleString("vi-VN")}₫
            </div>

            {/* Variant Selection */}
            {product.variantOptions.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.variantOptions.map((option) => (
                  <div key={option.id}>
                    <Label className="text-base font-semibold">{option.variantType}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {option.options.map((opt) => (
                        <Button
                          key={opt}
                          variant={selectedVariants[option.variantType] === opt ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedVariants((prev) => ({ ...prev, [option.variantType]: opt }))}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <Label className="text-base font-semibold">Số lượng</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToCart}>
                Thêm Vào Giỏ
              </Button>
              <Button size="lg" className="flex-1" onClick={() => { handleAddToCart(); router.push("/checkout"); }}>
                Mua Ngay — {finalPrice.toLocaleString("vi-VN")}₫
              </Button>
            </div>

            {/* Shipping Info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Miễn phí vận chuyển</strong> cho đơn hàng từ 500.000₫
                </p>
              </CardContent>
            </Card>
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
                <Leaf className="w-4 h-4" />
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