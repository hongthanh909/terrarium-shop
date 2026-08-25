"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  background?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ShimmerButton({
  background = "#171717",
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
      whileHover={{ scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-md border border-gray-950 font-semibold tracking-normal text-white shadow-sm transition-colors hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass,
        className
      )}
      style={{ background }}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

/** Ghost/outline variant */
export function OutlineButton({
  children,
  className,
  size = "md",
  ...props
}: Omit<ShimmerButtonProps, "background">) {
  const sizeClass = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }[size ?? "md"];

  return (
    <motion.button
      whileHover={{ scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-950 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40 disabled:opacity-50",
        sizeClass,
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
