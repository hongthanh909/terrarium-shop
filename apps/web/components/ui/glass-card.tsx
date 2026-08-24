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
    "border border-border bg-white/85 shadow-[0_4px_24px_rgba(25,28,24,0.06)] backdrop-blur-xl",
  subtle:
    "border border-border/80 bg-white/70 shadow-[0_2px_12px_rgba(25,28,24,0.04)] backdrop-blur-md",
  solid:
    "border border-border bg-white shadow-[0_4px_20px_rgba(25,28,24,0.05)]",
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
          noHover || prefersReducedMotion ? undefined : { y: -6, scale: 1.03 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "overflow-hidden rounded-lg transition-shadow duration-200",
          "hover:shadow-[0_8px_32px_rgba(25,28,24,0.1)]",
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
