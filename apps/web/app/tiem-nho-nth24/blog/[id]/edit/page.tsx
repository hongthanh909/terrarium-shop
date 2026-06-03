"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Upload, X, Plus, MessageSquare, CornerDownRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { supabaseClient } from "@/lib/supabaseClient";

const ReactQuill = dynamic(
  () => import("react-quill").then((mod) => {
    require("react-quill/dist/quill.snow.css");
    return mod;
  }),
  { ssr: false, loading: () => <div className="h-48 bg-gray-50 rounded border animate-pulse" /> }
);

interface BlogCategory {
  id: string;
  name: string;
}

interface Reply {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    role: string;
  };
  replies: Reply[];
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    thumbnail: "",
    images: [] as string[],
    intro: "",
    body: "",
    conclusion: "",
    categoryId: "",
    published: false,
  });

  // Comments and replies states
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({}); // commentId -> reply content
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/blog/posts/${id}`).then((res) => {
        if (!res.ok) throw new Error("Blog post not found");
        return res.json();
      }),
      fetch("/api/categories").then((res) => res.json().catch(() => [])), // fallback categories list
    ])
      .then(([postData, catData]) => {
        if (postData) {
          setFormData({
            title: postData.title || "",
            slug: postData.slug || "",
            thumbnail: postData.thumbnail || "",
            images: Array.isArray(postData.images) ? postData.images : [],
            intro: postData.intro || "",
            body: postData.body || "",
            conclusion: postData.conclusion || "",
            categoryId: postData.categoryId || "",
            published: postData.published || false,
          });

          // Fetch comments using slug
          if (postData.slug) {
            fetchComments(postData.slug);
          }
        }
        // Admin categories
        fetch("/api/admin/blog/categories")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setCategories(data);
          })
          .catch(() => {});
      })
      .catch((error) => {
        console.error(error);
        toast.error("Không tìm thấy bài viết");
        router.push("/tiem-nho-nth24/blog");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, router]);

  const fetchComments = async (slug: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/blog/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Real-time comments and replies listener for admin
  useEffect(() => {
    if (!id || !formData.slug) return;

    const channel = supabaseClient
      .channel(`admin-blog-interactions-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blog_comments",
        },
        async (payload) => {
          const newComment = payload.new;
          if (newComment && newComment.postId === id) {
            toast.info("💬 Có bình luận mới trên bài viết này!", {
              duration: 5000,
            });
            fetchComments(formData.slug);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blog_replies",
        },
        async (payload) => {
          const newReply = payload.new;
          if (newReply && !newReply.isAdmin) {
            fetchComments(formData.slug);
            toast.info("✉️ Có phản hồi mới từ khách hàng!", {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [id, formData.slug]);

  // Auto-generate slug from title
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
      toast.error("Upload ảnh thất bại");
      return null;
    }
    const data = await res.json();
    return data.url;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    const url = await uploadImage(file);
    if (url) {
      setFormData((prev) => ({ ...prev, thumbnail: url }));
      toast.success("Tải ảnh đại diện thành công!");
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
      toast.success(`Đã tải thêm ${uploadedUrls.length} ảnh thư viện!`);
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

  const handleReplySubmit = async (commentId: string) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;

    setSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await fetch(`/api/blog/comments/${commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        toast.success("Gửi phản hồi thành công!");
        setReplyText((prev) => ({ ...prev, [commentId]: "" }));
        // Refresh comments list
        fetchComments(formData.slug);
      } else {
        const data = await res.json();
        toast.error(data.error || "Gửi phản hồi thất bại");
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
      toast.error("Lỗi kết nối");
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [commentId]: false }));
    }
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

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Cập nhật bài viết thành công!");
        router.push("/tiem-nho-nth24/blog");
      } else {
        const err = await response.json();
        toast.error(err.error || "Lỗi khi cập nhật bài viết");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Đang tải dữ liệu bài viết...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="mb-6">
        <Link
          href="/tiem-nho-nth24/blog"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Blog
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Bài Viết</h2>
        <p className="text-sm text-gray-500">Cập nhật nội dung và quản lý bình luận khách hàng</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                Đường dẫn tĩnh: /blog/{formData.slug || "..."}
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

          {/* Hidden file inputs */}
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

          {/* Rich Text Editors stacked */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                1. Mở bài (Introduction)
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.intro}
                  onChange={(intro) => setFormData((prev) => ({ ...prev, intro }))}
                  className="h-44 mb-12"
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                2. Thân bài (Body Content)
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.body}
                  onChange={(body) => setFormData((prev) => ({ ...prev, body }))}
                  className="h-64 mb-12"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike", "blockquote"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                3. Kết bài (Conclusion)
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.conclusion}
                  onChange={(conclusion) => setFormData((prev) => ({ ...prev, conclusion }))}
                  className="h-44 mb-12"
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
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
            <div>
              <p className="font-semibold text-sm text-gray-800">
                {formData.published ? "Đã xuất bản" : "Lưu bản nháp"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formData.published
                  ? "Bài viết đang hiển thị trên trang Blog của khách hàng"
                  : "Bài viết ẩn với khách hàng, lưu trữ dưới dạng nháp"}
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
            {saving ? "Đang lưu..." : "Cập Nhật Bài Viết"}
          </button>
        </div>
      </form>

      {/* Comment Management Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <MessageSquare className="w-5 h-5 text-[#425733]" />
          <h3 className="text-lg font-bold text-gray-800">Quản lý bình luận ({comments.length})</h3>
        </div>

        {loadingComments ? (
          <p className="text-sm text-gray-400 text-center py-6">Đang tải danh sách bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có bình luận nào cho bài viết này.</p>
        ) : (
          <div className="space-y-6 divide-y divide-gray-50">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-4 first:pt-0 space-y-3">
                {/* Parent Comment */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">{comment.customer?.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 px-4 py-2.5 rounded-2xl inline-block max-w-2xl">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {/* Replies list */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-6 space-y-3 border-l-2 border-gray-100">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2.5 items-start">
                        <CornerDownRight className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-gray-800">{reply.user?.name}</span>
                            {reply.isAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-[#e3ebdd] text-[#425733] font-bold px-1.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                            <span className="text-[9px] text-gray-400">
                              {new Date(reply.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 bg-gray-50/70 px-3.5 py-2 rounded-xl inline-block max-w-xl">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="pl-6 flex gap-2 max-w-2xl">
                  <input
                    type="text"
                    value={replyText[comment.id] || ""}
                    onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                    placeholder="Viết câu trả lời của admin..."
                    className="flex-1 px-4 py-1.5 border rounded-full text-xs focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleReplySubmit(comment.id)}
                    disabled={submittingReply[comment.id] || !replyText[comment.id]?.trim()}
                    className="px-4 py-1.5 bg-[#425733] text-white rounded-full text-xs font-semibold hover:bg-[#364a29] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
                  >
                    {submittingReply[comment.id] ? "Đang gửi..." : "Trả lời"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
