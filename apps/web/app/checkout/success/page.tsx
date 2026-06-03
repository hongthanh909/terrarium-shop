"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check, Clock, AlertTriangle, Copy, Package,
  ArrowRight, Truck, CreditCard, Leaf, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── SePay / KienLongBank ───────────────────────────────────────────────────
const BANK_NAME    = "KienLongBank";
const BANK_ACCOUNT = "101499100004612299";
const BANK_OWNER   = "NGUYEN THANH HONG";
const BANK_BIN     = "970452";
const TOTAL_SECONDS = 30 * 60; // 30 phút

type PayStatus = "PENDING" | "PAID" | "EXPIRED";

// ────────────────────────────────────────────────────────────────────────────
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId     = searchParams.get("orderId")     || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const method      = searchParams.get("method")      || "COD"; // COD | BANK_TRANSFER
  const total       = Number(searchParams.get("total") || 0);

  const isBanking = method === "BANK_TRANSFER";

  // Transfer info
  const transferContent = `TT ${orderNumber.slice(-8).toUpperCase()}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact.png`
    + `?amount=${total}&addInfo=${encodeURIComponent(transferContent)}`
    + `&accountName=${encodeURIComponent(BANK_OWNER)}`;

  // ── State ─────────────────────────────────────────────────────────────────
  const [payStatus, setPayStatus]     = useState<PayStatus>(isBanking ? "PENDING" : "PAID");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copied, setCopied]           = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Polling trạng thái ────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    if (!orderId || !isBanking || payStatus !== "PENDING") return;
    try {
      const res  = await fetch(`/api/orders/${orderId}/status`);
      const data = await res.json();

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
    }
  }, [orderId, isBanking, payStatus]);

  useEffect(() => {
    if (!isBanking || payStatus !== "PENDING") return;
    checkStatus();
    const iv = setInterval(checkStatus, 8000); // poll mỗi 8 giây
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
    { label: "Ngân hàng",    value: BANK_NAME,        key: "bank" },
    { label: "Số tài khoản", value: BANK_ACCOUNT,     key: "acc"  },
    { label: "Chủ tài khoản",value: BANK_OWNER,       key: "own"  },
    { label: "Nội dung CK",  value: transferContent,  key: "msg"  },
  ];

  // ============================================================
  // ① COD hoặc Banking đã PAID → trang Cảm Ơn
  // ============================================================
  if (!isBanking || payStatus === "PAID") {
    return (
      <main className="min-h-screen bg-[#f4f8f0] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Hero Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

            {/* Dải màu xanh trên cùng */}
            <div className="h-2 bg-gradient-to-r from-[#425733] via-[#6aad4a] to-[#425733]" />

            <div className="px-8 py-10 text-center">
              {/* Icon thành công */}
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-full bg-[#e8f5e1] flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-12 h-12 text-[#425733] stroke-[2.5]" />
                </div>
                {/* hào quang xanh */}
                <div className="absolute inset-0 rounded-full animate-ping bg-[#6aad4a] opacity-20 pointer-events-none" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Leaf className="w-5 h-5 text-[#6aad4a]" />
                <span className="text-[#6aad4a] font-semibold text-sm tracking-wide uppercase">Tiệm Rêu Décor</span>
                <Leaf className="w-5 h-5 text-[#6aad4a]" />
              </div>

              <h1 className="text-3xl font-bold text-[#2d4a1e] mb-2">
                {isBanking ? "Thanh Toán Thành Công!" : "Đặt Hàng Thành Công!"}
              </h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Cảm ơn bạn đã tin tưởng và mua hàng tại{" "}
                <span className="font-semibold text-[#425733]">Tiệm Rêu Décor</span>.<br />
                Đơn hàng của bạn đã được tiếp nhận và sẽ sớm được xử lý.
              </p>

              {/* Mã đơn hàng */}
              <div className="bg-[#f0f7ea] border border-[#c8d5be] rounded-2xl px-6 py-4 mb-6 inline-block w-full">
                <p className="text-xs text-[#5a7a48] mb-1 font-medium">Mã đơn hàng</p>
                <p className="font-mono text-xl font-bold text-[#2d4a1e] tracking-wider">{orderNumber}</p>
              </div>

              {/* Thông tin trạng thái */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="flex items-center gap-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl p-3 text-left">
                  <span className="text-2xl shrink-0">
                    {isBanking ? "💳" : "🚚"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#2d4a1e]">
                      {isBanking ? "Đã thanh toán" : "Thanh toán COD"}
                    </p>
                    <p className="text-[10px] text-[#5a7a48]">
                      {isBanking ? "Qua chuyển khoản" : "Khi nhận hàng"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl p-3 text-left">
                  <span className="text-2xl shrink-0">📦</span>
                  <div>
                    <p className="text-xs font-bold text-[#2d4a1e]">Đang xử lý</p>
                    <p className="text-[10px] text-[#5a7a48]">Shop sẽ sớm đóng gói</p>
                  </div>
                </div>
              </div>

              {/* Lời nhắn */}
              <div className="flex items-center justify-center gap-2 text-[#6aad4a] text-sm mb-8">
                <Heart className="w-4 h-4 fill-current" />
                <span>Cảm ơn bạn đã lựa chọn sản phẩm xanh của chúng tôi!</span>
                <Heart className="w-4 h-4 fill-current" />
              </div>

              {/* Nút hành động */}
              <div className="space-y-3">
                <Button className="w-full bg-[#425733] hover:bg-[#364a29] h-12 text-base font-semibold rounded-xl" asChild>
                  <Link href="/orders" className="flex items-center justify-center gap-2">
                    <Package className="w-5 h-5" />
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

            {/* Chân */}
            <div className="bg-[#f0f7ea] border-t border-[#daebd0] px-8 py-4 text-center">
              <p className="text-xs text-[#5a7a48]">
                📧 Xác nhận đơn hàng sẽ được gửi qua email &nbsp;•&nbsp;
                📞 Hỗ trợ: tiemreudecor@gmail.com
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
    <main className="min-h-screen bg-[#f4f8f0] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#425733] text-white text-sm px-5 py-2 rounded-full font-semibold mb-4 shadow">
            <Clock className="w-4 h-4 animate-pulse" />
            Đang chờ thanh toán chuyển khoản
          </div>
          <h1 className="text-3xl font-bold text-[#2d4a1e]">Hoàn Tất Thanh Toán</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quét mã QR hoặc chuyển khoản thủ công &nbsp;•&nbsp;
            Mã đơn: <span className="font-mono font-bold text-[#425733]">{orderNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Cột trái: QR + thông tin CK ─────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Countdown timer */}
            <div className={`rounded-2xl p-5 border ${isUrgent ? "bg-red-50 border-red-200" : "bg-white border-[#daebd0]"} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Thời gian còn lại để thanh toán
                </p>
                <p className="text-xs text-gray-400">Đơn tự huỷ khi hết giờ</p>
              </div>
              <div className={`text-5xl font-mono font-bold tabular-nums text-center mb-3 ${isUrgent ? "text-red-600" : "text-[#425733]"}`}>
                {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-400" : "bg-[#6aad4a]"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">
                Trang sẽ <strong>tự động cập nhật</strong> khi nhận được tiền — không cần tải lại
              </p>
            </div>

            {/* QR + bank info side by side */}
            <div className="bg-white rounded-2xl border border-[#daebd0] shadow-sm overflow-hidden">
              <div className="bg-[#f4f8f0] px-6 py-3 border-b border-[#daebd0]">
                <p className="text-sm font-semibold text-[#2d4a1e] flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Thông tin chuyển khoản KienLongBank — SePay
                </p>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-8 items-center">

                {/* QR */}
                <div className="shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-md flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrUrl} 
                      alt="QR chuyển khoản" 
                      className="w-72 h-auto object-contain rounded-lg" 
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Quét bằng app ngân hàng bất kỳ</p>
                </div>

                {/* Bank info */}
                <div className="flex-1 w-full">
                  {/* Số tiền */}
                  <div className="bg-[#f0f7ea] rounded-xl p-4 text-center mb-4 border border-[#c8d5be]">
                    <p className="text-xs text-[#5a7a48] mb-1">Số tiền cần chuyển</p>
                    <p className="text-3xl font-bold text-[#2d4a1e]">{total.toLocaleString("vi-VN")}đ</p>
                  </div>

                  {/* Fields */}
                  <div className="space-y-2">
                    {bankRows.map(({ label, value, key }) => (
                      <div
                        key={key}
                        className={`flex justify-between items-center px-4 py-3 rounded-xl border transition
                          ${key === "msg"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-gray-50 border-gray-100"}`}
                      >
                        <span className="text-xs text-gray-500 shrink-0 mr-2">{label}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-semibold truncate ${key === "msg" ? "text-[#2d8a4e] font-mono text-base" : "text-gray-800 text-sm"}`}>
                            {value}
                          </span>
                          <button
                            onClick={() => copyToClipboard(value, key)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition"
                            title="Sao chép"
                          >
                            {copied === key
                              ? <Check className="w-4 h-4 text-green-600" />
                              : <Copy className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="mx-6 mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2 items-start text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <p>
                  Vui lòng ghi <strong>đúng nội dung chuyển khoản</strong>{" "}
                  <span className="font-mono font-bold text-[#2d8a4e]">{transferContent}</span>{" "}
                  để hệ thống tự động xác nhận đơn hàng của bạn.
                </p>
              </div>
            </div>

            {/* Nút kiểm tra thủ công */}
            <button
              onClick={checkStatus}
              className="w-full py-3 rounded-xl border border-[#425733] text-[#425733] font-medium text-sm hover:bg-[#f0f7ea] transition"
            >
              Kiểm tra trạng thái ngay
            </button>
          </div>

          {/* ── Cột phải: Chi tiết đơn hàng ─────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#daebd0] shadow-sm sticky top-6 overflow-hidden">
              <div className="bg-[#f4f8f0] px-5 py-3 border-b border-[#daebd0]">
                <p className="text-sm font-semibold text-[#2d4a1e] flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Chi tiết đơn hàng
                </p>
              </div>
              <div className="p-5 space-y-3">
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

                <hr className="border-[#e8f0e1]" />

                <div className="flex justify-between font-bold text-base">
                  <span>Tổng tiền</span>
                  <span className="text-[#425733]">{total.toLocaleString("vi-VN")}đ</span>
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
