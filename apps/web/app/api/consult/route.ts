/**
 * AI Consultation API Route — v10 (Smart KB + Fuzzy Intent + Ollama + Product Cards)
 *
 * FLOW:
 * 1. Smart Knowledge Base (instant, 40+ patterns, <100ms)
 *    → Fuzzy matching: suy luận ý khi user nhập sai từ khóa
 * 2. Ollama llama3.2:3b (~2GB RAM, local VPS)
 * 3. DB Product Query (trả về kèm thumbnail + giá)
 * 4. Helpful Fallback (gợi ý chủ đề thay vì "em không hiểu")
 *
 * POST /api/consult
 * Body: { message, history?, pageContext? }
 *
 * Response JSON: { response, source, products? }
 * - products: [{ name, slug, price, image, category }] — hiển thị card trong chat
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
const MAX_CONCURRENT_AI = 2;

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
// PRODUCT CARD TYPE (trả về cho frontend)
// =============================================
interface ProductCard {
  name: string;
  slug: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  inStock: boolean;
}

// =============================================
// FUZZY MATCHING — Suy luận ý khi user nhập sai/viết tắt
// =============================================
// Vietnamese typo corrections & synonyms
const FUZZY_MAP: Record<string, string[]> = {
  // Chăm sóc
  "tưới": ["tuoi", "tươi", "tưoi", "tuới", "twoi", "tưới nước", "nước"],
  "ánh sáng": ["anh sang", "anh sáng", "ánh sang", "as", "nắng", "nang", "sáng"],
  "nấm": ["nam", "nấm mốc", "nam moc", "moc", "mốc"],
  "héo": ["heo", "héo", "rũ", "rụ", "rủ", "héo lá"],
  "vàng": ["vang", "vàng lá", "la vang", "úa"],
  "chăm sóc": ["cham soc", "chamsoc", "cách chăm", "cach cham", "chăm", "cham"],
  "côn trùng": ["con trung", "contr", "sâu", "sau", "bọ", "bo", "ruồi", "ruoi"],
  "rêu": ["reu", "rêu", "moss"],
  "bể": ["bê", "be", "bễ", "bể cá", "chậu"],
  // Sản phẩm
  "sản phẩm": ["san pham", "sp", "sanpham", "s.p", "sphẩm", "sảm phẩm"],
  "mua": ["mua", "muốn mua", "đặt", "dat", "order"],
  "giá": ["gia", "bao nhiêu", "bao nhiu", "bnhieu", "bn", "bnh", "giá cả", "giá tiền"],
  // Chính sách
  "ship": ["ship", "giao hàng", "giao hang", "giaohang", "vận chuyển", "van chuyen", "freeship", "phí ship"],
  "đổi trả": ["doi tra", "doitra", "trả hàng", "tra hang", "bảo hành", "bao hanh"],
  "thanh toán": ["thanh toan", "thanhtoan", "tt", "chuyển khoản", "chuyen khoan", "ck", "cod"],
  "khuyến mãi": ["khuyen mai", "km", "giảm giá", "giam gia", "voucher", "sale", "ưu đãi", "discount"],
  "liên hệ": ["lien he", "lienhe", "zalo", "facebook", "fb", "sdt", "hotline", "phone", "dt"],
  // Greeting
  "chào": ["chao", "hello", "hi", "hey", "alo", "helo", "xin chào", "xin chao"],
  "cảm ơn": ["cam on", "camon", "thank", "thanks", "tks"],
  "tạm biệt": ["tam biet", "bye", "goodbye", "bb"],
  // Tư vấn
  "tư vấn": ["tu van", "tuvan", "tv", "recommend", "gợi ý", "goi y", "đề xuất"],
  "phù hợp": ["phu hop", "phuhop", "nên mua", "nen mua"],
  "người mới": ["nguoi moi", "newbie", "beginner", "mới chơi", "lần đầu", "lan dau"],
  // Loại bể
  "bể kín": ["be kin", "bekin", "hệ kín", "he kin", "closed"],
  "bể mở": ["be mo", "bemo", "hệ mở", "he mo", "open"],
  "sen đá": ["sen da", "senda", "succulent", "xương rồng", "xuong rong", "cactus"],
  // Đẹp/đề xuất sản phẩm
  "đẹp": ["dep", "đẹp nhất", "dep nhat", "xinh", "cute", "nice"],
};

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function fuzzyMatch(input: string): string | null {
  const q = input.toLowerCase().trim();
  const normalized = normalizeVietnamese(q);

  for (const [canonical, variants] of Object.entries(FUZZY_MAP)) {
    for (const variant of variants) {
      if (q.includes(variant) || normalized.includes(normalizeVietnamese(variant))) {
        return canonical;
      }
    }
    // Also check if canonical itself is in the query
    if (q.includes(canonical) || normalized.includes(normalizeVietnamese(canonical))) {
      return canonical;
    }
  }
  return null;
}

// Detect product-related intent (even with typos)
function isProductIntent(message: string): boolean {
  const q = message.toLowerCase().trim();
  const n = normalizeVietnamese(q);

  const productPatterns = [
    /s(ả|a)n\s*ph(ẩ|a)m/,
    /\bsp\b/,
    /gi(á|a)\b/,
    /b(a|ả)o\s*nhi(ê|e)u/,
    /\bbn\b/,
    /\bbnh\b/,
    /mu(a|ố)n?\s*mua/,
    /\bmua\b/,
    /g(ợ|o)i\s*(ý|y)/,
    /t(ì|i)m/,
    /đ(ặ|a)t\s*h(à|a)ng/,
    /c(ò|o)n\s*h(à|a)ng/,
    /h(ế|e)t\s*h(à|a)ng/,
    /qu(à|a)\s*t(ặ|a)ng/,
    /ph(ụ|u)\s*ki(ệ|e)n/,
    /combo/,
    /r(ẻ|e)\b/,
    /ti(ế|e)t\s*ki(ệ|e)m/,
    /cao\s*c(ấ|a)p/,
    /premium/,
    /luxury/,
    /\bd(ẹ|e)p\b/,
    /xinh/,
    /cute/,
  ];

  for (const p of productPatterns) {
    if (p.test(q) || p.test(n)) return true;
  }
  return false;
}

// =============================================
// SYSTEM PROMPT (dùng cho Ollama)
// =============================================
async function buildSystemPrompt(pageContext?: PageContext): Promise<string> {
  const catalog = await getProductCatalog();

  const baseRole = `Bạn là trợ lý AI của "Tiệm Rêu" — shop terrarium Việt Nam. Xưng "em", gọi khách "anh/chị". Trả lời ngắn gọn, tự nhiên, bằng tiếng Việt.

QUY TẮC QUAN TRỌNG:
- Luôn CỐ GẮNG HIỂU Ý khách, kể cả khi họ viết sai chính tả, viết tắt, hoặc dùng tiếng lóng
- Hỏi chăm sóc/kiến thức → trả lời kiến thức, KHÔNG list sản phẩm
- Hỏi mua/giá/gợi ý → gợi ý 1-3 SP + link dạng "Link: /products/slug"
- Hỏi chính sách → trả lời ngắn gọn
- Chẩn đoán (nấm/héo/vàng) → nguyên nhân + xử lý
- CHỈ gợi ý sản phẩm khi khách HỎI MUA
- KHÔNG bịa sản phẩm/giá ngoài danh sách
- Freeship đơn từ 500k
- Nếu không chắc ý khách → hỏi lại lịch sự

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
// SMART KNOWLEDGE BASE — 40+ patterns + Fuzzy
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

  // ── Chính sách ──────────────────────────────
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

  // ── Sản phẩm → return null để AI hoặc DB xử lý ─────
  if (isProductIntent(message)) return null;

  // ── Fuzzy fallback: suy luận ý từ typo ────────
  const fuzzyIntent = fuzzyMatch(message);
  if (fuzzyIntent) {
    // Re-run with corrected intent
    return getSmartFallback(fuzzyIntent);
  }

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
// OLLAMA STREAMING — llama3.2:3b (~2GB RAM)
// =============================================
async function streamFromOllama(
  messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  console.log(`[AI] Trying Ollama (model: ${model}, url: ${ollamaUrl})...`);

  const abortCtrl = new AbortController();
  const timeout = setTimeout(() => abortCtrl.abort(), 25000);

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
// MAIN AI FUNCTION (Ollama only)
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

    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];

    const ollamaStream = await streamFromOllama(ollamaMessages);
    if (ollamaStream) {
      console.log("[AI] ✅ Using OLLAMA llama3.2:3b");
      return ollamaStream;
    }

    console.log("[AI] ❌ Ollama unavailable");
    activeAiRequests--;
    return null;
  } catch (err) {
    console.error("[AI] streamFromAI error:", err);
    activeAiRequests--;
    return null;
  }
}

// =============================================
// DB PRODUCT QUERY — Trả về product cards với thumbnail
// =============================================
async function queryProducts(message: string): Promise<{ text: string; products: ProductCard[] } | null> {
  try {
    const q = message.toLowerCase();

    // Determine sort/filter based on intent
    type OrderBy = { featured?: "desc" | "asc"; createdAt?: "desc" | "asc"; basePrice?: "desc" | "asc" };
    let orderBy: OrderBy[] = [{ featured: "desc" }, { createdAt: "desc" }];
    let take = 5;

    if (/rẻ|tiết kiệm|bình dân|giá thấp|dưới/i.test(q)) {
      orderBy = [{ basePrice: "asc" }];
    } else if (/đắt|cao cấp|premium|sang|luxury/i.test(q)) {
      orderBy = [{ basePrice: "desc" }];
    } else if (/đẹp|xinh|cute|hot|nổi bật/i.test(q)) {
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
    }

    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", inventory: { gt: 0 } },
      select: {
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        images: true,
        category: { select: { name: true } },
        featured: true,
      },
      take,
      orderBy,
    });

    if (products.length === 0) return null;

    const productCards: ProductCard[] = products.map((p) => ({
      name: p.name,
      slug: `/products/${p.slug}`,
      price: p.salePrice
        ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫`
        : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`,
      originalPrice: p.salePrice
        ? `${Number(p.basePrice).toLocaleString("vi-VN")}₫`
        : undefined,
      image: p.images?.[0] || "",
      category: p.category.name,
      inStock: true,
    }));

    // Build text response
    let intro = "🌿 Dạ, đây là một số sản phẩm nổi bật tại Tiệm Rêu:";
    if (/rẻ|tiết kiệm|bình dân/i.test(q)) intro = "🌿 Dạ, đây là các sản phẩm giá tốt nhất:";
    if (/đắt|cao cấp|premium/i.test(q)) intro = "🌿 Dạ, đây là các sản phẩm cao cấp:";
    if (/đẹp|xinh|cute/i.test(q)) intro = "🌿 Dạ, đây là các sản phẩm đẹp nhất tại Tiệm Rêu:";

    const text = `${intro}\n\n💡 Bấm vào sản phẩm để xem chi tiết. Freeship đơn từ 500.000₫ ạ!`;

    return { text, products: productCards };
  } catch {
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

    // ── 2. Product query with thumbnails (if product intent detected) ──
    if (isProductIntent(trimmedMessage)) {
      const productResult = await queryProducts(trimmedMessage);
      if (productResult) {
        return NextResponse.json({
          response: productResult.text,
          source: "db",
          products: productResult.products,
        });
      }
    }

    // ── 3. Ollama AI Streaming (llama3.2:3b ~2GB) ────────
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

    // ── 4. Fallback DB Product Query (nếu Ollama offline) ──
    const fallbackProducts = await queryProducts(trimmedMessage);
    if (fallbackProducts) {
      return NextResponse.json({
        response: fallbackProducts.text,
        source: "db",
        products: fallbackProducts.products,
      });
    }

    // ── 5. Smart Fallback — gợi ý chủ đề thay vì "em không hiểu" ──
    // Cố gắng suy luận ý
    const fuzzyIntent = fuzzyMatch(trimmedMessage);
    if (fuzzyIntent) {
      const retryResponse = getSmartFallback(fuzzyIntent);
      if (retryResponse) {
        return NextResponse.json({
          response: retryResponse,
          source: "knowledge",
        });
      }
    }

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
