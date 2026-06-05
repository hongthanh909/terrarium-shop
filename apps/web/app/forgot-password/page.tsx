"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/custom-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast.error("Vui lòng nhập địa chỉ email");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-[#425733]">Tiệm Rêu Decor</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Quên mật khẩu?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Kiểm tra email của bạn</h3>
              <p className="text-sm text-gray-500">
                Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến <br />
                <span className="font-semibold text-gray-800">{email}</span>
              </p>
              <div className="pt-4">
                <Button variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
                  Thử lại với email khác
                </Button>
              </div>
              <div className="pt-2">
                <Link href="/login" className="text-sm font-medium text-[#425733] hover:text-[#364a29]">
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Địa chỉ email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 bg-[#425733] hover:bg-[#364a29] text-white"
                >
                  {loading ? "Đang gửi..." : "Gửi link khôi phục"}
                </Button>
              </div>
            </form>
          )}
          
          {!isSuccess && (
            <div className="mt-6 flex items-center justify-center">
              <Link href="/login" className="flex items-center text-sm font-medium text-[#425733] hover:text-[#364a29]">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
