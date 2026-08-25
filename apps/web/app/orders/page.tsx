"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, TrendingUp, Clock, CheckCircle, Truck, XCircle, AlertTriangle, CreditCard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/custom-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderTimeline } from "@/components/ui/order-timeline";
import { requiresShippingQuote } from "@/lib/shipping-coverage";



interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  shippingQuoteRequired?: boolean;
  shippingInfo?: { province?: string } | null;
  discount: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
  }>;
}

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

export default function MyOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  // Search state for orders page
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);


  const { data: session } = useSession();
  const customerId = (session?.user as any)?.id;
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/orders?customerId=${customerId}`);
      return response.json();
    },
    enabled: !!customerId,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // Apply client‑side filtering based on debouncedTerm (case‑insensitive)
  const filteredOrders = orders.filter((order: Order) => {
    const term = debouncedTerm.toLowerCase();
    if (!term) return true;
    // Assuming order may contain customerName, customerEmail, customerPhone fields
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      (order as any).customerName?.toLowerCase().includes(term) ||
      (order as any).customerEmail?.toLowerCase().includes(term) ||
      (order as any).customerPhone?.toLowerCase().includes(term)
    );
  });

  const handleCancelOrder = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmCancelId(orderId);
  };

  const doCancel = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        showToast.success("Đã hủy đơn hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["customer-orders", customerId] });
      } else {
        showToast.error(data.error || "Không thể hủy đơn hàng");
      }
    } catch {
      showToast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:    "bg-yellow-100 text-yellow-800 border-yellow-200",
      CONFIRMED:  "bg-blue-100 text-blue-800 border-blue-200",
      PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
      SHIPPING:   "bg-indigo-100 text-indigo-800 border-indigo-200",
      DELIVERED:  "bg-emerald-50 text-emerald-800 border-emerald-200",
      CANCELLED:  "bg-red-100 text-red-800 border-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:  "bg-yellow-100 text-yellow-800",
      PAID:     "bg-emerald-50 text-emerald-800",
      REFUNDED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getStepIndex = (status: string) =>
    ORDER_STATUS_STEPS.findIndex((s) => s.key === status);

  const totalSpent = orders
    .filter((order: Order) => order.status === "DELIVERED")
    .reduce((sum: number, order: Order) => sum + order.total, 0);


  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link
            href="/"
            className="mb-4 inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trang chủ
          </Link>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-gray-900 sm:text-5xl">Đơn hàng của tôi</h1>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-6">
          <div className="border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-800 sm:text-3xl">{orders.length}</p>
              </div>
              <div className="hidden rounded-full bg-blue-100 p-3 min-[390px]:block">
                <Package className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
          <div className="border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tổng chi tiêu</p>
                <p className="break-words text-xl font-bold text-gray-800 sm:text-3xl">
                  {totalSpent.toLocaleString("vi-VN")}₫
                </p>
              </div>
              <div className="hidden bg-muted p-3 min-[390px]:block">
                <TrendingUp className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="border border-border bg-white p-8 text-center text-gray-500 shadow-sm">
            Đang tải đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="border border-border bg-white p-8 text-center shadow-sm">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa Có Đơn Hàng</h2>
            <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
            <Link href="/products" className="inline-block bg-foreground px-6 py-3 text-white hover:bg-foreground/85">
              Mua Sắm Ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search input */}
            <div className="mb-4 flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, tên, email, SĐT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="min-h-12 min-w-0 flex-1 border px-4 py-2 text-base transition focus:outline-none focus:ring-2 focus:ring-foreground/15"
              />
              <button
                onClick={() => setSearchTerm("")}
                className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-gray-500 hover:bg-muted hover:text-gray-700"
                aria-label="Xóa nội dung tìm kiếm"
              >
                ✕
              </button>
            </div>
            {filteredOrders.map((order: Order) => {
              const currentStep = getStepIndex(order.status);
              const isCancelled = order.status === "CANCELLED";
              const isExpanded = selectedOrder?.id === order.id;
              return (
                <div key={order.id} className="border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
                  {/* Order Header — clickable */}
                  <div className="p-4 sm:p-6">
                    <div className="mb-3 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
                      <div>
                        <div className="font-mono text-sm text-gray-500 mb-0.5">#{order.orderNumber}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                      </div>
                      <div className="min-[380px]:text-right">
                        <div className="text-lg font-bold text-gray-800 sm:text-xl">{order.total.toLocaleString("vi-VN")}₫</div>
                        <div className="text-xs text-gray-400">{order.items.length} sản phẩm</div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(order.paymentStatus)}`}>
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                        </span>
                        {order.paymentMethod && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                          </span>
                        )}
                      </div>

                      {order.status === "PENDING" && (
                        <button
                          onClick={(e) => handleCancelOrder(order.id, e)}
                          disabled={cancellingId === order.id}
                          className="min-h-11 border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                        >
                          {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn hàng"}
                        </button>
                      )}
                    </div>

                    {/* Progress Timeline (horizontal) */}
                    {!isCancelled && (
                    <div className="mb-4 grid w-full grid-cols-4">
                      {ORDER_STATUS_STEPS.map((step, index) => {
                          const done = index <= currentStep;
                          const active = index === currentStep;
                          return (
                            <div key={step.key} className="relative flex min-w-0 flex-col items-center">
                              {index > 0 && (
                                <div className={`absolute right-1/2 top-3.5 h-0.5 w-full ${index <= currentStep ? "bg-gray-600" : "bg-gray-200"}`} />
                              )}
                              <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all ${
                                  active ? "bg-foreground text-white ring-2 ring-foreground/20 ring-offset-2" :
                                  done ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-400"
                                }`}>
                                  <step.icon className="w-3.5 h-3.5" />
                              </div>
                              <span className={`mt-1 w-full px-0.5 text-center text-xs leading-tight ${done ? "font-medium text-foreground" : "text-gray-400"}`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isCancelled && (
                      <div className="flex items-center gap-2 mb-4 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">Đơn hàng đã bị huỷ</span>
                      </div>
                    )}

                    {/* Product items list - always visible */}
                    <div className="space-y-2 mt-4">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border border-gray-100 bg-gray-50 p-3 min-[420px]:grid-cols-[3.5rem_minmax(0,1fr)_auto]">
                          <div className="w-14 h-14 bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.productImage ? (
                              <ImageWrapper src={item.productImage} alt={item.productName} width={56} height={56} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800 line-clamp-1">{item.productName}</div>
                            <div className="text-xs text-gray-500 mt-1">SL: {item.quantity} × {item.price.toLocaleString("vi-VN")}₫</div>
                          </div>
                          <div className="col-start-2 text-sm font-bold text-gray-800 min-[420px]:col-start-auto min-[420px]:flex min-[420px]:items-center">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(isExpanded ? null : order)}
                      className="mt-4 flex min-h-11 w-full items-center justify-center text-center text-xs font-semibold text-foreground hover:bg-muted hover:underline"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "▲ Thu gọn giá tổng quan" : "▼ Xem chi phí tạm tính & chi tiết vận chuyển"}
                    </button>
                  </div>

                    {/* Expandable order details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 px-4 py-5 sm:px-6">
                      {/* Order total breakdown */}
                      <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Tạm tính</span>
                          <span>{order.subtotal.toLocaleString("vi-VN")}₫</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Phí vận chuyển</span>
                          <span>{order.shippingQuoteRequired || requiresShippingQuote(order.shippingInfo?.province) ? "Trao đổi riêng" : `${order.shippingFee.toLocaleString("vi-VN")}₫`}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Giảm giá</span>
                            <span>-{order.discount.toLocaleString("vi-VN")}₫</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-base pt-2 border-t">
                          <span>Tổng cộng</span>
                          <span className="text-foreground">{order.total.toLocaleString("vi-VN")}₫</span>
                        </div>
                      </div>

                      {/* COD + PENDING → hiện thông báo hủy */}
                      {order.status === "PENDING" && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-left">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-800">Đơn hàng chưa được xác nhận</p>
                            <p className="text-xs text-yellow-600 mt-0.5">Bạn có thể hủy đơn hàng này trực tiếp bằng cách nhấn nút &quot;Hủy đơn hàng&quot; ở góc trên của thẻ.</p>
                          </div>
                        </div>
                      )}

                      {/* Confirmed — cannot cancel */}
                      {["CONFIRMED", "PROCESSING", "SHIPPING"].includes(order.status) && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-left">
                          <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <p className="text-xs text-blue-700">Đơn hàng đã được xác nhận, không thể hủy. Vui lòng liên hệ shop để được hỗ trợ.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Confirm Dialog thay confirm() */}
      <ConfirmDialog
        open={!!confirmCancelId}
        onOpenChange={(open) => !open && setConfirmCancelId(null)}
        title="Hủy đơn hàng"
        description="Bạn chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
        confirmLabel={cancellingId ? "Đang hủy..." : "Hủy đơn"}
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={() => confirmCancelId && doCancel(confirmCancelId)}
      />
    </div>
  );
}
