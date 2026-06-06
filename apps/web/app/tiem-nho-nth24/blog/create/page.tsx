"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff, Upload, X, Image as ImageIcon, Clock } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/custom-toast";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(
  () => import("react-quill").then((mod) => {
    require("react-quill/dist/quill.snow.css");
    return mod;
  }),
  { ssr: false, loading: () => <div className="h-48 bg-gray-50 rounded border animate-pulse" /> }
) as any;

interface BlogCategory {
  id: string;
  name: string;
}

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const introQuillRef = useRef<any>(null);
  const bodyQuillRef = useRef<any>(null);
  const conclusionQuillRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    thumbnail: "",
    images: [] as string[],
    intro: "",
    body: "",
    conclusion: "",
    categoryId: "",
    published: true,
  });

  // Cập nhật thời gian thực
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      showToast.error("Upload ảnh thất bại");
      return null;
    }
    const data = await res.json();
    return data.url;
  };

  // Custom image handler cho Quill — chèn ảnh inline
  const createImageHandler = useCallback((quillRef: React.RefObject<any>) => {
    return () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        showToast.info("Đang tải ảnh lên...");
        const url = await uploadImage(file);
        if (url) {
          const quill = quillRef.current?.getEditor?.();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", url);
            quill.setSelection(range.index + 1);
          }
          showToast.success("Đã chèn ảnh vào bài viết!");
        }
      };
    };
  }, []);

  // Quill modules với image handler
  const introModules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: createImageHandler(introQuillRef),
      },
    },
  }), [createImageHandler]);

  const bodyModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: createImageHandler(bodyQuillRef),
      },
    },
  }), [createImageHandler]);

  const conclusionModules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: createImageHandler(conclusionQuillRef),
      },
    },
  }), [createImageHandler]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    const url = await uploadImage(file);
    if (url) {
      setFormData((prev) => ({ ...prev, thumbnail: url }));
      showToast.success("Tải ảnh đại diện thành công!");
    }
    setUploadingThumbnail(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await uploadImage(file);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      showToast.success(`Đã tải thêm ${uploadedUrls.length} ảnh thư viện!`);
    }
    setUploadingGallery(false);
  };

  const removeThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnail: "" }));
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }
    if (!formData.slug.trim()) {
      showToast.error("Vui lòng nhập đường dẫn (slug)");
      return;
    }
    if (!formData.intro.trim() && !formData.body.trim() && !formData.conclusion.trim()) {
      showToast.error("Nội dung bài viết không được để trống");
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
        showToast.success(
          formData.published
            ? "Bài viết đã được xuất bản thành công!"
            : "Đã lưu bài viết dưới dạng bản nháp!"
        );
        router.push("/tiem-nho-nth24/blog");
      } else {
        showToast.error(result.error || "Lỗi khi tạo bài viết");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/tiem-nho-nth24/blog"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Blog
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tạo Bài Viết Mới</h2>
            <p className="text-sm text-gray-500">Phân chia cấu trúc bài viết rõ ràng và trực quan</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <Clock className="w-4 h-4 text-[#425733]" />
            <span className="text-xs font-medium text-gray-600">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tiêu đề bài viết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              required
              className="w-full px-4 py-2 border rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none transition-all"
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Đường dẫn (slug) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full px-4 py-2 border rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none font-mono text-sm transition-all"
                placeholder="tieu-de-bai-viet"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tự động tạo từ tiêu đề: /blog/{formData.slug || "..."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none bg-white transition-all"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hình ảnh đại diện & Thư viện */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Ảnh đại diện (Thumbnail) */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện (Thumbnail)</label>
              <div className="relative border border-dashed rounded-2xl h-40 flex flex-col items-center justify-center bg-gray-50 overflow-hidden group">
                {formData.thumbnail ? (
                  <>
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors opacity-90 hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-100/50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">
                      {uploadingThumbnail ? "Đang tải..." : "Tải ảnh đại diện"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Thư viện ảnh (Gallery) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thư viện ảnh bài viết ({formData.images.length})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative border rounded-xl h-24 overflow-hidden bg-gray-100 group shadow-sm">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {formData.images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingGallery}
                    className="border border-dashed rounded-xl h-24 flex flex-col items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100/50 transition-colors disabled:opacity-50 text-gray-400 hover:text-gray-600"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Tải nhiều ảnh</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden inputs for uploading */}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailUpload}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryUpload}
          />

          <hr className="border-gray-100" />

          {/* Rich Text Editors with inline image support */}
          <div className="space-y-6">
            {/* Tip */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <ImageIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Mẹo:</strong> Bấm nút <span className="inline-flex items-center px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">🖼 Ảnh</span> trên thanh công cụ để chèn ảnh trực tiếp vào vị trí con trỏ trong bài viết.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                1. Mở bài (Introduction)
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ReactQuill
                  ref={introQuillRef}
                  theme="snow"
                  value={formData.intro}
                  onChange={(intro: string) => setFormData((prev) => ({ ...prev, intro }))}
                  className="h-44 mb-12"
                  modules={introModules}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                2. Thân bài (Body Content)
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ReactQuill
                  ref={bodyQuillRef}
                  theme="snow"
                  value={formData.body}
                  onChange={(body: string) => setFormData((prev) => ({ ...prev, body }))}
                  className="h-64 mb-12"
                  modules={bodyModules}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                3. Kết bài (Conclusion)
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ReactQuill
                  ref={conclusionQuillRef}
                  theme="snow"
                  value={formData.conclusion}
                  onChange={(conclusion: string) => setFormData((prev) => ({ ...prev, conclusion }))}
                  className="h-44 mb-12"
                  modules={conclusionModules}
                />
              </div>
            </div>
          </div>

          {/* Trạng thái xuất bản */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
              formData.published
                ? "border-[#425733]/40 bg-[#f8faf6]"
                : "border-gray-200 bg-gray-50/50"
            }`}
            onClick={() => setFormData((prev) => ({ ...prev, published: !prev.published }))}
          >
            {formData.published ? (
              <Eye className="w-5 h-5 text-[#425733]" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">
                {formData.published ? "Xuất bản ngay" : "Lưu bản nháp"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formData.published
                  ? `Bài viết sẽ được xuất bản lúc: ${formatTime(currentTime)}`
                  : "Bài viết sẽ được lưu nhưng chưa hiển thị với khách hàng"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
              className="ml-auto w-4.5 h-4.5 accent-[#425733]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/tiem-nho-nth24/blog"
            className="px-6 py-2.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold shadow hover:bg-[#364a29] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : formData.published ? "Xuất Bản Bài Viết" : "Lưu Bản Nháp"}
          </button>
        </div>
      </form>

      {/* Custom styles for Quill images */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 1rem 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .ql-snow .ql-toolbar button.ql-image {
          color: #425733;
        }
        .ql-snow .ql-toolbar button.ql-image:hover {
          color: #364a29;
        }
      `}} />
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
