"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);

    // Auto-reload once for ChunkLoadError (stale JS after deploy)
    const isChunkError =
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      const reloadKey = `chunk_reload_${window.location.pathname}`;
      const alreadyReloaded = sessionStorage.getItem(reloadKey);
      if (!alreadyReloaded) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
        return;
      }
      // Clear after 30s so future navigations can retry
      setTimeout(() => sessionStorage.removeItem(reloadKey), 30000);
    }
  }, [error]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#f0f4ec] to-[#e3ebdd] px-6">
      <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-soft-xl p-10">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Đã xảy ra lỗi
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Trang không thể tải được. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex min-h-11 items-center gap-2 rounded-control border border-primary bg-primary px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50 active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-control border border-primary-border bg-white px-5 py-2.5 font-semibold text-primary shadow-sm transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && error.message && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer">
              Chi tiết lỗi (dev only)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg overflow-auto max-h-40">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

