"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, Package, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable, FilterBar, SelectFilter, StatusBadge, Pagination,
  type Column,
} from "@/components/admin/data-table";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  customer: { id: string; name: string; email: string } | null;
  shippingInfo?: {
    name: string;
    email?: string;
    phone: string;
    province?: string;
    district?: string;
    ward?: string;
    fullAddress?: string;
  } | null;
  items: Array<{ id: string; productName: string; quantity: number; price: number }>;
}

const STATUS_OPTIONS = [
  { value: "PENDING",    label: "Chờ xử lý" },
  { value: "CONFIRMED",  label: "Đã xác nhận" },
  { value: "PROCESSING", label: "Đóng gói" },
  { value: "SHIPPING",   label: "Đang giao" },
  { value: "DELIVERED",  label: "Đã giao" },
  { value: "CANCELLED",  label: "Đã huỷ" },
];

const UPDATE_OPTIONS = [
  { value: "PENDING",    label: "Chờ xử lý" },
  { value: "CONFIRMED",  label: "Xác nhận" },
  { value: "PROCESSING", label: "Đóng gói" },
  { value: "SHIPPING",   label: "Đang giao" },
  { value: "DELIVERED",  label: "Đã giao" },
  { value: "CANCELLED",  label: "Huỷ đơn" },
];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pageSize = 10;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=${pageSize}`);
      const data = await res.json();
      return {
        orders: (data.orders || []) as Order[],
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      };
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const orders = ordersData?.orders ?? [];
  const totalPages = ordersData?.totalPages ?? 1;
  const total = ordersData?.total ?? 0;

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const promise = async () => {
      const res = await fetch(`/api/admin/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Không thể cập nhật trạng thái đơn hàng");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    };

    toast.promise(promise(), {
      loading: "Đang cập nhật trạng thái...",
      success: "Cập nhật trạng thái thành công!",
      error: (err) => err.message || "Lỗi khi cập nhật trạng thái",
      finally: () => setUpdatingId(null),
    });
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q) ||
      o.shippingInfo?.name?.toLowerCase().includes(q) ||
      o.shippingInfo?.email?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      label: "Mã Đơn",
      render: (o) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          #{o.orderNumber}
        </span>
      ),
    },
    {
      key: "customer",
      label: "Khách Hàng",
      render: (o) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{o.customer?.name || o.shippingInfo?.name || "Khách vãng lai"}</p>
          <p className="text-xs text-gray-400 truncate max-w-[180px]">{o.customer?.email || o.shippingInfo?.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "items",
      label: "Sản Phẩm",
      render: (o) => (
        <div>
          <p className="text-sm font-medium text-gray-700">{o.items?.length || 0} sản phẩm</p>
          <p className="text-xs text-gray-400 truncate max-w-[160px]">
            {o.items?.slice(0, 2).map((i) => i.productName).join(", ")}
            {(o.items?.length ?? 0) > 2 && ` +${o.items.length - 2}`}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      label: "Tổng Tiền",
      sortable: true,
      render: (o) => (
        <span className="font-bold text-[#425733]">{o.total.toLocaleString("vi-VN")}₫</span>
      ),
    },
    {
      key: "status",
      label: "Trạng Thái",
      render: (o) => {
        const getSelectStyles = (status: string) => {
          const styles: Record<string, string> = {
            PENDING:    "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20",
            CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20",
            PROCESSING: "bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500/20",
            SHIPPING:   "bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500/20",
            DELIVERED:  "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0] focus:ring-[#364a29]/20",
            CANCELLED:  "bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20",
          };
          return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
        };

        const dotColors: Record<string, string> = {
          PENDING:    "bg-amber-500",
          CONFIRMED:  "bg-blue-500",
          PROCESSING: "bg-purple-500",
          SHIPPING:   "bg-indigo-500",
          DELIVERED:  "bg-[#364a29]",
          CANCELLED:  "bg-red-500",
        };

        const dotColor = dotColors[o.status] || "bg-gray-500";

        return (
          <div className="relative inline-flex items-center">
            <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${dotColor} pointer-events-none opacity-80`} />
            <select
              value={o.status}
              onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              disabled={updatingId !== null}
              className={`text-xs rounded-full border py-0.5 pl-5.5 pr-7 font-semibold cursor-pointer transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed appearance-none ${getSelectStyles(o.status)}`}
            >
              {UPDATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-gray-700 font-normal">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 w-3 h-3 pointer-events-none opacity-60 text-current" />
          </div>
        );
      },
    },
    {
      key: "paymentStatus",
      label: "Thanh Toán",
      render: (o) => <StatusBadge status={o.paymentStatus} />,
    },
    {
      key: "createdAt",
      label: "Ngày",
      sortable: true,
      render: (o) => (
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(o.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "id",
      label: "",
      className: "text-right",
      render: (o) => (
        <Link
          href={`/tiem-nho-nth24/orders/${o.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[#425733] hover:text-[#364a29] font-semibold text-xs px-2 py-1 rounded-lg hover:bg-[#e3ebdd] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Chi tiết
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Đơn Hàng</h2>
          <p className="text-gray-500">Quản lý và cập nhật trạng thái đơn hàng</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
          Tổng: <span className="font-bold text-gray-800">{total}</span> đơn
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="Tìm theo mã đơn, tên, email..."
        filters={
          <SelectFilter
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            options={STATUS_OPTIONS}
            placeholder="Tất cả trạng thái"
          />
        }
      />

      <DataTable<Order>
        columns={columns}
        data={filtered}
        getRowKey={(o) => o.id}
        loading={isLoading}
        emptyText="Không tìm thấy đơn hàng nào"
        emptyIcon={<Package className="w-12 h-12 text-gray-200" />}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
