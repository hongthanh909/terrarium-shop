"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ANALYTICS_CONSENT_KEY,
  flushAnalytics,
  setAnalyticsConsent,
  trackEvent,
} from "@/lib/analytics-client";

const EXCLUDED_PREFIXES = ["/tiem-nho-nth24", "/seller", "/api"];

export function AnalyticsTracker() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState<"granted" | "denied" | null | undefined>(undefined);
  const pageStartedAt = useRef(Date.now());
  const trackingEnabled = consent !== undefined && consent !== "denied";

  useEffect(() => {
    setConsent((localStorage.getItem(ANALYTICS_CONSENT_KEY) as "granted" | "denied" | null) || null);
    const onConsent = (event: Event) => setConsent((event as CustomEvent<boolean>).detail ? "granted" : "denied");
    window.addEventListener("analytics-consent-changed", onConsent);
    return () => window.removeEventListener("analytics-consent-changed", onConsent);
  }, []);

  useEffect(() => {
    if (!trackingEnabled || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    pageStartedAt.current = Date.now();
    trackEvent({ type: "PAGE_VIEW", path: pathname });
    return () => {
      trackEvent({ type: "SESSION_END", path: pathname, durationMs: Date.now() - pageStartedAt.current });
      flushAnalytics(true);
    };
  }, [trackingEnabled, pathname, searchParams]);

  useEffect(() => {
    if (!trackingEnabled || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") trackEvent({ type: "HEARTBEAT", path: pathname });
    }, 30_000);
    const onPageHide = () => {
      trackEvent({ type: "SESSION_END", path: pathname, durationMs: Date.now() - pageStartedAt.current });
      flushAnalytics(true);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [trackingEnabled, pathname]);

  if (consent !== null) return null;

  return (
    <aside data-analytics-consent className="fixed inset-x-0 bottom-0 z-[10020] mx-auto border-x-0 border-b-0 border-t border-border bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_36px_rgba(25,28,24,0.12)] sm:inset-x-3 sm:bottom-3 sm:max-w-2xl sm:rounded-lg sm:border sm:p-4 sm:shadow-[0_12px_36px_rgba(25,28,24,0.14)] md:flex md:items-center md:gap-4" aria-label="Tùy chọn thống kê truy cập">
      <p className="flex-1 text-[13px] leading-5 text-gray-700 sm:text-sm sm:leading-6">
        Tiệm Rêu dùng thống kê ẩn danh để cải thiện trải nghiệm. Không ghi nội dung chat, biểu mẫu hoặc thông tin thanh toán.
      </p>
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 md:mt-0">
        <button type="button" onClick={() => setAnalyticsConsent(false)} className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted sm:px-4">
          Chỉ cần thiết
        </button>
        <button type="button" onClick={() => setAnalyticsConsent(true)} className="min-h-11 rounded-md bg-foreground px-3 text-sm font-semibold text-white hover:bg-foreground/85 sm:px-4">
          Cho phép thống kê
        </button>
      </div>
    </aside>
  );
}
