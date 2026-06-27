"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export function ChatWidgetClient() {
  if (process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "false") return null;
  return <ChatWidget />;
}
