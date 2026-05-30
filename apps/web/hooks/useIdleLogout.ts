"use client";

/**
 * useIdleLogout — Tự động đăng xuất khi user không hoạt động
 *
 * Cách hoạt động:
 * 1. Theo dõi mọi sự kiện tương tác của user (mouse, keyboard, scroll, touch)
 * 2. Sau IDLE_WARN_MS không hoạt động → hiện toast cảnh báo
 * 3. Sau thêm IDLE_LOGOUT_MS không phản hồi → gọi signOut()
 *
 * @param idleMinutes - Số phút không hoạt động trước khi cảnh báo (default: 30)
 * @param warnMinutes - Số phút cảnh báo trước khi logout (default: 2)
 */

import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";

interface UseIdleLogoutOptions {
  idleMinutes?: number;
  warnMinutes?: number;
  enabled?: boolean;
}

export function useIdleLogout({
  idleMinutes = 30,
  warnMinutes = 2,
  enabled = true,
}: UseIdleLogoutOptions = {}) {
  const { data: session } = useSession();
  const idleTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnToastId = useRef<string | number | null>(null);

  const IDLE_MS = idleMinutes * 60 * 1000;
  const WARN_MS = warnMinutes * 60 * 1000;

  const clearTimers = useCallback(() => {
    if (idleTimer.current)   clearTimeout(idleTimer.current);
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    if (warnToastId.current) toast.dismiss(warnToastId.current);
    idleTimer.current   = null;
    warnTimer.current   = null;
    warnToastId.current = null;
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    toast.info("🔒 Phiên đăng nhập đã hết. Đang đăng xuất...", { duration: 3000 });
    await new Promise(r => setTimeout(r, 1500));
    useCartStore.getState().clearCart();
    signOut({ callbackUrl: "/login" });
  }, [clearTimers]);

  const showWarning = useCallback(() => {
    const id = toast.warning(
      `⚠️ Phiên sắp hết — bạn sẽ tự động đăng xuất sau ${warnMinutes} phút nếu không có hoạt động.`,
      {
        duration: WARN_MS,
        action: {
          label: "Tôi vẫn ở đây",
          onClick: () => {
            clearTimers();
            startTimers();
          },
        },
      }
    );
    warnToastId.current = id;
    warnTimer.current = setTimeout(handleLogout, WARN_MS);
  }, [warnMinutes, WARN_MS, clearTimers, handleLogout]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startTimers = useCallback(() => {
    clearTimers();
    idleTimer.current = setTimeout(showWarning, IDLE_MS);
  }, [clearTimers, showWarning, IDLE_MS]);

  const resetActivity = useCallback(() => {
    // Nếu đang hiện cảnh báo thì không reset (user phải bấm nút)
    if (warnTimer.current) return;
    startTimers();
  }, [startTimers, warnTimer]);

  useEffect(() => {
    // Chỉ bật nếu user đã đăng nhập và feature được enable
    if (!enabled || !session) return;

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
      "visibilitychange",
    ] as const;

    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    startTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      clearTimers();
    };
  }, [session, enabled, resetActivity, startTimers, clearTimers]);
}
