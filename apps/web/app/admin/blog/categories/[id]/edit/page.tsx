"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function EditBlogCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  useEffect(() => {
    // There is no specific GET /categories/[id] endpoint, so we fetch all and find it
    fetch("/api/admin/blog/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const category = data.find((cat: any) => cat.id === id);
        if (category) {
          setFormData({
            name: category.name || "",
            slug: category.slug || "",
          });
        } else {
          toast.error("Không tìm thấy danh mục");
          router.push("/admin/blog");
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Lỗi khi tải danh mục");
        router.push("/admin/blog");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, router]);

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
      const response = await fetch(`/api/admin/blog/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Cập nhật danh mục thành công!");
        queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
        router.push("/admin/blog");
      } else {
        const err = await response.json();
        toast.error(err.error || "Lỗi khi cập nhật danh mục");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này? Các bài viết trong danh mục sẽ không bị xóa nhưng sẽ mất phân loại.")) return;
    
    try {
      const response = await fetch(`/api/admin/blog/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Đã xóa danh mục!");
        queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
        router.push("/admin/blog");
      } else {
        const err = await response.json();
        toast.error(err.error || "Không thể xóa danh mục");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải dữ liệu...</div>;
  }

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
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Chỉnh Sửa Danh Mục</h2>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Xóa danh mục
          </button>
        </div>
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
            {saving ? "Đang lưu..." : "Cập Nhật Danh Mục"}
          </button>
        </div>
      </form>
    </div>
  );
}
