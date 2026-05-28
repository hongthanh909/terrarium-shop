"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// SePay VA — KienLongBank (chuyển khoản vào số này để SePay tự động xác nhận)
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "KienLongBank";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "1014991000046l2299";
const BANK_OWNER = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN THANH HONG";
const BANK_BIN = process.env.NEXT_PUBLIC_BANK_BIN || "970452"; // KienLong BIN
const TOTAL_SECONDS = 30 * 60; // 30 phút

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const total = Number(searchParams.get("total") || 0);
  const transferContent = `TT ${orderNumber.slice(-8).toUpperCase()}`;

  const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_OWNER)}`;

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "EXPIRED">("PENDING");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      const data = await res.json();

      if (data.paymentStatus === "PAID") {
        setPaymentStatus("PAID");
        setTimeout(() => {
          router.push(`/checkout/success?order=${orderNumber}`);
        }, 1500);
        return;
      }

      if (data.expired || data.status === "CANCELLED") {
        setPaymentStatus("EXPIRED");
        setTimeout(() => {
          router.push(`/checkout/payment?order=${orderNumber}&reason=expired`);
        }, 2000);
        return;
      }

      if (data.remainingSeconds !== undefined) {
        setSecondsLeft(data.remainingSeconds);
      }
    } catch (e) {
      console.error("Error checking payment status:", e);
    }
  }, [orderId, orderNumber, router]);

  // Poll trạng thái mỗi 12 giây
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 12000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Đồng hồ đếm ngược local (giảm mỗi giây)
  useEffect(() => {
    if (secondsLeft === null || paymentStatus !== "PENDING") return;
    if (secondsLeft <= 0) {
      setPaymentStatus("EXPIRED");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => (s ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, paymentStatus]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 30;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
  const progress = secondsLeft !== null ? (secondsLeft / TOTAL_SECONDS) * 100 : 100;
  const isUrgent = secondsLeft !== null && secondsLeft < 300; // < 5 phút

  if (paymentStatus === "PAID") {
    return (
      <main className="min-h-screen bg-[#f4f8f0] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-[#425733]" />
          </div>
          <p className="text-xl font-bold text-[#425733]">Đã xác nhận thanh toán!</p>
          <p className="text-sm text-gray-500">Đang chuyển sang trang xác nhận...</p>
        </div>
      </main>
    );
  }

  if (paymentStatus === "EXPIRED") {
    return (
      <main className="min-h-screen bg-[#f4f8f0] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-600">Hết thời gian thanh toán</p>
          <p className="text-sm text-gray-500">Đơn hàng đã bị hủy tự động...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8f0] py-10 px-4">
      <div className="max-w-md mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-[#425733] text-white text-sm px-4 py-1.5 rounded-full font-medium">
            <Clock className="w-4 h-4" />
            Chờ thanh toán
          </div>
          <h1 className="text-2xl font-bold text-[#2d4a1e] mt-2">Quét QR để thanh toán</h1>
          <p className="text-sm text-gray-500">Mã đơn: <span className="font-mono font-semibold text-[#425733]">{orderNumber}</span></p>
        </div>

        {/* Countdown Timer */}
        <div className={`rounded-2xl p-4 text-center space-y-2 ${isUrgent ? "bg-red-50 border border-red-200" : "bg-white border border-[#daebd0]"}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Thời gian còn lại</p>
          <div className={`text-5xl font-mono font-bold tabular-nums ${isUrgent ? "text-red-600" : "text-[#425733]"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-400" : "bg-[#6aad4a]"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Đơn hàng sẽ tự động hủy sau khi hết giờ</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-6 border border-[#daebd0] shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="relative p-3 bg-white rounded-xl border-4 border-[#425733] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR chuyển khoản"
                className="w-52 h-52 rounded-lg"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  (img.nextElementSibling as HTMLElement).style.display = "flex";
                }}
              />
              <div className="w-52 h-52 items-center justify-center flex-col gap-2 text-center hidden bg-gray-50 rounded-lg">
                <span className="text-3xl">🏦</span>
                <p className="text-xs text-gray-500">Nhập thủ công theo thông tin bên dưới</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-[#f0f7ea] rounded-xl p-3 text-center mb-4">
            <p className="text-xs text-[#5a7a48] mb-0.5">Số tiền chuyển khoản</p>
            <p className="text-2xl font-bold text-[#2d4a1e]">{total.toLocaleString("vi-VN")}đ</p>
          </div>

          {/* Bank Info Table */}
          <div className="space-y-2.5 text-sm">
            {[
              { label: "Ngân hàng", value: BANK_NAME, copyKey: "bank" },
              { label: "Số tài khoản", value: BANK_ACCOUNT, copyKey: "account" },
              { label: "Chủ tài khoản", value: BANK_OWNER, copyKey: "owner" },
              { label: "Nội dung CK", value: transferContent, copyKey: "content" },
            ].map(({ label, value, copyKey }) => (
              <div key={copyKey} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-500 text-xs">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${copyKey === "content" ? "text-[#2d8a4e] font-mono" : "text-gray-800"}`}>{value}</span>
                  <button
                    onClick={() => copyToClipboard(value, copyKey)}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Copy"
                  >
                    {copied === copyKey ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
          <span className="text-base">⚠️</span>
          <p>Vui lòng ghi đúng <strong>Nội dung CK</strong> để đơn hàng được xử lý tự động. Trang này sẽ tự cập nhật khi nhận được thanh toán.</p>
        </div>

        {/* Manual check button */}
        <Button
          variant="outline"
          className="w-full border-[#425733] text-[#425733] hover:bg-[#f0f7ea]"
          onClick={checkStatus}
        >
          Kiểm tra lại trạng thái
        </Button>

        <p className="text-center text-xs text-gray-400">Trang tự cập nhật mỗi 12 giây • Không cần làm mới trang</p>
      </div>
    </main>
  );
}
