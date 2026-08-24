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
    <aside data-analytics-consent className="fixed inset-x-3 bottom-3 z-[10020] mx-auto max-w-2xl rounded-lg border border-border bg-white p-4 shadow-[0_12px_36px_rgba(25,28,24,0.14)] sm:flex sm:items-center sm:gap-4" aria-label="Tùy chọn thống kê truy cập">
      <p className="flex-1 text-sm leading-6 text-gray-700">
        Tiệm Rêu dùng thống kê ẩn danh để cải thiện trải nghiệm. Không ghi nội dung chat, biểu mẫu hoặc thông tin thanh toán.
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button type="button" onClick={() => setAnalyticsConsent(false)} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted">
          Chỉ cần thiết
        </button>
        <button type="button" onClick={() => setAnalyticsConsent(true)} className="min-h-11 rounded-md bg-foreground px-4 text-sm font-semibold text-white hover:bg-foreground/85">
          Cho phép thống kê
        </button>
      </div>
    </aside>
  );
}
