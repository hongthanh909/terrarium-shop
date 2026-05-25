"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface BlogCategory {
  id: string;
  name: string;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    categoryId: "",
    published: false,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/blog/posts/${id}`).then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      }),
      fetch("/api/blog/categories").then(res => res.json())
    ])
      .then(([postData, catData]) => {
        if (postData) {
          setFormData({
            title: postData.title || "",
            slug: postData.slug || "",
            content: postData.content || "",
            categoryId: postData.categoryId || "",
            published: postData.published || false,
          });
        }
        if (Array.isArray(catData)) {
          setCategories(catData);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Không tìm thấy bài viết");
        router.push("/admin/blog");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, router]);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData({ ...formData, title, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Cập nhật bài viết thành công!");
        router.push("/admin/blog");
      } else {
        const err = await response.json();
        toast.error(err.error || "Lỗi khi cập nhật bài viết");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi khi cập nhật bài viết");
    } finally {
      setSaving(false);
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
        <h2 className="text-3xl font-bold text-gray-800">Chỉnh Sửa Bài Viết</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
          <input
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
            placeholder="Nhập tiêu đề bài viết"
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
            placeholder="tieu-de-bai-viet"
          />
          <p className="text-xs text-gray-500 mt-1">Tự động tạo từ tiêu đề, có thể chỉnh sửa</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Danh mục</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nội dung *</label>
          <div className="bg-white">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              className="h-96 mb-12"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike", "blockquote"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="published" className="text-sm font-medium">
            Xuất bản ngay
          </label>
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
            {saving ? "Đang lưu..." : "Cập Nhật Bài Viết"}
          </button>
        </div>
      </form>
    </div>
  );
}
