"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, CreditCard
} from "lucide-react";

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
  COD:           "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const orderId = params.id as string;

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#425733] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
      <main className="min-h-screen bg-gray-50 py-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
          <Link href="/orders" className="inline-block bg-[#425733] text-white px-6 py-3 rounded-lg hover:bg-[#364a29]">
            Quay lại đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  const isCancelled = order.status === "CANCELLED";
  const cancelLog = order.statusLogs?.find((l: any) => l.status === "CANCELLED");
  const isAdminCancelled = cancelLog?.note === "Admin đã huỷ đơn hàng";
  
  const currentStepIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === order.status);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:    "bg-yellow-100 text-yellow-800 border-yellow-200",
      CONFIRMED:  "bg-blue-100 text-blue-800 border-blue-200",
      PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
      SHIPPING:   "bg-indigo-100 text-indigo-800 border-indigo-200",
      DELIVERED:  "bg-[#e3ebdd] text-[#364a29] border-[#c8d5be]",
      CANCELLED:  "bg-red-100 text-red-800 border-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:  "bg-yellow-100 text-yellow-800",
      PAID:     "bg-[#e3ebdd] text-[#364a29]",
      REFUNDED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6">
        {/* Back */}
        <Link href="/orders" className="inline-flex items-center text-gray-500 hover:text-[#425733] mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại đơn hàng
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-mono text-sm text-gray-500">#{order.orderNumber}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">{order.total.toLocaleString("vi-VN")}₫</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentBadge(order.paymentStatus)}`}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>

          {/* Progress Timeline */}
          {!isCancelled ? (
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {ORDER_STATUS_STEPS.map((step, index) => {
                const done = index <= currentStepIndex;
                const active = index === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                        active ? "bg-[#425733] text-white ring-2 ring-[#6d8c5a] ring-offset-1" :
                        done ? "bg-[#6d8c5a] text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] mt-1 whitespace-nowrap ${done ? "text-[#425733] font-medium" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < ORDER_STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 w-10 mx-1 mb-4 flex-shrink-0 ${index < currentStepIndex ? "bg-[#6d8c5a]" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Đơn hàng đã bị huỷ</span>
              </div>
              {isAdminCancelled && (
                <p className="text-sm text-red-600 mt-1">
                  <strong className="font-semibold">Thông báo:</strong> Quản trị viên (Admin) đã huỷ đơn hàng của bạn. Nếu có thắc mắc, vui lòng liên hệ hỗ trợ.
                </p>
              )}
              {cancelLog?.note && !isAdminCancelled && (
                <p className="text-sm text-red-500 mt-1">
                  Lý do: {cancelLog.note}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Sản Phẩm Đã Đặt</h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 bg-gray-50 rounded-lg p-3">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <ImageWrapper src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.productName}</div>
                  {item.variants && item.variants !== "{}" && (
                    <div className="text-xs text-gray-500 mt-0.5 font-medium">
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
                  <div className="text-xs text-gray-500 mt-0.5">SL: {item.quantity} × {Number(item.price).toLocaleString("vi-VN")}₫</div>
                </div>
                <div className="font-semibold text-sm text-gray-800">
                  {(Number(item.price) * item.quantity).toLocaleString("vi-VN")}₫
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Tổng Đơn Hàng</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{order.subtotal.toLocaleString("vi-VN")}₫</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{order.shippingFee.toLocaleString("vi-VN")}₫</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#425733]">
                <span>Giảm giá</span>
                <span>-{order.discount.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Tổng cộng</span>
              <span className="text-[#425733]">{order.total.toLocaleString("vi-VN")}₫</span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {order.shippingInfo && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Thông Tin Giao Hàng</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">Người nhận</span>
                <span className="font-medium text-gray-800">{order.shippingInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SĐT</span>
                <span>{order.shippingInfo.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Địa chỉ</span>
                <span className="text-right max-w-[60%]">{order.shippingInfo.fullAddress}</span>
              </div>
            </div>
          </div>
        )}

        {/* BANK_TRANSFER pending → pay button */}
        {order.status === "PENDING" && order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "PENDING" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Chưa thanh toán</p>
                <p className="text-xs text-blue-600 mt-0.5">Đơn hàng đang chờ chuyển khoản.</p>
              </div>
            </div>
            <button
              onClick={() => {
                const qp = new URLSearchParams({
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  total: String(order.total),
                });
                router.push(`/checkout/pending?${qp.toString()}`);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#425733] rounded-lg hover:bg-[#364a29] transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Tiếp tục thanh toán (QR)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
