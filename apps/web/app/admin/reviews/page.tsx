"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, X, Star, Eye } from "lucide-react";
import { toast } from "sonner";

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

  const { data: reviews = [], isLoading: loading } = useQuery({
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
      return response.json();
    },
  });

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, status: "APPROVED" }),
      });

      if (response.ok) {
        toast.success("Đã duyệt đánh giá!");
        queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      } else {
        toast.error("Không thể duyệt đánh giá");
      }
    } catch (error) {
      console.error("Error approving review:", error);
      toast.error("Lỗi khi duyệt đánh giá");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, status: "REJECTED" }),
      });

      if (response.ok) {
        toast.success("Đã từ chối đánh giá!");
        queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      } else {
        toast.error("Không thể từ chối đánh giá");
      }
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast.error("Lỗi khi từ chối đánh giá");
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
          href="/admin"
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
          {reviews.length === 0 ? (
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
                      review.approved
                        ? "bg-[#e3ebdd] text-[#364a29]"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {review.approved ? "Đã Duyệt" : "Chờ Duyệt"}
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
                      <Image
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
                  {!review.approved && filter === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(review.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29]"
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