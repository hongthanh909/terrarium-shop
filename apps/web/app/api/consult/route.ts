/**
 * AI Consultation API Route — v4 (Streaming + Rate Limiting + Concurrency Guard)
 *
 * - Khi Ollama online: stream từng token về client (như ChatGPT gõ từng chữ)
 * - Khi Ollama offline: fallback về DB query hoặc knowledge base tĩnh (vẫn JSON bình thường)
 * - Rate limiting: 6 request/phút/IP
 * - Concurrency: tối đa 2 Ollama inference đồng thời
 *
 * POST /api/consult
 * Body: { message: string, history?: { role: "user"|"assistant", content: string }[] }
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
  for (const [key, val] of rateLimitMap) {
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
        careGuide: {
          select: {
            watering: true,
            sunlight: true,
            temperature: true,
            humidity: true,
            commonIssues: true,
          },
        },
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
          ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫ (giảm từ ${Number(p.basePrice).toLocaleString("vi-VN")}₫)`
          : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`;
        const stock = p.inventory > 0 ? `còn hàng (${p.inventory} sp)` : "hết hàng";
        const care = p.careGuide
          ? ` | Tưới: ${p.careGuide.watering}, Sáng: ${p.careGuide.sunlight}, Nhiệt độ: ${p.careGuide.temperature}${p.careGuide.humidity ? `, Ẩm: ${p.careGuide.humidity}` : ""}${p.careGuide.commonIssues ? ` | Lưu ý: ${p.careGuide.commonIssues}` : ""}`
          : "";
        const featured = p.featured ? " ⭐" : "";
        return `- ${p.name}${featured} [${p.category.name}] — ${price} — ${stock}${care} | Link: /products/${p.slug}`;
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
// SYSTEM PROMPT ĐỘNG — v4
// Nâng cấp: chẩn đoán bể, chăm sóc, cross-sell, chốt đơn
// =============================================
async function buildSystemPrompt(): Promise<string> {
  const catalog = await getProductCatalog();

  const baseRole = `Bạn là trợ lý tư vấn AI bán hàng chuyên nghiệp của "Tiệm Rêu" — thương hiệu terrarium, tiểu cảnh và thiên nhiên thu nhỏ hàng đầu tại Việt Nam.

═══ QUY TẮC BẮT BUỘC ═══

1. NGÔN NGỮ: Luôn dùng tiếng Việt ấm áp, thân thiện, lịch sự. Dùng emoji 🌿 nhẹ nhàng. Xưng "em", gọi khách "anh/chị".

2. PHẠM VI: CHỈ trả lời về terrarium, cây cảnh, tiểu cảnh, rêu, dụng cụ chăm sóc, sản phẩm shop Tiệm Rêu.
   - Nếu khách hỏi ngoài lề (toán, code, chính trị, AI, khoa học khác): từ chối nhẹ nhàng, hướng về terrarium.
   - Ví dụ: "Dạ em chỉ chuyên về terrarium thôi ạ 🌿 Anh/chị có muốn em tư vấn sản phẩm hoặc cách chăm sóc bể không?"

3. ĐỘ DÀI: Trả lời ngắn gọn 3-5 câu. Không viết dài dòng. Tập trung giải quyết đúng câu hỏi.

4. KHÔNG BỊA: TUYỆT ĐỐI không đề cập sản phẩm, giá, link KHÔNG CÓ trong danh sách bên dưới. Nếu không biết → nói "Em chưa có thông tin, anh/chị xem thêm tại trang Sản Phẩm nhé".

═══ NGHIỆP VỤ BÁN HÀNG ═══

1. CHỐT ĐƠN: Khi tư vấn sản phẩm, LUÔN kèm link dạng "Link: /products/[slug]". Khuyến khích: "Anh/chị bấm vào link để xem ảnh thật và đặt hàng ngay nhé!"

2. CROSS-SELL: Nếu khách mua bình terrarium kín → gợi ý nhẹ nhàng mua kèm dụng cụ (nhíp dài tỉa cây, bình xịt phun sương). Nếu mua bể mở → gợi ý rêu, đá trang trí.

3. FREESHIP: Shop miễn phí vận chuyển cho đơn từ 500.000₫. Nếu đơn khách gần mốc 500k → khuyên lấy thêm phụ kiện nhỏ để được freeship.

4. COMBO: Nếu khách mua nhiều hoặc làm quà → gợi ý xem combo (tiết kiệm hơn mua lẻ).

═══ CHẨN ĐOÁN TÌNH TRẠNG BỂ ═══

Khi khách mô tả vấn đề với bể terrarium, hãy chẩn đoán theo kiến thức sau:

• NẤM MỐC (trắng/xám trên đất hoặc cây):
  → Nguyên nhân: quá ẩm, thiếu thông gió
  → Xử lý: Mở nắp 24-48h thoáng khí, dùng tăm bông lau sạch nấm, giảm tưới, thêm than hoạt tính

• RÊU CHUYỂN NÂU/VÀNG:
  → Nguyên nhân: thiếu ánh sáng hoặc tưới quá nhiều
  → Xử lý: Di chuyển đến nơi sáng gián tiếp hơn, kiểm tra độ ẩm đất

• LÁ VÀNG/HÉO:
  → Nếu lá mềm rũ = thiếu nước → tưới nhẹ
  → Nếu lá vàng từ gốc + đất ướt = thừa nước → mở nắp cho thoáng, giảm tưới

• CÔN TRÙNG NHỎ (ruồi giấm, bọ nhảy):
  → Nguyên nhân: đất quá ẩm, chất hữu cơ phân hủy
  → Xử lý: Để đất khô hơn giữa các lần tưới, phủ cát mỏng lên mặt đất

• SƯƠNG MÙ QUÁ NHIỀU (bể kín):
  → Bình thường nếu ít, nhưng nếu không nhìn thấy bên trong → mở nắp 30 phút/ngày

═══ TƯ VẤN THEO NHU CẦU KHÁCH ═══

Khi khách chưa biết chọn gì, hãy hỏi nhẹ nhàng:
- "Anh/chị mua để tự dùng hay làm quà tặng ạ?"
- "Anh/chị đã từng chơi terrarium chưa? Mới bắt đầu hay đã có kinh nghiệm?"
- "Budget anh/chị dự kiến khoảng bao nhiêu ạ?"

Từ đó gợi ý 1-3 sản phẩm phù hợp nhất từ danh sách.`;

  if (catalog.type === "ok") {
    return `${baseRole}

═══ DANH SÁCH SẢN PHẨM SHOP (dữ liệu thật) ═══
${catalog.text}

Quy tắc sản phẩm:
- Gợi ý TỐI ĐA 3 sản phẩm phù hợp nhất, kèm giá + link
- Ưu tiên sản phẩm ⭐ (nổi bật) và "còn hàng"
- KHÔNG đề xuất sản phẩm không có trong danh sách trên
- Sản phẩm "hết hàng" → vẫn đề cập nhưng ghi rõ hết hàng`;
  }

  if (catalog.type === "empty") {
    return `${baseRole}

THÔNG TIN QUAN TRỌNG: Hiện tại shop CHƯA CÓ SẢN PHẨM đang bán.
- TUYỆT ĐỐI KHÔNG bịa tên sản phẩm hoặc giá tiền
- Khi khách hỏi sản phẩm: nói shop đang cập nhật, đề nghị liên hệ Zalo/Facebook
- Vẫn tư vấn kiến thức chăm sóc terrarium nói chung`;
  }

  // catalog.type === "error"
  return `${baseRole}

THÔNG TIN QUAN TRỌNG: Không thể tải danh sách sản phẩm lúc này.
- TUYỆT ĐỐI KHÔNG đoán mò hoặc bịa sản phẩm/giá
- Khi khách hỏi sản phẩm: xin lỗi và đề nghị xem trực tiếp trang Sản Phẩm
- Vẫn tư vấn kiến thức chăm sóc terrarium nói chung`;
}

// =============================================
// FALLBACK KNOWLEDGE BASE (khi Ollama offline)
// =============================================
const FALLBACK_KNOWLEDGE: Record<string, string> = {
  "chăm sóc": "🌿 Để chăm sóc terrarium:\n• Đặt nơi có ánh sáng gián tiếp\n• Tưới nước 1-2 tuần/lần (terrarium kín) hoặc 3-5 ngày/lần (mở)\n• Cắt tỉa lá vàng định kỳ\n• Tránh ánh nắng trực tiếp",
  "tưới nước": "💧 Hướng dẫn tưới:\n• Terrarium kín: 2-3 tuần/lần, xịt sương nhẹ\n• Terrarium mở: 3-5 ngày/lần\n• Lá héo = thiếu nước | Nấm mốc = thừa nước",
  "ánh sáng": "☀️ Yêu cầu ánh sáng:\n• Ánh sáng gián tiếp là tốt nhất\n• Tránh nắng trực tiếp (cháy lá)\n• Đèn LED grow light thay thế tốt\n• Đặt cách cửa sổ 1-2m",
  "phòng tối": "🌙 Cây phù hợp nơi ít sáng:\n• Fern (Dương xỉ)\n• Moss (Rêu)\n• Pothos (Trầu bà)\n• Fittonia (Cây thảm)\n→ Bổ sung đèn LED grow light nếu cần",
  "nấm": "🔬 Xử lý nấm mốc trong bể:\n• Mở nắp 24-48h cho thoáng khí\n• Dùng tăm bông lau sạch nấm\n• Giảm tần suất tưới\n• Thêm than hoạt tính vào lớp đất\n• Nếu nặng: thay đất mới",
  "côn trùng": "🐛 Xử lý côn trùng nhỏ:\n• Để đất khô hơn giữa các lần tưới\n• Phủ cát mỏng lên mặt đất\n• Dùng bẫy dính vàng\n• Tránh dùng thuốc trừ sâu hóa học",
  "héo": "🍂 Cây bị héo:\n• Lá mềm rũ = thiếu nước → tưới nhẹ\n• Lá vàng + đất ướt = thừa nước → mở nắp thoáng, giảm tưới\n• Lá cháy viền = nắng trực tiếp → di chuyển vào chỗ mát",
  "mua": "🛒 Cách mua hàng:\n• Vào trang Sản Phẩm → thêm vào giỏ hàng\n• Thanh toán COD hoặc chuyển khoản\n• Giao hàng toàn quốc 3-5 ngày\n• Miễn phí ship đơn từ 500.000₫",
  "vận chuyển": "🚚 Thông tin giao hàng:\n• Tiêu chuẩn: 3-5 ngày (30.000₫)\n• Nhanh: 1-2 ngày (50.000₫)\n• Đóng gói cẩn thận, chống va đập\n• Miễn phí khi đơn ≥ 500.000₫",
  "bảo hành": "🛡️ Chính sách bảo hành:\n• Bảo hành cây sống 7 ngày\n• Đổi trả nếu hư hỏng khi vận chuyển\n• Hỗ trợ tư vấn chăm sóc miễn phí suốt thời gian sử dụng",
  "voucher": "🎟️ Voucher giảm giá:\n• Xem mã giảm giá tại trang Khám Phá\n• Nhập mã khi thanh toán\n• Một số voucher có giới hạn số lượng\n• Miễn phí ship cho đơn từ 500.000₫",
  "combo": "🎁 Combo sản phẩm:\n• Combo tiết kiệm hơn mua lẻ\n• Phù hợp làm quà tặng\n• Có thể thêm đèn LED\n• Xem tại trang Sản Phẩm mục Combo",
  "terrarium kín": "🫙 Terrarium kín (bể kín):\n• Hệ sinh thái tự cung tự cấp\n• Tưới 2-3 tuần/lần (rất ít)\n• Ánh sáng gián tiếp\n• Nếu quá nhiều sương → mở nắp 30 phút/ngày\n• Phù hợp: người bận rộn, ít kinh nghiệm",
  "terrarium mở": "🌱 Terrarium mở:\n• Cần tưới thường xuyên hơn (3-5 ngày/lần)\n• Thoáng khí tốt, ít nấm mốc\n• Phù hợp: cây mọng nước, xương rồng, fern\n• Cần chú ý độ ẩm môi trường",
};

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (/xin chào|hello|hi|chào|alo/.test(lower)) {
    return "Xin chào! 🌿 Em là trợ lý AI của Tiệm Rêu. Em có thể giúp anh/chị về:\n• Gợi ý sản phẩm terrarium phù hợp\n• Chăm sóc cây và xử lý sự cố bể\n• Giá cả, đặt hàng và vận chuyển\n\nAnh/chị cần tư vấn gì ạ?";
  }

  if (/cảm ơn|thank/.test(lower)) {
    return "Dạ không có gì! 😊 Chúc anh/chị chăm sóc terrarium thật vui. Nếu cần hỗ trợ thêm, cứ hỏi em nhé! 🌱";
  }

  for (const [keyword, response] of Object.entries(FALLBACK_KNOWLEDGE)) {
    if (lower.includes(keyword)) return response;
  }

  return "Dạ cảm ơn anh/chị! 🌿 Em có thể tư vấn về sản phẩm terrarium, cách chăm sóc cây, xử lý sự cố bể, giá cả và đặt hàng. Anh/chị hỏi cụ thể hơn để em hỗ trợ tốt nhất nhé!";
}

// =============================================
// STREAMING RESPONSE TỪ OLLAMA
// =============================================
async function streamFromOllama(
  message: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaUrl) return null;

  // Concurrency guard
  if (activeOllamaRequests >= MAX_CONCURRENT_OLLAMA) {
    return null; // Fallback — quá tải
  }

  activeOllamaRequests++;

  try {
    const systemPrompt = await buildSystemPrompt();
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6), // Giới hạn 6 tin nhắn gần nhất (tiết kiệm token)
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3:8b",
        messages,
        stream: true,
        options: {
          temperature: 0.6,
          num_predict: 400,
          top_p: 0.85,
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
    const { message, history = [] } = body;

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
    const stream = await streamFromOllama(trimmedMessage, history);

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
    if (/sản phẩm|terrarium|cây|rêu|moss|fern|mua|gợi ý|muốn|cần|tìm|giá|bao nhiêu|combo/i.test(trimmedMessage)) {
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
