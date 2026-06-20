"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ShoppingBag, Sprout, Star, Trophy } from "lucide-react";

interface NumberTickerProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number; // ms
  className?: string;
}

export function NumberTicker({
  value,
  suffix = "",
  prefix = "",
  duration = 2000,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}{display.toLocaleString("vi-VN")}{suffix}
    </span>
  );
}

interface StatCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ value, suffix, label, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center justify-center text-center px-6 py-8 md:py-10 bg-white rounded-2xl shadow-[0_8px_30px_rgba(41,58,32,0.08)] border border-[#daebd0] hover:shadow-[0_15px_40px_rgba(41,58,32,0.15)] hover:-translate-y-1 transition-all duration-300 h-full"
    >
      <div className="mb-4 text-[#425733] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-3xl md:text-4xl font-extrabold text-[#293a20] tracking-tight leading-none">
        <NumberTicker value={value} suffix={suffix} />
      </span>
      <span className="mt-3 text-xs md:text-sm text-gray-500 font-semibold tracking-wide">{label}</span>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 bg-[#f8faf6]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            value={2500}
            suffix="+"
            label="Khách hàng hài lòng"
            icon={<ShoppingBag className="w-8 h-8 text-[#425733] stroke-[1.2]" />}
            delay={0}
          />
          <StatCard
            value={500}
            suffix="+"
            label="Sản phẩm handmade"
            icon={<Sprout className="w-8 h-8 text-[#425733] stroke-[1.2]" />}
            delay={0.1}
          />
          <StatCard
            value={98}
            suffix="%"
            label="Đánh giá 5 sao"
            icon={<Star className="w-8 h-8 text-[#425733] stroke-[1.2]" />}
            delay={0.2}
          />
          <StatCard
            value={3}
            suffix=" năm"
            label="Kinh nghiệm"
            icon={<Trophy className="w-8 h-8 text-[#425733] stroke-[1.2]" />}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}

