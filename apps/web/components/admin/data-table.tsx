"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react";

// ─── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  // Order statuses
  PENDING:    "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPING:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED:  "bg-emerald-50 text-emerald-800 border-emerald-200",
  CANCELLED:  "bg-red-50 text-red-700 border-red-200",
  // Payment
  PAID:       "bg-emerald-50 text-emerald-800 border-emerald-200",
  REFUNDED:   "bg-orange-50 text-orange-700 border-orange-200",
  // Product / generic
  ACTIVE:     "bg-emerald-50 text-emerald-800 border-emerald-200",
  INACTIVE:   "bg-gray-100 text-gray-500 border-gray-200",
  // Blog
  PUBLISHED:  "bg-emerald-50 text-emerald-800 border-emerald-200",
  DRAFT:      "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý", CONFIRMED: "Đã xác nhận", PROCESSING: "Đóng gói",
  SHIPPING: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã huỷ",
  PAID: "Đã thanh toán", REFUNDED: "Hoàn tiền",
  ACTIVE: "Hoạt động", INACTIVE: "Tạm dừng",
  PUBLISHED: "Đã xuất bản", DRAFT: "Bản nháp",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", style, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Table Filter Bar ──────────────────────────────────────────────────────────
interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function FilterBar({ search, onSearchChange, placeholder = "Tìm kiếm...", filters, actions }: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-12 w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-12 text-base transition-all focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950/20 sm:text-sm"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600" aria-label="Xóa nội dung tìm kiếm">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {filters}
      {actions && <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">{actions}</div>}
    </div>
  );
}

// ─── Select Filter ─────────────────────────────────────────────────────────────
interface SelectFilterProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function SelectFilter({ value, onChange, options, placeholder = "Tất cả", className }: SelectFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "min-h-11 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white py-2 pl-3 pr-8 text-base transition-all focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950/20 sm:text-sm",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")] bg-no-repeat bg-[right_0.75rem_center]",
        className
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns, data, getRowKey, sortKey, sortDir, onSort,
  loading, emptyText = "Không có dữ liệu", emptyIcon, onRowClick, rowClassName,
}: DataTableProps<T>) {
  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null;
    const key = col.key as string;
    if (sortKey !== key) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 h-3.5 w-3.5 text-gray-950" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 text-gray-950" />;
  };

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-max text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  onClick={() => col.sortable && onSort?.(col.key as string)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none",
                    col.sortable && "cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-950",
                    col.className
                  )}
                >
                  <span className="flex items-center">
                    {col.label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (i * 7) % 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-400">
                  {emptyIcon && <div className="mb-3 flex justify-center">{emptyIcon}</div>}
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={getRowKey(row)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-gray-50 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-gray-50",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key as string} className={cn("px-4 py-3", col.className)}>
                      {col.render
                        ? col.render(row, i)
                        : String((row as any)[col.key] ?? "-")}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-400">
        Hiển thị <span className="font-medium text-gray-600">{start}–{end}</span> / <span className="font-medium text-gray-600">{total}</span>
      </p>
      <div className="flex items-center justify-between gap-1 sm:justify-start">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="min-h-11 rounded-md border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Trước
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "h-11 w-11 rounded-md text-sm font-medium transition-colors",
                totalPages > 3 && p !== page && "hidden min-[420px]:inline-flex min-[420px]:items-center min-[420px]:justify-center",
                p === page
                  ? "bg-primary text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-950"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="min-h-11 rounded-md border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tiếp →
        </button>
      </div>
    </div>
  );
}
