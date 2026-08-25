"use client";

/* eslint-disable @next/next/no-img-element -- Editor previews may use local object URLs. */

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff, Upload, X, Image as ImageIcon, Clock, ImagePlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/custom-toast";
import { BlogHtmlEditor } from "@/components/admin/BlogHtmlEditor";

interface BlogCategory {
  id: string;
  name: string;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [originalPublishedAt, setOriginalPublishedAt] = useState<string | null>(null);
  
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const introImageRef = useRef<HTMLInputElement>(null);
  const bodyImageRef = useRef<HTMLInputElement>(null);
  const conclusionImageRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load existing post
  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/posts/${postId}`);
        if (!res.ok) { showToast.error("Không tìm thấy bài viết"); router.push("/tiem-nho-nth24/blog"); return; }
        const post = await res.json();
        setFormData({
          title: post.title || "", slug: post.slug || "", thumbnail: post.thumbnail || "",
          images: Array.isArray(post.images) ? post.images : [],
          intro: post.intro || "", body: post.body || "", conclusion: post.conclusion || "",
          categoryId: post.categoryId || "", published: post.published ?? true,
        });
        setOriginalPublishedAt(post.publishedAt || null);
      } catch { showToast.error("Lỗi tải dữ liệu"); }
      finally { setLoading(false); }
    };
    loadPost();
  }, [postId, router]);

  useEffect(() => {
    fetch("/api/admin/blog/categories")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, title, slug }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { showToast.error("Upload ảnh thất bại"); return null; }
    const data = await res.json();
    return data.url;
  };

  const handleSectionImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: "intro" | "body" | "conclusion"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSection(section);
    const url = await uploadImage(file);
    if (url) {
      const imgTag = `<p><img src="${url}" style="max-width:100%;height:auto;border-radius:12px;margin:8px 0;" /></p>`;
      setFormData((prev) => ({ ...prev, [section]: prev[section] + imgTag }));
      showToast.success("Đã chèn ảnh vào bài viết!");
    }
    setUploadingSection(null);
    e.target.value = "";
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    const url = await uploadImage(file);
    if (url) { setFormData((prev) => ({ ...prev, thumbnail: url })); showToast.success("Tải ảnh đại diện thành công!"); }
    setUploadingThumbnail(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    const uploadedUrls: string[] = [];
    for (const file of files) { const url = await uploadImage(file); if (url) uploadedUrls.push(url); }
    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      showToast.success(`Đã tải thêm ${uploadedUrls.length} ảnh thư viện!`);
    }
    setUploadingGallery(false);
  };

  const removeThumbnail = () => setFormData((prev) => ({ ...prev, thumbnail: "" }));
  const removeGalleryImage = (idx: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { showToast.error("Vui lòng nhập tiêu đề"); return; }
    if (!formData.slug.trim()) { showToast.error("Vui lòng nhập đường dẫn (slug)"); return; }
    if (!formData.intro.trim() && !formData.body.trim() && !formData.conclusion.trim()) {
      showToast.error("Nội dung bài viết không được để trống"); return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        showToast.success("Bài viết đã được cập nhật thành công!");
        router.push("/tiem-nho-nth24/blog");
      } else { showToast.error(result.error || "Lỗi khi cập nhật bài viết"); }
    } catch { showToast.error("Lỗi kết nối. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("vi-VN", {
      weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#425733] animate-spin" />
          <p className="text-sm text-gray-500">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/tiem-nho-nth24/blog" className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại Blog
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Bài Viết</h2>
            <p className="text-sm text-gray-500">Cập nhật nội dung và chèn ảnh tùy ý</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <Clock className="w-4 h-4 text-[#425733]" />
              <span className="text-xs font-medium text-gray-600">{formatTime(currentTime)}</span>
            </div>
            {originalPublishedAt && (
              <span className="text-[10px] text-gray-400">Xuất bản lần đầu: {formatTime(originalPublishedAt)}</span>
            )}
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
            <input type="text" value={formData.title} onChange={handleTitleChange} required
              className="w-full px-4 py-2 border rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none transition-all"
              placeholder="Nhập tiêu đề bài viết..." />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Đường dẫn (slug) <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} required
                className="w-full px-4 py-2 border rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none font-mono text-sm transition-all"
                placeholder="tieu-de-bai-viet" />
              <p className="text-xs text-gray-400 mt-1">Tự động tạo: /blog/{formData.slug || "..."}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
              <select value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none bg-white transition-all">
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hình ảnh đại diện & Thư viện */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện</label>
              <div className="relative border border-dashed rounded-2xl h-40 flex flex-col items-center justify-center bg-gray-50 overflow-hidden group">
                {formData.thumbnail ? (
                  <>
                    <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button type="button" onClick={removeThumbnail}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()} disabled={uploadingThumbnail}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-100/50 transition-colors disabled:opacity-50">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">
                      {uploadingThumbnail ? "Đang tải..." : "Tải ảnh đại diện"}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thư viện ảnh phụ ({formData.images.length})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative border rounded-xl h-24 overflow-hidden bg-gray-100 group shadow-sm">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 10 && (
                  <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}
                    className="border border-dashed rounded-xl h-24 flex flex-col items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100/50 transition-colors disabled:opacity-50 text-gray-400 hover:text-gray-600">
                    <PlusIcon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">{uploadingGallery ? "Đang tải..." : "Tải ảnh phụ"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          <input ref={introImageRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleSectionImageUpload(e, "intro")} />
          <input ref={bodyImageRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleSectionImageUpload(e, "body")} />
          <input ref={conclusionImageRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleSectionImageUpload(e, "conclusion")} />

          <hr className="border-gray-100" />

          {/* Editors */}
          <div className="space-y-6">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <ImageIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Mẹo:</strong> Bấm nút <strong>📷 Chèn ảnh</strong> bên cạnh tiêu đề mỗi mục để chèn ảnh vào đúng vị trí mong muốn.
              </p>
            </div>

            {/* 1. Mở bài */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">1. Mở bài (Introduction)</label>
                <button type="button" onClick={() => introImageRef.current?.click()}
                  disabled={uploadingSection === "intro"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#425733] bg-[#f0f5ec] hover:bg-[#e3ebdd] rounded-lg border border-[#daebd0] transition-colors disabled:opacity-50">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {uploadingSection === "intro" ? "Đang tải..." : "📷 Chèn ảnh"}
                </button>
              </div>
              <BlogHtmlEditor
                value={formData.intro}
                onChange={(intro) => setFormData((prev) => ({ ...prev, intro }))}
                minHeightClass="h-44"
              />
            </div>

            {/* 2. Thân bài */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">2. Thân bài (Body Content)</label>
                <button type="button" onClick={() => bodyImageRef.current?.click()}
                  disabled={uploadingSection === "body"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#425733] bg-[#f0f5ec] hover:bg-[#e3ebdd] rounded-lg border border-[#daebd0] transition-colors disabled:opacity-50">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {uploadingSection === "body" ? "Đang tải..." : "📷 Chèn ảnh"}
                </button>
              </div>
              <BlogHtmlEditor
                value={formData.body}
                onChange={(body) => setFormData((prev) => ({ ...prev, body }))}
                minHeightClass="h-64"
              />
            </div>

            {/* 3. Kết bài */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">3. Kết bài (Conclusion)</label>
                <button type="button" onClick={() => conclusionImageRef.current?.click()}
                  disabled={uploadingSection === "conclusion"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#425733] bg-[#f0f5ec] hover:bg-[#e3ebdd] rounded-lg border border-[#daebd0] transition-colors disabled:opacity-50">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {uploadingSection === "conclusion" ? "Đang tải..." : "📷 Chèn ảnh"}
                </button>
              </div>
              <BlogHtmlEditor
                value={formData.conclusion}
                onChange={(conclusion) => setFormData((prev) => ({ ...prev, conclusion }))}
                minHeightClass="h-44"
              />
            </div>
          </div>

          {/* Trạng thái */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
              formData.published ? "border-[#425733]/40 bg-[#f8faf6]" : "border-gray-200 bg-gray-50/50"
            }`}
            onClick={() => setFormData((prev) => ({ ...prev, published: !prev.published }))}
          >
            {formData.published ? <Eye className="w-5 h-5 text-[#425733]" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">
                {formData.published ? "Đang xuất bản" : "Bản nháp"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formData.published
                  ? `Bài viết đang hiển thị • Cập nhật lúc: ${formatTime(currentTime)}`
                  : "Bài viết sẽ được lưu nhưng chưa hiển thị"}
              </p>
            </div>
            <input type="checkbox" checked={formData.published}
              onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
              className="ml-auto w-4.5 h-4.5 accent-[#425733]" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/tiem-nho-nth24/blog"
            className="px-6 py-2.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors">
            Hủy
          </Link>
          <button type="submit" disabled={saving}
            className="flex min-h-11 items-center gap-2 rounded-md border border-[#425733] bg-[#425733] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#364a29] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400">
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : "Cập Nhật Bài Viết"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
