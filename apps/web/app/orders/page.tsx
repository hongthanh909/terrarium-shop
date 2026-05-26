"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, TrendingUp, Clock, CheckCircle, Truck, XCircle, AlertTriangle, CreditCard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  shippingFee: number;
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
  COD:           "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO:          "Ví MoMo",
};

export default function MyOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
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
        toast.success("Đã hủy đơn hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["customer-orders", customerId] });
      } else {
        toast.error(data.error || "Không thể hủy đơn hàng");
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
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
      DELIVERED:  "bg-[#e3ebdd] text-[#364a29] border-[#c8d5be]",
      CANCELLED:  "bg-red-100 text-red-800 border-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:  "bg-yellow-100 text-yellow-800",
      PAID:     "bg-[#e3ebdd] text-[#364a29]",
      REFUNDED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getStepIndex = (status: string) =>
    ORDER_STATUS_STEPS.findIndex((s) => s.key === status);

  const totalSpent = orders
    .filter((order: Order) => order.status !== "CANCELLED")
    .reduce((sum: number, order: Order) => sum + order.total, 0);


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trang chủ
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Đơn Hàng Của Tôi</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tổng chi tiêu</p>
                <p className="text-3xl font-bold text-gray-800">
                  {totalSpent.toLocaleString("vi-VN")}₫
                </p>
              </div>
              <div className="bg-[#e3ebdd] p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-[#425733]" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Đang tải đơn hàng...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa Có Đơn Hàng</h2>
            <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
            <Link href="/products" className="inline-block bg-[#425733] text-white px-6 py-3 rounded-lg hover:bg-[#364a29]">
              Mua Sắm Ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => {
              const currentStep = getStepIndex(order.status);
              const isCancelled = order.status === "CANCELLED";
              const isExpanded = selectedOrder?.id === order.id;
              return (
                <div key={order.id} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow">
                  {/* Order Header — clickable */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedOrder(isExpanded ? null : order)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-mono text-sm text-gray-500 mb-0.5">#{order.orderNumber}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-800">{order.total.toLocaleString("vi-VN")}₫</div>
                        <div className="text-xs text-gray-400">{order.items.length} sản phẩm</div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
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

                    {/* Progress Timeline (horizontal) */}
                    {!isCancelled && (
                      <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
                        {ORDER_STATUS_STEPS.map((step, index) => {
                          const done = index <= currentStep;
                          const active = index === currentStep;
                          return (
                            <div key={step.key} className="flex items-center flex-shrink-0">
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                                  active ? "bg-[#425733] text-white ring-2 ring-[#6d8c5a] ring-offset-1" :
                                  done ? "bg-[#6d8c5a] text-white" : "bg-gray-100 text-gray-400"
                                }`}>
                                  <step.icon className="w-3.5 h-3.5" />
                                </div>
                                <span className={`text-[10px] mt-1 whitespace-nowrap ${done ? "text-[#425733] font-medium" : "text-gray-400"}`}>
                                  {step.label}
                                </span>
                              </div>
                              {index < ORDER_STATUS_STEPS.length - 1 && (
                                <div className={`h-0.5 w-8 mx-1 mb-4 flex-shrink-0 ${index < currentStep ? "bg-[#6d8c5a]" : "bg-gray-200"}`} />
                              )}
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

                    {/* Product thumbnails */}
                    <div className="flex gap-2">
                      {order.items.slice(0, 4).map((item: any) => (
                        <div key={item.id} className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <Image src={item.productImage} alt={item.productName} width={56} height={56} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm font-semibold">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-gray-400 text-center">
                      {isExpanded ? "▲ Thu gọn" : "▼ Xem chi tiết đơn hàng"}
                    </div>
                  </div>

                    {/* Expandable order items */}
                  {isExpanded && (
                    <div className="border-t px-6 py-5 bg-gray-50 rounded-b-xl">
                      <h3 className="font-semibold text-gray-800 mb-4">Sản Phẩm Đã Đặt</h3>
                      <div className="space-y-3 mb-4">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex gap-4 bg-white rounded-lg p-3">
                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.productImage ? (
                                <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.productName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">SL: {item.quantity} × {item.price.toLocaleString("vi-VN")}₫</div>
                            </div>
                            <div className="font-semibold text-sm text-gray-800">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</div>
                          </div>
                        ))}
                      </div>

                      {/* Order total breakdown */}
                      <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
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

                      {/* BANK_TRANSFER + PENDING payment → hiện nút Tiếp tục thanh toán + Hủy đơn */}
                      {order.status === "PENDING" && order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "PENDING" && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                          <div className="flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-800">Chưa thanh toán</p>
                              <p className="text-xs text-blue-600 mt-0.5">Đơn hàng đang chờ chuyển khoản. Quét QR để thanh toán ngay hoặc hủy đơn nếu không muốn tiếp tục.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const params = new URLSearchParams({
                                  orderId: order.id,
                                  orderNumber: order.orderNumber,
                                  total: String(order.total),
                                });
                                router.push(`/checkout/pending?${params.toString()}`);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#425733] rounded-lg hover:bg-[#364a29] transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                              Tiếp tục thanh toán (QR)
                            </button>
                            <button
                              onClick={(e) => handleCancelOrder(order.id, e)}
                              disabled={cancellingId === order.id}
                              className="px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* COD + PENDING → chỉ hiện nút hủy */}
                      {order.status === "PENDING" && order.paymentMethod !== "BANK_TRANSFER" && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-800">Đơn hàng chưa được xác nhận</p>
                            <p className="text-xs text-yellow-600 mt-0.5">Bạn có thể hủy đơn trước khi shop xác nhận.</p>
                          </div>
                          <button
                            onClick={(e) => handleCancelOrder(order.id, e)}
                            disabled={cancellingId === order.id}
                            className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                          </button>
                        </div>
                      )}

                      {/* Confirmed — cannot cancel */}
                      {["CONFIRMED", "PROCESSING", "SHIPPING"].includes(order.status) && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <p className="text-xs text-blue-700">Đơn hàng đã được xác nhận — không thể hủy. Vui lòng liên hệ shop để được hỗ trợ.</p>
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
    </main>
  );
}
