"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminChatEvent = {
  unreadCount: number;
  latestMessage: null | {
    id: string;
    conversationId: string;
    senderType: "CUSTOMER" | "ADMIN";
    content: string | null;
    imageUrl: string | null;
    customerName: string;
    productName: string;
  };
};

export function AdminChatNotifier({ onUnreadChange }: { onUnreadChange: (count: number) => void }) {
  const [enabled, setEnabled] = useState(false);
  const lastMessageId = useRef<string | null>(null);
  const initialized = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);

  const unlockAudio = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContext.current) audioContext.current = new AudioContextClass();
    if (audioContext.current.state === "suspended") void audioContext.current.resume();
  };

  const playAlert = () => {
    const context = audioContext.current;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  };

  useEffect(() => {
    const preference = window.localStorage.getItem("admin-chat-alerts") === "enabled";
    setEnabled(preference && (typeof Notification === "undefined" || Notification.permission !== "denied"));
    const unlock = () => {
      if (window.localStorage.getItem("admin-chat-alerts") === "enabled") unlockAudio();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/chat/events?scope=admin");
    const handleUpdate = (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as AdminChatEvent;
      onUnreadChange(data.unreadCount || 0);
      const incoming = data.latestMessage;

      if (!initialized.current) {
        initialized.current = true;
        lastMessageId.current = incoming?.id || null;
        return;
      }

      if (!incoming || incoming.id === lastMessageId.current) return;
      lastMessageId.current = incoming.id;
      if (incoming.senderType !== "CUSTOMER") return;

      if (window.localStorage.getItem("admin-chat-alerts") === "enabled") playAlert();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const notification = new Notification(`Tin nhắn từ ${incoming.customerName}`, {
          body: incoming.content || (incoming.imageUrl ? `Đã gửi một ảnh về ${incoming.productName}` : incoming.productName),
          icon: "/favicon-192.png",
          tag: `chat-${incoming.conversationId}`,
        });
        notification.onclick = () => {
          window.focus();
          window.location.href = `/tiem-nho-nth24/messages?conversation=${incoming.conversationId}`;
          notification.close();
        };
      }
    };
    events.addEventListener("update", handleUpdate as EventListener);
    return () => {
      events.removeEventListener("update", handleUpdate as EventListener);
      events.close();
    };
  }, [onUnreadChange]);

  const toggleAlerts = async () => {
    unlockAudio();
    if (!enabled) {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      window.localStorage.setItem("admin-chat-alerts", "enabled");
      setEnabled(true);
      return;
    }
    window.localStorage.setItem("admin-chat-alerts", "disabled");
    setEnabled(false);
  };

  return (
    <button
      type="button"
      onClick={toggleAlerts}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fba6f]/60",
        enabled ? "border-[#b8cdaa] bg-[#edf5e8] text-[#365229]" : "border-[#e0e6dc] bg-white text-gray-500 hover:text-[#425733]",
      )}
      aria-label={enabled ? "Tắt âm thanh thông báo chat" : "Bật âm thanh và thông báo chat"}
      title={enabled ? "Thông báo chat đang bật" : "Bật thông báo chat"}
    >
      {enabled ? <BellRing className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
    </button>
  );
}
