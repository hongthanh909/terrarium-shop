"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

/**
 * GlassCard – thẻ glassmorphism tái sử dụng.
 *
 * Mặc định: backdrop-blur, viền bán trong suốt, shadow nhẹ.
 * Hover: nổi lên nhẹ + shadow đậm hơn.
 * Tôn trọng prefers-reduced-motion.
 */
export interface GlassCardProps extends HTMLMotionProps<"div"> {
  /** Tắt hiệu ứng hover lift */
  noHover?: boolean;
  /** Tắt animation enter */
  noEntry?: boolean;
  /** Variant: default | subtle | solid */
  variant?: "default" | "subtle" | "solid";
}

const variantStyles = {
  default:
    "bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_4px_24px_rgba(66,87,51,0.08)]",
  subtle:
    "bg-white/40 backdrop-blur-md border border-white/20 shadow-[0_2px_12px_rgba(66,87,51,0.05)]",
  solid:
    "bg-white border border-[#e3ebdd] shadow-[0_4px_20px_rgba(66,87,51,0.06)]",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      className,
      noHover = false,
      noEntry = false,
      variant = "default",
      ...motionProps
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={
          noEntry || prefersReducedMotion ? false : { opacity: 0, y: 20 }
        }
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={
          noHover || prefersReducedMotion ? undefined : { y: -4 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "rounded-2xl overflow-hidden transition-shadow duration-300",
          "hover:shadow-[0_8px_32px_rgba(66,87,51,0.12)]",
          variantStyles[variant],
          className
        )}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
