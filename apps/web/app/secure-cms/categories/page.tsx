"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  metaDescription: string | null;
  parentId: string | null;
  status: string;
  _count?: {
    products: number;
  };
  parent?: {
    id: string;
    name: string;
  };
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination & Bulk Actions
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    metaDescription: "",
    parentId: "",
    status: "ACTIVE",
  });

  const { data: categoriesData, isLoading: loading } = useQuery({
    queryKey: ["admin-categories", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/categories?status=all&page=${page}&limit=${limit}`);
      const data = await response.json();

      if (data.categories) {
        return {
          categories: data.categories as Category[],
          totalPages: data.pagination.totalPages || 1,
        };
      } else {
        return {
          categories: data as Category[],
          totalPages: 1,
        };
      }
    },
  });

  const categories = categoriesData?.categories ?? [];
  const parentCategories = categories.filter((c) => !c.parentId);
  const totalPages = categoriesData?.totalPages ?? 1;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      setSelectedIds([]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCategories.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} danh mục đã chọn?`)) return;

    let successCount = 0;
    let errorMessages: string[] = [];

    for (const id of selectedIds) {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (response.ok) {
        successCount++;
      } else {
        const err = await response.json();
        errorMessages.push(err.error || "Lỗi không xác định");
      }
    }

    if (successCount > 0) {
      toast.success(`Đã xóa ${successCount} danh mục thành công!`);
    }
    if (errorMessages.length > 0) {
      toast.error(errorMessages[0]);
    }

    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Tạo danh mục thành công!");
        setShowCreateModal(false);
        setFormData({ name: "", slug: "", metaDescription: "", parentId: "", status: "ACTIVE" });
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      } else {
        const err = await response.json();
        toast.error(err.error || "Không thể tạo danh mục");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Lỗi khi tạo danh mục");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        toast.success("Xóa danh mục thành công!");
      } else {
        const err = await response.json();
        toast.error(err.error || "Không thể xóa danh mục");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Lỗi khi xóa danh mục");
    }
  };

  const filteredCategories = parentCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChildCategories = (parentId: string) => {
    return categories.filter((c) => c.parentId === parentId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Danh Mục</h2>
          <p className="text-gray-600">Quản lý danh mục sản phẩm</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Danh Mục Mới
        </button>
      </div>

      {/* Search and Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-sm text-gray-600 font-medium">
              Đã chọn {selectedIds.length} mục
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Xóa đã chọn
            </button>
          </div>
        )}
      </div>

      {/* Select All Checkbox */}
      {!loading && filteredCategories.length > 0 && (
        <div className="mb-4 px-2 flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredCategories.length && filteredCategories.length > 0}
            onChange={handleSelectAll}
            className="w-5 h-5 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
          />
          <span className="text-sm font-medium text-gray-700">Chọn tất cả trên trang này</span>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải danh mục...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không tìm thấy danh mục. Nhấn &quot;Thêm Danh Mục Mới&quot; để tạo.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className={`bg-white rounded-lg shadow border-l-4 ${selectedIds.includes(category.id) ? "border-l-[#425733] bg-[#f8faf7]" : "border-l-transparent"}`}>
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(category.id)}
                    onChange={() => handleSelect(category.id)}
                    className="w-5 h-5 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.slug} &mdash; {category._count?.products || 0} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="text-[#6d8c5a] hover:text-[#5c7a4b] p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title={category._count?.products ? `Có ${category._count.products} sản phẩm` : "Xóa"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Child Categories */}
              {getChildCategories(category.id).length > 0 && (
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getChildCategories(category.id).map((child) => (
                      <div key={child.id} className="flex justify-between items-center p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium text-sm">{child.name}</div>
                          <div className="text-xs text-gray-500">
                            {child._count?.products || 0} sản phẩm
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/categories/${child.id}/edit`}
                            className="text-[#6d8c5a] hover:text-[#5c7a4b] p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-4">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trang trước
              </button>
              <span className="text-gray-600 font-medium">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trang tiếp
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Tạo Danh Mục Mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đường dẫn (slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                  placeholder="vd: thung-chai-thuy-tinh"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh Mục Cha</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                >
                  <option value="">Không (Danh mục gốc)</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô Tả (Meta)</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#425733] text-white rounded-full font-semibold hover:bg-[#364a29]"
                >
                  Tạo Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
