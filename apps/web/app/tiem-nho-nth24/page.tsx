"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  Filter,
  DollarSign,
  Receipt,
  Layers,
  Sparkles,
} from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  pendingReviews: number;
  thisMonthRevenue: number;
  revenueChange: number;
  currentOrdersCount: number;
  ordersChange: number;
  averageOrderValue: number;
}

interface BreakdownItem {
  label: string;
  revenue: number;
  orders: number;
  date: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold",
  CONFIRMED:  "bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold",
  PROCESSING: "bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold",
  SHIPPING:   "bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold",
  CANCELLED:  "bg-red-50 text-red-700 border border-red-200/60 font-semibold",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "Chờ xử lý",
  CONFIRMED:  "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING:   "Đang giao",
  DELIVERED:  "Đã giao",
  CANCELLED:  "Đã huỷ",
};

const PERIOD_OPTIONS = [
  { id: "day", label: "Hôm nay" },
  { id: "week", label: "7 ngày qua" },
  { id: "month", label: "Tháng này" },
  { id: "year", label: "Năm nay" },
  { id: "custom", label: "Tùy chỉnh" },
];

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} tỷ ₫`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu ₫`;
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
  iconBg = "#eef5e8",
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
    <div className="group relative flex min-h-[125px] items-start gap-4 overflow-hidden rounded-md border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* Subtle background glow accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-25"
        style={{ background: iconColor }}
      />

      {/* Icon container */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-xs"
        style={{ background: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 z-10">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 truncate">{label}</p>
        <p className="text-2xl font-extrabold text-gray-800 leading-tight tabular-nums">{value}</p>
        {(sub || change !== undefined) && (
          <div className="flex items-center gap-1.5 mt-2">
            {change !== undefined ? (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {change > 0 ? `+${change}%` : `${change}%`}
              </span>
            ) : null}
            <span className="text-[12px] text-gray-400 truncate">
              {change !== undefined ? "so với kỳ trước" : sub}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ["admin-stats", period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }
      const res = await fetch(`/api/admin/stats?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
  });

  const stats: Stats | null = data?.stats ?? null;
  const breakdown: BreakdownItem[] = data?.breakdown ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const topProducts = data?.topProducts ?? [];

  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? "Tháng này";

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* ── Top Header & Filter Controls ── */}
      <div className="flex flex-col justify-between gap-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Bảng Điều Khiển</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary-soft text-primary px-2.5 py-0.5 rounded-full border border-[#c5dcb8]/60">
              <Sparkles className="w-3 h-3" /> Live Stats
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Tổng quan doanh thu, đơn hàng & hiệu suất hoạt động Tiệm Rêu Décor
          </p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-1">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap focus-visible:outline-none ${
                    active ? "text-primary" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-filter-pill"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/80"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Picker */}
          {period === "custom" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-1.5 text-xs"
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#8fba6f]"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#8fba6f]"
              />
              <button
                onClick={() => refetch()}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Lọc
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-gray-200 bg-white py-24">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs text-gray-400 font-medium">Đang tải thống kê doanh thu...</p>
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          ⚠️ Không thể tải thống kê: {(error as Error).message}
        </div>
      ) : (
        <>
          {/* ── Stats Grid — 4 Core Metric Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={`Doanh Thu (${periodLabel})`}
              value={formatCurrency(stats?.thisMonthRevenue || 0)}
              icon={TrendingUp}
              change={stats?.revenueChange}
              iconBg="#eef5e8"
              iconColor="hsl(var(--primary))"
            />
            <StatCard
              label={`Số Đơn Hàng (${periodLabel})`}
              value={stats?.currentOrdersCount || 0}
              icon={ShoppingCart}
              change={stats?.ordersChange}
              href="/tiem-nho-nth24/orders"
              iconBg="#edf5ff"
              iconColor="#3b7dd8"
            />
            <StatCard
              label="Trung Bình / Đơn (AOV)"
              value={formatCurrency(stats?.averageOrderValue || 0)}
              icon={Receipt}
              sub={`${stats?.totalOrders || 0} đơn tích luỹ`}
              iconBg="#fef5e7"
              iconColor="#c28b2d"
            />
            <StatCard
              label="Tổng Khách Hàng"
              value={stats?.totalCustomers || 0}
              icon={Users}
              sub={`${stats?.totalProducts || 0} sản phẩm đang bán`}
              iconBg="#f0eef8"
              iconColor="#6b5eaa"
            />
          </div>

          {/* ── Revenue Timeline Chart Component ── */}
          <RevenueChart data={breakdown} periodLabel={periodLabel} />

          {/* ── Alert banners for pending tasks ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {(stats?.pendingOrders || 0) > 0 && (
              <Link
                href="/tiem-nho-nth24/orders"
                className="flex flex-1 items-center gap-3 rounded-md border border-amber-200/70 bg-amber-50/80 px-4 py-3 shadow-xs transition-colors hover:bg-amber-100/60"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-amber-900 font-semibold text-sm flex-1">
                  {stats?.pendingOrders} đơn hàng đang chờ bạn xử lý
                </span>
                <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
              </Link>
            )}
            {(stats?.pendingReviews || 0) > 0 && (
              <Link
                href="/tiem-nho-nth24/reviews"
                className="flex flex-1 items-center gap-3 rounded-md border border-blue-200/70 bg-blue-50/80 px-4 py-3 shadow-xs transition-colors hover:bg-blue-100/60"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-blue-900 font-semibold text-sm flex-1">
                  {stats?.pendingReviews} đánh giá khách hàng chờ duyệt
                </span>
                <ArrowUpRight className="w-4 h-4 text-blue-600 ml-auto shrink-0" />
              </Link>
            )}
          </div>

          {/* ── Tables row — Orders + Top Products ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Recent Orders — 3/5 width */}
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-gray-800 text-base">Đơn Hàng Gần Đây</h3>
                </div>
                <Link
                  href="/tiem-nho-nth24/orders"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-950"
                >
                  Xem tất cả →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-300 text-sm font-medium">Chưa có đơn hàng nào</div>
              ) : (
                <div className="divide-y divide-gray-100/80">
                  {recentOrders.map((order: any) => (
                    <Link
                      key={order.id}
                      href={`/tiem-nho-nth24/orders/${order.id}`}
                      className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 text-sm truncate group-hover:text-primary transition-colors">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {order.customer?.name || order.customer?.email || "Khách vãng lai"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        <span className="text-sm font-extrabold text-gray-800 tabular-nums min-w-[85px] text-right">
                          {Number(order.total).toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products — 2/5 width */}
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#c28b2d]" />
                  <h3 className="font-bold text-gray-800 text-base">Bán Chạy Nhất</h3>
                </div>
                <Link
                  href="/tiem-nho-nth24/products"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-950"
                >
                  Tất cả →
                </Link>
              </div>
              {topProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-300 text-sm font-medium">Chưa có dữ liệu</div>
              ) : (
                <div className="divide-y divide-gray-100/80">
                  {topProducts.map((product: any, index: number) => (
                    <div
                      key={product.slug}
                      className="flex items-center gap-3.5 px-6 py-3.5 transition-colors hover:bg-gray-50"
                    >
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow-xs ${
                          index === 0
                            ? "bg-amber-100 text-amber-800 border border-amber-300/60"
                            : index === 1
                            ? "bg-gray-100 text-gray-600 border border-gray-200"
                            : index === 2
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="text-xs text-gray-800 flex-1 min-w-0 truncate font-semibold">
                        {product.name}
                      </p>
                      <span className="text-xs font-extrabold text-primary bg-primary-soft px-2.5 py-1 rounded-full shrink-0">
                        {product.totalSold} đã bán
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Hành Động Nhanh
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { href: "/tiem-nho-nth24/products/create", icon: Package,       label: "Thêm Sản Phẩm", bg: "#fef5e7", color: "#c28b2d" },
                { href: "/tiem-nho-nth24/orders",          icon: ShoppingCart,  label: "Đơn Hàng",      bg: "#edf5ff", color: "#3b7dd8" },
                { href: "/tiem-nho-nth24/categories",      icon: LayoutGrid,    label: "Danh Mục",      bg: "#f0eef8", color: "#6b5eaa" },
                { href: "/tiem-nho-nth24/discounts",       icon: Tag,           label: "Giảm Giá",      bg: "#fef0f0", color: "#d35050" },
                { href: "/tiem-nho-nth24/reviews",         icon: MessageSquare, label: "Đánh Giá",      bg: "#fff8e6", color: "#b68a1d" },
              ].map(({ href, icon: Icon, label, bg, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-h-28 flex-col items-center justify-center gap-2.5 rounded-md border border-gray-200 p-4 text-center transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/30"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs"
                    style={{ background: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 group-hover:text-primary text-center transition-colors">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
