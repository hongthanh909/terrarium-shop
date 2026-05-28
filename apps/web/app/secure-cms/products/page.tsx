"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Eye, Search, Filter, Pin, Star } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: {
    toString: () => string;
  };
  status: string;
  inventory: number;
  category: {
    id: string;
    name: string;
  };
  images: string[];
  createdAt: string;
  pinnedUntil: string | null;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const response = await fetch("/api/products?status=all");
      const data = await response.json();
      return data.products || data;
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDelete = async (id: string) => {
    // Optimistic update — remove from cache immediately
    queryClient.setQueryData(["admin-products"], (old: Product[] | undefined) =>
      old ? old.filter((p) => p.id !== id) : []
    );
    setConfirmDeleteId(null);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Xóa sản phẩm thành công!");
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      } else {
        toast.error("Không thể xóa sản phẩm");
        // Revert optimistic update
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Lỗi khi xóa sản phẩm");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    }
  };

  const handlePin = async (id: string, currentlyPinned: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pinnedUntil: currentlyPinned ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days 
        }),
      });

      if (response.ok) {
        toast.success(currentlyPinned ? "Đã bỏ ghim sản phẩm" : "Đã ghim sản phẩm trong 7 ngày");
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      } else {
        toast.error("Không thể thay đổi trạng thái ghim");
      }
    } catch (error) {
      toast.error("Lỗi khi ghim sản phẩm");
    }
  };

  const handleSetWeekly = async (id: string) => {
    try {
      const reason = prompt("Nhập lý do sản phẩm này nổi bật trong tuần (Tùy chọn):", "");
      if (reason === null) return; // User cancelled

      const response = await fetch(`/api/admin/products/${id}/weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success("Đã đặt làm Sản Phẩm Của Tuần!");
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      } else {
        toast.error("Không thể thay đổi Sản Phẩm Của Tuần");
      }
    } catch (error) {
      toast.error("Lỗi khi đặt Sản Phẩm Của Tuần");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map((p: any) => p.id));
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
    setConfirmBulkDelete(true);
  };

  const doBulkDelete = async () => {
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        toast.success(`Đã xóa ${selectedIds.length} sản phẩm thành công!`);
        setSelectedIds([]);
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      } else {
        toast.error("Không thể xóa sản phẩm");
      }
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Lỗi khi xóa sản phẩm");
    } finally {
      setConfirmBulkDelete(false);
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    
    const price = Number(product.basePrice.toString());
    const matchesMinPrice = minPrice === "" || price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === "" || price <= Number(maxPrice);
    
    return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: "bg-[#e3ebdd] text-[#364a29]",
      DRAFT: "bg-gray-100 text-gray-800",
      ARCHIVED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Sản Phẩm</h2>
          <p className="text-gray-600">Quản lý sản phẩm terrarium của bạn</p>
        </div>
        <Link
          href="/secure-cms/products/create"
          className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm Sản Phẩm Mới
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="ACTIVE">Hoạt Động</option>
              <option value="DRAFT">Bản Nháp</option>
              <option value="ARCHIVED">Đã Lưu Trữ</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Giá từ..."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-28 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Đến..."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4">
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
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải sản phẩm...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không tìm thấy sản phẩm.{" "}
            <Link href="/secure-cms/products/create" className="text-[#425733] hover:underline">
              Thêm sản phẩm đầu tiên
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản Phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh Mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đã Tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${selectedIds.includes(product.id) ? 'bg-[#f8faf7]' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => handleSelect(product.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#425733]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Không có hình
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category?.name || "Chưa phân loại"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {Number(product.basePrice.toString()).toLocaleString("vi-VN")}₫
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.inventory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(product.status)}`}>
                      {product.status === 'ACTIVE' ? 'Hoạt Động' : product.status === 'DRAFT' ? 'Bản Nháp' : product.status === 'ARCHIVED' ? 'Đã Lưu Trữ' : product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSetWeekly(product.id)}
                        className="text-amber-500 hover:text-amber-700 p-1"
                        title="Đặt làm Weekly Featured"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePin(product.id, !!product.pinnedUntil && new Date(product.pinnedUntil) > new Date())}
                        className={`p-1 ${!!product.pinnedUntil && new Date(product.pinnedUntil) > new Date() ? 'text-[#425733] fill-[#425733]' : 'text-gray-400 hover:text-[#425733]'}`}
                        title={!!product.pinnedUntil && new Date(product.pinnedUntil) > new Date() ? "Bỏ ghim" : "Ghim 7 ngày"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="text-[#425733] hover:text-[#364a29] p-1"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-[#6d8c5a] hover:text-yellow-900 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
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
      </div>

      {/* Product count */}
      <div className="mt-4 text-sm text-gray-600">
        Hiển thị {filteredProducts.length} trong tổng số {products.length} sản phẩm
      </div>

      {/* Confirm delete single */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Xóa sản phẩm"
        description="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => confirmDeleteId && doDelete(confirmDeleteId)}
      />

      {/* Confirm bulk delete */}
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Xóa ${selectedIds.length} sản phẩm`}
        description={`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tất cả"
        variant="danger"
        onConfirm={doBulkDelete}
      />
    </div>
  );
}