"use client";

import dynamic from "next/dynamic";
import { AI_CHAT_ENABLED } from "@/lib/features";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export function ChatWidgetClient() {
  if (!AI_CHAT_ENABLED) return null;
  return <ChatWidget />;
}
