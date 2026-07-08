import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    appVersion: process.env.APP_VERSION || "unknown",
    aiProvider: process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "ollama"),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    pid: process.pid,
    uptime: Math.round(process.uptime()),
    nodeEnv: process.env.NODE_ENV || "unknown",
  });
}
