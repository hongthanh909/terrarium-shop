"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, MessageCircle
} from "lucide-react";
import { requiresShippingQuote } from "@/lib/shipping-coverage";

const ORDER_STATUS_STEPS = [
  { key: "PENDING",    label: "Chờ xác nhận",  icon: Clock },
  { key: "CONFIRMED",  label: "Đã xác nhận",   icon: CheckCircle },
  { key: "PROCESSING", label: "Đang đóng gói", icon: Package },
  { key: "SHIPPING",   label: "Đang giao",      icon: Truck },
  { key: "DELIVERED",  label: "Đã giao",        icon: CheckCircle },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "Chờ xác nhận",
  CONFIRMED:  "Đã xác nhận",
  PROCESSING: "Đang đóng gói",
  SHIPPING:   "Đang giao hàng",
  DELIVERED:  "Đã giao",
  CANCELLED:  "Đã huỷ",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING:  "Chờ thanh toán",
  PAID:     "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD:  "Thanh toán khi nhận hàng",
  MOMO: "Ví MoMo",
  BANK_TRANSFER: "Chuyển khoản",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const orderId = params.id as string;
  const [chatLoading, setChatLoading] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Không tìm thấy đơn hàng");
      return res.json();
    },
    enabled: !!orderId && sessionStatus === "authenticated",
  });

  if (sessionStatus === "loading" || isLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500">Đang tải đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/login?callbackUrl=/orders");
    return null;
  }

  if (error || !order) {
    return (
      <main className="min-h-[100dvh] bg-white px-4 py-8 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
          <Link href="/orders" className="inline-flex min-h-12 items-center rounded-control bg-primary px-6 py-3 text-white hover:bg-primary-hover">
            Quay lại đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  const isCancelled = order.status === "CANCELLED";
  const shippingQuoteRequired = Boolean(order.shippingQuoteRequired || requiresShippingQuote(order.shippingInfo?.province));
  const cancelLog = order.statusLogs?.find((l: any) => l.status === "CANCELLED");
  const isAdminCancelled = cancelLog?.note === "Admin đã huỷ đơn hàng";
  
  const currentStepIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === order.status);

  const openShippingChat = async () => {
    if (chatLoading) return;
    setChatLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/chat`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể mở cuộc trò chuyện.");
      router.push(`/messages?conversation=${encodeURIComponent(data.conversation.id)}`);
    } catch (chatError) {
      console.error("Open order chat error:", chatError);
    } finally {
      setChatLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:    "bg-yellow-100 text-yellow-800 border-yellow-200",
      CONFIRMED:  "bg-blue-100 text-blue-800 border-blue-200",
      PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
      SHIPPING:   "bg-indigo-100 text-indigo-800 border-indigo-200",
      DELIVERED:  "bg-primary-soft text-primary border-primary-border",
      CANCELLED:  "bg-red-100 text-red-800 border-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:  "bg-yellow-100 text-yellow-800",
      PAID:     "bg-primary-soft text-primary",
      REFUNDED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <main className="min-h-[100dvh] bg-white pb-28 pt-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-6">
        {/* Back */}
        <Link href="/orders" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại đơn hàng
        </Link>

        <article className="mb-6 overflow-hidden rounded-card border border-border bg-white shadow-sm">
          <header className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Chi tiết đơn hàng</p>
                <h1 className="mt-1 break-all font-mono text-sm font-semibold text-foreground sm:text-base">
                  #{order.orderNumber}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <p className="shrink-0 text-xl font-bold tabular-nums text-foreground min-[380px]:text-right sm:text-2xl">
                {order.total.toLocaleString("vi-VN")}₫
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentBadge(order.paymentStatus)}`}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
              </span>
            </div>

            {shippingQuoteRequired && (
              <div className="mt-5 flex flex-col gap-3 border border-[#e5d3ad] bg-[#fffaf0] p-4 text-sm text-[#6d531e] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Phí vận chuyển sẽ được trao đổi lại</p>
                  <p className="mt-1 text-xs leading-5">Shop sẽ nhắn tin báo phí theo địa chỉ giao hàng trước khi chốt đơn.</p>
                </div>
                <button type="button" onClick={openShippingChat} disabled={chatLoading} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
                  <MessageCircle className="h-4 w-4" />
                  {chatLoading ? "Đang mở..." : "Trao đổi với shop"}
                </button>
              </div>
            )}
          </header>

          <section className="border-t border-border p-4 sm:p-6" aria-labelledby="order-progress-heading">
            <h2 id="order-progress-heading" className="sr-only">Tiến trình đơn hàng</h2>
            {!isCancelled ? (
              <div className="grid w-full grid-cols-5">
                {ORDER_STATUS_STEPS.map((step, index) => {
                  const done = index <= currentStepIndex;
                  const active = index === currentStepIndex;
                  return (
                    <div key={step.key} className="relative flex min-w-0 flex-col items-center">
                      {index > 0 && (
                        <div className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= currentStepIndex ? "bg-primary" : "bg-gray-200"}`} />
                      )}
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all ${
                          active ? "bg-primary text-white ring-2 ring-primary/25 ring-offset-1" :
                          done ? "bg-primary/70 text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          <step.icon className="h-4 w-4" />
                      </div>
                      <span className={`mt-1.5 w-full px-0.5 text-center text-[10px] leading-3.5 min-[380px]:text-xs min-[380px]:leading-tight ${done ? "font-medium text-primary" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2 border border-red-100 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Đơn hàng đã bị huỷ</span>
                </div>
                {isAdminCancelled && (
                  <p className="mt-1 text-sm text-red-600">
                    <strong className="font-semibold">Thông báo:</strong> Quản trị viên (Admin) đã huỷ đơn hàng của bạn. Nếu có thắc mắc, vui lòng liên hệ hỗ trợ.
                  </p>
                )}
                {cancelLog?.note && !isAdminCancelled && (
                  <p className="mt-1 text-sm text-red-500">Lý do: {cancelLog.note}</p>
                )}
              </div>
            )}
          </section>

          <section className="border-t border-border p-4 sm:p-6" aria-labelledby="ordered-products-heading">
            <h2 id="ordered-products-heading" className="mb-4 font-semibold text-foreground">Sản phẩm đã đặt</h2>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-3 rounded-input bg-muted/40 p-3 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-x-4">
                  <div className="row-span-2 h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-100 sm:h-16 sm:w-16">
                    {item.productImage ? (
                      <ImageWrapper src={item.productImage} alt={item.productName} width={64} height={64} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">N/A</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.productName}</p>
                    {item.variants && item.variants !== "{}" && (
                      <div className="mt-0.5 text-xs font-medium leading-5 text-muted-foreground">
                        {(() => {
                          try {
                            const parsed = typeof item.variants === "string" ? JSON.parse(item.variants) : item.variants;
                            const filtered = Object.entries(parsed)
                              .filter(([k]) => k !== "Đèn")
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ");
                            return filtered ? `Phân loại: ${filtered}` : null;
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">SL: {item.quantity} × {Number(item.price).toLocaleString("vi-VN")}₫</p>
                  </div>
                  <p className="col-start-2 row-start-2 mt-2 text-sm font-semibold tabular-nums text-foreground sm:col-start-3 sm:row-start-1 sm:mt-0 sm:text-right">
                    {(Number(item.price) * item.quantity).toLocaleString("vi-VN")}₫
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className={order.shippingInfo ? "grid border-t border-border lg:grid-cols-2" : "border-t border-border"}>
            <section className={`p-4 sm:p-6 ${order.shippingInfo ? "lg:border-r lg:border-border" : ""}`} aria-labelledby="order-summary-heading">
              <h2 id="order-summary-heading" className="mb-4 font-semibold text-foreground">Tổng đơn hàng</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Tạm tính</span>
                  <span className="shrink-0 tabular-nums">{order.subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span className="text-right">{shippingQuoteRequired ? "Trao đổi riêng" : `${order.shippingFee.toLocaleString("vi-VN")}₫`}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between gap-4 text-primary">
                    <span>Giảm giá</span>
                    <span className="shrink-0 tabular-nums">-{order.discount.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold">
                  <span>Tổng cộng</span>
                  <span className="shrink-0 tabular-nums text-primary">{order.total.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
            </section>

            {order.shippingInfo && (
              <section className="border-t border-border p-4 sm:p-6 lg:border-t-0" aria-labelledby="shipping-info-heading">
                <h2 id="shipping-info-heading" className="mb-4 font-semibold text-foreground">Thông tin giao hàng</h2>
                <dl className="space-y-3 text-sm">
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-muted-foreground">Người nhận</dt>
                    <dd className="min-w-0 text-right font-medium text-foreground">{order.shippingInfo.name}</dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-muted-foreground">SĐT</dt>
                    <dd className="min-w-0 text-right text-foreground">{order.shippingInfo.phone}</dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <dt className="text-muted-foreground">Địa chỉ</dt>
                    <dd className="min-w-0 break-words text-right leading-5 text-foreground">{order.shippingInfo.fullAddress}</dd>
                  </div>
                </dl>
              </section>
            )}
          </div>
        </article>


      </div>
    </main>
  );
}
