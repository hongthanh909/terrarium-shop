"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Phone, Star, Award, ShoppingBag,
  Lock, LogOut, ChevronRight, Save, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";
import { useCartStore } from "@/lib/store/cartStore";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  createdAt: string;
  orders: Order[];
}

const TIER_CONFIG = {
  BRONZE:   { label: "Đồng",   color: "from-amber-600 to-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", icon: "🥉", next: 500 },
  SILVER:   { label: "Bạc",    color: "from-slate-400 to-slate-300",   bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200", icon: "🥈", next: 1500 },
  GOLD:     { label: "Vàng",   color: "from-yellow-500 to-yellow-300", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: "🥇", next: 3000 },
  PLATINUM: { label: "Bạch kim", color: "from-violet-500 to-purple-400", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "💎", next: null },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Chờ xử lý",  color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:  { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
  SHIPPING:   { label: "Đang giao",  color: "bg-indigo-100 text-indigo-800" },
  DELIVERED:  { label: "Đã giao",    color: "bg-green-100 text-green-800" },
  CANCELLED:  { label: "Đã hủy",     color: "bg-red-100 text-red-800" },
};

type TabType = "info" | "password" | "orders";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  const { data: profile = null, isLoading: loading } = useQuery<ProfileData | null>({
    queryKey: ["customer-profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setName(data.name || "");
      setPhone(data.phone || "");
      return data;
    },
    enabled: status === "authenticated",
  });

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || null }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
        await updateSession({ name });
        showToast.success("Cập nhật thông tin thành công!");
      } else {
        const err = await res.json();
        showToast.error(err.error || "Cập nhật thất bại");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-password", currentPassword, newPassword }),
      });
      if (res.ok) {
        showToast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setTimeout(() => {
          useCartStore.getState().clearCart();
          signOut({ callbackUrl: "/login" });
        }, 2000);
      } else {
        const err = await res.json();
        showToast.error(err.error || "Đổi mật khẩu thất bại");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Tải ảnh lên thất bại");
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (profileRes.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
        await updateSession({ image: imageUrl });
        showToast.success("Cập nhật ảnh đại diện thành công! 📸");
      } else {
        const err = await profileRes.json();
        showToast.error(err.error || "Lưu ảnh thất bại");
      }
    } catch (err: any) {
      showToast.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setUploading(true);
    try {
      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });

      if (profileRes.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
        await updateSession({ image: null });
        showToast.success("Đã xóa ảnh đại diện");
      } else {
        const err = await profileRes.json();
        showToast.error(err.error || "Không thể xóa ảnh");
      }
    } catch {
      showToast.error("Lỗi kết nối");
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#425733] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const tier = TIER_CONFIG[profile.loyaltyTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.BRONZE;
  const nextTierPoints = tier.next;
  const progressPercent = nextTierPoints
    ? Math.min((profile.loyaltyPoints / nextTierPoints) * 100, 100)
    : 100;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back */}
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-[#425733] mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
        </Link>

        {/* ─── Hero Card ─────────────────────────────────────────────────────────── */}
        <div className={`relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-r ${tier.color} p-6 text-white shadow-lg`}>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-2 border-white/40 flex-shrink-0 relative">
              {profile.image ? (
                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{profile.name}</h1>
                <span className="text-xl">{tier.icon}</span>
              </div>
              <p className="text-white/80 text-sm">{profile.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                  {tier.label}
                </span>
                <span className="text-white/80 text-sm">
                  {profile.loyaltyPoints.toLocaleString("vi-VN")} điểm
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {nextTierPoints && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{profile.loyaltyPoints} điểm</span>
                <span>Cần {nextTierPoints} điểm để lên hạng</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
            <Link 
              href="/profile/points" 
              className="text-sm text-white/90 hover:text-white flex items-center gap-1 font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full"
            >
              Xem lịch sử điểm <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm">
          {[
            { id: "info" as TabType,     label: "Thông tin",    icon: User },
            { id: "orders" as TabType,   label: "Đơn hàng",     icon: ShoppingBag },
            { id: "password" as TabType, label: "Mật khẩu",     icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? "bg-[#425733] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Thông tin cá nhân ──────────────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Thông tin cá nhân</h2>

            {/* Avatar Upload */}
            <div className="flex items-center gap-4 p-4 bg-[#f8faf6] border border-[#e3ebdd] rounded-2xl mb-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#425733]/20 bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                {profile.image ? (
                  <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#425733] text-xl font-bold">{(name || "U").charAt(0).toUpperCase()}</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ảnh đại diện</p>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-[#c8d5be] text-[#425733] bg-white cursor-pointer hover:bg-[#e3ebdd] hover:border-[#425733]/40 transition-colors disabled:opacity-60"
                  >
                    {uploading ? "Đang tải..." : "Chọn ảnh mới"}
                  </label>
                  {profile.image && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateInfo} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:border-transparent outline-none transition-all"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
              </div>
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:border-transparent outline-none transition-all"
                  placeholder="VD: 0901234567"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { useCartStore.getState().clearCart(); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#364a29] disabled:opacity-60 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Tab: Đơn hàng gần đây ───────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Đơn hàng gần đây</h2>
              <Link
                href="/orders"
                className="text-sm text-[#425733] hover:text-[#364a29] font-medium flex items-center gap-1"
              >
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {profile.orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Bạn chưa có đơn hàng nào</p>
                <Link
                  href="/products"
                  className="mt-3 inline-block text-sm text-[#425733] font-medium hover:underline"
                >
                  Khám phá sản phẩm →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.orders.map((order) => {
                  const s = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#6d8c5a] hover:shadow-sm transition-all group"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-[#425733] transition-colors">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="font-bold text-[#425733]">
                          {Number(order.total).toLocaleString("vi-VN")}₫
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#425733] transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Đổi mật khẩu ───────────────────────────────────────────────── */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:border-transparent outline-none transition-all"
                    placeholder="Ít nhất 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#6d8c5a] focus:border-transparent outline-none transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Nhập lại mật khẩu mới"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Mật khẩu xác nhận không khớp</p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving || (!!confirmPassword && confirmPassword !== newPassword)}
                className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#364a29] disabled:opacity-60 transition-all"
              >
                <Lock className="w-4 h-4" />
                {saving ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        )}

        {/* ─── Stats Footer ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: "Tổng đơn hàng", value: profile.orders.length + "+", icon: "📦" },
            { label: "Điểm tích lũy",  value: profile.loyaltyPoints.toLocaleString("vi-VN"), icon: "⭐" },
            { label: "Hạng thành viên", value: tier.label, icon: tier.icon },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
