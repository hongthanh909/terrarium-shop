/**
 * AI Consultation API Route — v5 (Intent-Aware + Streaming + Rate Limiting)
 *
 * - Intent Classification: phân loại ý định khách (kiến thức/sản phẩm/chính sách/chẩn đoán)
 * - Khi Ollama online: stream từng token về client (như ChatGPT gõ từng chữ)
 * - Khi Ollama offline: fallback về DB query hoặc knowledge base tĩnh (vẫn JSON bình thường)
 * - Rate limiting: 6 request/phút/IP
 * - Concurrency: tối đa 2 Ollama inference đồng thời
 *
 * POST /api/consult
 * Body: { message: string, history?: { role: "user"|"assistant", content: string }[], pageContext?: PageContext }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================
// RATE LIMITING — In-memory, per-IP
// 6 requests / phút. Auto-cleanup mỗi 2 phút
// =============================================
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 phút
const RATE_LIMIT_MAX = 6;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// Cleanup expired entries mỗi 2 phút
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitMap.entries()).forEach(([key, val]) => {
    if (now - val.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  });
}, 120_000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true; // OK
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // BLOCKED
  }

  entry.count++;
  return true; // OK
}

// =============================================
// CONCURRENCY GUARD — Chỉ cho tối đa 2 Ollama inference đồng thời
// VPS 8GB RAM: 2 PM2 instances + Ollama → chỉ đủ 2 concurrent AI
// =============================================
let activeOllamaRequests = 0;
const MAX_CONCURRENT_OLLAMA = 2;

// =============================================
// LOAD CATALOG SẢN PHẨM THẬT TỪ DB
// Cache 5 phút để tránh query DB mỗi request
// =============================================
type CatalogResult =
  | { type: "ok"; text: string }
  | { type: "empty" }
  | { type: "error" };

let productCatalogCache: {
  result: CatalogResult;
  fetchedAt: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

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
// PAGE CONTEXT TYPE — from ChatWidget
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
// SYSTEM PROMPT ĐỘNG — v5 (Page-Context Aware)
// Nâng cấp: nhận biết trang user đang xem
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

    // Inject page context
    if (pageContext?.type === "product" && pageContext.productName) {
      prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang xem SẢN PHẨM: "${pageContext.productName}"${pageContext.productPrice ? ` — Giá: ${pageContext.productPrice}` : ""}${pageContext.categoryName ? ` — Danh mục: ${pageContext.categoryName}` : ""}\n- Ưu tiên trả lời về sản phẩm này\n- Gợi ý mua kèm phụ kiện, so sánh với SP cùng danh mục`;
    } else if (pageContext?.type === "explore") {
      prompt += `\n\n═══ NGỮ CẢNH ═══\nKhách đang xem trang KHÁM PHÁ. Gợi ý sản phẩm hot, deal giảm giá.`;
    } else if (pageContext?.type === "checkout") {
      prompt += `\n\n═══ NGỮ CẢNH ═══\nKhách đang THANH TOÁN. Hỗ trợ vận chuyển, mã giảm giá, chính sách đổi trả.`;
    } else if (pageContext?.type === "orders") {
      prompt += `\n\n═══ NGỮ CẢNH ═══\nKhách đang xem ĐƠN HÀNG. Hỗ trợ tình trạng đơn, bảo hành, đổi trả.`;
    } else if (pageContext?.type === "blog") {
      prompt += `\n\n═══ NGỮ CẢNH ═══\nKhách đang đọc BLOG. Gợi ý sản phẩm liên quan.`;
    }

    return prompt;
  }

  if (catalog.type === "empty") {
    let prompt = `${baseRole}

THÔNG TIN QUAN TRỌNG: Hiện tại shop CHƯA CÓ SẢN PHẨM đang bán.
- TUYỆT ĐỐI KHÔNG bịa tên sản phẩm hoặc giá tiền
- Khi khách hỏi sản phẩm: nói shop đang cập nhật, đề nghị liên hệ Zalo/Facebook
- Vẫn tư vấn kiến thức chăm sóc terrarium nói chung`;

    if (pageContext?.type && pageContext.type !== "general" && pageContext.type !== "home") {
      prompt += `\n\nKhách đang ở trang: ${pageContext.type.toUpperCase()}.`;
    }

    return prompt;
  }

  // catalog.type === "error"
  let prompt = `${baseRole}

THÔNG TIN QUAN TRỌNG: Không thể tải danh sách sản phẩm lúc này.
- TUYỆT ĐỐI KHÔNG đoán mò hoặc bịa sản phẩm/giá
- Khi khách hỏi sản phẩm: xin lỗi và đề nghị xem trực tiếp trang Sản Phẩm
- Vẫn tư vấn kiến thức chăm sóc terrarium nói chung`;

  // ── Inject page context ──────────────────────
  if (pageContext) {
    switch (pageContext.type) {
      case "product":
        if (pageContext.productName) {
          prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang xem SẢN PHẨM: "${pageContext.productName}"${pageContext.productPrice ? ` — Giá: ${pageContext.productPrice}` : ""}${pageContext.categoryName ? ` — Danh mục: ${pageContext.categoryName}` : ""}\n- Ưu tiên trả lời về sản phẩm này (chăm sóc, ưu nhược điểm, so sánh, gợi ý mua kèm)\n- Nếu khách hỏi sản phẩm khác → vẫn gợi ý nhưng nhắc sản phẩm đang xem`;
        }
        break;
      case "blog":
        prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang đọc BLOG. Có thể gợi ý sản phẩm liên quan đến bài viết hoặc tư vấn chăm sóc.`;
        break;
      case "explore":
        prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang xem trang KHÁM PHÁ (explore). Giúp khách tìm sản phẩm phù hợp, so sánh, gợi ý hot deal.`;
        break;
      case "checkout":
        prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang ở trang THANH TOÁN. Tập trung hỗ trợ: vận chuyển, mã giảm giá, phương thức thanh toán, chính sách đổi trả.`;
        break;
      case "orders":
        prompt += `\n\n═══ NGỮ CẢNH TRANG HIỆN TẠI ═══\nKhách đang xem ĐƠN HÀNG. Hỗ trợ: tình trạng đơn, bảo hành, đổi trả, liên hệ shop.`;
        break;
    }
  }

  return prompt;
}

// =============================================
// FALLBACK KNOWLEDGE BASE (from Database)
// Cached for 5 minutes, admin-editable
// =============================================
let knowledgeCache: { keyword: string; response: string; priority: number }[] | null = null;
let knowledgeCacheTime = 0;
const KNOWLEDGE_CACHE_TTL = 5 * 60 * 1000; // 5 phút

async function getKnowledgeBase(): Promise<{ keyword: string; response: string; priority: number }[]> {
  const now = Date.now();
  if (knowledgeCache && now - knowledgeCacheTime < KNOWLEDGE_CACHE_TTL) {
    return knowledgeCache;
  }

  try {
    const entries = await prisma.aiKnowledge.findMany({
      where: { isActive: true },
      select: { keyword: true, response: true, priority: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    knowledgeCache = entries;
    knowledgeCacheTime = now;
    return entries;
  } catch (err) {
    console.error("Failed to load AI knowledge from DB:", err);
    // Return empty if DB fails — sẽ dùng default response
    return knowledgeCache || [];
  }
}

async function getFallbackResponse(message: string): Promise<string> {
  const lower = message.toLowerCase();

  if (/xin chào|hello|hi|chào|alo/.test(lower)) {
    return "Xin chào! 🌿 Em là trợ lý AI của Tiệm Rêu. Em có thể giúp anh/chị về:\n• Gợi ý sản phẩm terrarium phù hợp\n• Chăm sóc cây và xử lý sự cố bể\n• Giá cả, đặt hàng và vận chuyển\n\nAnh/chị cần tư vấn gì ạ?";
  }

  if (/cảm ơn|thank/.test(lower)) {
    return "Dạ không có gì! 😊 Chúc anh/chị chăm sóc terrarium thật vui. Nếu cần hỗ trợ thêm, cứ hỏi em nhé! 🌱";
  }

  // Query from database
  const knowledge = await getKnowledgeBase();

  // Match by keyword (sorted by priority already)
  for (const entry of knowledge) {
    if (lower.includes(entry.keyword)) {
      return entry.response;
    }
  }

  return "Dạ cảm ơn anh/chị! 🌿 Em có thể tư vấn về sản phẩm terrarium, cách chăm sóc cây, xử lý sự cố bể, giá cả và đặt hàng. Anh/chị hỏi cụ thể hơn để em hỗ trợ tốt nhất nhé!";
}

// =============================================
// STREAMING RESPONSE TỪ OLLAMA
// =============================================
async function streamFromOllama(
  message: string,
  history: { role: string; content: string }[],
  pageContext?: PageContext
): Promise<ReadableStream<Uint8Array> | null> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaUrl) return null;

  // Concurrency guard
  if (activeOllamaRequests >= MAX_CONCURRENT_OLLAMA) {
    return null; // Fallback — quá tải
  }

  activeOllamaRequests++;

  try {
    const systemPrompt = await buildSystemPrompt(pageContext);
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4), // Giới hạn 4 tin nhắn gần nhất (tối ưu tốc độ)
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3.2:3b",
        messages,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 350,
          top_p: 0.9,
          stop: ["\nUser:", "User:", "\nKhách:", "Khách:"],
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!ollamaRes.ok || !ollamaRes.body) {
      activeOllamaRequests--;
      return null;
    }

    const encoder = new TextEncoder();
    const ollamaBody = ollamaRes.body;

    const readable = new ReadableStream<Uint8Array>({
      async start(streamController) {
        const reader = ollamaBody.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const token = json?.message?.content ?? "";
                if (token) {
                  streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
                if (json?.done) {
                  streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
                }
              } catch {
                // Dòng JSON không hợp lệ → bỏ qua
              }
            }
          }
        } catch {
          streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } finally {
          activeOllamaRequests--;
          streamController.close();
        }
      },
    });

    return readable;
  } catch {
    activeOllamaRequests--;
    return null;
  }
}

// =============================================
// ROUTE HANDLER
// =============================================
export async function POST(request: Request) {
  try {
    // ── Rate Limiting ────────────────────────────
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({
        response: "Dạ anh/chị đang gửi hơi nhanh, vui lòng đợi 1 phút rồi hỏi lại nhé! 🌿 Em luôn sẵn sàng tư vấn ạ.",
        rateLimited: true,
      }, { status: 429 });
    }

    const body = await request.json();
    const { message, history = [], pageContext } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ response: "Vui lòng nhập câu hỏi." });
    }

    const trimmedMessage = message.trim();

    // ── Guardrail: Chặn tin nhắn quá dài ────────
    if (trimmedMessage.length > 400) {
      return NextResponse.json({
        response: "Dạ, câu hỏi của anh/chị hơi dài. Anh/chị tóm tắt ngắn gọn dưới 400 ký tự để em hỗ trợ nhanh nhất nhé! 🌿",
      });
    }

    // ── Thử Streaming từ Ollama ──────────────────
    const stream = await streamFromOllama(trimmedMessage, history, pageContext);

    if (stream) {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Source": "ai",
        },
      });
    }

    // ── Fallback lớp 2: DB query trực tiếp ──────
    if (/mua|giá|bao nhiêu|gợi ý sản phẩm|tìm (bể|sản phẩm)|đặt hàng|thêm vào giỏ|còn hàng|hết hàng|combo|freeship|khuyến mãi|giảm giá/i.test(trimmedMessage)) {
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
