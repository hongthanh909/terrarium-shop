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
  DELIVERED:  "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0]",
  CANCELLED:  "bg-red-50 text-red-700 border-red-200",
  // Payment
  PAID:       "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0]",
  REFUNDED:   "bg-orange-50 text-orange-700 border-orange-200",
  // Product / generic
  ACTIVE:     "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0]",
  INACTIVE:   "bg-gray-100 text-gray-500 border-gray-200",
  // Blog
  PUBLISHED:  "bg-[#e3ebdd] text-[#364a29] border-[#c2d6b0]",
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
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/20 transition-all"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {filters}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
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
        "py-2 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#425733]/50 focus:ring-1 focus:ring-[#425733]/20 transition-all appearance-none cursor-pointer pr-8",
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
      ? <ChevronUp className="w-3.5 h-3.5 text-[#425733] ml-1" />
      : <ChevronDown className="w-3.5 h-3.5 text-[#425733] ml-1" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  onClick={() => col.sortable && onSort?.(col.key as string)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none",
                    col.sortable && "cursor-pointer hover:text-[#425733] hover:bg-gray-100 transition-colors",
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
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
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
                    onRowClick && "cursor-pointer hover:bg-[#f8faf6]",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key as string} className={cn("px-4 py-3", col.className)}>
                      {col.render
                        ? col.render(row, i)
                        : String((row as any)[col.key] ?? "—")}
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
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-gray-400">
        Hiển thị <span className="font-medium text-gray-600">{start}–{end}</span> / <span className="font-medium text-gray-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-[#425733]/40 hover:text-[#425733] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                p === page
                  ? "bg-[#425733] text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:border-[#425733]/40 hover:text-[#425733]"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-[#425733]/40 hover:text-[#425733] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Tiếp →
        </button>
      </div>
    </div>
  );
}
