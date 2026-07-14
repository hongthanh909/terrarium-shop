"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Truck } from "lucide-react";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/custom-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { getSelectedItems, getSelectedTotal, removeItem } = useCartStore();
  const itemsToCheckout = getSelectedItems();
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
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [pendingAutoVoucherCode, setPendingAutoVoucherCode] = useState<string | null>(null);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(30000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
      }));
    }
  }, [session]);

  const subtotal = getSelectedTotal();
  const total = subtotal + shippingFee - discount;

  useEffect(() => {
    if (formData.voucherCode || voucherApplied || voucherChecking) return;
    const itemVoucherCode = itemsToCheckout.find((item: CartItem) => item.discountCode)?.discountCode;
    if (!itemVoucherCode) return;

    const normalizedCode = itemVoucherCode.trim().toUpperCase();
    setFormData((prev) => ({ ...prev, voucherCode: normalizedCode }));
    setPendingAutoVoucherCode(normalizedCode);
  }, [formData.voucherCode, itemsToCheckout, voucherApplied, voucherChecking]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset voucher state when user edits the voucher code
    if (name === "voucherCode") {
      setVoucherApplied(false);
      setVoucherError(null);
      setDiscount(0);
      setIsFreeShipping(false);
      if (!isFreeShipping) {
        setShippingFee(formData.shippingMethod === "GHN_EXPRESS" ? 50000 : 30000);
      }
    }
  };

  const handleApplyVoucher = async () => {
    if (!formData.voucherCode.trim()) return;
    setVoucherChecking(true);
    setVoucherError(null);
    try {
      const response = await fetch("/api/validate-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.voucherCode.trim().toUpperCase(),
          subtotal,
          cartItems: itemsToCheckout.map((item: CartItem) => ({
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
          setIsFreeShipping(true);
          setShippingFee(0);
          setDiscount(0);
          showToast.success("Áp dụng thành công!", "Miễn phí vận chuyển cho đơn hàng này");
        } else {
          setDiscount(data.discountAmount || 0);
          setIsFreeShipping(false);
          showToast.success("Áp dụng thành công!", `Giảm ${(data.discountAmount || 0).toLocaleString("vi-VN")}₫`);
        }
        setVoucherCampaignId(data.campaign?.id || null);
        setVoucherApplied(true);
        setVoucherError(null);
      } else {
        const errorMsg = data.error || data.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn";
        setVoucherError(errorMsg);
        setVoucherApplied(false);
        showToast.error("Voucher không hợp lệ", errorMsg);
      }
    } catch {
      setVoucherError("Lỗi kết nối. Vui lòng thử lại.");
      showToast.error("Lỗi kết nối", "Vui lòng thử lại.");
    } finally {
      setVoucherChecking(false);
    }
  };

  useEffect(() => {
    if (!pendingAutoVoucherCode) return;
    if (formData.voucherCode !== pendingAutoVoucherCode) return;

    setPendingAutoVoucherCode(null);
    void handleApplyVoucher();
  }, [formData.voucherCode, pendingAutoVoucherCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsToCheckout.length === 0) {
      showToast.error("Giỏ hàng trống! Vui lòng chọn sản phẩm trước.");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerId: (session?.user as any)?.id || null,
        items: itemsToCheckout.map((item: CartItem) => ({
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
          email: formData.email,
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
        discountCode: voucherApplied ? formData.voucherCode : undefined,
        discountCampaignId: voucherCampaignId || undefined,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        showToast.error("Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }

      const order = await response.json();

      // Xóa giỏ hàng và redirect sang trang cảm ơn
      itemsToCheckout.forEach(item => {
        removeItem(item.productId, item.variants);
      });
      const params = new URLSearchParams({
        orderId: order.id,
        orderNumber: order.orderNumber,
        method: formData.paymentMethod,
      });
      router.push(`/checkout/success?${params.toString()}`);

    } catch (error) {
      console.error("Error creating order:", error);
      showToast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (itemsToCheckout.length === 0) {
    return (
      <main className="min-h-[100dvh] bg-background py-8 px-4 sm:px-6">
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
    <main className="min-h-[100dvh] bg-background px-4 pb-28 pt-6 sm:px-6 sm:py-8 lg:pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Sản Phẩm
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Thanh Toán</h1>

        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Khách Hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 [&_input]:min-h-11 [&_label]:mb-1.5 [&_label]:block">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 [&_input]:min-h-11 [&_label]:mb-1.5 [&_label]:block">
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
                <label className="flex items-center justify-between gap-3 p-4 border rounded-xl cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="GHN_STANDARD" checked={formData.shippingMethod === "GHN_STANDARD"} onChange={(e) => { handleInputChange(e); setShippingFee(30000); }} className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Giao Hàng Tiêu Chuẩn</p>
                      <p className="text-sm text-muted-foreground">3-5 ngày làm việc</p>
                    </div>
                  </div>
                  <p className="font-semibold">30.000₫</p>
                </label>
                <label className="flex items-center justify-between gap-3 p-4 border rounded-xl cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shippingMethod" value="GHN_EXPRESS" checked={formData.shippingMethod === "GHN_EXPRESS"} onChange={(e) => { handleInputChange(e); setShippingFee(50000); }} className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Giao Hàng Nhanh</p>
                      <p className="text-sm text-muted-foreground">1-2 ngày làm việc</p>
                    </div>
                  </div>
                  <p className="font-semibold">50.000₫</p>
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
                <label className="flex items-start p-4 border rounded-xl cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === "COD"} onChange={handleInputChange} className="mt-1 mr-3 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Thanh Toán Khi Nhận Hàng (COD)</p>
                    <p className="text-sm text-muted-foreground">Thanh toán khi nhận được đơn hàng</p>
                  </div>
                </label>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mã Giảm Giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Input name="voucherCode" value={formData.voucherCode} onChange={handleInputChange} placeholder="Nhập mã giảm giá" disabled={voucherApplied || voucherChecking} />
                  <Button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={voucherApplied || voucherChecking || !formData.voucherCode.trim()}
                    variant={voucherApplied ? "secondary" : "default"}
                  >
                    {voucherChecking ? "Đang kiểm tra..." : voucherApplied ? "Đã áp dụng" : "Áp dụng"}
                  </Button>
                </div>
                {/* Voucher status messages */}
                {voucherApplied && (
                  <div className="mt-3 flex items-center gap-2 bg-[#f0f7ea] border border-[#c2d6b0] rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <span className="text-sm text-[#2d4a1e] font-medium">
                      {isFreeShipping ? "Miễn phí vận chuyển!" : `Giảm ${discount.toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>
                )}
                {voucherError && (
                  <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                    <span className="text-sm text-red-700 font-medium">{voucherError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit button: disabled when voucher is entered but not validated */}
            <Button
              type="submit"
              size="lg"
              className="hidden lg:flex w-full bg-[#425733] hover:bg-[#364a29]"
              disabled={
                loading ||
                voucherChecking ||
                (formData.voucherCode.trim().length > 0 && !voucherApplied && !voucherError)
              }
            >
              {loading
                ? "Đang xử lý..."
                : voucherChecking
                ? "Đang kiểm tra voucher..."
                : (formData.voucherCode.trim().length > 0 && !voucherApplied && !voucherError)
                ? "Vui lòng kiểm tra voucher trước"
                : `Đặt Hàng - ${total.toLocaleString("vi-VN")}₫`
              }
            </Button>
          </div>

          <div className="order-first lg:order-none lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Tổng Đơn Hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-56 lg:max-h-64 overflow-y-auto">
                  {itemsToCheckout.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-4">
                      <ImageWrapper src={item.productImage} alt={item.productName} width={64} height={64} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.productName}</p>
                        {item.variants && Object.keys(item.variants).filter(k => k !== "Đèn").length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {Object.entries(item.variants ?? {})
                              .filter(([k]) => k !== "Đèn")
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </p>
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8e4cf] bg-white/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_30px_rgba(26,46,18,0.10)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground">Tá»•ng thanh toĂ¡n</p>
              <p className="text-lg font-extrabold text-[#425733]">{total.toLocaleString("vi-VN")}â‚«</p>
            </div>
            <Button
              type="submit"
              className="h-12 min-w-[148px] rounded-xl bg-[#425733] px-4 text-sm font-bold text-white hover:bg-[#364a29]"
              disabled={
                loading ||
                voucherChecking ||
                (formData.voucherCode.trim().length > 0 && !voucherApplied && !voucherError)
              }
            >
              {loading ? "Äang xá»­ lĂ½..." : "Äáº·t hĂ ng"}
            </Button>
          </div>
        </div>
        </form>
      </div>
    </main>
  );
}
