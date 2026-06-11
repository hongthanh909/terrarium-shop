"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

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
  icon?: string;
  delay?: number;
}

function StatCard({ value, suffix, label, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center px-6 py-8 bg-gradient-to-br from-white to-[#f9fbf7] rounded-2xl shadow-[0_4px_20px_rgba(66,87,51,0.06)] border border-[#daebd0] hover:shadow-[0_8px_30px_rgba(66,87,51,0.1)] hover:-translate-y-1 transition-all duration-300"
    >
      {icon && <span className="text-3xl mb-3">{icon}</span>}
      <span className="text-4xl lg:text-5xl font-bold text-[#425733] leading-none">
        <NumberTicker value={value} suffix={suffix} />
      </span>
      <span className="mt-2 text-sm text-gray-500 font-medium">{label}</span>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-[#f8faf6] to-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl md:text-4xl font-bold mb-10"
          style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Con số nói lên tất cả
        </motion.h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={2500}  suffix="+"  label="Khách hàng hài lòng" icon="🌿" delay={0} />
          <StatCard value={500}   suffix="+"  label="Sản phẩm handmade"   icon="🔮" delay={0.1} />
          <StatCard value={98}    suffix="%"  label="Đánh giá 5 sao"       icon="⭐" delay={0.2} />
          <StatCard value={3}     suffix=" năm" label="Kinh nghiệm"        icon="🏆" delay={0.3} />
        </div>
      </div>
    </section>
  );
}
