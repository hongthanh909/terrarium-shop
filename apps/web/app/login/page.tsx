"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#0d1f0d]">
        <div className="w-10 h-10 border-4 border-[#425733] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <AuthPage />
    </Suspense>
  );
}

function FloatingLeaf({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none opacity-20"
      style={style}
      animate={{ y: [0, -20, 0], rotate: [0, 10, -5, 0] }}
      transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
    >
      🌿
    </motion.div>
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
    const result = await signIn("customer-login", { email: formData.email, password: formData.password, redirect: false });
    if (result?.error) {
      const errorMap: Record<string, string> = {
        CredentialsSignin: "Email hoặc mật khẩu không đúng",
      };
      throw new Error(errorMap[result.error] || "Đăng nhập thất bại");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) await handleLogin(); else await handleRegister();
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1a0a] via-[#0d2010] to-[#111a0d]">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(66,87,51,0.4) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(109,140,90,0.3) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Floating leaves */}
      <FloatingLeaf style={{ top: "10%", left: "8%" }} />
      <FloatingLeaf style={{ top: "70%", left: "5%" }} />
      <FloatingLeaf style={{ top: "20%", right: "10%" }} />
      <FloatingLeaf style={{ top: "80%", right: "8%" }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#425733]/40 border border-[#425733]/50 mb-4">
              <Leaf className="w-7 h-7 text-[#8fba6f]" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold text-white mb-1">
                  {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
                </h1>
                <p className="text-white/50 text-sm">
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
                    className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm text-center"
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
                    <GlassField icon={<User className="w-4 h-4" />} label="Họ và tên" id="name" name="name" placeholder="Nguyễn Văn A" value={formData.name} onChange={handleInputChange} required={!isLogin} />
                    <GlassField icon={<Phone className="w-4 h-4" />} label="Số điện thoại (tuỳ chọn)" id="phone" name="phone" type="tel" placeholder="0912 345 678" value={formData.phone} onChange={handleInputChange} />
                  </motion.div>
                )}
              </AnimatePresence>

              <GlassField icon={<Mail className="w-4 h-4" />} label="Email" id="email" name="email" type="email" placeholder="email@example.com" value={formData.email} onChange={handleInputChange} required />

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="password" className="text-white/70 text-sm">Mật khẩu</Label>
                  {isLogin && (
                    <Link href="/forgot-password" className="text-xs text-[#8fba6f] hover:text-[#a0cf80] transition-colors">
                      Quên mật khẩu?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={isLogin ? 1 : 6}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#425733]/70 focus:ring-1 focus:ring-[#425733]/50 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
              <span className="text-white/40">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-[#8fba6f] font-semibold hover:text-[#a0cf80] transition-colors"
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

function GlassField({ icon, label, id, ...inputProps }: {
  icon: React.ReactNode;
  label: string;
  id: string;
  [key: string]: any;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-white/70 text-sm mb-1.5 block">{label}</Label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
        <input
          id={id}
          {...inputProps}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#425733]/70 focus:ring-1 focus:ring-[#425733]/50 transition-all"
          style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}
        />
      </div>
    </div>
  );
}
