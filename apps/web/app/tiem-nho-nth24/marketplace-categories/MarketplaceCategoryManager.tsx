"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Maximize2, PackageOpen, Save, Sofa, Sprout, Tag, Trash2, Waves } from "lucide-react";

type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

const iconOptions = [
  { value: "mini", label: "Mini", Icon: Sprout },
  { value: "medium", label: "Vừa", Icon: Sofa },
  { value: "large", label: "To", Icon: Maximize2 },
  { value: "tank", label: "Bể mới", Icon: Waves },
  { value: "sale", label: "Thanh lý", Icon: Tag },
  { value: "accessory", label: "Phụ kiện", Icon: Boxes },
  { value: "tag", label: "Khác", Icon: PackageOpen },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function MarketplaceCategoryManager({ initialCategories }: { initialCategories: MarketplaceCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    slug: "",
    icon: "mini",
    sortOrder: "0",
    isActive: true,
  });

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const response = await fetch("/api/admin/marketplace-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        slug: draft.slug || slugify(draft.name),
        sortOrder: Number(draft.sortOrder || 0),
      }),
    });
    const data = await response.json();
    setCreating(false);

    if (!response.ok) {
      setMessage(data.error || "Tạo danh mục thất bại.");
      return;
    }

    setCategories((current) => [...current, { ...data.category, _count: { products: 0 } }]);
    setDraft({ name: "", slug: "", icon: "mini", sortOrder: "0", isActive: true });
    router.refresh();
  }

  async function updateCategory(id: string, patch: Partial<MarketplaceCategory>) {
    setMessage("");
    setCategories((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

    const response = await fetch(`/api/admin/marketplace-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setMessage("Cập nhật danh mục thất bại. Hãy tải lại trang để đồng bộ.");
      router.refresh();
      return;
    }

    router.refresh();
  }

  async function deleteCategory(id: string) {
    setMessage("");
    const response = await fetch(`/api/admin/marketplace-categories/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessage("Xóa danh mục thất bại.");
      return;
    }

    setCategories((current) => current.map((item) => (item.id === id ? { ...item, isActive: false } : item)));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createCategory} className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Thêm danh mục filter</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_180px_120px_auto]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Tên danh mục
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))}
              required
              className="min-h-11 rounded-xl border border-gray-200 px-3 outline-none focus:border-[#7fa95e]"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Slug
            <input
              value={draft.slug}
              onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
              required
              className="min-h-11 rounded-xl border border-gray-200 px-3 outline-none focus:border-[#7fa95e]"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Icon
            <select
              value={draft.icon}
              onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
              className="min-h-11 rounded-xl border border-gray-200 px-3 outline-none focus:border-[#7fa95e]"
            >
              {iconOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Thứ tự
            <input
              value={draft.sortOrder}
              onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
              inputMode="numeric"
              className="min-h-11 rounded-xl border border-gray-200 px-3 outline-none focus:border-[#7fa95e]"
            />
          </label>
          <button disabled={creating} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
            {creating ? "Đang thêm..." : "Thêm"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="grid grid-cols-[1fr_140px_110px_110px_120px] gap-3 border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase text-gray-400">
          <span>Danh mục</span>
          <span>Icon</span>
          <span>Thứ tự</span>
          <span>Trạng thái</span>
          <span>Sản phẩm</span>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.map((category) => {
            const selectedIcon = iconOptions.find((option) => option.value === category.icon) || iconOptions[6];
            const Icon = selectedIcon.Icon;

            return (
              <div key={category.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_140px_110px_110px_120px] lg:items-center">
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    aria-label="Tên danh mục"
                    value={category.name}
                    onChange={(event) => setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, name: event.target.value } : item)))}
                    onBlur={() => updateCategory(category.id, { name: category.name })}
                    className="min-h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#7fa95e]"
                  />
                  <input
                    aria-label="Slug danh mục"
                    value={category.slug}
                    onChange={(event) => setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, slug: event.target.value } : item)))}
                    onBlur={() => updateCategory(category.id, { slug: category.slug })}
                    className="min-h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#7fa95e]"
                  />
                </div>
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  <select
                    aria-label="Icon danh mục"
                    value={category.icon}
                    onChange={(event) => updateCategory(category.id, { icon: event.target.value })}
                    className="w-full bg-transparent outline-none"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <input
                  aria-label="Thứ tự danh mục"
                  value={category.sortOrder}
                  inputMode="numeric"
                  onChange={(event) => setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, sortOrder: Number(event.target.value || 0) } : item)))}
                  onBlur={() => updateCategory(category.id, { sortOrder: Number(category.sortOrder || 0) })}
                  className="min-h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#7fa95e]"
                />
                <button
                  type="button"
                  onClick={() => updateCategory(category.id, { isActive: !category.isActive })}
                  className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${
                    category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {category.isActive ? "Đang bật" : "Đã ẩn"}
                </button>
                <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                  <span>{category._count?.products || 0}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateCategory(category.id, {
                        name: category.name,
                        slug: category.slug,
                        icon: category.icon,
                        sortOrder: Number(category.sortOrder || 0),
                        isActive: category.isActive,
                      })}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-primary"
                      title="Lưu"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600"
                      title="Xóa mềm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {message && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</p>}
    </div>
  );
}
