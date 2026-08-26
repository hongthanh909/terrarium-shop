"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { Button } from "@/components/ui/button";

export default function CreatePolicyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    type: "policy",
    order: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast.success("Tạo chính sách thành công");
        router.push("/tiem-nho-nth24/policies");
      } else {
        const error = await res.json();
        showToast.error(error.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      showToast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/đ/g, "d").replace(/Đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/\s+/g, "-");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/tiem-nho-nth24/policies"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Thêm Chính Sách Mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Tiêu đề *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) });
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50"
              placeholder="VD: Chính sách bảo hành"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Đường dẫn (Slug) *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Loại chính sách</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="policy">Chính sách chung</option>
              <option value="warranty">Bảo hành</option>
              <option value="shipping">Vận chuyển</option>
              <option value="returns">Đổi trả</option>
              <option value="privacy">Bảo mật</option>
              <option value="faq">FAQ</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Thứ tự hiển thị</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center space-x-3 pt-8">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
              Hiển thị trên website
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Nội dung * (Hỗ trợ HTML)</label>
          <textarea
            required
            rows={15}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50 font-mono"
            placeholder="<p>Nhập nội dung HTML tại đây...</p>"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-hover min-w-[120px]"
          >
            {loading ? "Đang lưu..." : <><Save className="w-4 h-4 mr-2" /> Lưu Chính Sách</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
