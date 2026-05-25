"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";

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
  items: Array<{
    id: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
  }>;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) fetchOrders();
    else setLoading(false);
  }, [session]);

  const fetchOrders = async () => {
    try {
      const customerId = (session?.user as any)?.id;
      if (!customerId) { setLoading(false); return; }
      const response = await fetch(`/api/orders?customerId=${customerId}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-[#e3ebdd] text-[#364a29]",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-[#e3ebdd] text-[#364a29]",
      REFUNDED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

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
            <Link
              href="/products"
              className="inline-block bg-[#425733] text-white px-6 py-3 rounded-lg hover:bg-[#364a29]"
            >
              Mua Sắm Ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Order #{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {order.total.toLocaleString("vi-VN")}₫
                      </div>
                      <div className="text-sm text-gray-500">{order.items.length} items</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-4">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Expandable Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-semibold mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-gray-500">
                                Qty: {item.quantity} x {item.price.toLocaleString("vi-VN")}₫
                              </div>
                            </div>
                            <div className="font-semibold">
                              {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="mt-4 pt-4 border-t space-y-2">
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
                  )}

                  <div className="mt-4 text-center text-sm text-gray-500">
                    {selectedOrder?.id === order.id ? "Click to collapse" : "Click to view details"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}