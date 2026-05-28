"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ShimmerButton({
  shimmerColor = "rgba(255,255,255,0.35)",
  background = "#425733",
  children,
  className,
  size = "md",
  ...props
}: ShimmerButtonProps) {
  const sizeClass = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }[size];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold text-white shadow-md transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#425733] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClass,
        className
      )}
      style={{ background }}
      {...(props as any)}
    >
      {/* Shimmer sweep */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite]"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${shimmerColor} 50%, transparent 60%)`,
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>

      <style jsx>{`
        @keyframes shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </motion.button>
  );
}

/** Ghost/outline variant */
export function OutlineButton({
  children,
  className,
  size = "md",
  ...props
}: Omit<ShimmerButtonProps, "shimmerColor" | "background">) {
  const sizeClass = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }[size ?? "md"];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#425733] bg-transparent font-semibold text-[#425733] transition-colors hover:bg-[#425733] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#425733] disabled:opacity-50",
        sizeClass,
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
