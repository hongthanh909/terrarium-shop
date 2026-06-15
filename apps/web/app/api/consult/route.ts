/**
 * AI Consultation API Route — v7 (Smart Fallback + Gemini + Ollama)
 *
 * FLOW:
 * 1. Gemini API (primary, timeout 8s, 1 retry on 429)
 * 2. Ollama local (fallback, timeout 30s for CPU inference)
 * 3. Smart Knowledge Base (instant, intent-aware, 40+ patterns)
 *    → Đây là layer quan trọng nhất — khi AI offline, khách vẫn được tư vấn đầy đủ
 *
 * POST /api/consult
 * Body: { message, history?, pageContext? }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================
// RATE LIMITING
// =============================================
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

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
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// =============================================
// CONCURRENCY
// =============================================
let activeAiRequests = 0;
const MAX_CONCURRENT_AI = 3;

// =============================================
// PRODUCT CATALOG CACHE
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
// PAGE CONTEXT
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
// SYSTEM PROMPT (compact for Gemini token efficiency)
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

═══ DANH SÁCH SẢN PHẨM ═══
${catalog.text}

Quy tắc: Gợi ý TỐI ĐA 3 SP phù hợp, kèm giá + link. Ưu tiên ⭐ và còn hàng.`;

    if (pageContext?.type === "product" && pageContext.productName) {
      prompt += `\n\nKhách đang xem: "${pageContext.productName}"${pageContext.productPrice ? ` — ${pageContext.productPrice}` : ""}. Ưu tiên trả lời về SP này.`;
    }
    return prompt;
  }
  return baseRole;
}

// =============================================
// SMART KNOWLEDGE BASE — 40+ patterns
// Trả lời ngay, không cần AI, rất nhanh
// =============================================
function getSmartFallback(message: string): string | null {
  const q = message.toLowerCase().trim();

  // ── Chào hỏi ────────────────────────────────
  if (/^(xin chào|hello|hi|chào|hey|alo|helo)/i.test(q))
    return "Xin chào! 🌿 Em là trợ lý của Tiệm Rêu. Em có thể giúp anh/chị:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Giải đáp chính sách mua hàng\n\nAnh/chị muốn hỏi gì ạ?";

  if (/cảm ơn|thank|cám ơn/i.test(q))
    return "Dạ không có gì ạ! 😊 Nếu cần thêm thông tin, anh/chị cứ hỏi em nhé. Chúc anh/chị chăm sóc terrarium thật vui! 🌿";

  if (/tạm biệt|bye|goodbye/i.test(q))
    return "Dạ tạm biệt anh/chị! 👋🌿 Hẹn gặp lại, nếu cần tư vấn cứ quay lại nhé!";

  // ── Tư vấn chăm sóc ────────────────────────
  if (/tưới|tưới nước|bao lâu.*tưới|tưới.*bao lâu|cách tưới/i.test(q))
    return "🌿 **Hướng dẫn tưới nước terrarium:**\n\n• **Bể kín (có nắp):** Tưới 1-2 tuần/lần, phun sương nhẹ. Nếu thành bể đọng nước nhiều → bỏ nắp 24h cho thoát hơi.\n• **Bể mở (không nắp):** Tưới 3-5 ngày/lần, tùy độ ẩm phòng.\n• **Mẹo:** Dùng bình xịt phun sương, tưới vào gốc cây, tránh đọng nước trên lá.\n• **Dấu hiệu thiếu nước:** Lá héo, rêu khô. **Thừa nước:** Lá vàng, đất sũng.";

  if (/ánh sáng|nắng|để ở đâu|chỗ nào|vị trí|đặt.*đâu|phòng tối/i.test(q))
    return "☀️ **Ánh sáng cho terrarium:**\n\n• Cần ánh sáng **gián tiếp** 6-8h/ngày (gần cửa sổ nhưng không nắng trực tiếp).\n• Tránh nắng chiếu thẳng → cây bị cháy lá, bể nóng.\n• **Phòng tối:** Dùng đèn LED grow light chiếu 8-10h/ngày, cách bể 30-50cm.\n• Nhiệt độ lý tưởng: 18-28°C, tránh điều hòa thổi trực tiếp.";

  if (/rêu vàng|rêu.*vàng|vàng.*rêu|rêu.*héo|rêu.*chết/i.test(q))
    return "🍂 **Rêu bị vàng — Nguyên nhân & Cách xử lý:**\n\n• **Thiếu sáng:** Di chuyển bể đến nơi có ánh sáng gián tiếp nhiều hơn.\n• **Tưới quá nhiều:** Giảm tần suất tưới, mở nắp 24-48h cho thoát ẩm.\n• **Nấm mốc:** Nhẹ nhàng gỡ phần nấm, rắc quế bột, mở nắp.\n• **Già tự nhiên:** Rêu cũ sẽ vàng dần, cắt tỉa phần vàng để rêu mới mọc.";

  if (/nấm|mốc|nấm mốc|mọc nấm/i.test(q))
    return "🍄 **Xử lý nấm mốc trong terrarium:**\n\n1. **Mở nắp** bể 24-48h để giảm độ ẩm.\n2. Dùng nhíp/tăm bông **nhẹ nhàng lấy phần nấm** ra.\n3. Rắc **bột quế** lên vùng bị nấm (quế có tính kháng nấm tự nhiên).\n4. Giảm tần suất tưới, đảm bảo thoát nước tốt.\n5. Nếu nấm tái phát nhiều lần → có thể thay đất mới.\n\n💡 Nấm mốc nhẹ là bình thường trong hệ sinh thái kín, đừng quá lo nhé!";

  if (/héo|lá héo|cây héo|lá.*rũ|cây.*rũ|lá mềm/i.test(q))
    return "🥀 **Cây bị héo — Nguyên nhân & Xử lý:**\n\n• **Héo mềm (lá rũ xuống):** Thiếu nước → tưới nhẹ, phun sương lên lá.\n• **Héo + đất ướt:** Thừa nước → ngừng tưới, mở nắp 24-48h.\n• **Héo + lá vàng:** Rễ bị úng → kiểm tra thoát nước, có thể cần thay đất.\n• **Héo nhanh:** Kiểm tra nhiệt độ, tránh nắng trực tiếp và gió điều hòa.";

  if (/lá vàng|vàng lá|cây.*vàng|lá.*úa/i.test(q))
    return "💛 **Lá bị vàng — Nguyên nhân & Xử lý:**\n\n• **Lá vàng + đất ướt:** Thừa nước → giảm tưới, mở nắp cho thoát ẩm.\n• **Lá vàng + đất khô:** Thiếu nước → tưới ngay.\n• **Lá vàng + mềm nhũn:** Rễ bị thối → cần thay đất, cắt rễ hư.\n• **Lá già vàng tự nhiên:** Bình thường, cắt bỏ lá vàng để cây tập trung năng lượng.";

  if (/côn trùng|sâu|bọ|kiến|ruồi|muỗi|côn.*trùng/i.test(q))
    return "🐛 **Xử lý côn trùng trong terrarium:**\n\n• **Ruồi nhỏ (fungus gnats):** Để đất khô hơn giữa các lần tưới, phủ lớp cát/sỏi mỏng lên mặt đất.\n• **Kiến:** Ngâm chậu trong nước 30 phút để đuổi kiến.\n• **Sên/ốc:** Bắt thủ công, đặt bẫy bia.\n• **Phòng ngừa:** Luôn kiểm tra cây mới trước khi đưa vào bể.";

  if (/chăm sóc|cách chăm|hướng dẫn.*chăm|chăm.*thế nào|chăm.*sao|dễ chăm/i.test(q))
    return "🌿 **Hướng dẫn chăm sóc terrarium cơ bản:**\n\n1. **Ánh sáng:** Gián tiếp 6-8h/ngày, không nắng trực tiếp.\n2. **Tưới nước:**\n   • Bể kín: 1-2 tuần/lần\n   • Bể mở: 3-5 ngày/lần\n3. **Nhiệt độ:** 18-28°C, tránh nơi quá nóng/lạnh.\n4. **Cắt tỉa:** Loại bỏ lá vàng, héo, kiểm soát cây mọc quá to.\n5. **Nấm mốc:** Mở nắp 24-48h, rắc bột quế.\n\n💡 Terrarium rất dễ chăm! Chỉ cần chú ý ánh sáng và nước là đủ ạ.";

  if (/người mới|mới bắt đầu|lần đầu|newbie|beginner|bắt đầu.*terrarium|terrarium.*gì/i.test(q))
    return "🌱 **Terrarium cho người mới bắt đầu:**\n\n• **Bể kín** là lựa chọn tốt nhất — hệ sinh thái tự duy trì, ít cần chăm sóc.\n• Chọn cây dễ sống: rêu, cỏ ngọc, fitonia, phong thảo.\n• Bắt đầu với bể nhỏ để tập quen.\n• **Quy tắc lớp đất:** Sỏi thoát nước → than hoạt tính → đất trồng → rêu.\n\nAnh/chị muốn em gợi ý sản phẩm phù hợp cho người mới không ạ? 🌿";

  if (/bể kín|terrarium kín|kín.*hay.*mở|mở.*hay.*kín|loại nào|loại.*terrarium/i.test(q))
    return "🏺 **So sánh Bể Kín vs Bể Mở:**\n\n**Bể kín (closed):**\n• Tự tạo hệ sinh thái tuần hoàn\n• Tưới rất ít (1-2 tuần/lần)\n• Phù hợp người bận, ít thời gian chăm\n• Cây phù hợp: rêu, fitonia, cỏ ngọc\n\n**Bể mở (open):**\n• Thoáng khí hơn, ít bị nấm mốc\n• Cần tưới thường xuyên hơn (3-5 ngày/lần)\n• Phù hợp sen đá, xương rồng\n\n💡 Cho người mới: Em khuyên bể kín ạ — dễ chăm và đẹp!";

  // ── Sản phẩm ────────────────────────────────
  // ── Chính sách (check TRƯỚC sản phẩm để "ship bao nhiêu" không match "bao nhiêu") ──
  if (/ship|giao hàng|vận chuyển|freeship|phí ship|bao lâu.*nhận|nhận.*bao lâu|giao.*nhanh/i.test(q))
    return "🚚 **Chính sách vận chuyển Tiệm Rêu:**\n\n• **Freeship** cho đơn hàng từ 500.000₫\n• Phí ship tiêu chuẩn: 25.000₫ - 40.000₫ (tùy khu vực)\n• **Nội thành HCM:** Giao trong 1-2 ngày\n• **Tỉnh khác:** 3-5 ngày làm việc\n• Đóng gói cẩn thận, bảo vệ cây an toàn\n• Hỗ trợ ship nhanh (phí phát sinh)";

  if (/đổi trả|trả hàng|bảo hành|hỏng|vỡ|bể.*vỡ|lỗi/i.test(q))
    return "🔄 **Chính sách đổi trả & bảo hành:**\n\n• **Đổi trả trong 3 ngày** nếu sản phẩm lỗi do vận chuyển.\n• **Bảo hành 7 ngày** cho cây bị hư hại không do người dùng.\n• Cần quay video khi mở hàng để làm bằng chứng.\n• Liên hệ Zalo/Facebook để được hỗ trợ đổi trả.\n• Không áp dụng cho trường hợp chăm sóc sai cách.";

  if (/thanh toán|trả tiền|chuyển khoản|cod|payment|momo|vnpay/i.test(q))
    return "💳 **Phương thức thanh toán:**\n\n• **Chuyển khoản ngân hàng** (TPBank) — xác nhận tự động\n• **COD** (thanh toán khi nhận hàng)\n• Thông tin chuyển khoản sẽ hiển thị khi đặt hàng.\n\n💡 Đặt hàng trên website → chọn sản phẩm → thêm vào giỏ → thanh toán!";

  if (/giảm giá|khuyến mãi|voucher|mã giảm|discount|sale/i.test(q))
    return "🎉 **Khuyến mãi tại Tiệm Rêu:**\n\n• **Freeship** đơn từ 500.000₫\n• Theo dõi Tiệm Rêu trên Facebook/Zalo để nhận mã giảm giá.\n• Các chương trình khuyến mãi được cập nhật thường xuyên trên website.\n\nAnh/chị muốn xem sản phẩm đang giảm giá không ạ?";

  if (/liên hệ|hotline|zalo|facebook|điện thoại|sdt|phone|email/i.test(q))
    return "📞 **Liên hệ Tiệm Rêu:**\n\n• **Facebook:** Tiệm Rêu Décor\n• **Zalo:** Tìm 'Tiệm Rêu'\n• **Website:** tiemreudecor.com\n• Giờ hỗ trợ: 8:00 - 21:00 hàng ngày\n\nHoặc anh/chị cứ chat với em ở đây, em hỗ trợ 24/7 ạ! 🌿";

  if (/đặt hàng.*sao|mua.*sao|cách.*mua|cách.*đặt|order/i.test(q))
    return "🛒 **Cách đặt hàng tại Tiệm Rêu:**\n\n1. Chọn sản phẩm yêu thích trên website\n2. Nhấn **\"Thêm vào giỏ\"**\n3. Vào **Giỏ hàng** → kiểm tra\n4. Nhấn **\"Thanh toán\"** → điền thông tin giao hàng\n5. Chọn phương thức thanh toán\n6. Xác nhận đơn hàng!\n\n💡 Freeship cho đơn từ 500.000₫ ạ!";

  // ── Tư vấn chung ────────────────────────────
  if (/phù hợp|nên mua|đề xuất|recommend|suggest|tư vấn/i.test(q))
    return "🌿 **Em có thể tư vấn cho anh/chị!** Cho em biết thêm:\n\n• **Mục đích:** Trang trí bàn làm việc, phòng khách, hay quà tặng?\n• **Kích thước:** Muốn bể nhỏ gọn hay bể lớn?\n• **Kinh nghiệm:** Đã từng chăm cây chưa?\n• **Ngân sách:** Khoảng bao nhiêu?\n\nEm sẽ gợi ý sản phẩm phù hợp nhất ạ! 😊";

  if (/phòng.*tối|văn phòng|bàn làm việc|bàn học|để bàn/i.test(q))
    return "💼 **Terrarium cho bàn làm việc/phòng tối:**\n\n• Chọn **bể kín mini** — gọn gàng, ít chăm sóc.\n• Cây phù hợp: rêu, fitonia, cỏ ngọc (sống tốt ánh sáng yếu).\n• Nếu phòng tối: dùng đèn LED nhỏ chiếu 8-10h/ngày.\n• Kích thước lý tưởng: 10-15cm cho bàn làm việc.\n\nAnh/chị muốn em gợi ý sản phẩm cụ thể không ạ?";

  if (/sen đá|xương rồng|cactus|succulent/i.test(q))
    return "🌵 **Sen đá & Xương rồng trong terrarium:**\n\n• Dùng **bể mở** (cần thoáng khí, không thích ẩm).\n• Đất trồng: hỗn hợp đất + cát + đá pumice (thoát nước tốt).\n• Tưới: 7-10 ngày/lần, để đất khô hoàn toàn giữa 2 lần tưới.\n• Ánh sáng: Cần nhiều nắng, ít nhất 4-6h/ngày.\n\n⚠️ Sen đá KHÔNG phù hợp bể kín (quá ẩm sẽ thối rễ).";

  // ── Sản phẩm (check SAU chính sách) ─────────
  if (/sản phẩm|mua|giá|bao nhiêu|gợi ý|tìm.*bể|đặt hàng|thêm.*giỏ|còn hàng|hết hàng|combo|quà tặng|tặng|phụ kiện/i.test(q))
    return null; // Để AI hoặc DB fallback xử lý

  if (/rẻ|tiết kiệm|giá.*rẻ|bình dân|dưới.*\d/i.test(q))
    return null;

  if (/đắt|cao cấp|premium|sang|luxury/i.test(q))
    return null;

  // ── Default fallback ────────────────────────
  return null;
}

// =============================================
// ESCAPE JSON
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
// GEMINI STREAMING (with retry on 429)
// =============================================
async function streamFromGemini(
  message: string,
  systemPrompt: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("[AI] GEMINI_API_KEY not set, skipping");
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
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

  // Try up to 2 times (initial + 1 retry on 429)
  for (let attempt = 0; attempt < 2; attempt++) {
    const abortCtrl = new AbortController();
    const timeout = setTimeout(() => abortCtrl.abort(), 8000);

    try {
      console.log(`[AI] Gemini attempt ${attempt + 1} (model: ${model})...`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortCtrl.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        console.warn(`[AI] Gemini 429 rate limited (attempt ${attempt + 1})`);
        if (attempt === 0) {
          // Wait 2s then retry once
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return null; // Give up after retry
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "unknown");
        console.error(`[AI] Gemini error ${res.status}: ${errText}`);
        return null;
      }

      if (!res.body) return null;
      console.log("[AI] ✅ Gemini connected, streaming...");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      return new ReadableStream({
        async pull(ctrl) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer.trim()) {
                const token = extractTokenFromSSE(buffer);
                if (token) {
                  ctrl.enqueue(encoder.encode(`data: {"token":"${escapeJsonString(token)}"}\n\n`));
                }
              }
              ctrl.close();
              activeAiRequests--;
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              const token = extractTokenFromSSE(part);
              if (token) {
                ctrl.enqueue(encoder.encode(`data: {"token":"${escapeJsonString(token)}"}\n\n`));
              }
            }
          } catch (err) {
            console.error("[AI] Gemini stream error:", err);
            ctrl.close();
            activeAiRequests--;
          }
        },
        cancel() {
          reader.cancel();
          activeAiRequests--;
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error(`[AI] Gemini fetch error (attempt ${attempt + 1}):`, err);
      if (attempt === 0) continue;
      return null;
    }
  }
  return null;
}

function extractTokenFromSSE(sseChunk: string): string | null {
  for (const line of sseChunk.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ")) {
      try {
        const json = JSON.parse(trimmed.slice(6));
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch {
        // ignore
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
  // Support both env var names
  const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  console.log(`[AI] Trying Ollama (model: ${model}, url: ${ollamaUrl})...`);

  const abortCtrl = new AbortController();
  // CPU inference needs more time (30s)
  const timeout = setTimeout(() => abortCtrl.abort(), 30000);

  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: abortCtrl.signal,
    });
    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      console.error(`[AI] Ollama error: ${res.status}`);
      return null;
    }

    console.log("[AI] ✅ Ollama connected, streaming...");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    return new ReadableStream({
      async pull(ctrl) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            ctrl.close();
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
                ctrl.enqueue(encoder.encode(`data: {"token":"${escapeJsonString(token)}"}\n\n`));
              }
            } catch {
              // ignore
            }
          }
        } catch (err) {
          console.error("[AI] Ollama stream error:", err);
          ctrl.close();
          activeAiRequests--;
        }
      },
      cancel() {
        reader.cancel();
        activeAiRequests--;
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("[AI] Ollama fetch error:", err);
    return null;
  }
}

// =============================================
// MAIN STREAMING (Gemini → Ollama)
// =============================================
async function streamFromAI(
  message: string,
  history: { role: string; content: string }[],
  pageContext?: PageContext
): Promise<ReadableStream<Uint8Array> | null> {
  if (activeAiRequests >= MAX_CONCURRENT_AI) {
    console.log("[AI] Concurrency limit reached, skipping AI");
    return null;
  }

  activeAiRequests++;
  const systemPrompt = await buildSystemPrompt(pageContext);

  try {
    console.log(`[AI] Processing: "${message.slice(0, 50)}..."`);

    // 1) Gemini
    const geminiStream = await streamFromGemini(message, systemPrompt, history);
    if (geminiStream) {
      console.log("[AI] ✅ Using GEMINI");
      return geminiStream;
    }

    // 2) Ollama
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];
    const ollamaStream = await streamFromOllama(ollamaMessages);
    if (ollamaStream) {
      console.log("[AI] ✅ Using OLLAMA");
      return ollamaStream;
    }

    console.log("[AI] ❌ Both AI providers failed");
    activeAiRequests--;
    return null;
  } catch (err) {
    console.error("[AI] streamFromAI error:", err);
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
          response: "Dạ anh/chị đang gửi hơi nhanh, vui lòng đợi 1 phút rồi hỏi lại nhé! 🌿",
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
        response: "Dạ câu hỏi hơi dài. Anh/chị tóm tắt ngắn gọn dưới 400 ký tự nhé! 🌿",
      });
    }

    // ── 1. Smart Knowledge Base (instant, no AI needed) ──
    const smartResponse = getSmartFallback(trimmedMessage);
    if (smartResponse) {
      return NextResponse.json({
        response: smartResponse,
        source: "knowledge",
      });
    }

    // ── 2. AI Streaming (DISABLED — Gemini cần prepay, Ollama không chạy)
    // Bỏ comment đoạn dưới khi muốn bật lại AI:
    // - Gemini: nạp credit tại https://aistudio.google.com/billing
    // - Ollama: chạy `ollama serve` + `ollama pull llama3.2:3b` trên VPS
    //
    // const stream = await streamFromAI(trimmedMessage, history, pageContext);
    // if (stream) {
    //   return new Response(stream, {
    //     headers: {
    //       "Content-Type": "text/event-stream",
    //       "Cache-Control": "no-cache",
    //       Connection: "keep-alive",
    //     },
    //   });
    // }

    // ── 3. DB Product Query ──────────────────────────────
    if (/sản phẩm|mua|giá|bao nhiêu|gợi ý|tìm|đặt hàng|còn hàng|hết hàng|combo|quà|phụ kiện|rẻ|tiết kiệm|đắt|cao cấp/i.test(trimmedMessage)) {
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
            response: `🌿 Dạ, đây là một số sản phẩm nổi bật tại Tiệm Rêu:\n\n${productList}\n\n💡 Bấm vào link để xem chi tiết và đặt hàng. Freeship đơn từ 500.000₫ ạ!`,
            source: "db",
          });
        }
      } catch {
        // continue to final fallback
      }
    }

    // ── 4. Final fallback ────────────────────────────────
    return NextResponse.json({
      response: "Dạ em chưa hiểu rõ câu hỏi. Anh/chị có thể hỏi em về:\n\n• 🌿 **Chăm sóc terrarium** (tưới nước, ánh sáng, xử lý nấm mốc)\n• 🛒 **Sản phẩm** (gợi ý, giá cả, so sánh)\n• 📦 **Chính sách** (ship, đổi trả, thanh toán)\n\nHoặc liên hệ trực tiếp qua Zalo/Facebook Tiệm Rêu nhé! 😊",
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
