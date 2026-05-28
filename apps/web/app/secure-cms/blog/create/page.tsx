"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface BlogCategory {
  id: string;
  name: string;
}

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    categoryId: "",
    published: true,
  });

  useEffect(() => {
    fetch("/api/admin/blog/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Tự động tạo slug từ tiêu đề
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, title, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("Vui lòng nhập đường dẫn (slug)");
      return;
    }
    if (!formData.content || formData.content === "<p><br></p>") {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          formData.published
            ? "Bài viết đã được xuất bản thành công!"
            : "Đã lưu bài viết dưới dạng bản nháp!"
        );
        router.push("/secure-cms/blog");
      } else {
        toast.error(result.error || "Lỗi khi tạo bài viết");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/secure-cms/blog"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Blog
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Tạo Bài Viết Mới</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none"
              placeholder="Nhập tiêu đề bài viết"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Đường dẫn (slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none font-mono text-sm"
              placeholder="tieu-de-bai-viet"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tự động tạo từ tiêu đề — URL sẽ là: /blog/{formData.slug || "..."}
            </p>
          </div>


          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <div className="bg-white border rounded-lg">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
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

          {/* Trạng thái xuất bản */}
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              formData.published
                ? "border-[#425733] bg-[#f0f4ee]"
                : "border-gray-200 bg-gray-50"
            }`}
            onClick={() => setFormData((prev) => ({ ...prev, published: !prev.published }))}
          >
            {formData.published ? (
              <Eye className="w-5 h-5 text-[#425733]" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-sm">
                {formData.published ? "Xuất bản ngay" : "Lưu bản nháp"}
              </p>
              <p className="text-xs text-gray-500">
                {formData.published
                  ? "Bài viết sẽ hiển thị ngay trên trang Blog của khách hàng"
                  : "Bài viết sẽ được lưu nhưng chưa hiển thị với khách hàng"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
              className="ml-auto w-5 h-5 accent-[#425733]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/secure-cms/blog"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#364a29] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? "Đang lưu..." : formData.published ? "Xuất Bản Bài Viết" : "Lưu Bản Nháp"}
          </button>
        </div>
      </form>
    </div>
  );
}