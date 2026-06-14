/**
 * AI Consultation API Route — v6 (Gemini Primary + Ollama Fallback)
 *
 * - Primary: Gemini API (streaming via SSE mode)
 * - Fallback: Ollama local (streaming)
 * - Fallback 2: DB query trực tiếp
 * - Fallback 3: Knowledge base tĩnh
 * - Rate limiting: 6 request/phút/IP
 * - Concurrency: tối đa 2 AI inference đồng thời
 *
 * POST /api/consult
 * Body: { message: string, history?: { role: "user"|"assistant", content: string }[], pageContext?: PageContext }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================
// RATE LIMITING — In-memory, per-IP
// =============================================
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// Cleanup expired entries mỗi 2 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now - val.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}, 120_000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// =============================================
// CONCURRENCY GUARD
// =============================================
let activeAiRequests = 0;
const MAX_CONCURRENT_AI = 2;

// =============================================
// PRODUCT CATALOG CACHE (5 min TTL)
// =============================================
type CatalogResult =
  | { type: "ok"; text: string }
  | { type: "empty" }
  | { type: "error" };

let productCatalogCache: { result: CatalogResult; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getProductCatalog(): Promise<CatalogResult> {
  const now = Date.now();
  if (productCatalogCache && now - productCatalogCache.fetchedAt < CACHE_TTL_MS) {
    return productCatalogCache.result;
  }

  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        inventory: true,
        featured: true,
        category: { select: { name: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 12,
    });

    if (products.length === 0) {
      const result: CatalogResult = { type: "empty" };
      productCatalogCache = { result, fetchedAt: now };
      return result;
    }

    const text = products
      .map((p) => {
        const price = p.salePrice
          ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫`
          : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`;
        const stock = p.inventory > 0 ? "còn" : "hết";
        const featured = p.featured ? "⭐" : "";
        return `- ${p.name}${featured} [${p.category.name}] ${price} ${stock} | Link: /products/${p.slug}`;
      })
      .join("\n");

    const result: CatalogResult = { type: "ok", text };
    productCatalogCache = { result, fetchedAt: now };
    return result;
  } catch {
    return { type: "error" };
  }
}

// =============================================
// PAGE CONTEXT TYPE
// =============================================
interface PageContext {
  type: "product" | "blog" | "explore" | "checkout" | "orders" | "consult" | "home" | "general";
  slug?: string;
  productName?: string;
  productPrice?: string;
  categoryName?: string;
  blogTitle?: string;
}

// =============================================
// SYSTEM PROMPT
// =============================================
async function buildSystemPrompt(pageContext?: PageContext): Promise<string> {
  const catalog = await getProductCatalog();

  const baseRole = `Bạn là trợ lý AI của "Tiệm Rêu" — shop terrarium Việt Nam. Xưng "em", gọi khách "anh/chị". Trả lời ngắn gọn, tự nhiên.

QUY TẮC:
- Hỏi chăm sóc/kiến thức → trả lời kiến thức, KHÔNG list sản phẩm
- Hỏi mua/giá/gợi ý → gợi ý 1-3 SP + link dạng "Link: /products/slug"
- Hỏi chính sách → trả lời ngắn gọn
- Chẩn đoán (nấm/héo/vàng) → nguyên nhân + xử lý
- CHỈ gợi ý sản phẩm khi khách HỎI MUA
- KHÔNG bịa sản phẩm/giá ngoài danh sách
- Freeship đơn từ 500k

KIẾN THỨC:
- Bể kín: tưới 1-2 tuần/lần, nấm mốc → mở nắp 24-48h
- Bể mở: tưới 3-5 ngày/lần
- Ánh sáng gián tiếp 6-8h/ngày, 18-28°C
- Rêu vàng → thiếu sáng hoặc tưới quá nhiều
- Lá héo mềm → thiếu nước. Lá vàng+đất ướt → thừa nước
- Côn trùng → để đất khô hơn, phủ cát mỏng`;

  if (catalog.type === "ok") {
    let prompt = `${baseRole}

═══ DANH SÁCH SẢN PHẨM SHOP (dữ liệu thật) ═══
${catalog.text}

Quy tắc sản phẩm:
- Gợi ý TỐI ĐA 3 sản phẩm phù hợp nhất, kèm giá + link
- Ưu tiên sản phẩm ⭐ (nổi bật) và "còn hàng"
- KHÔNG đề xuất sản phẩm không có trong danh sách trên
- Sản phẩm "hết hàng" → vẫn đề cập nhưng ghi rõ hết hàng`;

    if (pageContext?.type === "product" && pageContext.productName) {
      prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang xem SẢN PHẨM: "${pageContext.productName}"${pageContext.productPrice ? ` — Giá: ${pageContext.productPrice}` : ""}${pageContext.categoryName ? ` — Danh mục: ${pageContext.categoryName}` : ""}\n- Ưu tiên trả lời về sản phẩm này\n- Gợi ý mua kèm phụ kiện, so sánh với SP cùng danh mục`;
    }

    return prompt;
  }

  return baseRole;
}

// =============================================
// FALLBACK KNOWLEDGE BASE
// =============================================
async function getFallbackResponse(message: string): Promise<string> {
  const lower = message.toLowerCase();
  if (/xin chào|hello|hi|chào|alo/.test(lower))
    return "Xin chào! 🌿 Em là trợ lý AI của Tiệm Rêu. Em có thể giúp gì cho anh/chị ạ?";
  if (/cảm ơn|thank/.test(lower))
    return "Dạ không có gì! 😊 Chúc anh/chị chăm sóc terrarium thật vui.";
  return "Dạ, anh/chị vui lòng đợi chút hoặc liên hệ trực tiếp qua Zalo/Facebook để được nhân viên hỗ trợ ngay nhé! 🌿";
}

// =============================================
// HELPER: Escape string for JSON value
// =============================================
function escapeJsonString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

// =============================================
// GEMINI STREAMING
// =============================================
async function streamFromGemini(
  message: string,
  systemPrompt: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  // Use alt=sse to get Server-Sent Events format from Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents = [
    ...history.slice(-4).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    console.error(`Gemini API error ${res.status}: ${errText}`);
    return null;
  }

  if (!res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Flush any remaining buffer
          if (buffer.trim()) {
            const token = extractTokenFromSSE(buffer);
            if (token) {
              controller.enqueue(
                encoder.encode(`data: {"token":"${escapeJsonString(token)}"}\n\n`)
              );
            }
          }
          controller.close();
          activeAiRequests--;
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Gemini SSE format: "data: {json}\n\n"
        const parts = buffer.split("\n\n");
        // Keep the last (possibly incomplete) part in buffer
        buffer = parts.pop() || "";

        for (const part of parts) {
          const token = extractTokenFromSSE(part);
          if (token) {
            controller.enqueue(
              encoder.encode(`data: {"token":"${escapeJsonString(token)}"}\n\n`)
            );
          }
        }
      } catch (err) {
        console.error("Gemini stream read error:", err);
        controller.close();
        activeAiRequests--;
      }
    },
    cancel() {
      reader.cancel();
      activeAiRequests--;
    },
  });
}

function extractTokenFromSSE(sseChunk: string): string | null {
  // Each SSE chunk looks like: "data: { ... json ... }"
  for (const line of sseChunk.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ")) {
      try {
        const json = JSON.parse(trimmed.slice(6));
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch {
        // ignore parse errors
      }
    }
  }
  return null;
}

// =============================================
// OLLAMA STREAMING (fallback)
// =============================================
async function streamFromOllama(
  messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok || !res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          activeAiRequests--;
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            const token = obj?.message?.content;
            if (token) {
              controller.enqueue(
                encoder.encode(`data: {"token":"${escapeJsonString(token)}"}\n\n`)
              );
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Ollama stream read error:", err);
        controller.close();
        activeAiRequests--;
      }
    },
    cancel() {
      reader.cancel();
      activeAiRequests--;
    },
  });
}

// =============================================
// MAIN STREAMING FUNCTION (Gemini → Ollama)
// =============================================
async function streamFromAI(
  message: string,
  history: { role: string; content: string }[],
  pageContext?: PageContext
): Promise<ReadableStream<Uint8Array> | null> {
  if (activeAiRequests >= MAX_CONCURRENT_AI) return null;

  activeAiRequests++;
  const systemPrompt = await buildSystemPrompt(pageContext);

  try {
    // 1) Try Gemini first
    const geminiStream = await streamFromGemini(message, systemPrompt, history);
    if (geminiStream) return geminiStream;

    // 2) Fallback to Ollama
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];
    const ollamaStream = await streamFromOllama(ollamaMessages);
    if (ollamaStream) return ollamaStream;

    // Both failed
    activeAiRequests--;
    return null;
  } catch (err) {
    console.error("streamFromAI error:", err);
    activeAiRequests--;
    return null;
  }
}

// =============================================
// ROUTE HANDLER
// =============================================
export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          response:
            "Dạ anh/chị đang gửi hơi nhanh, vui lòng đợi 1 phút rồi hỏi lại nhé! 🌿 Em luôn sẵn sàng tư vấn ạ.",
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, history = [], pageContext } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ response: "Vui lòng nhập câu hỏi." });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > 400) {
      return NextResponse.json({
        response:
          "Dạ, câu hỏi của anh/chị hơi dài. Anh/chị tóm tắt ngắn gọn dưới 400 ký tự để em hỗ trợ nhanh nhất nhé! 🌿",
      });
    }

    // ── Attempt AI Streaming ──────────────────────
    const stream = await streamFromAI(trimmedMessage, history, pageContext);
    if (stream) {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Fallback lớp 2: DB query trực tiếp ──────
    if (
      /mua|giá|bao nhiêu|gợi ý sản phẩm|tìm (bể|sản phẩm)|đặt hàng|thêm vào giỏ|còn hàng|hết hàng|combo|freeship|khuyến mãi|giảm giá/i.test(
        trimmedMessage
      )
    ) {
      try {
        const products = await prisma.product.findMany({
          where: { status: "ACTIVE", inventory: { gt: 0 } },
          select: {
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
            category: { select: { name: true } },
            featured: true,
          },
          take: 5,
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        });

        if (products.length > 0) {
          const productList = products
            .map((p) => {
              const price = p.salePrice
                ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫ (giảm giá)`
                : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`;
              return `• ${p.name} [${p.category.name}] — ${price}\n  → Xem: /products/${p.slug}`;
            })
            .join("\n");

          return NextResponse.json({
            response: `🌿 Dạ, đây là một số sản phẩm nổi bật đang có hàng tại Tiệm Rêu:\n\n${productList}\n\n💡 Anh/chị bấm vào link để xem hình ảnh thật và đặt hàng nhé! Miễn phí ship cho đơn từ 500.000₫ ạ.`,
            source: "db",
          });
        }
      } catch {
        // tiếp tục fallback
      }
    }

    // ── Fallback lớp 3: Knowledge base tĩnh ─────
    return NextResponse.json({
      response: await getFallbackResponse(trimmedMessage),
      source: "fallback",
    });
  } catch (error) {
    console.error("Consult API error:", error);
    return NextResponse.json(
      { response: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau!" },
      { status: 500 }
    );
  }
}
