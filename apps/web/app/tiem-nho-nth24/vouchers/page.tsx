"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Clock, Copy, Download, KeyRound, RefreshCw } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/custom-toast";

// ─── Helpers: Vietnam Timezone (UTC+7) ─────────────────────────────────────
// datetime-local input cần format "YYYY-MM-DDTHH:mm" theo local time
// Supabase lưu UTC → cần convert 2 chiều

const VN_OFFSET = 7 * 60; // phút

/** Chuyển Date → "YYYY-MM-DDTHH:mm" theo giờ Việt Nam */
function toVNLocalInput(date: Date | string): string {
  const d = new Date(date);
  const vnMs = d.getTime() + VN_OFFSET * 60_000;
  const vnDate = new Date(vnMs);
  return vnDate.toISOString().slice(0, 16);
}

/** Chuyển "YYYY-MM-DDTHH:mm" (giờ VN) → ISO UTC string để lưu DB */
function fromVNLocalInput(localStr: string): string {
  // localStr là giờ VN, trừ 7 tiếng để ra UTC
  const utcMs = new Date(localStr).getTime() - VN_OFFSET * 60_000;
  return new Date(utcMs).toISOString();
}

/** Hiển thị giờ VN realtime "HH:mm:ss" */
function useVNClock() {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return clock;
}


interface DiscountCampaign {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  startsAt: string;
  expiresAt: string;
  usageLimit: number | null;
  usageCount: number;
  status: string;
  applicableTo: string;
  description: string | null;
  applicables?: { id: string; targetType: string; targetId: string }[];
}

interface DiscountCode {
  id: string;
  code: string;
  status: "ACTIVE" | "USED" | "DISABLED";
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  images: string[];
  basePrice: string;
  category: { name: string };
}

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "Phần Trăm (%)",
  FIXED: "Số Tiền Cố Định (₫)",
  FREE_SHIPPING: "Miễn Phí Vận Chuyển",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Hoạt Động",
  INACTIVE: "Không Hoạt Động",
  EXPIRED: "Đã Hết Hạn",
  SOLD_OUT: "Đã Hết",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-[#e3ebdd] text-[#364a29]",
  INACTIVE: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-red-100 text-red-800",
  SOLD_OUT: "bg-yellow-100 text-yellow-800",
};

const APPLICABLE_LABELS: Record<string, string> = {
  ALL: "Tất Cả Sản Phẩm",
  CATEGORIES: "Danh Mục Cụ Thể",
  PRODUCTS: "Sản Phẩm Cụ Thể",
  COMBOS: "Combo Cụ Thể",
};

