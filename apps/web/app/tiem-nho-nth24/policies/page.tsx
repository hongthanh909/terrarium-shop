"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/admin/policies");
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách chính sách");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chính sách này?")) return;
    try {
      const res = await fetch(`/api/admin/policies/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Xóa chính sách thành công");
        fetchPolicies();
      } else {
        toast.error("Lỗi khi xóa chính sách");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const filtered = policies.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Chính sách</h1>
          <p className="text-gray-500 text-sm mt-1">Thêm, sửa, xóa các chính sách hiển thị trên website</p>
        </div>
        <Button asChild className="bg-[#425733] hover:bg-[#364a29]">
          <Link href="/tiem-nho-nth24/policies/create">
            <Plus className="w-4 h-4 mr-2" /> Thêm Chính sách
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chính sách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#425733]/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium rounded-l-xl">Tiêu đề</th>
                <th className="px-4 py-3 font-medium">Đường dẫn (Slug)</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Thứ tự</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right rounded-r-xl">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Đang tải...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Không tìm thấy chính sách nào
                  </td>
                </tr>
              ) : (
                filtered.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{policy.title}</td>
                    <td className="px-4 py-4 text-gray-500">{policy.slug}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {policy.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{policy.order}</td>
                    <td className="px-4 py-4">
                      {policy.isActive ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Hiển thị
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Ẩn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" asChild className="h-8 w-8 text-[#425733] border-[#c2d6b0] hover:bg-[#f0f4ee]">
                          <Link href={`/tiem-nho-nth24/policies/${policy.id}/edit`}>
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(policy.id)} className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
