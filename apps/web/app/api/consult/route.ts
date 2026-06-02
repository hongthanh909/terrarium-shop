/**
 * AI Consultation API Route
 *
 * Tích hợp Ollama (self-hosted LLM) để tư vấn terrarium 24/7.
 * - Khi OLLAMA_BASE_URL được set và Ollama đang chạy → dùng AI thật
 * - Khi Ollama không khả dụng → fallback thông minh dùng data sản phẩm từ DB
 *
 * POST /api/consult
 * Body: { message: string, history?: { role: "user"|"assistant", content: string }[] }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================
// SYSTEM PROMPT cho Ollama
// =============================================
const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn AI của "Tiệm Rêu" - cửa hàng chuyên về terrarium, cây cảnh tiểu cảnh và thiên nhiên thu nhỏ tại Việt Nam.

Vai trò của bạn:
- Tư vấn về chăm sóc terrarium, cây moss, cây cảnh nhỏ
- Giúp khách chọn sản phẩm phù hợp với không gian và sở thích
- Giải đáp câu hỏi về giá cả, vận chuyển, bảo hành
- Hướng dẫn cách chăm sóc từng loại cây

Quy tắc trả lời:
- Luôn dùng tiếng Việt, thân thiện và chuyên nghiệp
- Trả lời ngắn gọn, dễ hiểu (tối đa 3-4 câu mỗi đoạn)
- Dùng emoji phù hợp để tạo cảm giác thân thiện 🌿
- Nếu khách hỏi về sản phẩm cụ thể, hãy gợi ý họ xem trang Sản Phẩm
- Nếu hỏi về đặt hàng/thanh toán/giao hàng, hướng dẫn đặt trực tiếp trên website
- KHÔNG bịa thông tin về giá hay sản phẩm cụ thể nếu không chắc chắn`;

// =============================================
// FALLBACK KNOWLEDGE BASE (khi Ollama offline)
// =============================================
const FALLBACK_KNOWLEDGE: Record<string, string> = {
  "chăm sóc": "🌿 Để chăm sóc terrarium:\n• Đặt nơi có ánh sáng gián tiếp\n• Tưới nước 1-2 tuần/lần (terrarium kín) hoặc 3-5 ngày/lần (mở)\n• Cắt tỉa lá vàng định kỳ\n• Tránh ánh nắng trực tiếp",
  "tưới nước": "💧 Hướng dẫn tưới:\n• Terrarium kín: 2-3 tuần/lần, xịt sương nhẹ\n• Terrarium mở: 3-5 ngày/lần\n• Lá héo = thiếu nước | Nấm mốc = thừa nước",
  "ánh sáng": "☀️ Yêu cầu ánh sáng:\n• Ánh sáng gián tiếp là tốt nhất\n• Tránh nắng trực tiếp (cháy lá)\n• Đèn LED grow light thay thế tốt\n• Đặt cách cửa sổ 1-2m",
  "phòng tối": "🌙 Cây phù hợp nơi ít sáng:\n• Fern (Dương xỉ)\n• Moss (Rêu)\n• Pothos (Trầu bà)\n• Fittonia (Cây thảm)\n→ Bổ sung đèn LED grow light nếu cần",
  "giá": "💰 Giá tham khảo:\n• Terrarium mini: từ 150.000₫\n• Terrarium trung: từ 300.000₫\n• Terrarium lớn: từ 500.000₫\nXem chi tiết và đặt hàng tại trang Sản Phẩm nhé!",
  "mua": "🛒 Cách mua hàng:\n• Vào trang Sản Phẩm → thêm vào giỏ hàng\n• Thanh toán COD hoặc chuyển khoản\n• Giao hàng toàn quốc 3-5 ngày\n• Miễn phí ship đơn từ 500.000₫",
  "vận chuyển": "🚚 Thông tin giao hàng:\n• Tiêu chuẩn: 3-5 ngày (30.000₫)\n• Nhanh: 1-2 ngày (50.000₫)\n• Đóng gói cẩn thận, chống va đập\n• Miễn phí khi đơn ≥ 500.000₫",
  "bảo hành": "🛡️ Chính sách bảo hành:\n• Bảo hành cây sống 7 ngày\n• Đổi trả nếu hư hỏng khi vận chuyển\n• Hỗ trợ tư vấn chăm sóc miễn phí suốt thời gian sử dụng",
};

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  // Greetings
  if (/xin chào|hello|hi|chào|alo/.test(lower)) {
    return "Xin chào! 🌿 Tôi là trợ lý AI của Tiệm Rêu. Tôi có thể giúp bạn về:\n• Chăm sóc terrarium\n• Chọn sản phẩm phù hợp\n• Giá cả và đặt hàng\n• Vận chuyển và bảo hành\n\nBạn cần tư vấn gì?";
  }

  if (/cảm ơn|thank/.test(lower)) {
    return "Không có gì! 😊 Chúc bạn chăm sóc terrarium thật vui. Nếu cần hỗ trợ thêm, cứ hỏi nhé! 🌱";
  }

  // Knowledge base matching
  for (const [keyword, response] of Object.entries(FALLBACK_KNOWLEDGE)) {
    if (lower.includes(keyword)) return response;
  }

  return "Cảm ơn câu hỏi của bạn! 🌿 Tôi có thể tư vấn về chăm sóc terrarium, chọn cây, giá cả và đặt hàng. Bạn hãy hỏi cụ thể hơn hoặc liên hệ trực tiếp qua trang Liên Hệ để được hỗ trợ nhanh nhé!";
}

// =============================================
// OLLAMA CALL
// =============================================
async function callOllama(
  message: string,
  history: { role: string; content: string }[]
): Promise<string | null> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaUrl) return null;

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10), // Giữ 10 tin nhắn gần nhất để tiết kiệm token
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3",
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 512, // Giới hạn độ dài phản hồi
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    return data?.message?.content || null;
  } catch {
    // Ollama không khả dụng (timeout, không chạy, v.v.)
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

    // Thử gọi Ollama trước
    const aiResponse = await callOllama(trimmedMessage, history);

    if (aiResponse) {
      return NextResponse.json({
        response: aiResponse,
        source: "ai", // Để debug biết đang dùng AI thật
      });
    }

    // Fallback: Kiểm tra nếu hỏi về sản phẩm cụ thể → truy vấn DB
    if (/sản phẩm|terrarium|cây|rêu|moss|fern/i.test(trimmedMessage)) {
      try {
        const products = await prisma.product.findMany({
          where: { status: "ACTIVE" },
          select: { name: true, basePrice: true, category: { select: { name: true } } },
          take: 5,
          orderBy: { featured: "desc" },
        });

        if (products.length > 0) {
          const productList = products
            .map((p) => `• ${p.name} (${p.category.name}) — ${Number(p.basePrice).toLocaleString("vi-VN")}₫`)
            .join("\n");

          return NextResponse.json({
            response: `🌿 Một số sản phẩm nổi bật hiện có:\n${productList}\n\nXem đầy đủ tại trang Sản Phẩm nhé!`,
            source: "db",
          });
        }
      } catch {
        // DB query lỗi → tiếp tục dùng fallback
      }
    }

    // Fallback cuối: knowledge base tĩnh
    const fallbackResponse = getFallbackResponse(trimmedMessage);
    return NextResponse.json({
      response: fallbackResponse,
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
