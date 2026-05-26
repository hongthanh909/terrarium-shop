"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

export default function AdminVouchersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: campaigns = [], isLoading: loading } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: async () => {
      const response = await fetch("/api/discount-campaigns");
      return response.json();
    },
  });
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DiscountCampaign | null>(null);

  const [formData, setFormData] = useState({
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
  });

  const handleOpenModal = (campaign?: DiscountCampaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        code: campaign.code,
        type: campaign.type,
        value: campaign.value.toString(),
        minOrderAmount: campaign.minOrderAmount?.toString() || "",
        maxDiscountAmount: campaign.maxDiscountAmount?.toString() || "",
        startsAt: new Date(campaign.startsAt).toISOString().slice(0, 16),
        expiresAt: new Date(campaign.expiresAt).toISOString().slice(0, 16),
        usageLimit: campaign.usageLimit?.toString() || "",
        status: campaign.status,
        applicableTo: campaign.applicableTo,
        description: campaign.description || "",
      });
    } else {
      setEditingCampaign(null);
      setFormData({
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
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCampaign(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCampaign
        ? `/api/discount-campaigns/${editingCampaign.id}`
        : "/api/discount-campaigns";

      const method = editingCampaign ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingCampaign ? "Cáº­p nháº­t phiáº¿u giáº£m giĂ¡!" : "Táº¡o phiáº¿u giáº£m giĂ¡!");
        handleCloseModal();
        queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      } else {
        const error = await response.json();
        toast.error(error.error || "KhĂ´ng thá»ƒ lÆ°u phiáº¿u giáº£m giĂ¡");
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("Lá»—i khi lÆ°u phiáº¿u giáº£m giĂ¡");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/discount-campaigns/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("XĂ³a phiáº¿u giáº£m giĂ¡ thĂ nh cĂ´ng!");
        queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      } else {
        toast.error("KhĂ´ng thá»ƒ xĂ³a phiáº¿u giáº£m giĂ¡");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Lá»—i khi xĂ³a phiáº¿u giáº£m giĂ¡");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-[#e3ebdd] text-[#364a29]";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "SOLD_OUT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "PERCENTAGE":
        return "Pháº§n TrÄƒm";
      case "FIXED":
        return "Sá»‘ Tiá»n Cá»‘ Äá»‹nh";
      case "FREE_SHIPPING":
        return "Miá»…n PhĂ­ Váº­n Chuyá»ƒn";
      default:
        return type;
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
          <h2 className="text-3xl font-bold text-gray-800">Phiáº¿u Giáº£m GiĂ¡</h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29]"
          >
            <Plus className="w-5 h-5" />
            Phiáº¿u Giáº£m GiĂ¡ Má»›i
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MĂ£</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loáº¡i</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GiĂ¡ Trá»‹</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tráº¡ng ThĂ¡i</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thá»i Gian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sá»­ Dá»¥ng</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">HĂ nh Äá»™ng</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map((campaign: any) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{campaign.code}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                    {getTypeLabel(campaign.type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {campaign.type === "PERCENTAGE"
                    ? `${campaign.value}%`
                    : campaign.type === "FIXED"
                    ? `${Number(campaign.value).toLocaleString("vi-VN")}â‚«`
                    : "Miá»…n PhĂ­ Váº­n Chuyá»ƒn"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status === 'ACTIVE' ? 'Hoáº¡t Äá»™ng' : campaign.status === 'INACTIVE' ? 'KhĂ´ng Hoáº¡t Äá»™ng' : campaign.status === 'EXPIRED' ? 'ÄĂ£ Háº¿t Háº¡n' : campaign.status === 'SOLD_OUT' ? 'ÄĂ£ Háº¿t' : campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(campaign.startsAt).toLocaleDateString()} - {new Date(campaign.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {campaign.usageCount}
                  {campaign.usageLimit && ` / ${campaign.usageLimit}`}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(campaign)}
                      className="text-[#425733] hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  ChÆ°a cĂ³ phiáº¿u giáº£m giĂ¡. Nháº¥n "Phiáº¿u Giáº£m GiĂ¡ Má»›i" Ä‘á»ƒ táº¡o.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={handleCloseModal} />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-4 right-4">
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-4">{editingCampaign ? "Chá»‰nh Sá»­a Phiáº¿u Giáº£m GiĂ¡" : "Phiáº¿u Giáº£m GiĂ¡ Má»›i"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">MĂ£ Phiáº¿u *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    placeholder="SAVE10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Loáº¡i *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    >
                      <option value="PERCENTAGE">Pháº§n TrÄƒm (%)</option>
                      <option value="FIXED">Sá»‘ Tiá»n Cá»‘ Äá»‹nh (â‚«)</option>
                      <option value="FREE_SHIPPING">Miá»…n PhĂ­ Váº­n Chuyá»ƒn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">GiĂ¡ Trá»‹ *</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                      placeholder={formData.type === "PERCENTAGE" ? "10" : "50000"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">NgĂ y Báº¯t Äáº§u *</label>
                    <input
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">NgĂ y Káº¿t ThĂºc *</label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ÄÆ¡n HĂ ng Tá»‘i Thiá»ƒu (â‚«)</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Giáº£m Tá»‘i Äa (â‚«)</label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                      placeholder="100000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá»›i Háº¡n Sá»­ Dá»¥ng</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      min="1"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                      placeholder="KhĂ´ng giá»›i háº¡n"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tráº¡ng ThĂ¡i</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    >
                      <option value="ACTIVE">Hoáº¡t Äá»™ng</option>
                      <option value="INACTIVE">KhĂ´ng Hoáº¡t Äá»™ng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ăp Dá»¥ng Cho</label>
                  <select
                    value={formData.applicableTo}
                    onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                  >
                    <option value="ALL">Táº¥t Cáº£ Sáº£n Pháº©m</option>
                    <option value="CATEGORIES">Danh Má»¥c Cá»¥ Thá»ƒ</option>
                    <option value="PRODUCTS">Sáº£n Pháº©m Cá»¥ Thá»ƒ</option>
                    <option value="COMBOS">Combo Cá»¥ Thá»ƒ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">MĂ´ Táº£</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    placeholder="MĂ´ táº£ tĂ¹y chá»n..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Há»§y
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#425733] text-white px-4 py-2 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,87,51,0.3)] hover:bg-[#364a29]"
                  >
                    <Save className="w-4 h-4" />
                    LÆ°u Phiáº¿u Giáº£m GiĂ¡
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
