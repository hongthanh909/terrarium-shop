"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["admin-blog-posts", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/blog/posts?page=${page}&limit=${limit}`);
      const data = await response.json();
      if (data.posts) {
        return {
          posts: data.posts as BlogPost[],
          totalPages: data.pagination.totalPages || 1,
        };
      } else {
        return {
          posts: data as BlogPost[],
          totalPages: 1,
        };
      }
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/blog/categories");
      return response.json();
    },
  });

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 1;
  const loading = postsLoading || categoriesLoading;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("XĂ³a bĂ i viáº¿t thĂ nh cĂ´ng!");
        queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Lá»—i khi xĂ³a bĂ i viáº¿t");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Äang táº£i...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay Láº¡i Admin
        </Link>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">BĂ i Viáº¿t Blog</h2>
          <Link
            href="/admin/blog/create"
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29]"
          >
            <Plus className="w-5 h-5" />
            BĂ i Viáº¿t Má»›i
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TiĂªu Äá»</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Má»¥c</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tráº¡ng ThĂ¡i</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xuáº¥t Báº£n</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">HĂ nh Äá»™ng</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{post.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {post.category?.name || "ChÆ°a phĂ¢n loáº¡i"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      post.published
                        ? "bg-[#e3ebdd] text-[#364a29]"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {post.published ? "ÄĂ£ Xuáº¥t Báº£n" : "Báº£n NhĂ¡p"}
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
                  ChÆ°a cĂ³ bĂ i viáº¿t. Nháº¥n "BĂ i Viáº¿t Má»›i" Ä‘á»ƒ táº¡o má»™t bĂ i viáº¿t.
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
              Trang trÆ°á»›c
            </button>
            <span className="text-gray-600 font-medium">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-white bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trang tiáº¿p
            </button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Danh Má»¥c Blog</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {categories.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{cat.name}</span>
                <Link
                  href={`/admin/blog/categories/${cat.id}/edit`}
                  className="text-[#425733] hover:text-blue-800 text-sm"
                >
                  Chá»‰nh sá»­a
                </Link>
              </div>
            ))}
            <Link
              href="/admin/blog/categories/new"
              className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#6d8c5a] hover:text-[#425733]"
            >
              <Plus className="w-4 h-4 mr-2" />
              ThĂªm Danh Má»¥c
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
