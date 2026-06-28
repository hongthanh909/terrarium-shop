"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { X, Check, AlertTriangle, Info, ShoppingCart } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default 5000
}

interface ToastContextType {
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/* ─── Action label by type ───────────────────────────────────────── */
function getActionLabel(type: ToastType): string {
  switch (type) {
    case "success": return "Thành công";
    case "error":   return "Thất bại";
    case "warning": return "Cảnh báo";
    case "info":
    default:        return "Thông báo";
  }
}

/* ─── Single Toast Item ──────────────────────────────────────────── */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
}) {
  const DURATION = toast.duration ?? 5000;
  const [progress, setProgress] = useState(100); // %
  const [exiting, setExiting] = useState(false);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 260);
  }, [onRemove, toast.id]);

  // Smooth progress bar using rAF
  useEffect(() => {
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / DURATION);
      setProgress(remaining * 100);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleClose();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [DURATION, handleClose]);

  // Color config per type
  const config = {
    success: {
      bar: "#3a7d22",
      iconBg: "#e8f5e1",
      icon: <Check className="w-4 h-4 text-[#3a7d22]" strokeWidth={2.5} />,
      label: "Thành công",
      dot: "#3a7d22",
    },
    error: {
      bar: "#dc2626",
      iconBg: "#fee2e2",
      icon: <X className="w-4 h-4 text-red-600" strokeWidth={2.5} />,
      label: "Thất bại",
      dot: "#dc2626",
    },
    warning: {
      bar: "#d97706",
      iconBg: "#fef3c7",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2.5} />,
      label: "Cảnh báo",
      dot: "#d97706",
    },
    info: {
      bar: "#2563eb",
      iconBg: "#dbeafe",
      icon: <Info className="w-4 h-4 text-blue-600" strokeWidth={2.5} />,
      label: "Thông báo",
      dot: "#2563eb",
    },
  }[toast.type];

  return (
    <div
      className={`
        relative w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-100
        transition-[opacity,transform] duration-260 ease-out overflow-hidden
        ${exiting ? "opacity-0 translate-x-6 scale-95" : "opacity-100 translate-x-0 scale-100"}
      `}
      style={{
        animation: exiting ? undefined : "toast-slide-in 0.30s cubic-bezier(0.21,1.02,0.73,1)",
      }}
    >
      {/* Top progress bar */}
      <div
        className="absolute top-0 left-0 h-[3px] w-full rounded-t-xl transition-none origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          background: config.bar,
        }}
      />

      {/* Content */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: config.iconBg }}
        >
          {config.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Status label */}
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: config.bar }}>
            {config.label}
          </p>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{toast.title}</p>
          {toast.description && (
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{toast.description}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 -mt-0.5 -mr-1 p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          title="Đóng"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* ─── Container ──────────────────────────────────────────────────── */
export function CustomToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((t: Omit<ToastData, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register in singleton
  useEffect(() => {
    _singletonAdd = addToast;
    _singletonRemove = removeToast;
    return () => {
      _singletonAdd = null;
      _singletonRemove = null;
    };
  }, [addToast, removeToast]);

  return (
    <>
      <style jsx global>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Singleton API ──────────────────────────────────────────────── */
let _singletonAdd: ((t: Omit<ToastData, "id">) => void) | null = null;
let _singletonRemove: ((id: string) => void) | null = null;

function _showToast(opts: Omit<ToastData, "id">) {
  if (_singletonAdd) {
    _singletonAdd(opts);
  } else {
    console.warn("[CustomToast] Container not mounted yet");
  }
}

/**
 * Drop-in replacement for sonner's toast().
 *
 * Usage:
 *   showToast.success("Lưu thành công!")
 *   showToast.error("Có lỗi xảy ra", "Vui lòng thử lại")
 *   showToast.warning("Cảnh báo", "Dữ liệu sẽ bị xóa")
 */
export const showToast = Object.assign(
  (titleOrOpts: string | Omit<ToastData, "id">, description?: string) => {
    if (typeof titleOrOpts === "string") {
      _showToast({ type: "info", title: titleOrOpts, description });
    } else {
      _showToast(titleOrOpts);
    }
  },
  {
    success: (title: string, description?: string) =>
      _showToast({ type: "success", title, description }),
    error: (title: string, description?: string) =>
      _showToast({ type: "error", title, description }),
    warning: (title: string, description?: string) =>
      _showToast({ type: "warning", title, description }),
    info: (title: string, description?: string) =>
      _showToast({ type: "info", title, description }),
  }
);
