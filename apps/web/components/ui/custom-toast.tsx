"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { X, Check, AlertTriangle, Info, Pin } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default 6000
}

interface ToastContextType {
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/* ─── Single Toast Item ──────────────────────────────────────────── */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
}) {
  const duration = toast.duration ?? 6000;
  const totalSeconds = Math.ceil(duration / 1000);

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown
  useEffect(() => {
    if (paused || pinned) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, pinned]);

  // Auto-close when countdown reaches 0
  useEffect(() => {
    if (secondsLeft <= 0 && !pinned) {
      handleClose();
    }
  }, [secondsLeft, pinned]);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [onRemove, toast.id]);

  const handleStopCountdown = () => {
    setPaused(true);
  };

  const handlePin = () => {
    setPinned((p) => !p);
    if (!pinned) setPaused(true);
  };

  // Icon
  const icon = (() => {
    switch (toast.type) {
      case "success":
        return (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#e8f5e1] flex items-center justify-center">
            <Check className="w-4 h-4 text-[#3a7d22]" strokeWidth={2.5} />
          </div>
        );
      case "error":
        return (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        );
      case "warning":
        return (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2.5} />
          </div>
        );
      case "info":
      default:
        return (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <Info className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
          </div>
        );
    }
  })();

  const progressPercent =
    pinned || paused ? (secondsLeft / totalSeconds) * 100 : (secondsLeft / totalSeconds) * 100;

  const progressColor =
    toast.type === "success"
      ? "bg-[#3a7d22]"
      : toast.type === "error"
      ? "bg-red-500"
      : toast.type === "warning"
      ? "bg-amber-500"
      : "bg-blue-500";

  return (
    <div
      className={`
        relative w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200
        transition-all duration-280 ease-out
        ${exiting ? "opacity-0 translate-x-8 scale-95" : "opacity-100 translate-x-0 scale-100"}
      `}
      style={{
        animation: exiting ? undefined : "toast-slide-in 0.32s cubic-bezier(0.21,1.02,0.73,1)",
      }}
    >
      {/* Header area */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{toast.description}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 -mt-0.5 -mr-1">
          <button
            onClick={handlePin}
            className={`p-1.5 rounded-lg transition-colors ${
              pinned
                ? "bg-gray-100 text-gray-700"
                : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
            }`}
            title={pinned ? "Bỏ ghim" : "Ghim thông báo"}
          >
            <Pin className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Okay button */}
      <div className="px-4 pb-3">
        <button
          onClick={handleClose}
          className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Okay
        </button>
      </div>

      {/* Countdown bar */}
      {!pinned && (
        <div
          className="border-t border-gray-100 px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleStopCountdown}
        >
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${progressColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-400 whitespace-nowrap select-none">
            {paused ? (
              "Đã dừng"
            ) : (
              <>
                Tự đóng sau <strong className="text-gray-600">{secondsLeft}</strong>s.{" "}
                <span className="text-gray-500 font-medium">Bấm để dừng.</span>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Container ──────────────────────────────────────────────────── */
export function CustomToastContainer() {
  const ctx = useContext(ToastContext);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Expose add/remove via context
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
            transform: translateX(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Singleton API (to call from anywhere without context) ──────── */
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
