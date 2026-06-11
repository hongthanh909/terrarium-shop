"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sprout, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#fafbf8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center group mb-4">
            <span
              className="text-4xl text-[#425733] leading-tight"
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#425733] bg-[#e3ebdd] px-2.5 py-1 rounded-full mt-4 shadow-sm">
              Admin Dashboard
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Hệ thống quản lý cửa hàng</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(66,87,51,0.08)] border border-[#e3ebdd] p-8 min-h-[350px] flex flex-col justify-center transition-all duration-300">
          {isSuccess ? (
            <div className="text-center py-6 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-green-100">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng Nhập Thành Công!</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                Chào mừng Quản trị viên trở lại hệ thống <br /><strong>tiệm Rêu Décor</strong>
              </p>
              <div className="flex items-center gap-1.5 justify-center text-xs text-[#425733] font-semibold bg-[#e3ebdd] px-3.5 py-1.5 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-ping" />
                Đang mở bảng điều khiển...
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email quản trị
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="admin-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-[#425733] focus:ring-[#425733]"
                      placeholder="admin@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#425733] focus:ring-[#425733]"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#425733] hover:bg-[#364a29] text-white font-medium rounded-full transition-colors"
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
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Chỉ dành cho quản trị viên được uỷ quyền
        </p>
      </div>
    </div>
  );
}
