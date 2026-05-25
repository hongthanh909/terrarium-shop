"use client";

import { motion, useInView } from "framer-motion";
import { useRef, memo } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  width?: "fit-content" | "100%";
}

const variants = {
  up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } },
  none: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

export const ScrollReveal = memo(function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
  width = "100%",
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });

  const isFullHeight = className.includes("h-full");

  return (
    <div ref={ref} style={{ width }} className={className}>
      <motion.div
        variants={variants[direction]}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ willChange: "opacity, transform" }}
        className={isFullHeight ? "h-full" : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
});
