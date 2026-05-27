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
    // Log để debug trong development
    console.error("[GlobalError]", error);
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
            onClick={reset}
            className="flex items-center gap-2 bg-[#425733] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#364a29] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 border border-[#c8d5be] text-[#425733] px-5 py-2.5 rounded-full font-semibold hover:bg-[#f0f4ec] transition-colors"
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
