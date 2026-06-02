/**
 * AI Consultation API Route — v3 (Streaming)
 *
 * - Khi Ollama online: stream từng token về client (như ChatGPT gõ từng chữ)
 * - Khi Ollama offline: fallback về DB query hoặc knowledge base tĩnh (vẫn JSON bình thường)
 *
 * POST /api/consult
 * Body: { message: string, history?: { role: "user"|"assistant", content: string }[] }
 *
 * Response headers:
 *   Content-Type: text/event-stream  (khi AI streaming)
 *   Content-Type: application/json   (khi fallback)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================
// LOAD CATALOG SẢN PHẨM THẬT TỪ DB
// Trả về object có type để system prompt xử lý đúng
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
        basePrice: true,
        salePrice: true,
        inventory: true,
        featured: true,
        category: { select: { name: true } },
        careGuide: { select: { watering: true, sunlight: true, temperature: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    if (products.length === 0) {
      const result: CatalogResult = { type: "empty" };
      productCatalogCache = { result, fetchedAt: now };
      return result;
    }

    const text = products
      .map((p) => {
        const price = p.salePrice
          ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫ (sale từ ${Number(p.basePrice).toLocaleString("vi-VN")}₫)`
          : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`;
        const stock = p.inventory > 0 ? `còn hàng (${p.inventory} sp)` : "hết hàng";
        const care = p.careGuide
          ? ` | Tưới: ${p.careGuide.watering}, Sáng: ${p.careGuide.sunlight}`
          : "";
        const featured = p.featured ? " ⭐" : "";
        return `- ${p.name}${featured} [${p.category.name}] — ${price} — ${stock}${care}`;
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
// SYSTEM PROMPT ĐỘNG
// =============================================
async function buildSystemPrompt(): Promise<string> {
  const catalog = await getProductCatalog();

  const baseRole = `Bạn là trợ lý tư vấn AI của "Tiệm Rêu" - cửa hàng chuyên về terrarium, cây cảnh tiểu cảnh và thiên nhiên thu nhỏ tại Việt Nam.

Quy tắc trả lời TUYỆT ĐỐI phải tuân thủ:
- Luôn dùng tiếng Việt, thân thiện và chuyên nghiệp
- Trả lời ngắn gọn (3-5 câu), dùng emoji nhẹ nhàng 🌿
- Với câu hỏi kỹ thuật chăm sóc: trả lời chi tiết, chính xác
- Khuyến khích khách đặt hàng trực tiếp trên website`;

  if (catalog.type === "ok") {
    return `${baseRole}

DANH SÁCH SẢN PHẨM HIỆN CÓ TRONG SHOP (dữ liệu thật từ hệ thống):
${catalog.text}

Quy tắc về sản phẩm:
- Khi khách hỏi mua sắm: GỢI Ý TỐI ĐA 3 sản phẩm PHÙ HỢP NHẤT từ danh sách trên, kèm giá rõ ràng
- Ưu tiên sản phẩm ⭐ (featured) và "còn hàng"
- TUYỆT ĐỐI KHÔNG đề xuất bất kỳ sản phẩm nào KHÔNG CÓ trong danh sách trên
- Nếu sản phẩm "hết hàng", vẫn có thể đề cập nhưng ghi rõ là hết hàng`;
  }

  if (catalog.type === "empty") {
    return `${baseRole}

THÔNG TIN QUAN TRỌNG: Hiện tại shop CHƯA CÓ SẢN PHẨM nào đang bán.

Quy tắc về sản phẩm (BẮT BUỘC):
- TUYỆT ĐỐI KHÔNG liệt kê, đề xuất, hay bịa ra bất kỳ tên sản phẩm hoặc giá tiền nào
- Khi khách hỏi về sản phẩm/mua hàng: thành thật nói shop đang cập nhật sản phẩm mới
- Đề nghị khách liên hệ Zalo/Facebook của shop để biết thêm thông tin
- Vẫn có thể tư vấn kiến thức chăm sóc terrarium nói chung`;
  }

  // catalog.type === "error"
  return `${baseRole}

THÔNG TIN QUAN TRỌNG: Hệ thống không thể tải danh sách sản phẩm lúc này.

Quy tắc về sản phẩm (BẮT BUỘC):
- TUYỆT ĐỐI KHÔNG đoán mò, bịa ra hay liệt kê bất kỳ tên sản phẩm hoặc giá tiền nào
- Khi khách hỏi về sản phẩm cụ thể: xin lỗi và đề nghị khách xem trực tiếp trang Sản Phẩm
- Vẫn có thể tư vấn kiến thức chăm sóc terrarium nói chung`;
}

// =============================================
// FALLBACK KNOWLEDGE BASE (khi Ollama offline)
// =============================================
const FALLBACK_KNOWLEDGE: Record<string, string> = {
  "chăm sóc": "🌿 Để chăm sóc terrarium:\n• Đặt nơi có ánh sáng gián tiếp\n• Tưới nước 1-2 tuần/lần (terrarium kín) hoặc 3-5 ngày/lần (mở)\n• Cắt tỉa lá vàng định kỳ\n• Tránh ánh nắng trực tiếp",
  "tưới nước": "💧 Hướng dẫn tưới:\n• Terrarium kín: 2-3 tuần/lần, xịt sương nhẹ\n• Terrarium mở: 3-5 ngày/lần\n• Lá héo = thiếu nước | Nấm mốc = thừa nước",
  "ánh sáng": "☀️ Yêu cầu ánh sáng:\n• Ánh sáng gián tiếp là tốt nhất\n• Tránh nắng trực tiếp (cháy lá)\n• Đèn LED grow light thay thế tốt\n• Đặt cách cửa sổ 1-2m",
  "phòng tối": "🌙 Cây phù hợp nơi ít sáng:\n• Fern (Dương xỉ)\n• Moss (Rêu)\n• Pothos (Trầu bà)\n• Fittonia (Cây thảm)\n→ Bổ sung đèn LED grow light nếu cần",
  "mua": "🛒 Cách mua hàng:\n• Vào trang Sản Phẩm → thêm vào giỏ hàng\n• Thanh toán COD hoặc chuyển khoản\n• Giao hàng toàn quốc 3-5 ngày\n• Miễn phí ship đơn từ 500.000₫",
  "vận chuyển": "🚚 Thông tin giao hàng:\n• Tiêu chuẩn: 3-5 ngày (30.000₫)\n• Nhanh: 1-2 ngày (50.000₫)\n• Đóng gói cẩn thận, chống va đập\n• Miễn phí khi đơn ≥ 500.000₫",
  "bảo hành": "🛡️ Chính sách bảo hành:\n• Bảo hành cây sống 7 ngày\n• Đổi trả nếu hư hỏng khi vận chuyển\n• Hỗ trợ tư vấn chăm sóc miễn phí suốt thời gian sử dụng",
};

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (/xin chào|hello|hi|chào|alo/.test(lower)) {
    return "Xin chào! 🌿 Tôi là trợ lý AI của Tiệm Rêu. Tôi có thể giúp bạn về:\n• Gợi ý sản phẩm terrarium phù hợp\n• Chăm sóc cây và thiết kế tiểu cảnh\n• Giá cả, đặt hàng và vận chuyển\n\nBạn cần tư vấn gì?";
  }

  if (/cảm ơn|thank/.test(lower)) {
    return "Không có gì! 😊 Chúc bạn chăm sóc terrarium thật vui. Nếu cần hỗ trợ thêm, cứ hỏi nhé! 🌱";
  }

  for (const [keyword, response] of Object.entries(FALLBACK_KNOWLEDGE)) {
    if (lower.includes(keyword)) return response;
  }

  return "Cảm ơn câu hỏi của bạn! 🌿 Tôi có thể tư vấn về sản phẩm terrarium, cách chăm sóc cây, giá cả và đặt hàng. Bạn hãy hỏi cụ thể hơn hoặc liên hệ trực tiếp qua trang Liên Hệ để được hỗ trợ nhanh nhé!";
}

// =============================================
// STREAMING RESPONSE TỪ OLLAMA
// Trả về ReadableStream — client đọc từng token khi nhận
// =============================================
async function streamFromOllama(
  message: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaUrl) return null;

  try {
    const systemPrompt = await buildSystemPrompt();
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8),
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout cho stream

    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3.2:3b",
        messages,
        stream: true, // ← BẬT STREAMING
        options: {
          temperature: 0.65,
          num_predict: 600,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!ollamaRes.ok || !ollamaRes.body) return null;

    // Transform Ollama NDJSON stream → SSE text stream cho client
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
            buffer = lines.pop() ?? ""; // Giữ dòng chưa hoàn chỉnh

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const token = json?.message?.content ?? "";
                if (token) {
                  // Gửi từng token dạng SSE: "data: <token>\n\n"
                  streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
                if (json?.done) {
                  // Báo kết thúc stream
                  streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
                }
              } catch {
                // Dòng JSON không hợp lệ → bỏ qua
              }
            }
          }
        } catch {
          // Stream bị đứt giữa chừng → gửi DONE
          streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } finally {
          streamController.close();
        }
      },
    });

    return readable;
  } catch {
    return null;
  }
}

// =============================================
// ROUTE HANDLER
// =============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ response: "Vui lòng nhập câu hỏi." });
    }

    const trimmedMessage = message.trim();

    // ── Thử Streaming từ Ollama ──────────────────────────
    const stream = await streamFromOllama(trimmedMessage, history);

    if (stream) {
      // Trả về SSE stream — client sẽ đọc từng token
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Source": "ai", // Header để client biết đang dùng AI thật
        },
      });
    }

    // ── Fallback lớp 2: DB query trực tiếp ──────────────
    if (/sản phẩm|terrarium|cây|rêu|moss|fern|mua|gợi ý|muốn|cần|tìm/i.test(trimmedMessage)) {
      try {
        const products = await prisma.product.findMany({
          where: { status: "ACTIVE", inventory: { gt: 0 } },
          select: {
            name: true,
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
                ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫ (sale)`
                : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`;
              return `• ${p.name} [${p.category.name}] — ${price}`;
            })
            .join("\n");

          return NextResponse.json({
            response: `🌿 Một số sản phẩm nổi bật đang có hàng tại Tiệm Rêu:\n${productList}\n\nXem đầy đủ và đặt hàng tại trang Sản Phẩm nhé!`,
            source: "db",
          });
        }
      } catch {
        // tiếp tục fallback
      }
    }

    // ── Fallback lớp 3: Knowledge base tĩnh ─────────────
    return NextResponse.json({
      response: getFallbackResponse(trimmedMessage),
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
