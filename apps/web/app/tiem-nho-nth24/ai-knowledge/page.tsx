"use client";

import { useState, useEffect, useCallback } from "react";
import { showToast } from "@/components/ui/custom-toast";
import { Brain, Plus, Pencil, Trash2, Save, X, Search, ToggleLeft, ToggleRight } from "lucide-react";

interface AiEntry {
  id: string;
  keyword: string;
  response: string;
  category: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "general", label: "Chung" },
  { value: "care", label: "Chăm sóc" },
  { value: "shipping", label: "Vận chuyển" },
  { value: "policy", label: "Chính sách" },
  { value: "product", label: "Sản phẩm" },
  { value: "greeting", label: "Chào hỏi" },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  care: "bg-green-100 text-green-700",
  shipping: "bg-blue-100 text-blue-700",
  policy: "bg-purple-100 text-purple-700",
  product: "bg-orange-100 text-orange-700",
  greeting: "bg-pink-100 text-pink-700",
};

export default function AiKnowledgePage() {
  const [entries, setEntries] = useState<AiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    keyword: "",
    response: "",
    category: "general",
    priority: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-knowledge");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      showToast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const resetForm = () => {
    setForm({ keyword: "", response: "", category: "general", priority: 0, isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (entry: AiEntry) => {
    setForm({
      keyword: entry.keyword,
      response: entry.response,
      category: entry.category,
      priority: entry.priority,
      isActive: entry.isActive,
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.response.trim()) {
      showToast.error("Vui lòng nhập từ khóa và nội dung trả lời");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...form, id: editingId } : form;
      const res = await fetch("/api/admin/ai-knowledge", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast.success(editingId ? "Đã cập nhật" : "Đã thêm mới");
        resetForm();
        fetchEntries();
      } else {
        const data = await res.json();
        showToast.error(data.error || "Có lỗi xảy ra");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    if (!confirm(`Xóa kiến thức "${keyword}"?`)) return;
    try {
      const res = await fetch(`/api/admin/ai-knowledge?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast.success("Đã xóa");
        fetchEntries();
      } else {
        showToast.error("Lỗi xóa");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    }
  };

  const toggleActive = async (entry: AiEntry) => {
    try {
      const res = await fetch("/api/admin/ai-knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, isActive: !entry.isActive }),
      });
      if (res.ok) {
        showToast.success(entry.isActive ? "Đã tắt" : "Đã bật");
        fetchEntries();
      }
    } catch {
      showToast.error("Lỗi");
    }
  };

  const filtered = entries.filter((e) => {
    const matchSearch = !search || e.keyword.includes(search.toLowerCase()) || e.response.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || e.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kiến thức AI</h1>
            <p className="text-sm text-gray-500">
              Quản lý nội dung chatbot khi AI offline • {entries.length} mục
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#425733] text-white rounded-xl hover:bg-[#364a29] transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm kiến thức
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo từ khóa hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none text-sm bg-white"
        >
          <option value="all">Tất cả danh mục</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border-2 border-[#6d8c5a]/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{editingId ? "Sửa kiến thức" : "Thêm kiến thức mới"}</h2>
            <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Từ khóa *</label>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  placeholder="Ví dụ: chăm sóc, tưới nước..."
                  className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Sẽ tự chuyển thành chữ thường</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none text-sm bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none text-sm"
                  min={0}
                  max={100}
                />
                <p className="text-xs text-gray-400 mt-1">Số cao = ưu tiên trả lời trước</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nội dung trả lời *</label>
              <textarea
                value={form.response}
                onChange={(e) => setForm({ ...form, response: e.target.value })}
                placeholder="Hỗ trợ emoji và markdown. Ví dụ:&#10;🌿 Chăm sóc terrarium:&#10;• Đặt nơi có ánh sáng gián tiếp&#10;• Tưới nước 1-2 tuần/lần"
                rows={5}
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:outline-none text-sm font-mono"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#425733] focus:ring-[#6d8c5a]"
                />
                <span className="text-sm">Kích hoạt</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#425733] text-white rounded-xl hover:bg-[#364a29] disabled:bg-gray-300 text-sm font-medium"
                >
                  <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{entries.length === 0 ? "Chưa có kiến thức nào. Bấm \"Thêm kiến thức\" để bắt đầu." : "Không tìm thấy kết quả phù hợp."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${!entry.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">
                      &quot;{entry.keyword}&quot;
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.general}`}>
                      {CATEGORIES.find((c) => c.value === entry.category)?.label || entry.category}
                    </span>
                    {entry.priority > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        ⚡ {entry.priority}
                      </span>
                    )}
                    {!entry.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                        Đã tắt
                      </span>
                    )}
                  </div>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed line-clamp-4">
                    {entry.response}
                  </pre>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(entry)}
                    title={entry.isActive ? "Tắt" : "Bật"}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {entry.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-600" />
                      : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => startEdit(entry)}
                    title="Sửa"
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id, entry.keyword)}
                    title="Xóa"
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
