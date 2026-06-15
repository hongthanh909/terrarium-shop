"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { showToast } from "@/components/ui/custom-toast";

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: "Yếu", color: "bg-red-400" };
    if (score <= 2) return { level: 2, label: "Trung bình", color: "bg-amber-400" };
    if (score <= 3) return { level: 3, label: "Khá", color: "bg-[#8fba6f]" };
    return { level: 4, label: "Mạnh", color: "bg-[#425733]" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.level ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${
        strength.level <= 1 ? "text-red-500" :
        strength.level <= 2 ? "text-amber-500" :
        "text-[#425733]"
      }`}>
        {strength.label}
      </p>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If no token is provided in the URL
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 space-y-4"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Liên kết không hợp lệ</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Không tìm thấy mã khôi phục. Vui lòng kiểm tra lại đường dẫn trong email.
        </p>
        <Link href="/forgot-password" className="block w-full mt-2">
          <ShimmerButton type="button" className="w-full" size="md">
            Yêu cầu link mới
          </ShimmerButton>
        </Link>
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showToast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        showToast.success(data.message);
      } else {
        showToast.error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
      }
    } catch (error) {
      showToast.error("Lỗi kết nối. Vui lòng kiểm tra lại mạng.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center space-y-4 py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-8 h-8 text-[#425733]" />
        </motion.div>

        <div>
          <h3 className="text-lg font-bold text-gray-800">Đổi mật khẩu thành công!</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Mật khẩu đã được cập nhật. Đăng nhập bằng mật khẩu mới.
          </p>
        </div>

        <Link href="/login" className="block w-full mt-2">
          <ShimmerButton type="button" className="w-full" size="md">
            Đi đến trang đăng nhập
          </ShimmerButton>
        </Link>
      </motion.div>
    );
  }

  const passwordMismatch = confirmPassword && confirmPassword !== newPassword;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* New Password */}
      <div>
        <Label htmlFor="new-password" className="text-gray-600 text-sm mb-1.5 block">
          Mật khẩu mới
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
            placeholder="Ít nhất 6 ký tự"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PasswordStrength password={newPassword} />
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirm-password" className="text-gray-600 text-sm mb-1.5 block">
          Xác nhận mật khẩu
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none transition-all ${
              passwordMismatch
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)]"
            }`}
            placeholder="Nhập lại mật khẩu mới"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <AnimatePresence>
          {passwordMismatch && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 text-xs text-red-500"
            >
              Mật khẩu xác nhận không khớp
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <ShimmerButton
        type="submit"
        disabled={loading || !!passwordMismatch}
        className="w-full mt-2"
        size="md"
      >
        {loading ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
      </ShimmerButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#dce5d5] via-[#e8efe2] to-[#f0f4ee]">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 -left-24 w-[420px] h-[420px] rounded-full blur-[100px] opacity-40"
          style={{ background: "radial-gradient(circle, #b5cda3 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 -right-24 w-[360px] h-[360px] rounded-full blur-[100px] opacity-30"
          style={{ background: "radial-gradient(circle, #8ba57a 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[#425733]/60 hover:text-[#425733] mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(66,87,51,0.12)]"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 text-center">
            <Link href="/" className="inline-flex flex-col items-center group mb-4">
              <span
                className="text-2xl text-[#425733] group-hover:text-[#364a29] transition-colors leading-tight"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-6 h-px bg-[#8ba57a]" />
                <span
                  className="text-[9px] tracking-wider text-[#5f7d50] whitespace-nowrap"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
                >
                  Terrarium &amp; Moss Art
                </span>
                <div className="w-6 h-px bg-[#8ba57a]" />
              </div>
            </Link>

            <h1 className="text-xl font-bold text-gray-800 mb-1">Đặt lại mật khẩu</h1>
            <p className="text-gray-400 text-sm">Tạo mật khẩu mới cho tài khoản của bạn</p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-[#425733] border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>

            <div className="mt-5 flex items-center justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#425733] font-medium hover:text-[#364a29] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Bảo mật bởi Tiệm Rêu Décor
        </p>
      </div>
    </main>
  );
}
