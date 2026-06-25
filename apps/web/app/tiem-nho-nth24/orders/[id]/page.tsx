"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { ArrowLeft, Check, X, Printer, ChevronDown } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  shippingInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    fullAddress: string;
  };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    variants: string;
    quantity: number;
    price: number;
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const getOrderStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      PENDING:    "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20",
      CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20",
      PROCESSING: "bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500/20",
      SHIPPING:   "bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500/20",
      DELIVERED:  "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0] focus:ring-[#364a29]/20",
      CANCELLED:  "bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20",
    };
    return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getOrderStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      PENDING:    "bg-amber-500",
      CONFIRMED:  "bg-blue-500",
      PROCESSING: "bg-purple-500",
      SHIPPING:   "bg-indigo-500",
      DELIVERED:  "bg-[#364a29]",
      CANCELLED:  "bg-red-500",
    };
    return dots[status] || "bg-gray-500";
  };

  const getPaymentStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      PENDING:    "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20",
      PAID:       "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0] focus:ring-[#364a29]/20",
      REFUNDED:   "bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-500/20",
    };
    return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getPaymentStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      PENDING:    "bg-amber-500",
      PAID:       "bg-[#364a29]",
      REFUNDED:   "bg-orange-500",
    };
    return dots[status] || "bg-gray-500";
  };

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        showToast.error("Không tìm thấy đơn hàng");
        router.push("/tiem-nho-nth24/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      showToast.error("Lỗi khi tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    const promise = async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái đơn hàng");
      }
      await fetchOrder();
    };

    try {
      await promise();
      showToast.success("Cập nhật trạng thái thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi cập nhật trạng thái đơn hàng");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (newStatus: string) => {
    setUpdating(true);
    const promise = async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái thanh toán");
      }
      await fetchOrder();
    };

    try {
      await promise();
      showToast.success("Cập nhật trạng thái thanh toán thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi cập nhật trạng thái thanh toán");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/tiem-nho-nth24/orders"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đơn hàng
        </Link>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Đơn hàng #{order.orderNumber}</h2>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 text-sm font-semibold transition-all"
          >
            <Printer className="w-4 h-4" />
            In hóa đơn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chi tiết đơn hàng */}
        <div className="lg:col-span-2 space-y-6">
          {/* Danh sách sản phẩm */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Danh sách sản phẩm</h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0">
                    {item.productImage ? (
                      <ImageWrapper
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        noRound
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Không có ảnh
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">{item.productName}</div>
                    {item.variants && item.variants !== "{}" && (
                      <div className="text-xs text-gray-500 mt-1">
                        Phân loại: {(() => {
                          try {
                            const parsed = typeof item.variants === "string" ? JSON.parse(item.variants) : item.variants;
                            return Object.entries(parsed)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ");
                          } catch {
                            return String(item.variants);
                          }
                        })()}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Số lượng: {item.quantity} x {item.price.toLocaleString("vi-VN")}₫
                    </div>
                  </div>
                  <div className="text-right font-semibold text-sm text-gray-800 shrink-0">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                  </div>
                </div>
              ))}
            </div>

            {/* Tổng cộng tiền */}
            <div className="mt-6 border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{order.subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{order.shippingFee.toLocaleString("vi-VN")}₫</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#425733] font-medium">
                  <span>Giảm giá</span>
                  <span>-{order.discount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t text-gray-800">
                <span>Tổng tiền</span>
                <span className="text-[#425733]">{order.total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin phụ */}
        <div className="space-y-6">
          {/* Trạng thái */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Trạng thái</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái đơn hàng</label>
                <div className="relative flex items-center">
                  <span className={`absolute left-3 w-1.5 h-1.5 rounded-full ${getOrderStatusDot(order.status)} pointer-events-none opacity-80`} />
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={updating}
                    className={`w-full pl-6.5 pr-8 py-1.5 border rounded-full font-semibold text-xs appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${getOrderStatusStyles(order.status)}`}
                  >
                    <option value="PENDING">Chờ xử lý (Pending)</option>
                    <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                    <option value="PROCESSING">Đang xử lý (Processing)</option>
                    <option value="SHIPPING">Đang giao hàng (Shipping)</option>
                    <option value="DELIVERED">Đã giao hàng (Delivered)</option>
                    <option value="CANCELLED">Đã huỷ đơn (Cancelled)</option>
                  </select>
                  <ChevronDown className="absolute right-3 w-3.5 h-3.5 pointer-events-none opacity-60 text-current" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái thanh toán</label>
                <div className="relative flex items-center">
                  <span className={`absolute left-3 w-1.5 h-1.5 rounded-full ${getPaymentStatusDot(order.paymentStatus)} pointer-events-none opacity-80`} />
                  <select
                    value={order.paymentStatus}
                    onChange={(e) => handleUpdatePaymentStatus(e.target.value)}
                    disabled={updating}
                    className={`w-full pl-6.5 pr-8 py-1.5 border rounded-full font-semibold text-xs appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${getPaymentStatusStyles(order.paymentStatus)}`}
                  >
                    <option value="PENDING">Chờ thanh toán (Pending)</option>
                    <option value="PAID">Đã thanh toán (Paid)</option>
                    <option value="REFUNDED">Đã hoàn tiền (Refunded)</option>
                  </select>
                  <ChevronDown className="absolute right-3 w-3.5 h-3.5 pointer-events-none opacity-60 text-current" />
                </div>
              </div>
            </div>
          </div>

          {/* Khách hàng */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Thông tin khách hàng</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Họ tên:</span>
                <span className="ml-2 font-medium text-gray-800">{order.customer?.name || order.shippingInfo?.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-800">{order.customer?.email || order.shippingInfo?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="ml-2 text-gray-800">{order.customer?.phone || order.shippingInfo?.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Giao hàng */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Địa chỉ giao hàng</h3>
            <div className="text-sm">
              <div className="font-semibold text-gray-800">{order.shippingInfo?.name || "N/A"}</div>
              <div className="text-gray-600 mt-1">{order.shippingInfo?.fullAddress || order.shippingInfo?.address || "N/A"}</div>
              <div className="text-gray-600 mt-1">SĐT nhận hàng: {order.shippingInfo?.phone || "N/A"}</div>
            </div>
          </div>

          {/* Chi tiết thêm */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Chi tiết đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="ml-2 font-mono text-gray-800">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Ngày tạo:</span>
                <span className="ml-2 text-gray-800">{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
