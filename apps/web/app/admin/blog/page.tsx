"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  category: {
    name: string;
  } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchBlogData();
  }, []);

  const fetchBlogData = async (pageNum = page) => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/blog/posts?page=${pageNum}&limit=${limit}`),
        fetch("/api/admin/blog/categories"),
      ]);
      const [postsData, categoriesData] = await Promise.all([
        postsRes.json(),
        categoriesRes.json(),
      ]);
      
      if (postsData.posts) {
        setPosts(postsData.posts);
        setTotalPages(postsData.pagination.totalPages || 1);
      } else {
        setPosts(postsData);
        setTotalPages(1);
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching blog data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Xóa bài viết thành công!");
        fetchBlogData();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Lỗi khi xóa bài viết");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchBlogData(newPage);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay Lại Admin
        </Link>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Bài Viết Blog</h2>
          <Link
            href="/admin/blog/create"
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29]"
          >
            <Plus className="w-5 h-5" />
            Bài Viết Mới
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu Đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xuất Bản</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{post.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {post.category?.name || "Chưa phân loại"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      post.published
                        ? "bg-[#e3ebdd] text-[#364a29]"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {post.published ? "Đã Xuất Bản" : "Bản Nháp"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-[#425733] hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Chưa có bài viết. Nhấn "Bài Viết Mới" để tạo một bài viết.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-4 border-t bg-gray-50">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-white bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trang trước
            </button>
            <span className="text-gray-600 font-medium">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-white bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trang tiếp
            </button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Danh Mục Blog</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{cat.name}</span>
                <Link
                  href={`/admin/blog/categories/${cat.id}/edit`}
                  className="text-[#425733] hover:text-blue-800 text-sm"
                >
                  Chỉnh sửa
                </Link>
              </div>
            ))}
            <Link
              href="/admin/blog/categories/new"
              className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#6d8c5a] hover:text-[#425733]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Danh Mục
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}