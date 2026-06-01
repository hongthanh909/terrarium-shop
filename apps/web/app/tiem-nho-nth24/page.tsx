"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  MessageSquare,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  LayoutGrid,
  LayoutDashboard,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  pendingReviews: number;
  thisMonthRevenue: number;
  revenueChange: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customer: { name: string; email: string };
}

interface TopProduct {
  name: string;
  slug: string;
  totalSold: number;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-800",
  CONFIRMED:  "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPING:   "bg-indigo-100 text-indigo-800",
  DELIVERED:  "bg-[#e3ebdd] text-[#364a29]",
  CANCELLED:  "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "Chờ xử lý",
  CONFIRMED:  "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING:   "Đang giao",
  DELIVERED:  "Đã giao",
  CANCELLED:  "Đã huỷ",
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₫`;
  return `${value.toLocaleString("vi-VN")} ₫`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  change,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  change?: number;
  href?: string;
}) {
  const card = (
    <div className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className="bg-[#e3ebdd] p-3 rounded-full">
          <Icon className="w-6 h-6 text-[#425733]" />
        </div>
      </div>
      {(sub || change !== undefined) && (
        <div className="flex items-center gap-1 text-sm">
          {change !== undefined ? (
            change >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-[#425733]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )
          ) : null}
          <span className={change !== undefined && change < 0 ? "text-red-500" : "text-[#425733] font-medium"}>
            {change !== undefined ? `${change > 0 ? "+" : ""}${change}% so với tháng trước` : sub}
          </span>
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
  });

  const stats = data?.stats ?? null;
  const recentOrders = data?.recentOrders ?? [];
  const topProducts = data?.topProducts ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#425733] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl text-red-700 text-sm">
        ⚠️ Không thể tải thống kê: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-1">Bảng Điều Khiển</h2>
        <p className="text-gray-500">Tổng quan hoạt động của Tiệm Rêu Décor</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Doanh Thu Tháng Này"
          value={formatCurrency(stats?.thisMonthRevenue || 0)}
          icon={TrendingUp}
          change={stats?.revenueChange}
        />
        <StatCard
          label="Tổng Đơn Hàng"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          sub={`${stats?.pendingOrders || 0} đơn chờ xử lý`}
          href="/tiem-nho-nth24/orders"
        />
        <StatCard
          label="Sản Phẩm Hoạt Động"
          value={stats?.totalProducts || 0}
          icon={Package}
          href="/tiem-nho-nth24/products"
        />
        <StatCard
          label="Khách Hàng"
          value={stats?.totalCustomers || 0}
          icon={Users}
        />
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(stats?.pendingOrders || 0) > 0 && (
          <Link
            href="/tiem-nho-nth24/orders"
            className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
          >
            <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
            <span className="text-yellow-800 font-medium text-sm">
              {stats?.pendingOrders} đơn hàng đang chờ xác nhận
            </span>
            <ArrowUpRight className="w-4 h-4 text-yellow-600 ml-auto shrink-0" />
          </Link>
        )}
        {(stats?.pendingReviews || 0) > 0 && (
          <Link
            href="/tiem-nho-nth24/reviews"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Star className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-blue-800 font-medium text-sm">
              {stats?.pendingReviews} đánh giá chờ duyệt
            </span>
            <ArrowUpRight className="w-4 h-4 text-blue-600 ml-auto shrink-0" />
          </Link>
        )}
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Đơn Hàng Gần Đây</h3>
            <Link href="/tiem-nho-nth24/orders" className="text-sm text-[#425733] hover:underline font-medium">
              Xem tất cả →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Chưa có đơn hàng nào</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/tiem-nho-nth24/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 truncate">{order.customer?.name || order.customer?.email}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {Number(order.total).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Bán Chạy Nhất</h3>
            <Link href="/tiem-nho-nth24/products" className="text-sm text-[#425733] hover:underline font-medium">
              Xem tất cả →
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((product: any, index: number) => (
                <div key={product.slug} className="flex items-center gap-3 px-6 py-4">
                  <span className="w-6 h-6 rounded-full bg-[#e3ebdd] text-[#425733] text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 flex-1 min-w-0 truncate">{product.name}</p>
                  <span className="text-sm font-semibold text-[#425733] shrink-0">{product.totalSold} đã bán</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Hành Động Nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: "/tiem-nho-nth24/homepage",        icon: LayoutDashboard, label: "Giao Diện" },
            { href: "/tiem-nho-nth24/products/create", icon: Package,         label: "Thêm Sản Phẩm" },
            { href: "/tiem-nho-nth24/orders",          icon: ShoppingCart,    label: "Đơn Hàng" },
            { href: "/tiem-nho-nth24/categories",      icon: LayoutGrid,      label: "Danh Mục" },
            { href: "/tiem-nho-nth24/discounts",       icon: Tag,             label: "Giảm Giá" },
            { href: "/tiem-nho-nth24/reviews",         icon: MessageSquare,   label: "Đánh Giá" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#6d8c5a] hover:bg-[#f0f4ec] transition-all group"
            >
              <Icon className="w-7 h-7 text-gray-400 group-hover:text-[#425733] transition-colors" />
              <span className="text-xs font-medium text-gray-500 group-hover:text-[#425733] text-center transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
