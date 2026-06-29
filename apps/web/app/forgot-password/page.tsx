"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { showToast } from "@/components/ui/custom-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      showToast.error("Vui lòng nhập địa chỉ email");
      return;
    }
    setEmail(normalizedEmail);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        showToast.success(data.message || "Yêu cầu khôi phục mật khẩu đã được gửi!");
      } else {
        showToast.error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
      }
    } catch (error) {
      showToast.error("Lỗi kết nối. Vui lòng kiểm tra lại mạng.");
    } finally {
      setLoading(false);
    }
  };

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

            <AnimatePresence mode="wait">
              <motion.div
                key={isSuccess ? "success-header" : "form-header"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {isSuccess ? (
                  <>
                    <h1 className="text-xl font-bold text-gray-800 mb-1">Kiểm tra email</h1>
                    <p className="text-gray-400 text-sm">Nếu email đã đăng ký, link khôi phục sẽ được gửi</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-gray-800 mb-1">Quên mật khẩu?</h1>
                    <p className="text-gray-400 text-sm">Nhập email để nhận link đặt lại mật khẩu</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
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
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Nếu email này đã có tài khoản, hệ thống sẽ gửi link khôi phục đến
                    </p>
                    <p className="font-semibold text-gray-800 mt-1">{email}</p>
                  </div>

                  <div className="bg-[#f8faf6] border border-[#e3ebdd] rounded-xl p-4 text-left">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Vui lòng kiểm tra hộp thư và thư mục Spam. Nếu vẫn không thấy email, có thể địa chỉ này chưa được đăng ký hoặc hệ thống gửi mail đang gặp lỗi.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => { setIsSuccess(false); setEmail(""); }}
                      className="w-full py-2.5 rounded-full border-2 border-[#425733]/20 text-[#425733] text-sm font-medium hover:bg-[#425733]/5 transition-colors"
                    >
                      Thử email khác
                    </button>
                    <Link
                      href="/login"
                      className="block text-center text-sm text-[#425733] font-medium hover:text-[#364a29] transition-colors pt-1"
                    >
                      Quay lại đăng nhập
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                  onSubmit={handleSubmit}
                >
                  <div>
                    <Label htmlFor="forgot-email" className="text-gray-600 text-sm mb-1.5 block">
                      Địa chỉ email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
                        placeholder="email@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <ShimmerButton
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2"
                    size="md"
                  >
                    {loading ? "Đang gửi..." : "Gửi link khôi phục"}
                  </ShimmerButton>
                </motion.form>
              )}
            </AnimatePresence>
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
