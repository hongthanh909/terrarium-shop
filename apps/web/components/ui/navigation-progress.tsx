"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Lightweight progress bar without external deps
let resolve: (() => void) | null = null;

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const bar = document.getElementById("nprogress-bar");
    if (!bar) return;

    // Show bar instantly on route change
    bar.style.transform = "scaleX(0)";
    bar.style.opacity = "1";
    bar.style.transition = "none";

    requestAnimationFrame(() => {
      bar.style.transition = "transform 0.4s ease";
      bar.style.transform = "scaleX(0.85)";

      setTimeout(() => {
        bar.style.transition = "transform 0.2s ease, opacity 0.3s ease";
        bar.style.transform = "scaleX(1)";
        setTimeout(() => {
          bar.style.opacity = "0";
        }, 200);
      }, 150);
    });
  }, [pathname, searchParams]);

  return null;
}

export function NavigationProgress() {
  return (
    <>
      {/* Fixed progress bar at top */}
      <div
        id="nprogress-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          width: "100%",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-border)))",
          zIndex: 9999,
          opacity: 0,
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 8px rgba(66, 87, 51, 0.5)",
        }}
      />
      <Suspense fallback={null}>
        <ProgressBarInner />
      </Suspense>
    </>
  );
}
