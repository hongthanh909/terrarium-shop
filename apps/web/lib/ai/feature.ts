import "server-only";

import { NextResponse } from "next/server";

export function isAiServerEnabled() {
  return (
    process.env.AI_CHAT_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true"
  );
}

export function aiDisabledResponse(status = 503) {
  return NextResponse.json(
    {
      error: "Tính năng AI đang tạm tắt.",
      response: "Tính năng tư vấn AI đang tạm tắt. Vui lòng nhắn trực tiếp cho admin để được hỗ trợ.",
      source: "disabled",
    },
    { status },
  );
}
