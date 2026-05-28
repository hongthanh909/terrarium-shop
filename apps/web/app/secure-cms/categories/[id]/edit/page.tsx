"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  metaDescription: string | null;
  parentId: string | null;
  status: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    metaDescription: "",
    parentId: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, allRes] = await Promise.all([
          fetch(`/api/categories/${id}`),
          fetch("/api/categories"),
        ]);

        if (!catRes.ok) {
          toast.error("Không tìm thấy danh mục");
          router.push("/admin/categories");
          return;
        }

        const cat = await catRes.json();
        const allData = await allRes.json();
        const categories = Array.isArray(allData) ? allData : (allData.categories ?? []);

        setAllCategories(categories.filter((c: Category) => c.id !== id));
        setFormData({
          name: cat.name || "",
          slug: cat.slug || "",
          metaDescription: cat.metaDescription || "",
          parentId: cat.parentId || "",
          status: cat.status || "ACTIVE",
        });
      } catch (error) {
        console.error("Error fetching category:", error);
        toast.error("Lỗi tải danh mục");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (response.ok) {
        toast.success("Cập nhật danh mục thành công!");
        router.push("/admin/categories");
      } else {
        const err = await response.json();
        toast.error(err.error || "Không thể cập nhật danh mục");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Lỗi khi cập nhật danh mục");
    } finally {
      setSaving(false);
    }
  };

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#425733] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/categories"
          className="p-2 rounded-full hover:bg-[#e3ebdd] text-[#425733] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Danh Mục</h2>
          <p className="text-gray-500 text-sm mt-0.5">Cập nhật thông tin danh mục</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Tên */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tên danh mục <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData((prev) => ({
                ...prev,
                name,
                slug: prev.slug === autoSlug(prev.name) ? autoSlug(name) : prev.slug,
              }));
            }}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d8c5a] text-sm"
            placeholder="VD: Bể Cơ Bản"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Đường dẫn (slug) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d8c5a] text-sm font-mono"
            placeholder="vd: be-co-ban"
          />
          <p className="text-xs text-gray-400 mt-1">Chỉ dùng chữ thường, số và dấu gạch ngang</p>
        </div>

        {/* Danh mục cha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Danh mục cha
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d8c5a] text-sm"
          >
            <option value="">Không (Danh mục gốc)</option>
            {allCategories
              .filter((c) => !c.parentId) // only root categories as parent
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mô tả (Meta Description)
          </label>
          <textarea
            value={formData.metaDescription}
            onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d8c5a] text-sm resize-none"
            placeholder="Mô tả ngắn về danh mục này..."
          />
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6d8c5a] text-sm"
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/categories"
            className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#425733] text-white rounded-full text-sm font-semibold hover:bg-[#364a29] disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
