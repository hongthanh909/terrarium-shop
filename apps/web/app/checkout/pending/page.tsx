"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabaseClient";

// SePay VA — Bank Info
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "KienLongBank";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "101499100004612299";
const BANK_OWNER = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN THANH HONG";
const BANK_BIN = process.env.NEXT_PUBLIC_BANK_BIN || "970452";
const TOTAL_SECONDS = 30 * 60; // 30 phút

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const transferContent = `TT ${orderNumber.slice(-8).toUpperCase()}`;

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "EXPIRED">("PENDING");
  const [copied, setCopied] = useState<string | null>(null);
  // Server-fetched total — never trust URL
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  // QR URL uses server-validated total only
  const safeTotal = serverTotal ?? 0;
  const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact.png?amount=${safeTotal}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_OWNER)}`;


  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();

      // Always use server total
      if (data.total != null) {
        setServerTotal(data.total);
      }

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

  // Lắng nghe sự kiện Realtime tự động cập nhật & Dự phòng Polling 15s
  useEffect(() => {
    if (!orderId) return;

    // 1. Kiểm tra trạng thái ban đầu ngay khi vào trang
    checkStatus();

    // 2. Đăng ký Supabase Realtime lắng nghe sự thay đổi của đơn hàng
    console.log(`[Supabase Realtime] Đang đăng ký lắng nghe thay đổi đơn hàng: ${orderId}`);
    const channel = supabaseClient
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders", // Khớp chính xác map table "orders" trong Prisma schema!
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          console.log("[Supabase Realtime] Nhận được cập nhật đơn hàng:", payload);
          const newPaymentStatus = payload.new?.paymentStatus;
          
          if (newPaymentStatus === "PAID") {
            setPaymentStatus("PAID");
            setTimeout(() => {
              router.push(`/checkout/success?order=${orderNumber}`);
            }, 1200);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Supabase Realtime] Trạng thái kết nối kênh: ${status}`);
      });

    // 3. Cơ chế Polling dự phòng (15 giây) phòng trường hợp mạng yếu hoặc chưa bật Replication
    const interval = setInterval(checkStatus, 15000);

    // Cleanup khi rời trang
    return () => {
      clearInterval(interval);
      supabaseClient.removeChannel(channel);
    };
  }, [orderId, orderNumber, checkStatus, router]);

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
          <div className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto animate-pulse">
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
      <div className="max-w-lg mx-auto space-y-5">

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
          <div className="flex flex-col items-center mb-4">
            <div className="relative p-4 bg-white rounded-2xl border border-gray-200 shadow-md flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR chuyển khoản"
                className="w-72 h-auto object-contain rounded-lg block"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  (img.nextElementSibling as HTMLElement).style.display = "flex";
                }}
              />
              <div className="w-72 h-[340px] items-center justify-center flex-col gap-2 text-center hidden bg-gray-50 rounded-lg">
                <span className="text-4xl">🏦</span>
                <p className="text-sm text-gray-500">Nhập thủ công theo thông tin bên dưới</p>
              </div>
            </div>
            {/* VietQR badge */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#e53935]" />
              <span>VietQR</span>
              <span className="text-gray-300">•</span>
              <span>Quét bằng app ngân hàng bất kỳ</span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-[#f0f7ea] rounded-xl p-3 text-center mb-4">
            <p className="text-xs text-[#5a7a48] mb-0.5">Số tiền chuyển khoản</p>
            <p className="text-2xl font-bold text-[#2d4a1e]">{(serverTotal ?? 0).toLocaleString("vi-VN")}đ</p>
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
