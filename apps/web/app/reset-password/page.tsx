"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/custom-toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If no token is provided in the URL
  if (!token) {
    return (
      <div className="text-center py-8 space-y-4">
        <h3 className="text-xl font-semibold text-red-600">Liên kết không hợp lệ</h3>
        <p className="text-gray-500">
          Không tìm thấy mã khôi phục. Vui lòng kiểm tra lại đường dẫn trong email của bạn.
        </p>
        <Button asChild className="mt-4 bg-[#425733] hover:bg-[#364a29]">
          <Link href="/forgot-password">Yêu cầu lại link khôi phục</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showToast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        showToast.success(data.message);
      } else {
        showToast.error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
      }
    } catch (error) {
      showToast.error("Lỗi kết nối. Vui lòng kiểm tra lại mạng.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Đổi mật khẩu thành công!</h3>
        <p className="text-sm text-gray-500 pb-4">
          Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
        </p>
        <Button asChild className="w-full h-12 bg-[#425733] hover:bg-[#364a29]">
          <Link href="/login">Đi đến trang Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
          Mật khẩu mới
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="new-password"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 h-12"
            placeholder="Ít nhất 6 ký tự"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
          Xác nhận mật khẩu mới
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="confirm-password"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`pl-10 h-12 ${
              confirmPassword && confirmPassword !== newPassword
                ? "border-red-300 focus:ring-red-500"
                : ""
            }`}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="mt-2 text-sm text-red-600">Mật khẩu xác nhận không khớp</p>
        )}
      </div>

      <div>
        <Button 
          type="submit" 
          disabled={loading || (!!confirmPassword && confirmPassword !== newPassword)} 
          className="w-full h-12 bg-[#425733] hover:bg-[#364a29] text-white"
        >
          {loading ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
        </Button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-[#425733]">Tiệm Rêu Decor</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
          <Suspense fallback={<div className="text-center py-8">Đang tải...</div>}>
            <ResetPasswordForm />
          </Suspense>
          
          <div className="mt-6 flex items-center justify-center">
            <Link href="/login" className="flex items-center text-sm font-medium text-[#425733] hover:text-[#364a29]">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
