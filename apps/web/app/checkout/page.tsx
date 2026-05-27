"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Truck, Check } from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { data: session } = useSession();

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
  const [voucherCampaignId, setVoucherCampaignId] = useState<string | null>(null);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(30000);
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState("");
  // Lưu lại tổng tiền trước khi clearCart() xóa state
  const [finalTotal, setFinalTotal] = useState(0);
  const [finalSubtotal, setFinalSubtotal] = useState(0);
  const [finalShippingFee, setFinalShippingFee] = useState(0);
  const [finalDiscount, setFinalDiscount] = useState(0);

  const subtotal = getCartTotal();
  const total = subtotal + shippingFee - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyVoucher = async () => {
    if (!formData.voucherCode.trim()) return;
    try {
      const response = await fetch("/api/validate-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.voucherCode,
          subtotal,
          cartItems: items.map((item: CartItem) => ({
            productId: item.productId,
            categoryId: "",
            price: item.price,
            quantity: item.quantity,
          })),
          customerId: (session?.user as any)?.id,
        }),
      });
      const data = await response.json();
      if (data.valid) {
        if (data.isFreeShipping) {
          // FREE_SHIPPING: set phí ship = 0
          setIsFreeShipping(true);
          setShippingFee(0);
          setDiscount(0);
        } else {
          setDiscount(data.discountAmount || 0);
          setIsFreeShipping(false);
        }
        setVoucherCampaignId(data.campaign?.id || null);
        setVoucherApplied(true);
      } else {
        alert(data.error || data.message || "Mã giảm giá không hợp lệ");
      }
    } catch {
      alert("Lỗi khi kiểm tra mã giảm giá. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerId: (session?.user as any)?.id || null,
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
        // Voucher info — dùng để increment usage count sau khi order thành công
        discountCode: voucherApplied ? formData.voucherCode : undefined,
        discountCampaignId: voucherCampaignId || undefined,
      };

      // Bước 1: Tạo đơn hàng
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        alert("Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }

      const order = await response.json();

      // Bước 2: Nếu chọn Chuyển khoản
      if (formData.paymentMethod === "BANK_TRANSFER") {
        // Thử PayOS trước
        try {
          const payRes = await fetch("/api/payment/create-payment-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });

          if (payRes.ok) {
            const payData = await payRes.json();
            const checkoutUrl = payData.checkoutUrl;
            if (checkoutUrl) {
              clearCart();
              window.location.href = checkoutUrl; // → PayOS page
              return;
            }
          }
        } catch (payErr) {
          console.warn("[PayOS] Failed, falling back to VietQR pending page:", payErr);
        }

        // PayOS lỗi → redirect sang trang QR chờ thanh toán của chúng ta
        clearCart();
        const params = new URLSearchParams({
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: String(total),
        });
        router.push(`/checkout/pending?${params.toString()}`);
        return;
      }

      // COD → hiển thị trang thành công bình thường
      setOrderId(order.id);
      setFinalTotal(total);
      setFinalSubtotal(subtotal);
      setFinalShippingFee(shippingFee);
      setFinalDiscount(discount);
      setOrderCreated(true);
      clearCart();

    } catch (error) {
      console.error("Error creating order:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (orderCreated) {
    const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "TPBank";
    const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "07898110079";
    const bankOwner = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN THANH HONG";
    const bankBin = process.env.NEXT_PUBLIC_BANK_BIN || "970423"; // TPBank BIN trong hệ thống Napas/VietQR
    const transferAmount = finalTotal; // Dùng finalTotal — được lưu trước khi clearCart()
    const transferContent = `TT ${orderId.slice(-8).toUpperCase()}`;
    // VietQR dynamic URL — amount đã bao gồm subtotal + phí ship - giảm giá
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankOwner)}`;

    const STATUS_STEPS = [
      { key: "PENDING",    label: "Chờ xác nhận",  desc: "Đơn hàng đã được tiếp nhận" },
      { key: "CONFIRMED",  label: "Đã xác nhận",   desc: "Shop đã xác nhận đơn" },
      { key: "PROCESSING", label: "Đang đóng gói", desc: "Sản phẩm đang được chuẩn bị" },
      { key: "SHIPPING",   label: "Đang giao",      desc: "Đơn hàng đang trên đường đến bạn" },
      { key: "DELIVERED",  label: "Đã giao",        desc: "Giao hàng thành công" },
    ];

    return (
      <main className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-[#425733]" />
              </div>
              <CardTitle className="text-3xl">Đặt Hàng Thành Công!</CardTitle>
              <CardDescription className="mt-4">
                <p className="text-muted-foreground mb-2">Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận.</p>
                <p className="text-sm font-mono bg-muted rounded px-2 py-1 inline-block">#{orderId}</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <Link href="/orders">Xem Đơn Hàng Của Tôi</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products">Tiếp Tục Mua Sắm</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Bank Transfer QR */}
          {formData.paymentMethod === "BANK_TRANSFER" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Hướng Dẫn Chuyển Khoản
                </CardTitle>
                <CardDescription>Vui lòng chuyển khoản để hoàn tất đơn hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR chuyển khoản"
                      className="w-52 h-52 rounded-xl border-4 border-white shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="w-52 h-52 rounded-xl border-4 border-white shadow-lg bg-gray-100 items-center justify-center flex-col gap-2 text-center p-4"
                      style={{ display: "none" }}
                    >
                      <p className="text-2xl">🏦</p>
                      <p className="text-xs text-gray-500">QR chưa tải được.</p>
                      <p className="text-xs text-gray-400">Vui lòng nhập thủ công theo thông tin dưới</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 text-sm space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-semibold">{bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <span className="font-mono font-semibold">{bankAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>
                    <span className="font-semibold">{bankOwner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-bold text-blue-700">{finalTotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-muted-foreground">Nội dung CK:</span>
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">{transferContent}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">⚠️ Vui lòng ghi đúng nội dung chuyển khoản để đơn hàng được xử lý nhanh nhất</p>
              </CardContent>
            </Card>
          )}

          {formData.paymentMethod === "COD" && (
            <Card className="bg-[#f0f4ec] border-[#c8d5be]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#425733]" />
                  Thanh Toán Khi Nhận Hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tạm tính</span>
                  <span>{finalSubtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span>{finalShippingFee.toLocaleString("vi-VN")}₫</span>
                </div>
                {finalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-[#425733]">
                    <span>Giảm giá</span>
                    <span>-{finalDiscount.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[#c8d5be]">
                  <span>Tổng cộng</span>
                  <span className="text-[#425733]">{finalTotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <p className="text-sm text-muted-foreground pt-1">Vui lòng chuẩn bị đúng số tiền khi nhận hàng. Đơn vị vận chuyển sẽ liên hệ bạn để xếp lịch giao hàng.</p>
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tiến Trình Đơn Hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {STATUS_STEPS.map((step, index) => (
                  <div key={step.key} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${index === 0 ? "bg-[#425733] text-white" : "bg-muted text-muted-foreground"}`}>
                        {index === 0 ? <Check className="w-4 h-4" /> : index + 1}
                      </div>
                      {index < STATUS_STEPS.length - 1 && <div className="w-0.5 flex-1 bg-muted mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-semibold ${index === 0 ? "text-[#425733]" : "text-muted-foreground"}`}>{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                      {index === 0 && <p className="text-xs text-[#425733] font-medium mt-0.5">✓ Hoàn thành</p>}
                    </div>
                  </div>
                ))}
              </div>
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
          <h1 className="text-3xl font-bold mb-4">Giỏ Hàng Trống</h1>
          <p className="text-muted-foreground mb-8">Hãy thêm sản phẩm vào giỏ hàng trước!</p>
          <Button asChild>
            <Link href="/products">Xem Sản Phẩm</Link>
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
            Quay lại Sản Phẩm
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Thanh Toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Khách Hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Họ tên *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="090 123 4567" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Địa Chỉ Giao Hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Địa chỉ *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Số nhà, tên đường" />
                  </div>
                  <div>
                    <Label htmlFor="province">Tỉnh/Thành *</Label>
                    <Input id="province" name="province" value={formData.province} onChange={handleInputChange} required placeholder="TP. Hồ Chí Minh" />
                  </div>
                  <div>
                    <Label htmlFor="district">Quận/Huyện *</Label>
                    <Input id="district" name="district" value={formData.district} onChange={handleInputChange} required placeholder="Quận 1" />
                  </div>
                  <div>
                    <Label htmlFor="ward">Phường/Xã *</Label>
                    <Input id="ward" name="ward" value={formData.ward} onChange={handleInputChange} required placeholder="Phường 5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phương Thức Vận Chuyển</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="GHN_STANDARD" checked={formData.shippingMethod === "GHN_STANDARD"} onChange={(e) => { handleInputChange(e); setShippingFee(30000); }} className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Giao Hàng Tiêu Chuẩn</p>
                      <p className="text-sm text-muted-foreground">3-5 ngày làm việc</p>
                    </div>
                  </div>
                  <p className="font-semibold">{shippingFee.toLocaleString("vi-VN")}₫</p>
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="GHN_EXPRESS" checked={formData.shippingMethod === "GHN_EXPRESS"} onChange={(e) => { handleInputChange(e); setShippingFee(50000); }} className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Giao Hàng Nhanh</p>
                      <p className="text-sm text-muted-foreground">1-2 ngày làm việc</p>
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
                  Phương Thức Thanh Toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === "COD"} onChange={handleInputChange} className="mt-1 mr-3 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Thanh Toán Khi Nhận Hàng (COD)</p>
                    <p className="text-sm text-muted-foreground">Thanh toán khi nhận được đơn hàng</p>
                  </div>
                </label>
                <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" value="BANK_TRANSFER" checked={formData.paymentMethod === "BANK_TRANSFER"} onChange={handleInputChange} className="mt-1 mr-3 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Chuyển Khoản Ngân Hàng</p>
                    <p className="text-sm text-muted-foreground">Chuyển khoản trước khi giao hàng</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mã Giảm Giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input name="voucherCode" value={formData.voucherCode} onChange={handleInputChange} placeholder="Nhập mã giảm giá" disabled={voucherApplied} />
                  <Button onClick={handleApplyVoucher} disabled={voucherApplied} variant={voucherApplied ? "secondary" : "default"}>
                    {voucherApplied ? "Đã áp dụng" : "Áp dụng"}
                  </Button>
                </div>
                {voucherApplied && (
                  <Badge variant="default" className="mt-2 bg-[#425733]">
                    Đã áp dụng! Giảm {discount.toLocaleString("vi-VN")}₫
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={loading} onClick={handleSubmit as any}>
              {loading ? "Đang xử lý..." : `Đặt Hàng - ${total.toLocaleString("vi-VN")}₫`}
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Tổng Đơn Hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-4">
                      <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-16 h-16 object-cover rounded" />
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
                    <span>Tạm tính</span>
                    <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span>{shippingFee.toLocaleString("vi-VN")}₫</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#425733] font-medium">
                      <span>Giảm giá</span>
                      <span>-{discount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Tổng cộng</span>
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