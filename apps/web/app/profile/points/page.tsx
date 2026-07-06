"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Clock, Gift, ShoppingBag, PlusCircle, MinusCircle } from "lucide-react";

interface PointHistory {
  id: string;
  points: number;
  source: string;
  createdAt: string;
}

interface PointsData {
  history: PointHistory[];
  currentPoints: number;
  loyaltyTier: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PointsHistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile/points");
    }
  }, [status, router]);

  const { data, isLoading: loading } = useQuery<PointsData>({
    queryKey: ["customer-points", page],
    queryFn: async () => {
      const res = await fetch(`/api/profile/points?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch points");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  if (status === "loading" || (loading && !data)) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#425733] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const getSourceIcon = (source: string) => {
    if (source === "ORDER_PURCHASE") return <ShoppingBag className="w-5 h-5 text-blue-500" />;
    if (source === "REVIEW") return <Star className="w-5 h-5 text-yellow-500" />;
    if (source === "ORDER_REDEEM") return <Gift className="w-5 h-5 text-purple-500" />;
    return <Star className="w-5 h-5 text-gray-500" />;
  };

  const getSourceText = (source: string) => {
    const labels: Record<string, string> = {
      ORDER_PURCHASE: "Tích điểm từ đơn hàng",
      ORDER_REDEEM: "Đổi điểm giảm giá đơn hàng",
      REVIEW: "Đánh giá sản phẩm",
      ADMIN_BONUS: "Thưởng từ quản trị viên",
      SIGNUP_BONUS: "Thưởng đăng ký thành viên",
    };
    return labels[source] || source;
  };

  return (
    <main className="min-h-[100dvh] bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/profile" className="inline-flex items-center text-gray-500 hover:text-[#425733] mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại tài khoản
        </Link>

        <div className="bg-gradient-to-br from-[#425733] to-[#2d3d22] rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-white/80 font-medium mb-1">Điểm tích lũy hiện tại</p>
              <h1 className="text-5xl font-bold">{data?.currentPoints.toLocaleString("vi-VN") || 0}</h1>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Star className="w-10 h-10 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#425733]" />
            <h2 className="text-lg font-semibold text-gray-800">Lịch sử giao dịch điểm</h2>
          </div>

          {data?.history.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Bạn chưa có giao dịch điểm nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data?.history.map((item) => {
                const isPositive = item.points > 0;
                return (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {getSourceIcon(item.source)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{getSourceText(item.source)}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 font-bold text-lg ${isPositive ? "text-green-600" : "text-red-500"}`}>
                      {isPositive ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
                      {Math.abs(item.points)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data && data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-gray-600">
                Trang {page} / {data.pagination.totalPages}
              </span>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
