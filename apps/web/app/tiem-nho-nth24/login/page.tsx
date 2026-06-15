"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("admin-login", {
        email,
        password,
        redirect: false,
      });

      if (!result) {
        // signIn returned undefined — likely a critical server error / timeout
        setError("Không thể kết nối tới máy chủ. Vui lòng thử lại sau vài giây.");
        setLoading(false);
        return;
      }

      if (result.error) {
        // Map NextAuth errors to friendly messages
        if (
          result.error.includes("không có quyền") ||
          result.error.includes("không được phép") ||
          result.error.includes("không thể đăng nhập")
        ) {
          setError("Tài khoản này không có quyền truy cập trang quản trị.");
        } else if (
          result.error.includes("không tồn tại") ||
          result.error.includes("không đúng") ||
          result.error.includes("không chính xác")
        ) {
          setError("Email hoặc mật khẩu không chính xác.");
        } else if (result.error === "CredentialsSignin") {
          setError("Email hoặc mật khẩu không chính xác.");
        } else {
          setError(result.error || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
        setLoading(false);
        return;
      }

      if (result.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          // Navigate to admin dashboard using window.location.href to force a hard reload.
          // This ensures cookies are updated and the layout is re-rendered fresh.
          window.location.href = "/tiem-nho-nth24";
        }, 1500);
      }
    } catch (err: any) {
      if (err?.message?.includes("ECHECKOUTTIMEOUT") || err?.message?.includes("timeout")) {
        setError("Kết nối cơ sở dữ liệu bị quá tải. Vui lòng thử lại sau vài giây.");
      } else {
        setError("Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.");
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#dce5d5] via-[#e8efe2] to-[#f0f4ee] px-4 py-12">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-35"
          style={{ background: "radial-gradient(circle, #a8c098 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/3 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-25"
          style={{ background: "radial-gradient(circle, #8ba57a 0%, transparent 70%)" }}
        />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #425733 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(66,87,51,0.12)]"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 text-center">
            <Link href="/" className="inline-flex flex-col items-center group mb-3">
              <span
                className="text-3xl text-[#425733] group-hover:text-[#364a29] transition-colors leading-tight"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-8 h-px bg-[#8ba57a]" />
                <span
                  className="text-[10px] tracking-wider text-[#5f7d50] whitespace-nowrap"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
                >
                  Terrarium &amp; Moss Art
                </span>
                <div className="w-8 h-px bg-[#8ba57a]" />
              </div>
            </Link>

            {/* Admin Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#e3ebdd] px-3 py-1 rounded-full mt-3">
              <ShieldCheck className="w-3 h-3 text-[#425733]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#425733]">
                Admin Dashboard
              </span>
            </div>

            <p className="text-sm text-gray-400 mt-3">Hệ thống quản lý cửa hàng</p>
          </div>

          {/* Body */}
          <div className="px-8 py-6 min-h-[280px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-center py-4 flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                    className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mb-6 border border-[#d0dcc6]"
                  >
                    <CheckCircle2 className="w-10 h-10 text-[#425733]" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Đăng nhập thành công!</h2>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto mb-5">
                    Chào mừng Quản trị viên trở lại
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-[#425733] font-semibold bg-[#e3ebdd] px-4 py-2 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#8fba6f] animate-pulse" />
                    Đang mở bảng điều khiển...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <Label htmlFor="admin-email" className="text-gray-600 text-sm mb-1.5 block">
                        Email quản trị
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          id="admin-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
                          placeholder="admin@tiemreudecor.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <Label htmlFor="admin-password" className="text-gray-600 text-sm mb-1.5 block">
                        Mật khẩu
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(""); }}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
                          placeholder="••••••••"
                          autoComplete="current-password"
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
                    </div>

                    {/* Submit */}
                    <ShimmerButton
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2"
                      size="md"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Đang đăng nhập...
                        </span>
                      ) : (
                        "Đăng nhập"
                      )}
                    </ShimmerButton>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-gray-400">
            Chỉ dành cho quản trị viên được uỷ quyền
          </p>
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-300">
            <ShieldCheck className="w-3 h-3" />
            <span>Khu vực bảo mật</span>
          </div>
        </div>
      </div>
    </main>
  );
}
