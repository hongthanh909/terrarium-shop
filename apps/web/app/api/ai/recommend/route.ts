// apps/web/app/api/ai/recommend/route.ts – Endpoint for product recommendation AI
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildProductPrompt } from "@/lib/aiPrompt";
import { checkRateLimit } from "@/lib/rateLimiter";
import { aiDisabledResponse, isAiServerEnabled } from "@/lib/ai/feature";

/**
 * POST /api/ai/recommend
 * Body: { productId: string }
 * Returns AI-generated recommendation markdown.
 */
export async function POST(request: Request) {
  if (!isAiServerEnabled()) return aiDisabledResponse();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(ip, 10, 60 * 1000); // 10 req/min per IP
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rate.retryAfter },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  let payload: { productId: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
    select: {
      name: true,
      basePrice: true,
      category: { select: { name: true } },
      images: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const prompt = buildProductPrompt(product);

  const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  const abortCtrl = new AbortController();
  const timeout = setTimeout(() => abortCtrl.abort(), 18_000);

  // Call the same Ollama model configured for /api/consult.
  const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      keep_alive: "10m",
      options: {
        temperature: 0.45,
        top_p: 0.9,
        num_predict: 220,
      },
    }),
    signal: abortCtrl.signal,
  }).finally(() => clearTimeout(timeout));

  if (!ollamaRes.ok) {
    const err = await ollamaRes.text();
    return NextResponse.json({ error: "Ollama request failed", details: err }, { status: 502 });
  }

  const data = await ollamaRes.json();
  const answer = data.response?.trim() ?? "";

  return NextResponse.json({ recommendation: answer }, { status: 200 });
}
