"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { ArrowLeft, Check, X, Star, Eye } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";

interface Review {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  verified: boolean;
  approved: boolean;
  status: string;
  createdAt: string;
  customer: {
    name: string | null;
    email: string | null;
  };
  product?: {
    name: string;
    slug: string;
  };
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: reviews = [], isLoading: loading, error } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let url = "/api/reviews";
      if (filter === "ALL") {
        url += "?status=all";
      } else {
        const statusMap = {
          PENDING: "PENDING",
          APPROVED: "APPROVED",
          REJECTED: "REJECTED",
        };
        url += `?status=${statusMap[filter]}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Không thể tải danh sách đánh giá");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const promise = async () => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, status: "APPROVED" }),
      });

      if (!response.ok) {
        throw new Error("Không thể duyệt đánh giá");
      }
      
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      return response.json();
    };

    try {
      await promise();
      showToast.success("Đã duyệt đánh giá thành công!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi duyệt đánh giá");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const promise = async () => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, status: "REJECTED" }),
      });

      if (!response.ok) {
        throw new Error("Không thể từ chối đánh giá");
      }

      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      return response.json();
    };

    try {
      await promise();
      showToast.success("Đã từ chối đánh giá!");
    } catch (err: any) {
      showToast.error(err.message || "Lỗi khi từ chối đánh giá");
    } finally {
      setProcessingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/tiem-nho-nth24"
          className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay Lại Admin
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Đánh Giá Sản Phẩm</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === status
                ? "bg-[#425733] text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {status === "ALL" ? "Tất Cả" : status === "PENDING" ? "Chờ Duyệt" : status === "APPROVED" ? "Đã Duyệt" : "Đã Từ Chối"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="space-y-4 p-6">
          {error ? (
            <p className="text-center text-red-500 py-12">Đã xảy ra lỗi khi tải danh sách đánh giá</p>
          ) : !Array.isArray(reviews) || reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Không tìm thấy đánh giá</p>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{review.title || "Đánh Giá Không Tiêu Đề"}</h3>
                    <p className="text-sm text-gray-500">bởi {review.customer.name || review.customer.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      review.status === "APPROVED" || review.approved
                        ? "bg-[#e3ebdd] text-[#364a29]"
                        : review.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {review.status === "APPROVED" || review.approved
                        ? "Đã Duyệt"
                        : review.status === "REJECTED"
                        ? "Đã Từ Chối"
                        : "Chờ Duyệt"}
                    </span>
                    {review.verified && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Đã Mua Hàng
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{review.content}</p>

                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.map((img: string, idx: number) => (
                      <ImageWrapper
                        key={idx}
                        src={img}
                        alt={`Ảnh đánh giá ${idx + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Link
                    href={`/products/${review.product?.slug}`}
                    className="text-[#425733] hover:text-[#425733] text-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Xem Sản Phẩm
                  </Link>
                  {!review.approved && review.status !== "REJECTED" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(review.id)}
                        disabled={processingId !== null}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={processingId !== null}
                        className="flex min-h-10 items-center gap-1 rounded-md border border-[#425733] bg-[#425733] px-3 py-1 font-semibold text-white shadow-sm transition-colors hover:bg-[#364a29] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Duyệt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
