// apps/web/app/api/ai/recommend/route.ts – Endpoint for product recommendation AI
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildProductPrompt } from "@/lib/aiPrompt";
import { checkRateLimit } from "@/lib/rateLimiter";

/**
 * POST /api/ai/recommend
 * Body: { productId: string }
 * Returns AI-generated recommendation markdown.
 */
export async function POST(request: Request) {
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
      description: true,
      price: true,
      category: { select: { name: true } },
      images: { select: { url: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const prompt = buildProductPrompt(product);

  // Call Ollama model (llama3:8b) – assuming Ollama HTTP API is available at localhost:11434
  const ollamaRes = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama3:8b", prompt, stream: false }),
  });

  if (!ollamaRes.ok) {
    const err = await ollamaRes.text();
    return NextResponse.json({ error: "Ollama request failed", details: err }, { status: 502 });
  }

  const data = await ollamaRes.json();
  const answer = data.response?.trim() ?? "";

  return NextResponse.json({ recommendation: answer }, { status: 200 });
}
