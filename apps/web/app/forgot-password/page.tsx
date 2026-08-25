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
    <div className="flex min-h-[calc(100dvh-7rem)] items-center justify-center bg-white py-8 sm:py-10">
      <div className="w-full max-w-md px-4">
        <Link
          href="/login"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden border border-border bg-white shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
        >
          <div className="border-b border-gray-100 px-5 pb-6 pt-7 text-center sm:px-8 sm:pt-8">
            <Link href="/" className="inline-flex flex-col items-center group mb-4">
              <span
                className="text-2xl leading-tight text-foreground transition-colors group-hover:text-foreground/70"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-px w-6 bg-border" />
                <span
                  className="whitespace-nowrap text-xs text-muted-foreground"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
                >
                  Terrarium &amp; Moss Art
                </span>
                <div className="h-px w-6 bg-border" />
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
                <h1 className="mb-1 font-serif text-2xl font-semibold text-gray-900">
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

          <div className="px-5 py-6 sm:px-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
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
                          className="min-h-12 w-full rounded-none border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-base text-gray-800 transition-colors placeholder:text-gray-400 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                          placeholder="123456"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => requestCode(verificationEmail)}
                      disabled={loading}
                      className="min-h-11 w-full text-xs font-medium text-foreground hover:text-foreground/70 disabled:opacity-60"
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
                        inputMode="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="min-h-12 w-full rounded-none border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-base text-gray-800 transition-colors placeholder:text-gray-400 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
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
                className="inline-flex min-h-11 items-center font-semibold text-foreground transition-colors hover:text-foreground/70"
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
    </div>
  );
}
