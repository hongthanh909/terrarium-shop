"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface SaleCountdownProps {
  saleEndDate: string; // ISO string
  className?: string;
}

function getTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, totalMs: diff };
}

export function SaleCountdown({ saleEndDate, className }: SaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(saleEndDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft(saleEndDate);
      setTimeLeft(t);
      if (!t) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [saleEndDate]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Flame className="w-4 h-4 text-red-600 animate-pulse" />
      <span className="text-sm font-mono font-bold text-red-600 tabular-nums">
        {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </span>
    </div>
  );
}
