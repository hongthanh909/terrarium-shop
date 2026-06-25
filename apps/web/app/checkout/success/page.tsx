"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ────────────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  variants: string | null;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId     = searchParams.get("orderId")     || "";
  const orderNumber = searchParams.get("orderNumber") || "";

  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [subtotal, setSubtotal]       = useState<number>(0);
  const [discount, setDiscount]       = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [orderItems, setOrderItems]   = useState<OrderItem[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const safeTotal = serverTotal ?? 0;

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res  = await fetch(`/api/orders/${orderId}/status?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.total != null) setServerTotal(data.total);
      if (data.subtotal != null) setSubtotal(data.subtotal);
      if (data.discount != null) setDiscount(data.discount);
      if (data.shippingFee != null) setShippingFee(data.shippingFee);
      if (data.items) setOrderItems(data.items);
    } catch (e) {
      console.error("[success] fetch error:", e);
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId, orderNumber]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  if (loadingOrder) {
    return (
      <main className="min-h-screen bg-[#f4f8f0] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-12 h-12 border-4 border-[#425733] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Đang tải thông tin đơn hàng...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8f0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#425733] via-[#6aad4a] to-[#425733]" />
          <div className="px-8 py-10 text-center">
            {/* Success icon */}
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-full bg-[#e8f5e1] flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-[#425733] stroke-[2.5]" />
              </div>
            </div>

            {/* Logo tiệm */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <ImageWrapper
                src="/logo.png"
                alt="Tiệm Rêu Décor"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span
                className="text-lg text-[#425733] font-semibold"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                tiệm Rêu Décor
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#2d4a1e] mb-2">
              Đặt Hàng Thành Công!
            </h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Cảm ơn bạn đã tin tưởng và mua hàng tại{" "}
              <span className="font-semibold text-[#425733]">Tiệm Rêu Décor</span>.<br />
              Đơn hàng của bạn đã được tiếp nhận và sẽ sớm được xử lý.
            </p>

            {/* Mã đơn hàng */}
            <div className="bg-[#f0f7ea] border border-[#c8d5be] rounded-2xl px-6 py-4 mb-6 w-full">
              <p className="text-xs text-[#5a7a48] mb-1 font-medium">Mã đơn hàng</p>
              <p className="font-mono text-xl font-bold text-[#2d4a1e] tracking-wider">{orderNumber}</p>
            </div>

            {/* Order Items */}
            {orderItems.length > 0 && (
              <div className="mb-6 space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl p-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                      <ImageWrapper src={item.productImage} alt={item.productName} fill sizes="48px" noRound className="object-cover" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-bold text-[#2d4a1e] truncate">{item.productName}</p>
                      <p className="text-[10px] text-gray-400">SL: {item.quantity} × {item.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                    <p className="text-sm font-bold text-[#425733] shrink-0">{(item.price * item.quantity).toLocaleString("vi-VN")}đ</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chi tiết giá */}
            <div className="bg-white border border-gray-100 rounded-xl mb-6 text-left">
              <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span className="text-gray-700">{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="text-gray-700">{shippingFee.toLocaleString("vi-VN")}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#425733] font-medium">
                    <span>Giảm giá</span>
                    <span>-{discount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-[#425733]">{safeTotal.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
            </div>

            {/* Tình trạng đơn hàng */}
            <div className="bg-[#f6faf4] border border-[#daebd0] rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-[#2d4a1e] mb-3">Tình trạng đơn hàng</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2d4a1e]">Đã tiếp nhận</p>
                    <p className="text-[11px] text-gray-400">Đơn hàng đã được ghi nhận thành công</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c8d5be] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Đang đóng gói</p>
                    <p className="text-[11px] text-gray-400">Shop sẽ sớm chuẩn bị đơn hàng cho bạn</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Đang giao hàng</p>
                    <p className="text-[11px] text-gray-400">Dự kiến giao hàng: 1-3 ngày làm việc</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Hoàn tất</p>
                    <p className="text-[11px] text-gray-400">Đơn hàng đã được giao thành công</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin thêm */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-[#f6faf4] border border-[#daebd0] rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Thanh toán</p>
                <p className="text-xs font-bold text-[#2d4a1e]">COD - Khi nhận hàng</p>
              </div>
              <div className="bg-[#f6faf4] border border-[#daebd0] rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-0.5">Thời gian giao hàng</p>
                <p className="text-xs font-bold text-[#2d4a1e]">1-3 ngày làm việc</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Button className="w-full bg-[#425733] hover:bg-[#364a29] h-12 text-base font-semibold rounded-xl" asChild>
                <Link href="/orders" className="flex items-center justify-center gap-2">
                  Xem Đơn Hàng Của Tôi
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-12 text-base rounded-xl border-[#c8d5be] text-[#425733] hover:bg-[#f0f7ea]" asChild>
                <Link href="/products" className="flex items-center justify-center gap-2">
                  Tiếp Tục Mua Sắm
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-[#f0f7ea] border-t border-[#daebd0] px-8 py-4 text-center">
            <p className="text-xs text-[#5a7a48]">
              Xác nhận đơn hàng sẽ được gửi qua email &nbsp;•&nbsp;
              Hỗ trợ: tiemreudecor@gmail.com
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
