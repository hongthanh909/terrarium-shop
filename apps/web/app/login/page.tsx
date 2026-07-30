"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { trackEvent } from "@/lib/analytics-client";

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#e3ebdd] to-[#f5f7f4]">
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
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | null>(null);
  const [availableSocialProviders, setAvailableSocialProviders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "", name: "", phone: "" });

  const isVerifyingRegistration = !isLogin && Boolean(verificationEmail);

  useEffect(() => {
    let active = true;

    getProviders()
      .then((providers) => {
        if (!active) return;
        const providerIds = Object.keys(providers || {}).filter(
          (providerId) => providerId === "google" || providerId === "facebook"
        );
        setAvailableSocialProviders(new Set(providerIds));
      })
      .catch(() => {
        if (active) setAvailableSocialProviders(new Set());
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError) return;

    const messages: Record<string, string> = {
      AccessDenied: "Tài khoản này không thể đăng nhập bằng Google. Tài khoản quản trị cần dùng trang đăng nhập admin.",
      OAuthAccountNotLinked: "Email này đã được sử dụng bằng phương thức đăng nhập khác.",
      OAuthCallback: "Google chưa thể xác minh đăng nhập. Vui lòng thử lại.",
      OAuthSignin: "Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.",
    };

    setError(messages[oauthError] || "Đăng nhập Google chưa thành công. Vui lòng thử lại.");
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleRegister = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
    setVerificationEmail(data.email || formData.email);
  };

  const handleVerifyRegistration = async () => {
    const res = await fetch("/api/auth/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: verificationEmail || formData.email, code: verificationCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Mã xác minh không hợp lệ");
    trackEvent({ type: "REGISTER", path: "/login" });

    const signInResult = await signIn("customer-login", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });
    if (signInResult?.error) {
      throw new Error("Đăng ký thành công nhưng đăng nhập tự động thất bại.");
    }
    trackEvent({ type: "LOGIN", path: "/login" });
  };

  const handleLogin = async () => {
    const result = await signIn("customer-login", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin đăng nhập.");
    }
    trackEvent({ type: "LOGIN", path: "/login" });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await handleLogin();
        router.push(callbackUrl === "/" ? "/" : callbackUrl);
      } else if (isVerifyingRegistration) {
        await handleVerifyRegistration();
        router.push(callbackUrl);
      } else {
        await handleRegister();
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "facebook") => {
    const providerName = provider === "google" ? "Google" : "Facebook";
    setError(null);

    if (!availableSocialProviders.has(provider)) {
      setError(`Đăng nhập bằng ${providerName} đang chờ cấu hình ứng dụng OAuth.`);
      return;
    }

    setSocialLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError(`Không thể kết nối với ${providerName}. Vui lòng thử lại.`);
      setSocialLoading(null);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setVerificationEmail(null);
    setVerificationCode("");
  };

  return (
    <main className="min-h-[100dvh] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#dce5d5] via-[#e8efe2] to-[#f0f4ee]">
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
                key={isLogin ? "login" : isVerifyingRegistration ? "verify" : "register"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-800 mb-1">
                  {isLogin ? "Chào mừng trở lại" : isVerifyingRegistration ? "Xác minh email" : "Tạo tài khoản mới"}
                </h1>
                <p className="text-gray-400 text-sm">
                  {isLogin
                    ? "Đăng nhập để tiếp tục mua sắm"
                    : isVerifyingRegistration
                      ? `Nhập mã 6 số đã gửi đến ${verificationEmail}`
                      : "Tham gia cùng cộng đồng Rêu Décor"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-8 py-6">
            {!isVerifyingRegistration && (
              <div className="mb-5 space-y-3">
                <SocialLoginButton
                  provider="google"
                  label="Tiếp tục với Google"
                  loading={socialLoading === "google"}
                  disabled={Boolean(socialLoading)}
                  onClick={() => handleSocialSignIn("google")}
                />
                <SocialLoginButton
                  provider="facebook"
                  label="Tiếp tục với Facebook"
                  loading={socialLoading === "facebook"}
                  disabled={Boolean(socialLoading)}
                  onClick={() => handleSocialSignIn("facebook")}
                />
                <div className="flex items-center gap-3 pt-1" aria-hidden="true">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">Hoặc tiếp tục bằng email</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
            )}

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

              <AnimatePresence mode="wait">
                {isVerifyingRegistration ? (
                  <motion.div
                    key="verify-code"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <LightField
                      icon={<ShieldCheck className="w-4 h-4" />}
                      label="Mã xác minh"
                      id="verificationCode"
                      name="verificationCode"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setError(null);
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={loading}
                      className="w-full text-xs text-[#425733] hover:text-[#364a29] font-medium disabled:opacity-60"
                    >
                      Gửi lại mã xác minh
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="credentials"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {!isLogin && (
                      <>
                        <LightField icon={<User className="w-4 h-4" />} label="Họ và tên" id="name" name="name" placeholder="Nguyễn Văn A" value={formData.name} onChange={handleInputChange} required={!isLogin} />
                        <LightField icon={<Phone className="w-4 h-4" />} label="Số điện thoại (tuỳ chọn)" id="phone" name="phone" type="tel" placeholder="0912 345 678" value={formData.phone} onChange={handleInputChange} />
                      </>
                    )}

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
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          minLength={isLogin ? 1 : 6}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
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
                  </motion.div>
                )}
              </AnimatePresence>

              <ShimmerButton
                type="submit"
                disabled={loading}
                className="w-full mt-2"
                size="md"
              >
                {loading
                  ? "Đang xử lý..."
                  : isLogin
                    ? "Đăng nhập"
                    : isVerifyingRegistration
                      ? "Xác minh và tạo tài khoản"
                      : "Gửi mã xác minh"}
              </ShimmerButton>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">
                {isLogin ? "Chưa có tài khoản?" : isVerifyingRegistration ? "Sai email?" : "Đã có tài khoản?"}
              </span>{" "}
              <button
                type="button"
                onClick={isVerifyingRegistration ? () => { setVerificationEmail(null); setVerificationCode(""); setError(null); } : switchMode}
                className="text-[#425733] font-semibold hover:text-[#364a29] transition-colors"
              >
                {isLogin ? "Đăng ký ngay" : isVerifyingRegistration ? "Sửa thông tin" : "Đăng nhập"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function SocialLoginButton({ provider, label, loading, disabled, onClick }: {
  provider: "google" | "facebook";
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="absolute left-4 flex h-5 w-5 items-center justify-center">
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#425733]" />
        ) : (
          <Image
            src={`/brands/${provider}.svg`}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
        )}
      </span>
      <span>{loading ? "Đang kết nối..." : label}</span>
    </button>
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
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none focus:border-[#425733] focus:ring-2 focus:ring-[#425733]/10 focus:shadow-[0_0_0_3px_rgba(66,87,51,0.08)] transition-all"
        />
      </div>
    </div>
  );
}
