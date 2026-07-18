"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

export default function ProductRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function archiveProduct() {
    if (!window.confirm("Ẩn/xóa sản phẩm này khỏi shop của bạn?")) return;
    setLoading(true);
    const response = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      window.alert(data?.error || "Xóa sản phẩm thất bại.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Link
        href={`/seller/products/${id}/edit`}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#c6d8ba] px-3 text-sm font-semibold text-[#3d5f2d]"
      >
        <Pencil className="h-4 w-4" /> Sửa
      </Link>
      <button
        type="button"
        disabled={loading}
        onClick={archiveProduct}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-100 px-3 text-sm font-semibold text-red-600 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" /> {loading ? "Đang xóa..." : "Xóa"}
      </button>
    </div>
  );
}
