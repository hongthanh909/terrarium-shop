"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Calendar, ShoppingBag, DollarSign } from "lucide-react";

interface BreakdownItem {
  label: string;
  revenue: number;
  orders: number;
  date: string;
}

interface RevenueChartProps {
  data: BreakdownItem[];
  periodLabel: string;
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatShortVND(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ₫`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₫`;
  return `${value.toLocaleString("vi-VN")} ₫`;
}

export function RevenueChart({ data, periodLabel }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100_000);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const peakItem = data.reduce((max, item) => (item.revenue > max.revenue ? item : max), data[0] || { revenue: 0, label: "" });

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eef5e8] flex items-center justify-center text-[#2f4a23]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Biểu Đồ Doanh Thu & Đơn Hàng</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Theo dõi diễn biến doanh thu theo mốc thời gian ({periodLabel})
          </p>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#fafbf8] border border-gray-200/80 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-[#4a6d38]" />
            <div>
              <span className="text-gray-400">Tổng doanh thu: </span>
              <span className="font-bold text-gray-800">{formatShortVND(totalRevenue)}</span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#fafbf8] border border-gray-200/80 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-[#3b7dd8]" />
            <div>
              <span className="text-gray-400">Tổng đơn: </span>
              <span className="font-bold text-gray-800">{totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="relative pt-6 pb-2">
        {/* Active Hover Tooltip Card */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-0 right-4 z-20 bg-gray-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl border border-gray-800 flex items-center gap-4 text-xs"
            >
              <div>
                <p className="text-gray-400 text-[11px] flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3 text-[#8fba6f]" />
                  {activeItem.date}
                </p>
                <p className="font-bold text-base text-[#8fba6f] mt-0.5">
                  {formatVND(activeItem.revenue)}
                </p>
              </div>
              <div className="border-l border-gray-700 pl-3">
                <p className="text-gray-400 text-[11px]">Đơn hàng</p>
                <p className="font-semibold text-white text-sm mt-0.5">{activeItem.orders} đơn</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bars Grid */}
        <div className="h-56 flex items-end gap-1.5 sm:gap-2.5 px-2">
          {data.map((item, index) => {
            const heightPercent = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 4) : 4;
            const isHovered = hoveredIndex === index;
            const isPeak = peakItem?.label === item.label && item.revenue > 0;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bar Element */}
                <div className="w-full relative flex flex-col items-center justify-end h-full">
                  {/* Peak Marker Badge */}
                  {isPeak && !activeItem && (
                    <span className="absolute -top-6 text-[10px] font-bold text-[#4a6d38] bg-[#eef5e8] px-1.5 py-0.5 rounded-md shadow-xs whitespace-nowrap">
                      Cao nhất
                    </span>
                  )}

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.5, delay: index * 0.02 }}
                    className={`w-full rounded-t-lg transition-all duration-200 relative ${
                      isHovered
                        ? "bg-gradient-to-t from-[#2f4a23] to-[#4a6d38] shadow-[0_0_16px_rgba(74,109,56,0.35)] scale-x-105"
                        : isPeak
                        ? "bg-gradient-to-t from-[#365727] to-[#8fba6f]"
                        : "bg-[#e4ede0] hover:bg-[#c2d8b8]"
                    }`}
                  >
                    {/* Orders indicator dot on top of bar */}
                    {item.orders > 0 && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#2f4a23] border border-white shadow-xs" />
                    )}
                  </motion.div>
                </div>

                {/* X Axis Label */}
                <span
                  className={`text-[11px] mt-2 font-medium transition-colors truncate max-w-full ${
                    isHovered ? "text-[#2f4a23] font-bold" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8fba6f]" />
            <span>Doanh thu đạt chuẩn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2f4a23]" />
            <span>Có đơn hàng</span>
          </div>
        </div>
        <div>Rê chuột lên từng cột để xem chi tiết</div>
      </div>
    </div>
  );
}
