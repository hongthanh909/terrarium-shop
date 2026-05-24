"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // ─── ĐĂNG KÝ ────────────────────────────────────────────────────────────────
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

    if (!res.ok) {
      throw new Error(data.error || "Đăng ký thất bại");
    }

    // Sau khi đăng ký thành công → tự động đăng nhập
    const signInResult = await signIn("customer-login", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (signInResult?.error) {
      throw new Error("Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập lại.");
    }
  };

  // ─── ĐĂNG NHẬP ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const result = await signIn("customer-login", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      // Dịch lỗi từ NextAuth sang tiếng Việt
      const errorMap: Record<string, string> = {
        "Email hoặc mật khẩu không đúng.": "Email hoặc mật khẩu không đúng",
        "Tài khoản không tồn tại.": "Email hoặc mật khẩu không đúng",
        "Bạn không có quyền truy cập quản trị.": "Tài khoản này không hợp lệ",
        CredentialsSignin: "Email hoặc mật khẩu không đúng",
      };
      throw new Error(errorMap[result.error] || "Đăng nhập thất bại");
    }
  };

  // ─── SUBMIT ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }

      // Session đã được NextAuth set cookie tự động → redirect
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e3ebdd] to-[#f0f4ec] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(66,87,51,0.12)] rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[rgba(66,87,51,0.15)] rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại trang chủ
        </Link>

        <Card className="border-0 shadow-soft-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 border-b border-[#e3ebdd] bg-white/50">
            <CardTitle className="text-2xl font-bold text-[hsl(220,14%,25%)]">
              {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
            </CardTitle>
            <CardDescription className="text-[hsl(220,14%,45%)]">
              {isLogin
                ? "Đăng nhập để quản lý đơn hàng và giỏ hàng của bạn"
                : "Tham gia cùng chúng tôi để mua sắm dễ dàng hơn"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium text-center border border-red-100">
                  {error}
                </div>
              )}

              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại (Tuỳ chọn)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="VD: 0912345678"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="VD: email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    minLength={isLogin ? 1 : 6}
                  />
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-soft hover:shadow-soft-md transition-all"
                disabled={loading}
              >
                {loading
                  ? "Đang xử lý..."
                  : isLogin
                  ? "Đăng nhập"
                  : "Tạo tài khoản"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-[#425733] font-bold hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
