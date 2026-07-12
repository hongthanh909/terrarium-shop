"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { showToast } from "@/components/ui/custom-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isVerifying = Boolean(verificationEmail);

  const requestCode = async (targetEmail?: string | null) => {
    const normalizedEmail = (targetEmail || email).trim().toLowerCase();
    if (!normalizedEmail) {
      const message = "Vui lòng nhập địa chỉ email";
      setErrorMessage(message);
      showToast.error(message);
      return;
    }

    setEmail(normalizedEmail);
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Có lỗi xảy ra, vui lòng thử lại";
        setErrorMessage(message);
        showToast.error(message);
        return;
      }

      setVerificationEmail(data.email || normalizedEmail);
      setVerificationCode("");
      showToast.success(data.message || "Đã gửi mã xác minh!");
    } catch (error) {
      const message = "Lỗi kết nối. Vui lòng kiểm tra lại mạng.";
      setErrorMessage(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationEmail) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Mã xác minh không hợp lệ";
        setErrorMessage(message);
        showToast.error(message);
        return;
      }

      showToast.success(data.message || "Xác minh thành công");
      router.push(`/reset-password?token=${encodeURIComponent(data.token)}`);
    } catch (error) {
      const message = "Lỗi kết nối. Vui lòng kiểm tra lại mạng.";
      setErrorMessage(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) {
      await verifyCode();
    } else {
      await requestCode();
    }
  };

  return (
    <main className="min-h-[100dvh] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#dce5d5] via-[#e8efe2] to-[#f0f4ee]">
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

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(66,87,51,0.12)]"
        >
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
                key={isVerifying ? "verify-header" : "form-header"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-800 mb-1">
                  {isVerifying ? "Xác minh email" : "Quên mật khẩu?"}
                </h1>
                <p className="text-gray-400 text-sm">
                  {isVerifying
                    ? `Nhập mã 6 số đã gửi đến ${verificationEmail}`
                    : "Nhập email đã đăng ký để nhận mã đặt lại mật khẩu"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-8 py-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {isVerifying ? (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <Label htmlFor="reset-code" className="text-gray-600 text-sm mb-1.5 block">
                        Mã xác minh
                      </Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          id="reset-code"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          required
                          value={verificationCode}
                          onChange={(e) => {
                            setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                            setErrorMessage(null);
                          }}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
                          placeholder="123456"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => requestCode(verificationEmail)}
                      disabled={loading}
                      className="w-full text-xs text-[#425733] hover:text-[#364a29] font-medium disabled:opacity-60"
                    >
                      Gửi lại mã xác minh
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
                        placeholder="email@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ShimmerButton
                type="submit"
                disabled={loading}
                className="w-full mt-2"
                size="md"
              >
                {loading ? "Đang xử lý..." : isVerifying ? "Xác minh mã" : "Gửi mã xác minh"}
              </ShimmerButton>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">
                {isVerifying ? "Sai email?" : "Đã nhớ mật khẩu?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => {
                  if (isVerifying) {
                    setVerificationEmail(null);
                    setVerificationCode("");
                    setErrorMessage(null);
                  } else {
                    router.push("/login");
                  }
                }}
                className="text-[#425733] font-semibold hover:text-[#364a29] transition-colors"
              >
                {isVerifying ? "Sửa thông tin" : "Đăng nhập"}
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Bảo mật bởi Tiệm Rêu Décor
        </p>
      </div>
    </main>
  );
}
