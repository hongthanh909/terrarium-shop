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
import { ImageWrapper } from "@/components/ui/ImageWrapper";

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
      <div className="flex min-h-[70dvh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tier = TIER_CONFIG[profile.loyaltyTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.BRONZE;
  const nextTierPoints = tier.next;
  const progressPercent = nextTierPoints
    ? Math.min((profile.loyaltyPoints / nextTierPoints) * 100, 100)
    : 100;

  return (
    <div className="min-h-[100dvh] bg-white py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back */}
        <Link href="/" className="mb-6 inline-flex min-h-11 items-center text-sm text-gray-500 hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
        </Link>

        {/* ─── Hero Card ─────────────────────────────────────────────────────────── */}
        <div className="relative mb-6 overflow-hidden border border-foreground bg-foreground p-6 text-white shadow-sm">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-2 border-white/40 flex-shrink-0 relative">
              {profile.image ? (
                <ImageWrapper src={profile.image} alt={profile.name} fill sizes="80px" noRound className="object-cover" />
              ) : (
                profile.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{profile.name}</h1>
                <Award className="h-5 w-5 shrink-0" aria-label={`Hạng ${tier.label}`} />
              </div>
              <p className="truncate text-sm text-white/80">{profile.email}</p>
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
              className="flex min-h-11 items-center gap-1 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/20 hover:text-white"
            >
              Xem lịch sử điểm <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 border-b border-gray-200 bg-white p-1">
          {[
            { id: "info" as TabType,     label: "Thông tin",    icon: User },
            { id: "orders" as TabType,   label: "Đơn hàng",     icon: ShoppingBag },
            { id: "password" as TabType, label: "Mật khẩu",     icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex min-h-12 flex-1 items-center justify-center gap-1.5 border-b-2 px-1 py-2.5 text-sm font-semibold transition-all sm:gap-2 ${
                activeTab === id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Thông tin cá nhân ──────────────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 font-serif text-2xl font-semibold text-gray-900">Thông tin cá nhân</h2>

            {/* Avatar Upload */}
            <div className="mb-6 flex flex-col items-start gap-4 border border-border bg-muted/35 p-4 min-[380px]:flex-row min-[380px]:items-center">
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white shadow-sm">
                {profile.image ? (
                  <ImageWrapper src={profile.image} alt="Avatar" fill sizes="64px" noRound className="object-cover" />
                ) : (
                  <span className="text-xl font-bold text-foreground">{(name || "U").charAt(0).toUpperCase()}</span>
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
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted disabled:opacity-60"
                  >
                    {uploading ? "Đang tải..." : "Chọn ảnh mới"}
                  </label>
                  {profile.image && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="inline-flex min-h-11 items-center justify-center border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
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
                  autoComplete="name"
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-12 w-full border border-gray-200 px-4 py-2.5 text-base outline-none transition-all focus:border-foreground focus:ring-2 focus:ring-foreground/10"
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
                  autoComplete="email"
                  value={profile.email}
                  readOnly
                  className="min-h-12 w-full cursor-not-allowed border border-gray-200 bg-gray-50 px-4 py-2.5 text-base text-gray-500"
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
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-12 w-full border border-gray-200 px-4 py-2.5 text-base outline-none transition-all focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                  placeholder="VD: 0901234567"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                <button
                  type="button"
                  onClick={() => { useCartStore.getState().clearCart(); signOut({ callbackUrl: "/" }); }}
                  className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 min-[380px]:justify-start"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-h-12 items-center justify-center gap-2 bg-foreground px-6 py-2.5 font-semibold text-white transition-colors hover:bg-foreground/85 disabled:opacity-60"
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
          <div className="border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Đơn hàng gần đây</h2>
              <Link
                href="/orders"
                className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/70"
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
                  className="mt-3 inline-block text-sm font-medium text-foreground hover:underline"
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
                      className="group flex flex-col gap-3 border border-gray-100 p-4 transition-all hover:border-foreground/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 transition-colors group-hover:text-foreground">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="ml-auto font-bold text-foreground sm:ml-0">
                          {Number(order.total).toLocaleString("vi-VN")}₫
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-foreground" />
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
          <div className="border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 font-serif text-2xl font-semibold text-gray-900">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="min-h-12 w-full border border-gray-200 px-4 py-2.5 pr-12 text-base outline-none transition-all focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
                    aria-label={showCurrentPw ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
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
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="min-h-12 w-full border border-gray-200 px-4 py-2.5 pr-12 text-base outline-none transition-all focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                    placeholder="Ít nhất 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
                    aria-label={showNewPw ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
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
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`min-h-12 w-full border px-4 py-2.5 text-base outline-none transition-all focus:border-foreground focus:ring-2 focus:ring-foreground/10 ${
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
                className="flex min-h-12 w-full items-center justify-center gap-2 bg-foreground px-6 py-2.5 font-semibold text-white transition-colors hover:bg-foreground/85 disabled:opacity-60 sm:w-auto"
              >
                <Lock className="w-4 h-4" />
                {saving ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        )}

        {/* ─── Stats Footer ────────────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-3 sm:gap-4">
          {[
            { label: "Tổng đơn hàng", value: profile.orders.length + "+", icon: ShoppingBag },
            { label: "Điểm tích lũy",  value: profile.loyaltyPoints.toLocaleString("vi-VN"), icon: Star },
            { label: "Hạng thành viên", value: tier.label, icon: Award },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-gray-200 bg-white p-4 text-center shadow-sm">
              <Icon className="mx-auto mb-2 h-5 w-5 text-foreground" />
              <p className="text-xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
