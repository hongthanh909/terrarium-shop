"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Package, Truck, Star, XCircle } from "lucide-react";

const STEP_CONFIG = [
  { key: "PENDING",    label: "Chờ xác nhận",  desc: "Đơn hàng đang chờ shop xác nhận",       icon: Clock,        color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200" },
  { key: "CONFIRMED",  label: "Đã xác nhận",   desc: "Shop đã xác nhận đơn hàng của bạn",     icon: CheckCircle,  color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200" },
  { key: "PROCESSING", label: "Đang đóng gói", desc: "Sản phẩm đang được chuẩn bị cẩn thận",  icon: Package,      color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
  { key: "SHIPPING",   label: "Đang giao",     desc: "Đơn hàng đang trên đường đến bạn 🚚",   icon: Truck,        color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" },
  { key: "DELIVERED",  label: "Đã giao",       desc: "Đơn hàng đã giao thành công!",           icon: Star,         color: "text-primary",  bg: "bg-primary-soft", border: "border-primary-border" },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"];

interface OrderTimelineProps {
  currentStatus: string;
  className?: string;
}

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl", className)}>
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700">Đơn hàng đã bị huỷ</p>
          <p className="text-sm text-red-500">Nếu đã thanh toán, tiền sẽ được hoàn trong 3-5 ngày làm việc</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className={cn("relative", className)}>
      {STEP_CONFIG.map((step, i) => {
        const Icon = step.icon;
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isPending = i > currentIdx;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Left: icon + line */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={isCurrent ? { scale: 0.7, opacity: 0 } : false}
                animate={isCurrent ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-300",
                  isDone    && "bg-primary border-primary",
                  isCurrent && cn(step.bg, step.border, "border-2"),
                  isPending  && "bg-gray-100 border-gray-200"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isDone    && "text-white",
                    isCurrent && step.color,
                    isPending  && "text-gray-300"
                  )}
                />
                {/* Pulse ring for current step */}
                {isCurrent && (
                  <span className={cn("absolute inset-0 rounded-full animate-ping opacity-30", step.bg)} />
                )}
              </motion.div>

              {/* Connecting line */}
              {i < STEP_CONFIG.length - 1 && (
                <div className="w-0.5 h-8 mt-1 mb-1 relative overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="absolute inset-x-0 top-0 bg-primary rounded-full"
                    initial={{ height: "0%" }}
                    animate={{ height: isDone ? "100%" : "0%" }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  />
                </div>
              )}
            </div>

            {/* Right: text */}
            <div className={cn("pb-6 pt-1.5 flex-1", i === STEP_CONFIG.length - 1 && "pb-0")}>
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "font-semibold text-sm leading-tight",
                  isDone    && "text-primary",
                  isCurrent && "text-gray-900",
                  isPending  && "text-gray-300"
                )}
              >
                {step.label}
              </motion.p>
              {(isDone || isCurrent) && (
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
