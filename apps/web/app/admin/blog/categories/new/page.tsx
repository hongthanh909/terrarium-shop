"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateBlogCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Danh mục đã được tạo!");
        queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
        router.push("/admin/blog");
      } else {
        const err = await response.json();
        toast.error(err.error || "Lỗi khi tạo danh mục");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Blog
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Tạo Danh Mục Mới</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
            placeholder="Nhập tên danh mục"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] font-mono text-sm"
            placeholder="ten-danh-muc"
          />
          <p className="text-xs text-gray-500 mt-1">Tự động tạo từ tên, có thể chỉnh sửa</p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link
            href="/admin/blog"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Huỷ
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29] disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            {saving ? "Đang lưu..." : "Lưu Danh Mục"}
          </button>
        </div>
      </form>
    </div>
  );
}
