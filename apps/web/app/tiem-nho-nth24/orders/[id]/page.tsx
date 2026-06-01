"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, X, Printer } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast.error("Order not found");
        router.push("/tiem-nho-nth24/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error loading order");
    } finally {
      setLoading(false);
    }
  };

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

    toast.promise(promise(), {
      loading: "Đang cập nhật trạng thái đơn hàng...",
      success: "Cập nhật trạng thái thành công!",
      error: (err) => err.message || "Lỗi khi cập nhật trạng thái đơn hàng",
      finally: () => setUpdating(false),
    });
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

    toast.promise(promise(), {
      loading: "Đang cập nhật trạng thái thanh toán...",
      success: "Cập nhật trạng thái thanh toán thành công!",
      error: (err) => err.message || "Lỗi khi cập nhật trạng thái thanh toán",
      finally: () => setUpdating(false),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading order details...</p>
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
          className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Order #{order.orderNumber}</h2>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                  <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.productName}</div>
                    {item.variants && item.variants !== "{}" && (
                      <div className="text-sm text-gray-600">
                        {item.variants}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} x {item.price.toLocaleString("vi-VN")}₫
                    </div>
                  </div>
                  <div className="text-right font-semibold">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{order.subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shippingFee.toLocaleString("vi-VN")}₫</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#425733]">
                  <span>Discount</span>
                  <span>-{order.discount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-[#425733]">{order.total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] disabled:bg-gray-100"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handleUpdatePaymentStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] disabled:bg-gray-100"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{order.customer?.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{order.customer?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2">{order.customer?.phone || order.shippingInfo?.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
            <div className="text-sm">
              <div className="font-medium">{order.shippingInfo?.name || "N/A"}</div>
              <div className="text-gray-600 mt-1">{order.shippingInfo?.fullAddress || order.shippingInfo?.address || "N/A"}</div>
              <div className="text-gray-600 mt-1">{order.shippingInfo?.phone || "N/A"}</div>
            </div>
          </div>

          {/* Order Meta */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Order Number:</span>
                <span className="ml-2 font-mono">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2">{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}