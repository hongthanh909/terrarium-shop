"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
}

/**
 * ConfirmDialog — Thay thế browser confirm() bằng dialog đẹp theo brand.
 * Dùng shadcn AlertDialog bên dưới.
 *
 * Cách dùng:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     description="Bạn chắc chắn muốn hủy đơn hàng này?"
 *     onConfirm={handleCancel}
 *   />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Xác nhận",
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy bỏ",
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
      : variant === "warning"
      ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white"
      : "bg-[#425733] hover:bg-[#364a29] focus:ring-[#425733] text-white";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                variant === "danger"
                  ? "bg-red-100"
                  : variant === "warning"
                  ? "bg-yellow-100"
                  : "bg-[#e3ebdd]"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  variant === "danger"
                    ? "text-red-600"
                    : variant === "warning"
                    ? "text-yellow-600"
                    : "text-[#425733]"
                }`}
              />
            </div>
            <AlertDialogTitle className="text-base font-semibold text-gray-900">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600 pl-[52px]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`rounded-lg ${confirmBtnClass}`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
