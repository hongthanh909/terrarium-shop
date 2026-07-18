"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VIETNAM_PROVINCES_2025 } from "@/lib/vietnam-locations";

type MarketplaceCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type ProductFormInitial = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: any;
  priceNote?: string | null;
  images: string[];
  videoUrl?: string | null;
  condition?: string | null;
  quantity: number;
  province?: string | null;
  district?: string | null;
  categories?: { categoryId: string }[];
};

export default function ProductForm({
  categories = [],
  initialProduct,
}: {
  categories?: MarketplaceCategoryOption[];
  initialProduct?: ProductFormInitial;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialProduct?.categories?.map((item) => item.categoryId) || []
  );

  function toggleCategory(id: string) {
    setSelectedCategoryIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return current;
      return [...current, id];
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const imageText = String(form.get("images") || "");
    const images = imageText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      title: form.get("title"),
      slug: form.get("slug"),
      description: form.get("description"),
      price: form.get("price"),
      priceNote: form.get("priceNote") || null,
      images,
      videoUrl: form.get("videoUrl") || null,
      condition: form.get("condition") || null,
      quantity: form.get("quantity") || 1,
      province: form.get("province") || null,
      district: form.get("district") || null,
      categoryIds: selectedCategoryIds,
    };

    const response = await fetch(initialProduct ? `/api/seller/products/${initialProduct.id}` : "/api/seller/products", {
      method: initialProduct ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "Tạo sản phẩm thất bại.");
      return;
    }

    await fetch(`/api/seller/products/${data.product.id}/submit`, { method: "POST" });
    router.push("/seller/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-[#dfe8d7] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Tên sản phẩm
          <input name="title" required defaultValue={initialProduct?.title || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Slug
          <input name="slug" required defaultValue={initialProduct?.slug || ""} placeholder="binh-terrarium-mini" className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Giá tham khảo
          <input name="price" type="number" min="0" required defaultValue={initialProduct?.price ? Number(initialProduct.price) : ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Số lượng
          <input name="quantity" type="number" min="1" defaultValue={initialProduct?.quantity || 1} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Tỉnh/thành
          <select name="province" defaultValue={initialProduct?.province || ""} className="rounded-xl border border-[#d6e2ce] bg-white px-3 py-2">
            <option value="">Chọn tỉnh/thành</option>
            {VIETNAM_PROVINCES_2025.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Quận/huyện hoặc khu vực
          <input name="district" defaultValue={initialProduct?.district || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
        Mô tả
        <textarea name="description" required rows={6} defaultValue={initialProduct?.description || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
        Ảnh sản phẩm, mỗi URL một dòng
        <textarea name="images" rows={4} defaultValue={initialProduct?.images?.join("\n") || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
      </label>
      <fieldset className="rounded-xl border border-[#d6e2ce] p-4">
        <legend className="px-1 text-sm font-semibold text-[#3c4d35]">Danh mục filter</legend>
        <p className="mt-1 text-xs text-[#6f7f66]">Chọn tối đa 2 mục để khách lọc nhanh trong diễn đàn. Đã chọn {selectedCategoryIds.length}/2.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                selectedCategoryIds.includes(category.id)
                  ? "border-[#2f4a23] bg-[#eef5e8] font-semibold text-[#2f4a23]"
                  : "border-[#d6e2ce] text-[#526248]"
              }`}
            >
              <input
                name="categoryIds"
                type="checkbox"
                value={category.id}
                checked={selectedCategoryIds.includes(category.id)}
                disabled={!selectedCategoryIds.includes(category.id) && selectedCategoryIds.length >= 2}
                onChange={() => toggleCategory(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Video URL
          <input name="videoUrl" type="url" defaultValue={initialProduct?.videoUrl || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Tình trạng
          <input name="condition" defaultValue={initialProduct?.condition || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Ghi chú giá
          <input name="priceNote" defaultValue={initialProduct?.priceNote || ""} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
      </div>
      <button disabled={loading} className="w-fit rounded-full bg-[#2f4a23] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Đang gửi..." : initialProduct ? "Lưu và gửi duyệt lại" : "Tạo và gửi duyệt"}
      </button>
      {message && <p className="text-sm font-medium text-red-600">{message}</p>}
    </form>
  );
}
