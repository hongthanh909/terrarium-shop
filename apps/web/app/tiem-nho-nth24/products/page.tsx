"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { Plus, Edit, Trash2, Eye, Search, Filter, Pin, Star, Flame, Zap } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: {
    toString: () => string;
  };
  salePrice?: { toString: () => string } | string | number | null;
  saleEndDate?: string | null;
  status: string;
  inventory: number;
  category: {
    id: string;
    name: string;
  };
  images: string[];
  createdAt: string;
  pinnedUntil: string | null;
  featured?: boolean;
}

const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const toNumber = (value: Product["salePrice"] | Product["basePrice"]) => {
  if (value == null) return null;
  const numberValue = Number(value.toString());
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getProductPriceSummary = (product: Product) => {
  const basePrice = toNumber(product.basePrice) ?? 0;
  const salePrice = toNumber(product.salePrice);
  const saleIsActive =
    salePrice != null &&
    salePrice > 0 &&
    salePrice < basePrice &&
    (!product.saleEndDate || new Date(product.saleEndDate) > new Date());
  const currentPrice = saleIsActive ? salePrice : basePrice;
  const discountPercent =
    saleIsActive && basePrice > 0
      ? Math.round(((basePrice - salePrice) / basePrice) * 100)
      : 0;

  return { basePrice, currentPrice, saleIsActive, discountPercent };
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: loading, error } = useQuery<Product[], Error>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const response = await fetch("/api/products?status=all&limit=500&nocache=true");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể tải danh sách sản phẩm.");
      }
      const data = await response.json();
      return Array.isArray(data.products) ? data.products : [];
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDelete = async (id: string) => {
    // Optimistic update — remove from cache immediately
    queryClient.setQueryData(["admin-products"], (old: Product[] | undefined) =>
      old ? old.filter((p) => p.id !== id) : []
    );
    setConfirmDeleteId(null);
    setActionLoading(true);

    const promise = async () => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Không thể xóa sản phẩm");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    };

    try {
      await promise();
      showToast.success("Xóa sản phẩm thành công!");
    } catch (err: any) {
      showToast.error("Đã xảy ra lỗi");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePin = async (id: string, currentlyPinned: boolean) => {
    setActionLoading(true);
    const promise = async () => {
      const response = await fetch(`/api/admin/products/${id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pinnedUntil: currentlyPinned ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days 
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể ghim/bỏ ghim sản phẩm");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    };

    try {
      await promise();
      showToast.success("Thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi thay đổi ghim sản phẩm");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetWeekly = async (id: string) => {
    const reason = prompt("Nhập lý do sản phẩm này nổi bật trong tuần (Tùy chọn):", "");
    if (reason === null) return; // User cancelled

    setActionLoading(true);
    const promise = async () => {
      const response = await fetch(`/api/admin/products/${id}/weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error("Không thể đặt làm Sản Phẩm Của Tuần");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    };

    try {
      await promise();
      showToast.success("Đã đặt làm Sản Phẩm Của Tuần thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi đặt Sản Phẩm Của Tuần");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    setActionLoading(true);
    const promise = async () => {
      const response = await fetch(`/api/admin/products/${id}/featured`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          featured: !currentlyFeatured
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái nổi bật");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    };

    try {
      await promise();
      showToast.success("Thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi thay đổi trạng thái nổi bật");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshCreatedAt = async (id: string, name: string) => {
    if (!confirm(`Đẩy sản phẩm "${name}" lên đầu mục "Mới Rời Xưởng"?\nHành động này sẽ cập nhật ngày tạo sản phẩm về thời điểm hiện tại.`)) return;

    setActionLoading(true);
    const promise = async () => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          createdAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật ngày tạo sản phẩm");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    };

    try {
      await promise();
      showToast.success("Đã đẩy sản phẩm lên mục Mới thành công! 🆕");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi cập nhật ngày tạo sản phẩm");
    } finally {
      setActionLoading(false);
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
    setConfirmBulkDelete(false);
    setActionLoading(true);

    const promise = async () => {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error("Không thể xóa các sản phẩm đã chọn");
      }

      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    };

    try {
      await promise();
      showToast.success("Thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi xóa các sản phẩm");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    
    const price = getProductPriceSummary(product).currentPrice;
    const matchesMinPrice = minPrice === "" || price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === "" || price <= Number(maxPrice);
    
    return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-800",
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
          href="/tiem-nho-nth24/products/create"
          className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
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
              className="w-full rounded-md border py-2 pl-10 pr-4 focus:ring-2 focus:ring-gray-950/15"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border px-4 py-2 focus:ring-2 focus:ring-gray-950/15"
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
              className="w-28 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-950/15"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Đến..."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-950/15"
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
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-medium">
            ⚠️ Lỗi tải dữ liệu: {error.message || "Không thể tải danh sách sản phẩm. Vui lòng tải lại trang."}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không tìm thấy sản phẩm.{" "}
            <Link href="/tiem-nho-nth24/products/create" className="text-gray-950 hover:underline">
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
                    disabled={actionLoading}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
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
                      disabled={actionLoading}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded">
                        {product.images.length > 0 ? (
                          <ImageWrapper
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
                    {(() => {
                      const price = getProductPriceSummary(product);

                      return (
                        <div className="flex flex-col items-start gap-1 tabular-nums">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-950">
                              {formatPrice(price.currentPrice)}
                            </span>
                            {price.saleIsActive && (
                              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                -{price.discountPercent}%
                              </span>
                            )}
                          </div>
                          {price.saleIsActive && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span>Gốc</span>
                              <span className="line-through decoration-red-400">
                                {formatPrice(price.basePrice)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                        onClick={() => handleToggleFeatured(product.id, !!product.featured)}
                        disabled={actionLoading}
                        className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed ${product.featured ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        title={product.featured ? "Bỏ nổi bật" : "Đặt làm Nổi bật"}
                      >
                        <Flame className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRefreshCreatedAt(product.id, product.name)}
                        disabled={actionLoading}
                        className="text-blue-500 hover:text-blue-700 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Đẩy lên mục Mới rời xưởng"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSetWeekly(product.id)}
                        disabled={actionLoading}
                        className="text-amber-500 hover:text-amber-700 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Đặt làm Weekly Featured"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePin(product.id, !!product.pinnedUntil && new Date(product.pinnedUntil) > new Date())}
                        disabled={actionLoading}
                        className={`p-1 disabled:cursor-not-allowed disabled:opacity-30 ${!!product.pinnedUntil && new Date(product.pinnedUntil) > new Date() ? 'fill-primary text-primary' : 'text-gray-400 hover:text-primary'}`}
                        title={!!product.pinnedUntil && new Date(product.pinnedUntil) > new Date() ? "Bỏ ghim" : "Ghim 7 ngày"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="p-1 text-gray-600 hover:text-gray-950"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/tiem-nho-nth24/products/${product.id}/edit`}
                        className="p-1 text-amber-600 hover:text-amber-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-900 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
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
