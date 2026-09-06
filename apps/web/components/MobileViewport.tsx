"use client";

import { useEffect } from "react";

export function MobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Pin chat to the visible area without overriding browser pinch zoom.
        if (viewport.scale !== 1) return;
        root.style.setProperty("--visual-viewport-height", `${viewport.height}px`);
        root.style.setProperty("--visual-viewport-top", `${viewport.offsetTop}px`);
        const editing = document.activeElement?.matches("input:not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true]");
        root.dataset.mobileKeyboard = editing && window.innerHeight - viewport.height > 120 ? "open" : "closed";
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      root.style.removeProperty("--visual-viewport-height");
      root.style.removeProperty("--visual-viewport-top");
      delete root.dataset.mobileKeyboard;
    };
  }, []);
  return null;
}
