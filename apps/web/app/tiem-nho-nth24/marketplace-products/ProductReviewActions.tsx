"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: "approve" | "reject" | "suspend") {
    setLoading(true);
    await fetch(`/api/admin/marketplace-products/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "approve" ? {} : { note: `Admin ${action}` }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={loading} onClick={() => run("approve")} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
        Duyet
      </button>
      <button disabled={loading} onClick={() => run("reject")} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60">
        Tu choi
      </button>
      <button disabled={loading} onClick={() => run("suspend")} className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-60">
        Khoa
      </button>
    </div>
  );
}