const DEFAULT_FORM = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  status: "INACTIVE",
  applicableTo: "ALL",
  description: "",
};

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const vnClock = useVNClock();
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [codeCampaign, setCodeCampaign] = useState<DiscountCampaign | null>(null);
  const [privateCodes, setPrivateCodes] = useState<DiscountCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesSubmitting, setCodesSubmitting] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [codeForm, setCodeForm] = useState({ quantity: "10", prefix: "", length: "8", usageLimit: "1" });

  // ─ Data for applicable targeting ───────────────────────────────────
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Fetch categories & products on mount
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(data => {
      setAllCategories(Array.isArray(data) ? data : []);
    }).catch(() => {});
    fetch("/api/products?limit=200").then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : (data.products || []);
      setAllProducts(list);
    }).catch(() => {});
  }, []);

  const { data: campaigns = [], isLoading: loading } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: async () => {
      const res = await fetch("/api/discount-campaigns");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DiscountCampaign | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });

  const handleOpenModal = (campaign?: DiscountCampaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        code: campaign.code,
        type: campaign.type,
        value: campaign.value.toString(),
        minOrderAmount: campaign.minOrderAmount?.toString() || "",
        maxDiscountAmount: campaign.maxDiscountAmount?.toString() || "",
        startsAt: toVNLocalInput(campaign.startsAt),
        expiresAt: toVNLocalInput(campaign.expiresAt),
        usageLimit: campaign.usageLimit?.toString() || "",
        status: campaign.status,
        applicableTo: campaign.applicableTo,
        description: campaign.description || "",
      });
      // Restore selected applicables
      const catIds = (campaign.applicables || []).filter(a => a.targetType === "CATEGORY").map(a => a.targetId);
      const prodIds = (campaign.applicables || []).filter(a => a.targetType === "PRODUCT").map(a => a.targetId);
      setSelectedCategoryIds(catIds);
      setSelectedProductIds(prodIds);
    } else {
      setEditingCampaign(null);
      const nowVN = toVNLocalInput(new Date());
      setFormData({ ...DEFAULT_FORM, startsAt: nowVN });
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
    }
    setProductSearch("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCampaign(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingCampaign
        ? `/api/discount-campaigns/${editingCampaign.id}`
        : "/api/discount-campaigns";
      const method = editingCampaign ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startsAt: fromVNLocalInput(formData.startsAt),
          expiresAt: fromVNLocalInput(formData.expiresAt),
          applicableCategories: formData.applicableTo === "CATEGORIES" ? selectedCategoryIds : [],
          applicableProducts: formData.applicableTo === "PRODUCTS" ? selectedProductIds : [],
        }),
      });

      if (res.ok) {
        showToast.success(editingCampaign ? "Cập nhật phiếu giảm giá thành công!" : "Tạo phiếu giảm giá thành công!");
        handleCloseModal();
        queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      } else {
        const err = await res.json();
        showToast.error(err.error || "Không thể lưu phiếu giảm giá");
      }
    } catch {
      showToast.error("Lỗi khi lưu phiếu giảm giá");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu giảm giá này?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/discount-campaigns/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast.success(
          data.archived
            ? "Voucher đã được lưu trữ và ẩn khỏi danh sách vì đã có lịch sử đơn hàng."
            : "Xóa phiếu giảm giá thành công!"
        );
        queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      } else {
        showToast.error(data.error || "Không thể xóa phiếu giảm giá");
      }
    } catch {
      showToast.error("Lỗi khi xóa phiếu giảm giá");
    } finally {
      setDeletingId(null);
    }
  };

  const loadPrivateCodes = async (campaignId: string) => {
    setCodesLoading(true);
    try {
      const res = await fetch(`/api/discount-campaigns/${campaignId}/codes`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải mã riêng");
      setPrivateCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Không thể tải mã riêng");
    } finally {
      setCodesLoading(false);
    }
  };

  const handleOpenCodes = (campaign: DiscountCampaign) => {
    setCodeCampaign(campaign);
    setCodeForm({
      quantity: "10",
      prefix: campaign.code.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase(),
      length: "8",
      usageLimit: "1",
    });
    setPrivateCodes([]);
    setShowCodesModal(true);
    void loadPrivateCodes(campaign.id);
  };

  const handleGenerateCodes = async () => {
    if (!codeCampaign) return;
    setCodesSubmitting(true);
    try {
      const res = await fetch(`/api/discount-campaigns/${codeCampaign.id}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(codeForm.quantity),
          prefix: codeForm.prefix,
          length: Number(codeForm.length),
          usageLimit: Number(codeForm.usageLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo mã riêng");
      setPrivateCodes((current) => [...(data.codes || []), ...current]);
      showToast.success(`Đã tạo ${data.codes?.length || 0} mã riêng`);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Không thể tạo mã riêng");
    } finally {
      setCodesSubmitting(false);
    }
  };

  const handleToggleCode = async (code: DiscountCode) => {
    if (!codeCampaign) return;
    const nextStatus = code.status === "DISABLED" ? "ACTIVE" : "DISABLED";
    setCodesSubmitting(true);
    try {
      const res = await fetch(`/api/discount-campaigns/${codeCampaign.id}/codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật mã riêng");
      setPrivateCodes((current) => current.map((item) => item.id === code.id ? data : item));
      showToast.success(nextStatus === "ACTIVE" ? "Đã mở lại mã" : "Đã khóa mã");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Không thể cập nhật mã riêng");
    } finally {
      setCodesSubmitting(false);
    }
  };

  const handleDeleteCode = async (code: DiscountCode) => {
    if (!codeCampaign || !confirm(`Xóa mã ${code.code}?`)) return;
    setCodesSubmitting(true);
    try {
      const res = await fetch(`/api/discount-campaigns/${codeCampaign.id}/codes/${code.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể xóa mã riêng");
      setPrivateCodes((current) => current.filter((item) => item.id !== code.id));
      showToast.success("Đã xóa mã riêng");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Không thể xóa mã riêng");
    } finally {
      setCodesSubmitting(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast.success("Đã sao chép mã");
    } catch {
      showToast.error("Không thể sao chép mã");
    }
  };

  const handleDownloadCodes = () => {
    if (!codeCampaign || privateCodes.length === 0) return;
    const csv = [
      "code,status,usageCount,usageLimit",
      ...privateCodes.map((code) => `${code.code},${code.status},${code.usageCount},${code.usageLimit ?? ""}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${codeCampaign.code.toLowerCase()}-codes.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
        <div className="w-5 h-5 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
        Đang tải...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/tiem-nho-nth24" className="inline-flex items-center text-[#425733] hover:underline mb-4 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay Lại Admin
        </Link>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Phiếu Giảm Giá</h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#364a29] transition-all"
          >
            <Plus className="w-5 h-5" />
            Phiếu Giảm Giá Mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá Trị</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời Gian</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sử Dụng</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((c: DiscountCampaign) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono font-semibold text-gray-800">{c.code}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {TYPE_LABELS[c.type] || c.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700">
                  {c.type === "PERCENTAGE"
                    ? `${c.value}%`
                    : c.type === "FIXED"
                    ? `${Number(c.value).toLocaleString("vi-VN")}₫`
                    : "Miễn phí ship"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(c.startsAt).toLocaleDateString("vi-VN")} – {new Date(c.expiresAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleOpenCodes(c)}
                      disabled={deletingId !== null}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#425733] hover:bg-[#e3ebdd] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Quản lý mã riêng"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(c)}
                      disabled={deletingId !== null}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#425733] hover:bg-[#e3ebdd] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId !== null}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Xóa"
                    >
                      {deletingId === c.id
                        ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <Plus className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>Chưa có phiếu giảm giá. Nhấn &quot;Phiếu Giảm Giá Mới&quot; để tạo.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCampaign ? "Chỉnh Sửa Phiếu Giảm Giá" : "Phiếu Giảm Giá Mới"}
                </h3>
                {/* Real-time Vietnam clock */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-[#425733]" />
                  <span className="text-xs text-gray-500 font-mono">
                    🇻🇳 Giờ VN: <span className="text-[#425733] font-semibold">{vnClock}</span>
                  </span>
                </div>
              </div>
              <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Mã Phiếu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã Phiếu *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30"
                  placeholder="SAVE10"
                />
              </div>

              {/* Loại & Giá Trị */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        type: newType,
                        // Auto-set value for FREE_SHIPPING
                        value: newType === "FREE_SHIPPING" ? "30000" : formData.value === "30000" || formData.value === "50000" ? "" : formData.value,
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                  >
                    <option value="PERCENTAGE">Phần Trăm (%)</option>
                    <option value="FIXED">Số Tiền Cố Định (₫)</option>
                    <option value="FREE_SHIPPING">Miễn Phí Vận Chuyển</option>
                  </select>
                </div>
                <div>
                  {formData.type === "FREE_SHIPPING" ? (
                    <>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Áp dụng cho loại ship *</label>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.value === "30000" ? "border-[#425733] bg-[#f6faf4]" : "border-gray-200 hover:border-[#425733]/40"
                        }`}>
                          <input
                            type="radio"
                            name="shippingType"
                            checked={formData.value === "30000"}
                            onChange={() => setFormData({ ...formData, value: "30000" })}
                            className="w-4 h-4 accent-[#425733]"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">Giao Hàng Tiêu Chuẩn</p>
                            <p className="text-[10px] text-gray-400">3-5 ngày làm việc • 30.000₫</p>
                          </div>
                        </label>
                        <label className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.value === "50000" ? "border-[#425733] bg-[#f6faf4]" : "border-gray-200 hover:border-[#425733]/40"
                        }`}>
                          <input
                            type="radio"
                            name="shippingType"
                            checked={formData.value === "50000"}
                            onChange={() => setFormData({ ...formData, value: "50000" })}
                            className="w-4 h-4 accent-[#425733]"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">Giao Hàng Nhanh</p>
                            <p className="text-[10px] text-gray-400">1-2 ngày làm việc • 50.000₫</p>
                          </div>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá Trị *</label>
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30"
                        placeholder={formData.type === "PERCENTAGE" ? "10" : "50000"}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Ngày Bắt Đầu & Kết Thúc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Ngày Bắt Đầu * <span className="text-[10px] text-[#425733] font-normal">(Giờ VN)</span>
                  </label>
                  <input
                    type="datetime-local"
                    lang="en-GB"
                    step="60"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Ngày Kết Thúc * <span className="text-[10px] text-[#425733] font-normal">(Giờ VN)</span>
                  </label>
                  <input
                    type="datetime-local"
                    lang="en-GB"
                    step="60"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                  />
                </div>
              </div>

              {/* Đơn Hàng Tối Thiểu & Giảm Tối Đa */}
              <div className={`grid ${formData.type === "FREE_SHIPPING" ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đơn Hàng Tối Thiểu (₫)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                    placeholder="500000"
                  />
                </div>
                {formData.type !== "FREE_SHIPPING" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giảm Tối Đa (₫)</label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                      placeholder="100000"
                    />
                  </div>
                )}
              </div>

              {/* Giới Hạn & Trạng Thái */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giới Hạn Sử Dụng</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                    placeholder="Không giới hạn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng Thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                  >
                    <option value="ACTIVE">Hoạt Động</option>
                    <option value="INACTIVE">Không Hoạt Động</option>
                  </select>
                </div>
              </div>

              {/* Áp Dụng Cho */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Áp Dụng Cho</label>
                <select
                  value={formData.applicableTo}
                  onChange={(e) => {
                    setFormData({ ...formData, applicableTo: e.target.value });
                    setSelectedCategoryIds([]);
                    setSelectedProductIds([]);
                    setProductSearch("");
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                >
                  <option value="ALL">Tất Cả Sản Phẩm</option>
                  <option value="CATEGORIES">Danh Mục Cụ Thể</option>
                  <option value="PRODUCTS">Sản Phẩm Cụ Thể</option>
                  <option value="COMBOS">Combo Cụ Thể</option>
                </select>
              </div>

              {/* Category selector */}
              {formData.applicableTo === "CATEGORIES" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn Danh Mục</label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryIds(prev =>
                              isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            isSelected
                              ? "bg-[#425733] text-white border-[#425733]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#425733]/50"
                          }`}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedCategoryIds.length > 0 && (
                    <p className="text-xs text-[#425733] mt-1.5 font-medium">Đã chọn {selectedCategoryIds.length} danh mục</p>
                  )}
                </div>
              )}

              {/* Product selector */}
              {formData.applicableTo === "PRODUCTS" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn Sản Phẩm</label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 mb-2"
                  />
                  <div className="max-h-[200px] overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2">
                    {allProducts
                      .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map(p => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected ? "bg-[#f6faf4] border border-[#425733]/30" : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedProductIds(prev =>
                                  isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                );
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#425733] accent-[#425733] flex-shrink-0"
                            />
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{p.category?.name} • {Number(p.basePrice).toLocaleString("vi-VN")}₫</p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                  {selectedProductIds.length > 0 && (
                    <p className="text-xs text-[#425733] mt-1.5 font-medium">Đã chọn {selectedProductIds.length} sản phẩm</p>
                  )}
                </div>
              )}

              {/* Mô Tả */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô Tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50 resize-none"
                  placeholder="Mô tả tùy chọn..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#364a29] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                    : <><Save className="w-4 h-4" /> Lưu Phiếu Giảm Giá</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCodesModal && codeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Mã riêng của {codeCampaign.code}</h3>
                <p className="mt-1 text-xs text-gray-500">Mỗi mã có thể gửi cho một khách hàng và theo dõi lượt dùng riêng.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCodesModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="text-sm font-semibold text-gray-700">
                  Số lượng
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={codeForm.quantity}
                    onChange={(e) => setCodeForm({ ...codeForm, quantity: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal focus:border-[#425733]/50 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Tiền tố
                  <input
                    type="text"
                    maxLength={12}
                    value={codeForm.prefix}
                    onChange={(e) => setCodeForm({ ...codeForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="VIP"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal uppercase focus:border-[#425733]/50 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Độ dài ngẫu nhiên
                  <input
                    type="number"
                    min="4"
                    max="24"
                    value={codeForm.length}
                    onChange={(e) => setCodeForm({ ...codeForm, length: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal focus:border-[#425733]/50 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Lượt dùng / mã
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={codeForm.usageLimit}
                    onChange={(e) => setCodeForm({ ...codeForm, usageLimit: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal focus:border-[#425733]/50 focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleGenerateCodes}
                  disabled={codesSubmitting}
                  className="flex min-h-10 items-center gap-2 rounded-xl bg-[#425733] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#364a29] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {codesSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tạo mã ngẫu nhiên
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCodes}
                  disabled={privateCodes.length === 0}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  Tải CSV
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                {codesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải mã...
                  </div>
                ) : privateCodes.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Chưa có mã riêng. Hãy tạo lô mã đầu tiên.</div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Mã</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Lượt dùng</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {privateCodes.map((code) => (
                          <tr key={code.id}>
                            <td className="px-4 py-3 font-mono font-semibold text-gray-800">{code.code}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                code.status === "ACTIVE"
                                  ? "bg-green-50 text-green-700"
                                  : code.status === "USED"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {code.status === "ACTIVE" ? "Đang hoạt động" : code.status === "USED" ? "Đã dùng" : "Đã khóa"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {code.usageCount}{code.usageLimit ? ` / ${code.usageLimit}` : ""}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handleCopyCode(code.code)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#e3ebdd] hover:text-[#425733]"
                                  title="Sao chép mã"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleCode(code)}
                                  disabled={codesSubmitting || code.status === "USED"}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {code.status === "DISABLED" ? "Mở" : "Khóa"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteCode(code)}
                                  disabled={codesSubmitting || code.usageCount > 0 || code.status === "USED"}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Xóa mã chưa dùng"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
