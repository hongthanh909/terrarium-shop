"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useSearchParams } from "next/navigation";
import {
  Check, Clock, AlertTriangle, Copy, Package,
  ArrowRight, Truck, CreditCard, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── SePay / Bank Info ──────────────────────────────────────────────────────
const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME || "KienLongBank";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "101499100004612299";
const BANK_OWNER   = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN THANH HONG";
const BANK_BIN     = process.env.NEXT_PUBLIC_BANK_BIN || "970452";
const TOTAL_SECONDS = 30 * 60; // 30 phút

type PayStatus = "PENDING" | "PAID" | "EXPIRED";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  variants: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId     = searchParams.get("orderId")     || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const method      = searchParams.get("method")      || "COD";

  const isBanking = method === "BANK_TRANSFER";

  // Transfer info
  const transferContent = `TT ${orderNumber.slice(-8).toUpperCase()}`;

  // ── State ─────────────────────────────────────────────────────────────────
  const [payStatus, setPayStatus]     = useState<PayStatus>(isBanking ? "PENDING" : "PAID");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [subtotal, setSubtotal]       = useState<number>(0);
  const [discount, setDiscount]       = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [orderItems, setOrderItems]   = useState<OrderItem[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // QR URL only uses server-validated total
  const safeTotal = serverTotal ?? 0;
  const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact.png`
    + `?amount=${safeTotal}&addInfo=${encodeURIComponent(transferContent)}`
    + `&accountName=${encodeURIComponent(BANK_OWNER)}`;

  // ── Polling trạng thái + lấy total từ server ──────────────────────────────
  const checkStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res  = await fetch(`/api/orders/${orderId}/status`);
      const data = await res.json();

      if (data.total != null) setServerTotal(data.total);
      if (data.subtotal != null) setSubtotal(data.subtotal);
      if (data.discount != null) setDiscount(data.discount);
      if (data.shippingFee != null) setShippingFee(data.shippingFee);
      if (data.items) setOrderItems(data.items);
      setLoadingOrder(false);

      if (data.paymentStatus === "PAID") {
        setPayStatus("PAID");
        return;
      }
      if (data.expired || data.status === "CANCELLED") {
        setPayStatus("EXPIRED");
        return;
      }
      if (data.remainingSeconds !== undefined) {
        setSecondsLeft(data.remainingSeconds);
      }
    } catch (e) {
      console.error("[success] check status error:", e);
      setLoadingOrder(false);
    }
  }, [orderId]);

  useEffect(() => {
    checkStatus();
    if (!isBanking || payStatus !== "PENDING") return;
    const iv = setInterval(checkStatus, 8000);
    return () => clearInterval(iv);
  }, [isBanking, payStatus, checkStatus]);

  // ── Đồng hồ đếm ngược ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isBanking || payStatus !== "PENDING" || secondsLeft === null) return;
    if (secondsLeft <= 0) { setPayStatus("EXPIRED"); return; }
    const t = setTimeout(() => setSecondsLeft(s => Math.max(0, (s ?? 1) - 1)), 1000);
    return () => clearTimeout(t);
  }, [isBanking, payStatus, secondsLeft]);

  const minutes  = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 30;
  const secs     = secondsLeft !== null ? secondsLeft % 60 : 0;
  const isUrgent = secondsLeft !== null && secondsLeft < 300;
  const progress = secondsLeft !== null ? (secondsLeft / TOTAL_SECONDS) * 100 : 100;

  // ── UI Helpers ─────────────────────────────────────────────────────────────
  const bankRows = [
    { label: "Ngân hàng",     value: BANK_NAME,        key: "bank" },
    { label: "Số tài khoản",  value: BANK_ACCOUNT,     key: "acc"  },
    { label: "Chủ tài khoản", value: BANK_OWNER,       key: "own"  },
    { label: "Nội dung CK",   value: transferContent,  key: "msg"  },
  ];

  // Parse variants string
  const parseVariants = (v: string | null): Record<string, string> => {
    if (!v) return {};
    try { return JSON.parse(v); } catch { return {}; }
  };

  // Loading state
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

  // ============================================================
  // ① COD hoặc Banking đã PAID → trang Cảm Ơn (REDESIGNED)
  // ============================================================
  if (!isBanking || payStatus === "PAID") {
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
                {isBanking ? "Thanh Toán Thành Công!" : "Đặt Hàng Thành Công!"}
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
                  {/* Step 1: Đã tiếp nhận */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2d4a1e]">Đã tiếp nhận</p>
                      <p className="text-[11px] text-gray-400">Đơn hàng đã được ghi nhận thành công</p>
                    </div>
                  </div>
                  {/* Step 2: Đang đóng gói */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#c8d5be] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Đang đóng gói</p>
                      <p className="text-[11px] text-gray-400">Shop sẽ sớm chuẩn bị đơn hàng cho bạn</p>
                    </div>
                  </div>
                  {/* Step 3: Giao hàng */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Đang giao hàng</p>
                      <p className="text-[11px] text-gray-400">Dự kiến giao hàng: 1-3 ngày làm việc</p>
                    </div>
                  </div>
                  {/* Step 4: Hoàn tất */}
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
                  <p className="text-xs font-bold text-[#2d4a1e]">{isBanking ? "Chuyển khoản" : "COD - Khi nhận hàng"}</p>
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

  // ============================================================
  // ② Banking — EXPIRED
  // ============================================================
  if (payStatus === "EXPIRED") {
    return (
      <main className="min-h-screen bg-[#f4f8f0] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Hết Thời Gian Thanh Toán</h1>
          <p className="text-gray-500 text-sm mb-8">
            Đơn hàng <span className="font-mono font-bold">{orderNumber}</span> đã bị huỷ tự động
            do không nhận được thanh toán trong thời gian quy định (30 phút).
          </p>
          <div className="space-y-3">
            <Button className="w-full bg-[#425733] hover:bg-[#364a29]" asChild>
              <Link href="/products">Quay Lại Mua Sắm</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/orders">Xem Lịch Sử Đơn Hàng</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // ③ Banking — PENDING (đang chờ chuyển khoản)
  // ============================================================
  return (
    <main className="min-h-screen bg-[#f4f8f0] py-6 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ─── Top bar: Order info + Compact Countdown ─────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#425733] text-white text-xs px-4 py-1.5 rounded-full font-semibold mb-2 shadow">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Đang chờ thanh toán chuyển khoản
            </div>
            <h1 className="text-2xl font-bold text-[#2d4a1e]">Hoàn Tất Thanh Toán</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Mã đơn: <span className="font-mono font-bold text-[#425733]">{orderNumber}</span>
            </p>
          </div>

          {/* Compact Countdown Timer — top right corner */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-sm shrink-0 ${
            isUrgent ? "bg-red-50 border-red-200" : "bg-white border-[#daebd0]"
          }`}>
            <Timer className={`w-5 h-5 ${isUrgent ? "text-red-500 animate-pulse" : "text-[#425733]"}`} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider leading-none mb-0.5">Còn lại</p>
              <p className={`text-2xl font-mono font-bold tabular-nums leading-none ${isUrgent ? "text-red-600" : "text-[#425733]"}`}>
                {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </p>
            </div>
            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-400" : "bg-[#6aad4a]"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Cột trái: QR + thông tin CK (span 5) ──────────── */}
          <div className="lg:col-span-5 space-y-4">

            {/* QR + bank info card */}
            <div className="bg-white rounded-2xl border border-[#daebd0] shadow-sm overflow-hidden">
              <div className="bg-[#f4f8f0] px-5 py-2.5 border-b border-[#daebd0]">
                <p className="text-sm font-semibold text-[#2d4a1e] flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Thông tin chuyển khoản
                </p>
              </div>
              <div className="p-5 flex flex-col items-center">

                {/* QR Code */}
                <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-md mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR chuyển khoản"
                    className="w-56 h-auto object-contain rounded-lg"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium mb-4">Quét bằng app ngân hàng bất kỳ</p>

                {/* Số tiền cần chuyển */}
                <div className="w-full bg-[#f0f7ea] rounded-xl p-3 text-center mb-4 border border-[#c8d5be]">
                  <p className="text-[10px] text-[#5a7a48] mb-0.5">Số tiền cần chuyển</p>
                  <p className="text-2xl font-bold text-[#2d4a1e]">{safeTotal.toLocaleString("vi-VN")}đ</p>
                </div>

                {/* Bank Fields — FULL info, no truncation */}
                <div className="w-full space-y-1.5">
                  {bankRows.map(({ label, value, key }) => (
                    <div
                      key={key}
                      className={`flex justify-between items-center px-3.5 py-2.5 rounded-xl border transition text-sm ${
                        key === "msg"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <span className="text-xs text-gray-500 shrink-0 mr-2">{label}</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`font-semibold ${key === "msg" ? "text-[#2d8a4e] font-mono text-sm" : "text-gray-800 text-xs"}`}>
                          {value}
                        </span>
                        <button
                          onClick={() => copyToClipboard(value, key)}
                          className="shrink-0 p-1 rounded-lg hover:bg-gray-200 transition"
                          title="Sao chép"
                        >
                          {copied === key
                            ? <Check className="w-3.5 h-3.5 text-green-600" />
                            : <Copy className="w-3.5 h-3.5 text-gray-400" />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 flex gap-2 items-start text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <p>
                  Vui lòng ghi <strong>đúng nội dung CK</strong>{" "}
                  <span className="font-mono font-bold text-[#2d8a4e]">{transferContent}</span>{" "}
                  để hệ thống tự động xác nhận.
                </p>
              </div>
            </div>

            {/* Nút kiểm tra thủ công */}
            <button
              onClick={checkStatus}
              className="w-full py-2.5 rounded-xl border border-[#425733] text-[#425733] font-medium text-sm hover:bg-[#f0f7ea] transition"
            >
              Kiểm tra trạng thái ngay
            </button>
            <p className="text-center text-[10px] text-gray-400">
              Trang tự <strong>cập nhật</strong> khi nhận được tiền — không cần tải lại
            </p>
          </div>

          {/* ── Cột phải: Order items + Summary (span 7) ──────── */}
          <div className="lg:col-span-7 space-y-4">

            {/* Order Items with thumbnails and sale badges */}
            <div className="bg-white rounded-2xl border border-[#daebd0] shadow-sm overflow-hidden">
              <div className="bg-[#f4f8f0] px-5 py-2.5 border-b border-[#daebd0]">
                <p className="text-sm font-semibold text-[#2d4a1e] flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Sản phẩm đã đặt ({orderItems.length} sản phẩm)
                </p>
              </div>
              <div className="p-4 space-y-3">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Đang tải thông tin sản phẩm...
                  </div>
                ) : (
                  orderItems.map((item) => {
                    const variants = parseVariants(item.variants);
                    return (
                      <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-[#fafcf8] border border-[#e8f0e1] hover:border-[#c8d5be] transition">
                        {/* Product Thumbnail */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-sm">
                          <ImageWrapper
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            sizes="80px"
                            noRound
                            className="object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-[#2d4a1e] truncate mb-1">{item.productName}</h3>
                          {/* Variants */}
                          {Object.keys(variants).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {Object.entries(variants).map(([k, v]) => (
                                <span key={k} className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#e3ebdd] text-[10px] font-medium text-[#425733]">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400">
                            Số lượng: <span className="font-semibold text-gray-600">{item.quantity}</span>
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-[#425733]">
                            {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[10px] text-gray-400">{item.price.toLocaleString("vi-VN")}đ/sp</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-[#daebd0] shadow-sm overflow-hidden">
              <div className="bg-[#f4f8f0] px-5 py-2.5 border-b border-[#daebd0]">
                <p className="text-sm font-semibold text-[#2d4a1e] flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Chi tiết đơn hàng
                </p>
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Mã đơn</span>
                  <span className="font-mono text-sm font-bold text-[#425733]">{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Phương thức TT</span>
                  <span className="text-sm font-semibold">Chuyển khoản</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Trạng thái TT</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                    Chờ thanh toán
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Thời gian giao hàng</span>
                  <span className="text-sm font-semibold text-[#425733]">1-3 ngày làm việc</span>
                </div>

                <hr className="border-[#e8f0e1]" />

                {/* Pricing breakdown */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="text-gray-700">{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className="text-gray-700">{shippingFee.toLocaleString("vi-VN")}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#425733] font-medium">Giảm giá</span>
                    <span className="text-[#425733] font-semibold">-{discount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}

                <hr className="border-[#e8f0e1]" />

                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Tổng tiền</span>
                  <span className="text-[#425733]">{safeTotal.toLocaleString("vi-VN")}đ</span>
                </div>

                <hr className="border-[#e8f0e1]" />

                <div className="space-y-2 pt-1">
                  <Button className="w-full bg-[#425733] hover:bg-[#364a29] h-10 text-sm" asChild>
                    <Link href="/orders">
                      <Package className="w-4 h-4 mr-2" />
                      Xem đơn hàng
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full h-10 text-sm border-[#c8d5be] text-[#425733]" asChild>
                    <Link href="/products">Tiếp tục mua sắm</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
