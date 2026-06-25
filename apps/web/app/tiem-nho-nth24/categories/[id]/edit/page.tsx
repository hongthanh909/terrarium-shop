"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  metaDescription: string | null;
  parentId: string | null;
  status: string;
}

export default function AdminCategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    metaDescription: "",
    parentId: "",
    status: "ACTIVE",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load category data
  const { data: category, isLoading } = useQuery<Category>({
    queryKey: ["admin-category-edit", id],
    queryFn: async () => {
      const res = await fetch(`/api/categories?id=${id}&nocache=true`);
      if (!res.ok) throw new Error("Không tìm thấy danh mục");
      return res.json();
    },
    enabled: !!id,
  });

  // Load all categories for parent selector
  const { data: allCategoriesData } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const res = await fetch("/api/categories?status=all&limit=100");
      const data = await res.json();
      return (data.categories ?? data) as Category[];
    },
  });

  const parentCategories = (allCategoriesData ?? []).filter(
    (c) => !c.parentId && c.id !== id
  );

  // Populate form when data loads
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        metaDescription: category.metaDescription ?? "",
        parentId: category.parentId ?? "",
        status: category.status,
      });
    }
  }, [category]);

  // Auto-slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          metaDescription: formData.metaDescription || null,
          parentId: formData.parentId || null,
          status: formData.status,
        }),
      });

      if (res.ok) {
        showToast.success("Cập nhật danh mục thành công!");
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        router.push("/tiem-nho-nth24/categories");
      } else {
        const err = await res.json();
        showToast.error(err.error || "Không thể cập nhật danh mục");
      }
    } catch {
      showToast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p className="mb-4">Không tìm thấy danh mục.</p>
        <Link href="/tiem-nho-nth24/categories" className="text-[#425733] underline">
          ← Quay lại Danh Mục
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/tiem-nho-nth24/categories"
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:text-[#425733] hover:border-[#425733]/40 hover:bg-[#f0f4ee] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Danh Mục</h2>
          <p className="text-sm text-gray-400 mt-0.5 font-mono">{category.slug}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="VD: Bể Cây Nhỏ"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30"
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
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="be-cay-nho"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30"
            />
            <p className="text-xs text-gray-400 mt-1">
              URL sẽ là: /products?category={formData.slug || "..."}
            </p>
          </div>

          {/* Parent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Danh mục cha
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
            >
              <option value="">Không (Danh mục gốc)</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
            >
              <option value="ACTIVE">Đang hiện</option>
              <option value="INACTIVE">Ẩn</option>
            </select>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mô tả ngắn (SEO)
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn gọn về danh mục này..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Link
              href="/tiem-nho-nth24/categories"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#425733] text-white rounded-full text-sm font-semibold hover:bg-[#364a29] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu Thay Đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
