"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3ebdd] to-[#f5f7f4]">
        <div className="w-10 h-10 border-4 border-[#425733] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <AuthPage />
    </Suspense>
  );
}

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "", phone: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleRegister = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, password: formData.password, name: formData.name, phone: formData.phone || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
    const signInResult = await signIn("customer-login", { email: formData.email, password: formData.password, redirect: false });
    if (signInResult?.error) throw new Error("Đăng ký thành công nhưng đăng nhập tự động thất bại.");
  };

  const handleLogin = async () => {
    const result = await signIn("customer-login", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      // NextAuth v4: lỗi credentials luôn là "CredentialsSignin"
      // Message thực từ authorize() bị ẩn vì lý do bảo mật
      // Hiện thị message chung, không để lộ lý do cụ thể
      throw new Error("Email hoặc mật khẩu không đúng. Nếu bạn là quản trị viên, vui lòng dùng trang đăng nhập riêng.");
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await handleLogin();
        // Sau login, session chứa role — nếu là ADMIN thì về admin panel
        // (admin bị chặn ở server, nên flow này chỉ xảy ra với CUSTOMER)
        router.push(callbackUrl === "/" ? "/" : callbackUrl);
      } else {
        await handleRegister();
        router.push(callbackUrl);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#dce5d5] via-[#e8efe2] to-[#f0f4ee]">
      {/* Soft background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full blur-[100px] opacity-40"
          style={{ background: "radial-gradient(circle, #b5cda3 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-30"
          style={{ background: "radial-gradient(circle, #8ba57a 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#425733]/60 hover:text-[#425733] mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(66,87,51,0.12)]"
        >
          {/* Header — Logo from navbar */}
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
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-800 mb-1">
                  {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
                </h1>
                <p className="text-gray-400 text-sm">
                  {isLogin ? "Đăng nhập để tiếp tục mua sắm" : "Tham gia cùng cộng đồng Rêu Décor"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <LightField icon={<User className="w-4 h-4" />} label="Họ và tên" id="name" name="name" placeholder="Nguyễn Văn A" value={formData.name} onChange={handleInputChange} required={!isLogin} />
                    <LightField icon={<Phone className="w-4 h-4" />} label="Số điện thoại (tuỳ chọn)" id="phone" name="phone" type="tel" placeholder="0912 345 678" value={formData.phone} onChange={handleInputChange} />
                  </motion.div>
                )}
              </AnimatePresence>

              <LightField icon={<Mail className="w-4 h-4" />} label="Email" id="email" name="email" type="email" placeholder="email@example.com" value={formData.email} onChange={handleInputChange} required />

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="password" className="text-gray-600 text-sm">Mật khẩu</Label>
                  {isLogin && (
                    <Link href="/forgot-password" className="text-xs text-[#425733] hover:text-[#364a29] transition-colors font-medium">
                      Quên mật khẩu?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={isLogin ? 1 : 6}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30 transition-all"
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

              <ShimmerButton
                type="submit"
                disabled={loading}
                className="w-full mt-2"
                size="md"
              >
                {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              </ShimmerButton>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-[#425733] font-semibold hover:text-[#364a29] transition-colors"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function LightField({ icon, label, id, ...inputProps }: {
  icon: React.ReactNode;
  label: string;
  id: string;
  [key: string]: any;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-gray-600 text-sm mb-1.5 block">{label}</Label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">{icon}</span>
        <input
          id={id}
          {...inputProps}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/30 transition-all"
        />
      </div>
    </div>
  );
}
