"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Minus, Plus, Star } from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Need to create separator component first - skipping for now, using border instead

interface ProductVariant {
  id: string;
  variantType: string;
  value: string;
  priceAdjustment: {
    toString: () => string;
  };
  inventory: number;
}

interface ProductVariantOption {
  id: string;
  variantType: string;
  options: string[];
  image?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: {
    toString: () => string;
  };
  type: string;
  inventory: number;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: ProductVariant[];
  variantOptions: ProductVariantOption[];
}

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: {
    toString: () => string;
  };
  images: string[];
  category: {
    name: string;
  };
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);

  const { addItem, items, getCartTotal, getCartCount, removeItem, updateQuantity } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);

          if (data.category?.id) {
            const relatedResponse = await fetch(`/api/products?categoryId=${data.category.id}&limit=4`);
            const relatedData = await relatedResponse.json();
            setRelatedProducts((relatedData.products || relatedData).filter((p: RelatedProduct) => p.id !== data.id));
          }
        } else {
          router.push("/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, router]);

  const getPriceWithVariants = () => {
    if (!product) return 0;
    let price = parseFloat(product.basePrice.toString());
    product.variants.forEach((variant) => {
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const finalPrice = getPriceWithVariants();

  return (
    <main className="min-h-screen bg-background">
      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Shopping Cart ({getCartCount()})</SheetTitle>
            <SheetDescription>Review your items and proceed to checkout</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item: CartItem) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img src={item.productImage} alt={item.productName} className="w-20 h-20 object-cover rounded" />
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
                              Remove
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
                <span>Total:</span>
                <span className="text-primary">{getCartTotal().toLocaleString("vi-VN")}₫</span>
              </div>
              <Button className="w-full" asChild onClick={() => setCartOpen(false)}>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={product.images[currentImageIndex] || "https://via.placeholder.com/600x600?text=No+Image"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden ${currentImageIndex === index ? "ring-2 ring-primary" : ""}`}
                  >
                    <img src={img} alt={`${product.name} - ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Badge variant="secondary" className="mb-2">{product.category.name}</Badge>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="text-3xl font-bold text-primary mb-6">
              {finalPrice.toLocaleString("vi-VN")}₫
            </div>

            {/* Variant Selection */}
            {product.variantOptions.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.variantOptions.map((option) => (
                  <div key={option.id}>
                    <Label className="text-base">{option.variantType}</Label>
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
              <Label className="text-base">Quantity</Label>
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
              <Button size="lg" className="flex-1" onClick={() => {
                handleAddToCart();
                router.push("/checkout");
              }}>
                Mua Ngay - {finalPrice.toLocaleString("vi-VN")}₫
              </Button>
            </div>

            {/* Product Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  This beautiful {product.name} is perfect for bringing nature indoors.
                  Each terrarium is handcrafted with care and comes with everything you need
                  to maintain your mini ecosystem.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>High-quality glass container</li>
                  <li>Premium soil and drainage layer</li>
                  <li>Carefully selected plants</li>
                  <li>Decorative elements (stones, moss, etc.)</li>
                  <li>Care guide included</li>
                </ul>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Free shipping</strong> on orders over 500,000₫
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/products/${relatedProduct.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        {relatedProduct.images.length > 0 ? (
                          <img src={relatedProduct.images[0]} alt={relatedProduct.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground">No image</span>
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