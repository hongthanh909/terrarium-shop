"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Clock } from "lucide-react";
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
  const vnClock = useVNClock(); // Real-time VN clock
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        // ✅ Convert UTC → Giờ Việt Nam khi load
        startsAt: toVNLocalInput(campaign.startsAt),
        expiresAt: toVNLocalInput(campaign.expiresAt),
        usageLimit: campaign.usageLimit?.toString() || "",
        status: campaign.status,
        applicableTo: campaign.applicableTo,
        description: campaign.description || "",
      });
    } else {
      setEditingCampaign(null);
      // Default: thời điểm hiện tại VN
      const nowVN = toVNLocalInput(new Date());
      setFormData({ ...DEFAULT_FORM, startsAt: nowVN });
    }
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
          // ✅ Convert Giờ VN → UTC trước khi lưu DB
          startsAt: fromVNLocalInput(formData.startsAt),
          expiresAt: fromVNLocalInput(formData.expiresAt),
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
      if (res.ok) {
        showToast.success("Xóa phiếu giảm giá thành công!");
        queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      } else {
        showToast.error("Không thể xóa phiếu giảm giá");
      }
    } catch {
      showToast.error("Lỗi khi xóa phiếu giảm giá");
    } finally {
      setDeletingId(null);
    }
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
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                  >
                    <option value="PERCENTAGE">Phần Trăm (%)</option>
                    <option value="FIXED">Số Tiền Cố Định (₫)</option>
                    <option value="FREE_SHIPPING">Miễn Phí Vận Chuyển</option>
                  </select>
                </div>
                <div>
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
              <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                >
                  <option value="ALL">Tất Cả Sản Phẩm</option>
                  <option value="CATEGORIES">Danh Mục Cụ Thể</option>
                  <option value="PRODUCTS">Sản Phẩm Cụ Thể</option>
                  <option value="COMBOS">Combo Cụ Thể</option>
                </select>
              </div>

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
    </div>
  );
}
