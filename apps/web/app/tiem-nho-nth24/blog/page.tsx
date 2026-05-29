"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: { name: string } | null;
}

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["admin-blog-posts", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/blog/posts?page=${page}&limit=${limit}`);
      const data = await response.json();
      if (data.posts) {
        return {
          posts: data.posts as BlogPost[],
          totalPages: data.pagination?.totalPages || 1,
        };
      }
      return { posts: [] as BlogPost[], totalPages: 1 };
    },
  });

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 1;

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Xóa bài viết thành công!");
        queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      } else {
        const err = await response.json();
        toast.error(err.error || "Không thể xóa bài viết");
      }
    } catch {
      toast.error("Lỗi khi xóa bài viết");
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });
      if (response.ok) {
        toast.success(post.published ? "Đã chuyển sang bản nháp" : "Đã xuất bản bài viết!");
        queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      } else {
        const err = await response.json();
        toast.error(err.error || "Không thể cập nhật trạng thái");
      }
    } catch {
      toast.error("Lỗi khi cập nhật");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Bài Viết Blog</h2>
          <p className="text-gray-500">Quản lý nội dung blog</p>
        </div>
        <Link
          href="/tiem-nho-nth24/blog/create"
          className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#364a29] transition-all"
        >
          <Plus className="w-5 h-5" />
          Bài Viết Mới
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Đang tải...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-3">Chưa có bài viết nào.</p>
            <Link href="/tiem-nho-nth24/blog/create" className="text-[#425733] underline">
              Tạo bài viết đầu tiên →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu Đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Tạo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{post.title}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">/blog/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {post.category?.name || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        post.published
                          ? "bg-[#e3ebdd] text-[#364a29] hover:bg-[#d5e3cc]"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={post.published ? "Nhấn để chuyển sang bản nháp" : "Nhấn để xuất bản"}
                    >
                      {post.published ? (
                        <><Eye className="w-3 h-3" /> Đã Xuất Bản</>
                      ) : (
                        <><EyeOff className="w-3 h-3" /> Bản Nháp</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {post.published && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Xem bài viết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/tiem-nho-nth24/blog/${post.id}/edit`}
                        className="text-[#425733] hover:text-[#364a29] p-1"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-4 border-t bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
            >
              Trang trước
            </button>
            <span className="text-gray-600 font-medium">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
            >
              Trang tiếp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
