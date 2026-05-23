"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Truck, Check } from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    paymentMethod: "COD",
    shippingMethod: "GHN_STANDARD",
    voucherCode: "",
  });

  const [voucherApplied, setVoucherApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(30000);
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState("");

  const subtotal = getCartTotal();
  const total = subtotal + shippingFee - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyVoucher = () => {
    if (formData.voucherCode.toUpperCase() === "SAVE10") {
      setDiscount(Math.floor(subtotal * 0.1));
      setVoucherApplied(true);
    } else {
      alert("Invalid voucher code. Try SAVE10 for 10% off!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerId: "customer_123",
        items: items.map((item: CartItem) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          variants: item.variants,
          quantity: item.quantity,
          price: item.price,
          customOptions: item.customOptions,
        })),
        shippingInfo: {
          name: formData.name,
          phone: formData.phone,
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          fullAddress: `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.province}`,
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        subtotal: subtotal,
        shippingFee: shippingFee,
        discount: discount,
        total: total,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        setOrderId(order.id);
        setOrderCreated(true);
        clearCart();
      } else {
        alert("Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderCreated) {
    return (
      <main className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-[#425733]" />
              </div>
              <CardTitle className="text-3xl">Order Placed Successfully!</CardTitle>
              <CardDescription className="mt-4">
                <p className="text-muted-foreground mb-2">Thank you for your purchase. Your order has been received.</p>
                <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Instructions */}
              {formData.paymentMethod === "BANK_TRANSFER" && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Bank Transfer Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Please transfer the total amount to our bank account:</p>
                    <div className="bg-white rounded p-4 text-sm space-y-1">
                      <p className="font-semibold">Vietcombank</p>
                      <p className="text-muted-foreground">Account Number: 1234567890</p>
                      <p className="text-muted-foreground">Account Name: Terrarium Shop</p>
                      <p className="text-muted-foreground">Branch: Hanoi</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Note: Your order will be processed after we receive your payment.</p>
                  </CardContent>
                </Card>
              )}

              {formData.paymentMethod === "COD" && (
                <Card className="bg-[#f0f4ec] border-[#c8d5be]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#425733]" />
                      Cash on Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Please prepare the exact amount when your order arrives. Our delivery partner will contact you to schedule the delivery.</p>
                  </CardContent>
                </Card>
              )}

              <Button className="w-full" asChild>
                <Link href="/orders">View My Orders</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to your cart first!</p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="john@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="090 123 4567" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required placeholder="House number, street name" />
                  </div>
                  <div>
                    <Label htmlFor="province">Province/City *</Label>
                    <Input id="province" name="province" value={formData.province} onChange={handleInputChange} required placeholder="Ho Chi Minh City" />
                  </div>
                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Input id="district" name="district" value={formData.district} onChange={handleInputChange} required placeholder="District 1" />
                  </div>
                  <div>
                    <Label htmlFor="ward">Ward *</Label>
                    <Input id="ward" name="ward" value={formData.ward} onChange={handleInputChange} required placeholder="Ward 5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="GHN_STANDARD" checked={formData.shippingMethod === "GHN_STANDARD"} onChange={handleInputChange} className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Standard Shipping</p>
                      <p className="text-sm text-muted-foreground">3-5 business days</p>
                    </div>
                  </div>
                  <p className="font-semibold">{shippingFee.toLocaleString("vi-VN")}₫</p>
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="GHN_EXPRESS" checked={formData.shippingMethod === "GHN_EXPRESS"} onChange={(e) => { handleInputChange(e); setShippingFee(50000); }} className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Express Shipping</p>
                      <p className="text-sm text-muted-foreground">1-2 business days</p>
                    </div>
                  </div>
                  <p className="font-semibold">50,000₫</p>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === "COD"} onChange={handleInputChange} className="mt-1 mr-3 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Cash on Delivery (COD)</p>
                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                  </div>
                </label>
                <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" value="BANK_TRANSFER" checked={formData.paymentMethod === "BANK_TRANSFER"} onChange={handleInputChange} className="mt-1 mr-3 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">Transfer to our bank account before delivery</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voucher Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input name="voucherCode" value={formData.voucherCode} onChange={handleInputChange} placeholder="Enter voucher code" disabled={voucherApplied} />
                  <Button onClick={handleApplyVoucher} disabled={voucherApplied} variant={voucherApplied ? "secondary" : "default"}>
                    {voucherApplied ? "Applied" : "Apply"}
                  </Button>
                </div>
                {voucherApplied && (
                  <Badge variant="default" className="mt-2 bg-[#425733]">
                    Voucher applied! {discount.toLocaleString("vi-VN")}₫ discount
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={loading} onClick={handleSubmit as any}>
              {loading ? "Processing..." : `Place Order - ${total.toLocaleString("vi-VN")}₫`}
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.productName}</p>
                        {item.variants && Object.keys(item.variants).length > 0 && (
                          <p className="text-xs text-muted-foreground">{Object.entries(item.variants).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shippingFee.toLocaleString("vi-VN")}₫</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#425733] font-medium">
                      <span>Discount</span>
                      <span>-{discount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}