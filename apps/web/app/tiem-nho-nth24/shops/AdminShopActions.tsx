"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplicationActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: "approve" | "reject") {
    setLoading(true);
    await fetch(`/api/admin/shops/applications/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "reject" ? { note: "Admin từ chối đơn đăng ký." } : {}),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button disabled={loading} onClick={() => run("approve")} className="rounded-full bg-[#2f4a23] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
        Duyệt
      </button>
      <button disabled={loading} onClick={() => run("reject")} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60">
        Từ chối
      </button>
    </div>
  );
}

export function ShopRiskActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function suspend() {
    setLoading(true);
    await fetch(`/api/admin/shops/${id}/violations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severity: "HIGH",
        reason: "Admin đánh dấu shop cần tạm khóa để review policy.",
        action: "TEMP_SUSPEND",
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button disabled={loading} onClick={suspend} className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-60">
      Tạm khóa
    </button>
  );
}
