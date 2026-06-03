"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { toast } from "sonner";

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
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(30000);
  const [loading, setLoading] = useState(false);

  const subtotal = getSelectedTotal();
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
          toast.success("🚚 Áp dụng thành công! Miễn phí vận chuyển");
        } else {
          setDiscount(data.discountAmount || 0);
          setIsFreeShipping(false);
          toast.success(`✅ Áp dụng thành công! Giảm ${(data.discountAmount || 0).toLocaleString("vi-VN")}₫`);
        }
        setVoucherCampaignId(data.campaign?.id || null);
        setVoucherApplied(true);
      } else {
        toast.error(data.error || data.message || "Mã giảm giá không hợp lệ");
      }
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsToCheckout.length === 0) {
      toast.error("Giỏ hàng trống! Vui lòng chọn sản phẩm trước.");
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
        toast.error("Không thể tạo đơn hàng. Vui lòng thử lại.");
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
        total: String(total),
      });
      router.push(`/checkout/success?${params.toString()}`);

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (itemsToCheckout.length === 0) {
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

        <form onSubmit={handleSubmit}>
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
                  <p className="font-semibold">30.000₫</p>
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
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
                    <p className="text-sm text-muted-foreground">Chuyển khoản trước khi giao hàng — QR tự động xác nhận</p>
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

            <Button type="submit" size="lg" className="w-full bg-[#425733] hover:bg-[#364a29]" disabled={loading}>
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
                  {itemsToCheckout.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-4">
                      <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.productName}</p>
                        {item.variants && Object.keys(item.variants).length > 0 && (
                          <p className="text-xs text-muted-foreground">{Object.entries(item.variants ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
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
        </form>
      </div>
    </main>
  );
}
