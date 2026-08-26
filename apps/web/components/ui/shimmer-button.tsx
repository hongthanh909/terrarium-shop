"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  background?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ShimmerButton({
  background,
  children,
  className,
  size = "md",
  style,
  ...props
}: ShimmerButtonProps) {
  const sizeClass = {
    sm: "h-11 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-12 px-8 text-base",
  }[size];

  return (
    <Button
      className={cn(sizeClass, className)}
      style={background ? { ...style, background } : style}
      {...props}
    >
      {children}
    </Button>
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
    sm: "h-11 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-12 px-8 text-base",
  }[size ?? "md"];

  return (
    <Button
      variant="outline"
      className={cn(sizeClass, className)}
      {...props}
    >
      {children}
    </Button>
  );
}
