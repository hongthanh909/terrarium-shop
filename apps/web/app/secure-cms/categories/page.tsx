"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Edit, Trash2, Search, ChevronDown, ChevronRight,
  Package, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  metaDescription: string | null;
  parentId: string | null;
  status: string;
  _count?: { products: number };
  parent?: { id: string; name: string };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string | number;
  images: string[];
  status: string;
}

/** Accordion row: shows products when expanded */
function CategoryRow({
  category,
  selectedIds,
  onSelect,
  onDelete,
  children,
}: {
  category: Category;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = category._count?.products ?? 0;

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["category-products", category.id],
    queryFn: async () => {
      const res = await fetch(`/api/products?categoryId=${category.id}&limit=20`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.products ?? []);
    },
    enabled: expanded && count > 0,
    staleTime: 30_000,
  });

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        selectedIds.includes(category.id)
          ? "border-[#425733] shadow-md"
          : "border-gray-200 shadow-sm"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <input
          type="checkbox"
          checked={selectedIds.includes(category.id)}
          onChange={() => onSelect(category.id)}
          className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733] flex-shrink-0"
        />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          disabled={count === 0}
          className="flex items-center gap-3 flex-1 text-left disabled:cursor-default"
        >
          <div className="w-7 h-7 rounded-lg bg-[#f5f7f4] flex items-center justify-center flex-shrink-0">
            {count > 0 ? (
              expanded ? (
                <ChevronDown className="w-4 h-4 text-[#425733]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )
            ) : (
              <Package className="w-3.5 h-3.5 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800">{category.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="text-[#425733]/60 font-mono">{category.slug}</span>
              {" · "}
              <span className={count > 0 ? "text-[#425733] font-semibold" : "text-gray-400"}>
                {count} sản phẩm
              </span>
              {category.status === "ACTIVE" ? (
                <span className="ml-2 inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-semibold">Đang hiện</span>
              ) : (
                <span className="ml-2 inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">Ẩn</span>
              )}
            </p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/secure-cms/categories/${category.id}/edit`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#425733] hover:bg-[#e3ebdd] transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <Link
            href={`/products?category=${category.slug}`}
            target="_blank"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title="Xem trên cửa hàng"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onDelete(category.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title={count > 0 ? `Có ${count} sản phẩm` : "Xóa"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subcategories */}
      {children && <div className="border-t border-dashed border-gray-100 bg-gray-50/50 px-5 py-3">{children}</div>}

      {/* Products accordion */}
      {expanded && count > 0 && (
        <div className="border-t border-gray-100 bg-[#f9fbf8]">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
              Đang tải sản phẩm...
            </div>
          ) : products && products.length > 0 ? (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Sản phẩm trong danh mục ({products.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:border-[#425733]/40 hover:shadow-md transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-[#f5f7f4]">
                      {p.images?.[0] ? (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="150px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${p.status === "ACTIVE" ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>
                    {/* Info + actions */}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-tight mb-1">{p.name}</p>
                      <p className="text-xs text-[#425733] font-bold">
                        {Number(p.basePrice).toLocaleString("vi-VN")}₫
                      </p>
                      <Link
                        href={`/secure-cms/products/${p.id}/edit`}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-semibold text-[#425733] py-1 rounded-lg bg-[#e3ebdd] hover:bg-[#c8d5be] transition-colors"
                      >
                        <Edit className="w-3 h-3" /> Sửa
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <Link
                  href={`/secure-cms/products?categoryId=${category.id}`}
                  className="text-xs text-[#425733] hover:underline font-medium"
                >
                  Xem tất cả trong Products →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">Không có sản phẩm</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
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
      const res = await fetch(`/api/categories?status=all&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (data.categories) {
        return { categories: data.categories as Category[], totalPages: data.pagination?.totalPages || 1 };
      }
      return { categories: data as Category[], totalPages: 1 };
    },
  });

  const categories = categoriesData?.categories ?? [];
  const parentCategories = categories.filter((c) => !c.parentId);
  const totalPages = categoriesData?.totalPages ?? 1;

  const filteredCategories = parentCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const handleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedIds(e.target.checked ? filteredCategories.map((c) => c.id) : []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa danh mục");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } else {
      const err = await res.json();
      toast.error(err.error || "Không thể xóa");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Xóa ${selectedIds.length} danh mục đã chọn?`)) return;
    let ok = 0;
    for (const id of selectedIds) {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) ok++;
    }
    if (ok) toast.success(`Đã xóa ${ok} danh mục`);
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  // Auto-slug
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      toast.success("Tạo danh mục thành công!");
      setShowCreateModal(false);
      setFormData({ name: "", slug: "", metaDescription: "", parentId: "", status: "ACTIVE" });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } else {
      const err = await res.json();
      toast.error(err.error || "Không thể tạo danh mục");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Danh Mục</h2>
          <p className="text-sm text-gray-500 mt-0.5">Nhấn vào danh mục để xem sản phẩm bên trong</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#425733] text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow hover:-translate-y-0.5 hover:bg-[#364a29] transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục Mới
        </button>
      </div>

      {/* Search + Bulk */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30"
          />
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Xóa {selectedIds.length} mục
          </button>
        )}
      </div>

      {/* Select all */}
      {!loading && filteredCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredCategories.length && filteredCategories.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
          />
          <span className="text-sm text-gray-500">Chọn tất cả ({filteredCategories.length})</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
          Đang tải...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy danh mục. Nhấn &quot;Thêm Danh Mục Mới&quot; để tạo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((cat) => {
            const children = getChildren(cat.id);
            return (
              <CategoryRow
                key={cat.id}
                category={cat}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onDelete={handleDelete}
              >
                {children.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Danh mục con</p>
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{child.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{child._count?.products ?? 0} sp</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/secure-cms/categories/${child.id}/edit`} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#425733] hover:bg-[#e3ebdd] transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDelete(child.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CategoryRow>
            );
          })}

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
                ← Trang trước
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 font-medium">Trang {page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Trang tiếp →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Tạo Danh Mục Mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="VD: Bể Cây Nhỏ"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn (slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="be-cay-nho"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                >
                  <option value="">Không (Danh mục gốc)</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#425733] text-white rounded-full text-sm font-semibold hover:bg-[#364a29] transition-colors">
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
