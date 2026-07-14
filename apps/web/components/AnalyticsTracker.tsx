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
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const pageStartedAt = useRef(Date.now());

  useEffect(() => {
    setConsent((localStorage.getItem(ANALYTICS_CONSENT_KEY) as "granted" | "denied" | null) || null);
    const onConsent = (event: Event) => setConsent((event as CustomEvent<boolean>).detail ? "granted" : "denied");
    window.addEventListener("analytics-consent-changed", onConsent);
    return () => window.removeEventListener("analytics-consent-changed", onConsent);
  }, []);

  useEffect(() => {
    if (consent !== "granted" || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    pageStartedAt.current = Date.now();
    trackEvent({ type: "PAGE_VIEW", path: pathname });
    return () => {
      trackEvent({ type: "SESSION_END", path: pathname, durationMs: Date.now() - pageStartedAt.current });
      flushAnalytics(true);
    };
  }, [consent, pathname, searchParams]);

  useEffect(() => {
    if (consent !== "granted" || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
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
  }, [consent, pathname]);

  if (consent !== null) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[10020] mx-auto max-w-2xl border border-[#cddbc3] bg-white p-4 shadow-[0_12px_36px_rgba(32,55,23,0.18)] sm:flex sm:items-center sm:gap-4" aria-label="Tùy chọn thống kê truy cập">
      <p className="flex-1 text-sm leading-6 text-gray-700">
        Tiệm Rêu dùng thống kê ẩn danh để cải thiện trải nghiệm. Không ghi nội dung chat, biểu mẫu hoặc thông tin thanh toán.
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button type="button" onClick={() => setAnalyticsConsent(false)} className="min-h-10 border border-[#cddbc3] px-4 text-sm font-semibold text-[#425733] hover:bg-[#f3f7f0]">
          Chỉ cần thiết
        </button>
        <button type="button" onClick={() => setAnalyticsConsent(true)} className="min-h-10 bg-[#425733] px-4 text-sm font-semibold text-white hover:bg-[#34452a]">
          Cho phép thống kê
        </button>
      </div>
    </aside>
  );
}
