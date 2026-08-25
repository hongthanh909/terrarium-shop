import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAiServerEnabled } from "@/lib/ai/feature";

async function timed<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<"timeout">((resolve) => {
        timeoutId = setTimeout(() => resolve("timeout"), ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";
  const aiEnabled = isAiServerEnabled();
  const payload: Record<string, unknown> = {
    ok: true,
    appVersion: process.env.APP_VERSION || "unknown",
    aiEnabled,
    pid: process.pid,
    uptime: Math.round(process.uptime()),
    nodeEnv: process.env.NODE_ENV || "unknown",
  };

  if (deep) {
    payload.db = {
      products: await timed(prisma.product.count(), 5_000),
      ...(aiEnabled
        ? { knowledge: await timed(prisma.aiKnowledge.count({ where: { isActive: true } }), 5_000) }
        : {}),
    };
  }

  return NextResponse.json(payload);
}
