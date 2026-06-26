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
  PENDING:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  CONFIRMED:  "bg-blue-50 text-blue-700 border border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border border-purple-200",
  SHIPPING:   "bg-indigo-50 text-indigo-700 border border-indigo-200",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED:  "bg-red-50 text-red-700 border border-red-200",
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

/* ── Stat Card — đồng bộ size, icon nhẹ nhàng hơn ── */
function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  change,
  href,
  iconBg = "#eef3e8",
  iconColor = "#4a6d38",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  change?: number;
  href?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  const card = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 min-h-[120px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200 group">
      {/* Icon circle */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ background: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-400 font-medium mb-1 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        {(sub || change !== undefined) && (
          <div className="flex items-center gap-1 mt-1.5">
            {change !== undefined ? (
              change >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )
            ) : null}
            <span className={`text-[12px] font-medium ${change !== undefined && change < 0 ? "text-red-500" : "text-emerald-600"}`}>
              {change !== undefined ? `${change > 0 ? "+" : ""}${change}% so với tháng trước` : sub}
            </span>
          </div>
        )}
      </div>
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
    <div className="space-y-6 max-w-[1200px]">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bảng Điều Khiển</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng quan hoạt động của Tiệm Rêu Décor</p>
        </div>
      </div>

      {/* ── Stats Grid — 4 cards đồng bộ size ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh Thu Tháng Này"
          value={formatCurrency(stats?.thisMonthRevenue || 0)}
          icon={TrendingUp}
          change={stats?.revenueChange}
          iconBg="#eef3e8"
          iconColor="#4a6d38"
        />
        <StatCard
          label="Tổng Đơn Hàng"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          sub={`${stats?.pendingOrders || 0} đơn chờ xử lý`}
          href="/tiem-nho-nth24/orders"
          iconBg="#edf5ff"
          iconColor="#3b7dd8"
        />
        <StatCard
          label="Sản Phẩm Hoạt Động"
          value={stats?.totalProducts || 0}
          icon={Package}
          href="/tiem-nho-nth24/products"
          iconBg="#fef5e7"
          iconColor="#c28b2d"
        />
        <StatCard
          label="Khách Hàng"
          value={stats?.totalCustomers || 0}
          icon={Users}
          iconBg="#f0eef8"
          iconColor="#6b5eaa"
        />
      </div>

      {/* ── Alert banners ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {(stats?.pendingOrders || 0) > 0 && (
          <Link
            href="/tiem-nho-nth24/orders"
            className="flex-1 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl hover:bg-amber-100/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-amber-800 font-medium text-sm flex-1">
              {stats?.pendingOrders} đơn hàng đang chờ xác nhận
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-500 shrink-0" />
          </Link>
        )}
        {(stats?.pendingReviews || 0) > 0 && (
          <Link
            href="/tiem-nho-nth24/reviews"
            className="flex-1 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200/60 rounded-xl hover:bg-blue-100/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-blue-800 font-medium text-sm flex-1">
              {stats?.pendingReviews} đánh giá chờ duyệt
            </span>
            <ArrowUpRight className="w-4 h-4 text-blue-500 ml-auto shrink-0" />
          </Link>
        )}
      </div>

      {/* ── Tables row — Orders + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Orders — 3/5 width */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-800 text-[15px]">Đơn Hàng Gần Đây</h3>
            <Link href="/tiem-nho-nth24/orders" className="text-[13px] text-[#4a6d38] hover:text-[#2d4a22] font-medium transition-colors">
              Xem tất cả →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-300 text-sm">Chưa có đơn hàng nào</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/tiem-nho-nth24/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 text-[13px] truncate">{order.orderNumber}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{order.customer?.name || order.customer?.email}</p>
                  </div>
                  <div className="flex items-center gap-2.5 ml-4 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-[13px] font-bold text-gray-800 tabular-nums min-w-[80px] text-right">
                      {Number(order.total).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products — 2/5 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-800 text-[15px]">Bán Chạy Nhất</h3>
            <Link href="/tiem-nho-nth24/products" className="text-[13px] text-[#4a6d38] hover:text-[#2d4a22] font-medium transition-colors">
              Xem tất cả →
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-10 text-center text-gray-300 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((product: any, index: number) => (
                <div key={product.slug} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                    index === 0 ? "bg-amber-50 text-amber-600 border border-amber-200/50" :
                    index === 1 ? "bg-gray-100 text-gray-500" :
                    index === 2 ? "bg-orange-50 text-orange-500" :
                    "bg-gray-50 text-gray-400"
                  }`}>
                    {index + 1}
                  </span>
                  <p className="text-[13px] text-gray-700 flex-1 min-w-0 truncate font-medium">{product.name}</p>
                  <span className="text-[12px] font-semibold text-gray-400 shrink-0">{product.totalSold} đã bán</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions — soft cards ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 text-[15px] mb-4">Hành Động Nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/tiem-nho-nth24/homepage",        icon: LayoutDashboard, label: "Giao Diện",      bg: "#eef3e8", color: "#4a6d38" },
            { href: "/tiem-nho-nth24/products/create", icon: Package,         label: "Thêm Sản Phẩm",  bg: "#fef5e7", color: "#c28b2d" },
            { href: "/tiem-nho-nth24/orders",          icon: ShoppingCart,    label: "Đơn Hàng",        bg: "#edf5ff", color: "#3b7dd8" },
            { href: "/tiem-nho-nth24/categories",      icon: LayoutGrid,      label: "Danh Mục",        bg: "#f0eef8", color: "#6b5eaa" },
            { href: "/tiem-nho-nth24/discounts",       icon: Tag,             label: "Giảm Giá",        bg: "#fef0f0", color: "#d35050" },
            { href: "/tiem-nho-nth24/reviews",         icon: MessageSquare,   label: "Đánh Giá",        bg: "#fff8e6", color: "#b68a1d" },
          ].map(({ href, icon: Icon, label, bg, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-[12px] font-medium text-gray-500 group-hover:text-gray-700 text-center transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
