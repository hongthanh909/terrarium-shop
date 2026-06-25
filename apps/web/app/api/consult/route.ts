/**
 * AI Consultation API Route — v11 (Ollama-first + Guardrails + Deep Knowledge)
 *
 * THIẾT KẾ MỚI:
 * - KB chỉ xử lý: greeting, cảm ơn, tạm biệt, chính sách shop (instant)
 * - MỌI câu hỏi kiến thức terrarium → Ollama (model có kiến thức sâu)
 * - Guardrail: chặn câu hỏi off-topic trước khi gửi Ollama
 * - Product intent → DB query kèm thumbnail ảnh thật
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
    if (now - val.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitMap.delete(key);
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
// PRODUCT CATALOG CACHE (cho Ollama system prompt)
// =============================================
let productCatalogCache: { text: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getProductCatalogText(): Promise<string | null> {
  const now = Date.now();
  if (productCatalogCache && now - productCatalogCache.fetchedAt < CACHE_TTL_MS) {
    return productCatalogCache.text;
  }
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        name: true, slug: true, basePrice: true, salePrice: true,
        inventory: true, featured: true,
        category: { select: { name: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 15,
    });
    if (products.length === 0) return null;

    const text = products.map((p) => {
      const price = p.salePrice
        ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫ (gốc ${Number(p.basePrice).toLocaleString("vi-VN")}₫)`
        : `${Number(p.basePrice).toLocaleString("vi-VN")}₫`;
      const stock = p.inventory > 0 ? "còn hàng" : "hết hàng";
      const star = p.featured ? " ⭐" : "";
      return `• ${p.name}${star} — ${price} — ${p.category.name} — ${stock} — Link: /products/${p.slug}`;
    }).join("\n");

    productCatalogCache = { text, fetchedAt: now };
    return text;
  } catch {
    return null;
  }
}

// =============================================
// TYPES
// =============================================
interface PageContext {
  type: "product" | "blog" | "explore" | "checkout" | "orders" | "consult" | "home" | "general";
  slug?: string;
  productName?: string;
  productPrice?: string;
  categoryName?: string;
}

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
// 1. GUARDRAIL — Chặn off-topic, chống lạm dụng model
// =============================================
function isOffTopic(message: string): boolean {
  const q = message.toLowerCase().trim();
  const n = normalizeVN(q);

  // Các chủ đề OFF-TOPIC rõ ràng
  const offTopicPatterns = [
    // Lập trình / code
    /\b(code|coding|javascript|python|java|c\+\+|html|css|react|angular|vue|node|npm|api|sql|database|backend|frontend|fullstack|algorithm|leetcode|github|git|docker|kubernetes|devops|deploy|server|hosting|linux|windows|mac|ios|android|swift|kotlin|flutter|dart|typescript|php|ruby|golang|rust|scala|programming|developer|software|engineer)\b/i,
    // Toán / khoa học nặng
    /\b(calculus|integral|derivative|matrix|equation|theorem|proof|algebra|geometry|trigonometry|physics|chemistry|biology|quantum|relativity|entropy|thermodynamics)\b/i,
    // Chính trị / tôn giáo nhạy cảm
    /\b(chính trị|bầu cử|đảng|tổng thống|thủ tướng|quốc hội|biểu tình|chiến tranh|vũ khí|súng|đạn|bom|khủng bố|tôn giáo|phật|chúa|allah|hồi giáo|cộng sản|tư bản|dân chủ|độc tài)\b/i,
    // Nội dung người lớn / bạo lực
    /\b(sex|porn|xxx|nude|khiêu dâm|ma túy|thuốc lắc|cần sa|cocaine|heroin|cờ bạc|đánh bạc|casino|hack|crack|cheat|exploit|jailbreak|bypass)\b/i,
    // Y tế chuyên sâu (không liên quan cây)
    /\b(bệnh viện|bác sĩ|thuốc|kê đơn|triệu chứng|ung thư|tiểu đường|huyết áp|covid|vaccine|phẫu thuật|xét nghiệm)\b/i,
    // Tài chính / crypto
    /\b(bitcoin|crypto|ethereum|token|nft|blockchain|forex|chứng khoán|cổ phiếu|đầu tư|trading|binance|coinbase)\b/i,
    // AI / giả mạo
    /\b(viết (cho|giúp|hộ) (tôi|mình|em|anh) (bài|luận|essay|code|email|thư|cv|resume))/i,
    /\b(giả (vờ|làm|bộ)|pretend|roleplay|act as|đóng vai|bạn là ai|mày là ai|bạn có phải|you are)\b/i,
    /\b(ignore (previous|above)|bỏ qua (hướng dẫn|lệnh|instruction)|forget your|prompt injection)\b/i,
    // Nhờ làm bài
    /\b(giải (bài|toán|phương trình)|làm bài (tập|kiểm tra)|write (essay|code|script|story))\b/i,
    // Dịch thuật dài
    /\b(dịch (giúp|cho|hộ)|translate|dịch sang)\b/i,
  ];

  for (const p of offTopicPatterns) {
    if (p.test(q) || p.test(n)) return true;
  }

  return false;
}

// Kiểm tra có liên quan terrarium/cây/shop không
function isOnTopic(message: string): boolean {
  const q = message.toLowerCase().trim();
  const n = normalizeVN(q);

  const onTopicPatterns = [
    // Terrarium / cây cối
    /terrarium/i, /tiệm rêu/i, /rêu/i, /cây/i, /cỏ/i, /lá/i, /hoa/i,
    /bể/i, /chậu/i, /bình/i, /lọ/i, /hũ/i,
    /rễ/i, /thân/i, /gốc/i, /cành/i, /mầm/i, /hạt/i,
    /đất/i, /sỏi/i, /cát/i, /than/i, /phân/i, /giá thể/i,
    /tưới/i, /nước/i, /ẩm/i, /khô/i,
    /nắng/i, /sáng/i, /tối/i, /đèn/i,
    /nấm/i, /mốc/i, /sâu/i, /bọ/i, /kiến/i, /côn trùng/i,
    /héo/i, /vàng/i, /úa/i, /chết/i, /thối/i,
    /chăm/i, /trồng/i, /ghép/i, /cắt tỉa/i,
    /moss/i, /fern/i, /fitonia/i, /fittonia/i, /succulent/i, /cactus/i,
    /sen đá/i, /xương rồng/i, /dương xỉ/i, /phong thảo/i,
    /hệ kín/i, /hệ mở/i, /closed/i, /open/i,
    /sinh thái/i, /micro/i, /mini garden/i, /vườn/i,
    // Shop / mua hàng
    /sản phẩm/i, /mua/i, /giá/i, /đặt hàng/i, /order/i,
    /ship/i, /giao/i, /vận chuyển/i, /freeship/i,
    /đổi trả/i, /bảo hành/i, /chính sách/i,
    /thanh toán/i, /chuyển khoản/i, /cod/i, /momo/i,
    /voucher/i, /khuyến mãi/i, /giảm giá/i, /sale/i,
    /quà tặng/i, /combo/i, /phụ kiện/i,
    /sp/i, /bn/i,
    // Thiết kế / trang trí
    /trang trí/i, /decor/i, /design/i, /thiết kế/i,
    /phòng/i, /bàn/i, /kệ/i, /văn phòng/i,
    /đẹp/i, /xinh/i, /cute/i,
    // Greeting (cho phép)
    /chào/i, /hello/i, /hi\b/i, /hey/i,
    /cảm ơn/i, /thank/i, /tạm biệt/i, /bye/i,
    // Hỏi chung
    /tư vấn/i, /gợi ý/i, /recommend/i, /hướng dẫn/i,
    /là gì/i, /thế nào/i, /bao lâu/i, /bao nhiêu/i,
    /tại sao/i, /vì sao/i, /nguyên nhân/i,
    /cách/i, /làm sao/i, /thế nào/i,
    /loại/i, /nào/i, /kiểu/i,
    /liên hệ/i, /zalo/i, /facebook/i, /hotline/i,
    /người mới/i, /beginner/i, /newbie/i, /lần đầu/i,
  ];

  for (const p of onTopicPatterns) {
    if (p.test(q) || p.test(n)) return true;
  }

  // Nếu message ngắn (< 8 từ) và không rõ off-topic → cho qua (benefit of doubt)
  if (q.split(/\s+/).length <= 8 && !isOffTopic(q)) return true;

  return false;
}

const OFF_TOPIC_RESPONSE = "Dạ em là trợ lý chuyên về **terrarium và cây cảnh** của Tiệm Rêu thôi ạ 🌿\n\nEm có thể giúp anh/chị:\n• 🌱 Kiến thức terrarium (cách làm, chăm sóc, xử lý sự cố)\n• 🛒 Tư vấn sản phẩm (gợi ý, so sánh, giá cả)\n• 📦 Chính sách shop (ship, đổi trả, thanh toán)\n\nAnh/chị hỏi về terrarium nhé! 😊";

// =============================================
// 2. INSTANT KB — Chỉ greeting + chính sách shop
// =============================================
function getInstantResponse(message: string): string | null {
  const q = message.toLowerCase().trim();

  // ── Greeting ──
  if (/^(xin chào|hello|hi|chào|hey|alo|helo)\b/i.test(q))
    return "Xin chào! 🌿 Em là trợ lý của Tiệm Rêu. Em có thể giúp anh/chị:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Giải đáp chính sách mua hàng\nAnh/chị muốn hỏi gì ạ?";

  if (/^(cảm ơn|thank|cám ơn|tks)/i.test(q))
    return "Dạ không có gì ạ! 😊 Nếu cần thêm thông tin, anh/chị cứ hỏi em nhé. Chúc anh/chị chăm sóc terrarium thật vui! 🌿";

  if (/^(tạm biệt|bye|goodbye|bb)\b/i.test(q))
    return "Dạ tạm biệt anh/chị! 👋🌿 Hẹn gặp lại, nếu cần tư vấn cứ quay lại nhé!";

  // ── Chính sách shop (cần trả lời chính xác, không nên để AI bịa) ──
  if (/ship|giao hàng|vận chuyển|freeship|phí ship|phí giao|bao lâu.*nhận|nhận.*bao lâu|giao.*nhanh/i.test(q))
    return "🚚 **Chính sách vận chuyển Tiệm Rêu:**\n\n• **Freeship** cho đơn hàng từ 500.000₫\n• Phí ship tiêu chuẩn: 25.000₫ - 40.000₫ (tùy khu vực)\n• **Nội thành HCM:** Giao trong 1-2 ngày\n• **Tỉnh khác:** 3-5 ngày làm việc\n• Đóng gói cẩn thận, bảo vệ cây an toàn\n• Hỗ trợ ship nhanh (phí phát sinh)";

  if (/đổi trả|trả hàng|bảo hành|hỏng|vỡ|bể.*vỡ|lỗi/i.test(q))
    return "🔄 **Chính sách đổi trả & bảo hành:**\n\n• **Đổi trả trong 3 ngày** nếu sản phẩm lỗi do vận chuyển.\n• **Bảo hành 7 ngày** cho cây bị hư hại không do người dùng.\n• Cần quay video khi mở hàng để làm bằng chứng.\n• Liên hệ Zalo/Facebook để được hỗ trợ đổi trả.\n• Không áp dụng cho trường hợp chăm sóc sai cách.";

  if (/thanh toán|trả tiền|chuyển khoản|cod|payment|momo/i.test(q))
    return "💳 **Phương thức thanh toán:**\n\n• **COD** (thanh toán khi nhận hàng) — nhận hàng mới trả tiền, hoàn toàn an toàn ✅\n\n💡 Đặt hàng trên website → chọn sản phẩm → thêm vào giỏ → thanh toán COD khi nhận hàng!";

  if (/khuyến mãi|voucher|mã giảm|discount|sale|giảm giá/i.test(q))
    return "🎉 **Khuyến mãi tại Tiệm Rêu:**\n\n• **Freeship** đơn từ 500.000₫\n• Theo dõi Tiệm Rêu trên Facebook/Zalo để nhận mã giảm giá.\n• Các chương trình khuyến mãi được cập nhật thường xuyên trên website.\n\nAnh/chị muốn xem sản phẩm đang giảm giá không ạ?";

  if (/liên hệ|hotline|zalo|facebook|điện thoại|sdt|phone|email/i.test(q))
    return "📞 **Liên hệ Tiệm Rêu:**\n\n• **Facebook:** Tiệm Rêu Décor\n• **Zalo:** Tìm 'Tiệm Rêu'\n• **Website:** tiemreudecor.com\n• Giờ hỗ trợ: 8:00 - 21:00 hàng ngày\n\nHoặc anh/chị cứ chat với em ở đây, em hỗ trợ 24/7 ạ! 🌿";

  if (/đặt hàng.*sao|mua.*sao|cách.*mua|cách.*đặt|order.*sao/i.test(q))
    return "🛒 **Cách đặt hàng tại Tiệm Rêu:**\n\n1. Chọn sản phẩm yêu thích trên website\n2. Nhấn **\"Thêm vào giỏ\"**\n3. Vào **Giỏ hàng** → kiểm tra\n4. Nhấn **\"Thanh toán\"** → điền thông tin giao hàng\n5. Chọn phương thức thanh toán\n6. Xác nhận đơn hàng!\n\n💡 Freeship cho đơn từ 500.000₫ ạ!";

  // Không match → return null → flow tiếp tục tới Ollama
  return null;
}

// =============================================
// 3. PRODUCT INTENT DETECTION
// =============================================
function isProductIntent(message: string): boolean {
  const q = message.toLowerCase().trim();
  const productPatterns = [
    /s(ả|a)n\s*ph(ẩ|a)m/i,
    /\bsp\b/i,
    /gi(á|a)\s+(bao|c(ả|a)|ti(ề|e)n)/i,
    /b(a|ả)o\s*nhi(ê|e)u/i,
    /\bbn\b/i,
    /mu(ố|o)n\s*mua/i,
    /\bmua\s+(gì|cái|con|bể|chậu)/i,
    /g(ợ|o)i\s*(ý|y)\s*(sản|sp|bể|terrarium)/i,
    /đ(ặ|a)t\s*h(à|a)ng/i,
    /c(ò|o)n\s*h(à|a)ng/i,
    /h(ế|e)t\s*h(à|a)ng/i,
    /qu(à|a)\s*t(ặ|a)ng/i,
    /combo/i,
    /xem\s*(sản|sp|bể|hàng)/i,
    /có\s*(bán|bể|sản|sp)/i,
    /list\s*(sản|sp)/i,
  ];
  return productPatterns.some(p => p.test(q));
}

// =============================================
// 4. FUZZY MATCHING — Sửa lỗi chính tả
// =============================================
function normalizeVN(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, "").trim();
}

// =============================================
// 5. SYSTEM PROMPT — Kiến thức terrarium chuyên sâu cho Ollama
// =============================================
async function buildSystemPrompt(pageContext?: PageContext): Promise<string> {
  const catalog = await getProductCatalogText();

  const prompt = `Bạn là "Rêu" — trợ lý AI chuyên gia terrarium của "Tiệm Rêu Décor", shop terrarium tại Việt Nam.
Xưng "em", gọi khách "anh/chị". Trả lời bằng tiếng Việt, tự nhiên, dễ hiểu, có emoji.

═══════════════════════════════════════
QUY TẮC HÀNH VI (BẮT BUỘC)
═══════════════════════════════════════
1. Luôn CỐ GẮNG HIỂU Ý khách kể cả viết sai chính tả, viết tắt, tiếng lóng
2. Trả lời DỰA TRÊN KIẾN THỨC bên dưới. KHÔNG bịa thông tin
3. Độ dài phù hợp: câu đơn giản → 2-3 câu. Câu phức tạp → chia bullet points
4. Khi gợi ý sản phẩm: CHỈ lấy từ DANH SÁCH BÊN DƯỚI, kèm giá + "Link: /products/slug"
5. KHÔNG trả lời câu hỏi NGOÀI LĨNH VỰC terrarium/cây cảnh/shop
6. Nếu không chắc → hỏi lại lịch sự, KHÔNG bịa

═══════════════════════════════════════
KIẾN THỨC TERRARIUM CHUYÊN SÂU
═══════════════════════════════════════

【Terrarium là gì?】
Terrarium là vườn thu nhỏ trong bình/lọ thủy tinh, mô phỏng hệ sinh thái tự nhiên. Có 2 loại chính:
- Bể kín (closed): có nắp đậy, tạo chu trình nước tuần hoàn, gần như tự duy trì
- Bể mở (open): không có nắp, cần chăm sóc thường xuyên hơn

【Lịch sử】
Terrarium được phát minh bởi Nathaniel Bagshaw Ward (1842) khi ông tình cờ phát hiện cây dương xỉ mọc trong lọ thủy tinh. Ban đầu gọi là "Wardian case", dùng để vận chuyển cây qua đại dương.

【Cấu tạo các lớp (từ dưới lên)】
1. Lớp sỏi thoát nước (1-2cm): sỏi nhỏ/đá pumice, ngăn úng rễ
2. Than hoạt tính (0.5cm): lọc khí, khử mùi, chống nấm
3. Rêu sphagnum/lưới chắn: ngăn đất rơi xuống lớp sỏi
4. Đất trồng (3-5cm): hỗn hợp đất + perlite + peat moss
5. Rêu/cây trồng + trang trí (đá, gỗ lũa, tượng mini)

【Các loại cây phù hợp】
- Bể kín: rêu (Java moss, Sheet moss, Mood moss), fitonia/fittonia, cỏ ngọc, selaginella, phong thảo, dương xỉ mini, peperomia mini
- Bể mở: sen đá (echeveria, haworthia), xương rồng mini, cỏ ngọc, tillandsia (cây không khí)
- KHÔNG phù hợp: cây lớn, cây cần nắng trực tiếp, cây rụng lá nhiều

【Chăm sóc bể kín】
- Tưới: 1-2 tuần/lần, phun sương nhẹ 2-3 lần. Dấu hiệu cần tưới: đất khô, rêu nhạt màu
- Ánh sáng: gián tiếp 6-8h/ngày, TUYỆT ĐỐI không nắng trực tiếp (sẽ nấu chín cây)
- Nhiệt độ: 18-28°C, tránh điều hòa thổi trực tiếp
- Thông khí: mở nắp 30 phút mỗi tuần để trao đổi khí
- Dấu hiệu bình thường: sương đọng nhẹ trên thành bể vào buổi sáng

【Chăm sóc bể mở】
- Tưới: 3-5 ngày/lần (sen đá: 7-10 ngày, để đất khô hoàn toàn)
- Ánh sáng: tùy cây, sen đá cần nhiều nắng hơn (4-6h)
- Lưu ý: sen đá/xương rồng cần đất thoát nước tốt (trộn cát + đá pumice)

【Xử lý sự cố phổ biến】
- Nấm mốc: mở nắp 24-48h, gỡ nấm bằng nhíp, rắc bột quế, giảm tưới
- Rêu vàng: thiếu sáng → di chuyển, HOẶC tưới quá nhiều → giảm tưới
- Lá héo mềm: thiếu nước → tưới phun sương nhẹ
- Lá vàng + đất ướt: thừa nước → ngừng tưới, mở nắp
- Rễ thối: cắt phần hư, thay đất, để khô trước khi trồng lại
- Côn trùng (ruồi nhỏ/fungus gnats): để đất khô hơn, phủ cát mỏng, đặt bẫy giấy vàng
- Kiến: ngâm chậu trong nước 30 phút
- Rêu mọc quá dày: cắt tỉa, tách bớt
- Cây mọc quá to: cắt ngọn, thay cây nhỏ hơn
- Sương đọng quá nhiều: mở nắp vài giờ cho bớt ẩm

【Tự làm DIY terrarium】
Dụng cụ: bình thủy tinh, sỏi, than hoạt tính, đất, rêu, cây, nhíp dài, phễu, bình xịt
Các bước:
1. Rửa sạch bình, phơi khô
2. Đổ sỏi → than hoạt tính → rêu sphagnum → đất
3. Dùng nhíp đặt cây, ấn nhẹ gốc
4. Phủ rêu lên mặt đất, trang trí
5. Phun sương nhẹ, đóng nắp (bể kín)
6. Đặt nơi có ánh sáng gián tiếp

【Mẹo hay】
- Dùng muỗng dài/nhíp để trồng trong bình cổ hẹp
- Lau thành bình bằng giấy cuốn quanh que
- Thêm springtails (bọ nhảy) giúp phân hủy chất hữu cơ, chống nấm
- Than hoạt tính = "bộ lọc" tự nhiên cho bể

【Quà tặng terrarium】
- Quà sinh nhật, tân gia, Valentine, 8/3, 20/10
- Ý nghĩa: "Tặng cả một vườn thu nhỏ" — độc đáo, lâu bền, dễ chăm
- Có thể customize theo yêu cầu

═══════════════════════════════════════
CHÍNH SÁCH SHOP (trả lời chính xác)
═══════════════════════════════════════
- Freeship đơn từ 500.000₫
- Ship tiêu chuẩn: 25.000₫-40.000₫ (HCM 1-2 ngày, tỉnh khác 3-5 ngày)
- Đổi trả 3 ngày (lỗi do vận chuyển), bảo hành 7 ngày
- Thanh toán: COD (thu tiền khi giao hàng)
- Liên hệ: Facebook "Tiệm Rêu Décor", Zalo "Tiệm Rêu"
${catalog ? `\n═══════════════════════════════════════\nDANH SÁCH SẢN PHẨM HIỆN CÓ\n═══════════════════════════════════════\n${catalog}\n\nQuy tắc: Gợi ý TỐI ĐA 3 SP phù hợp nhất, kèm giá + link. Ưu tiên ⭐ featured và còn hàng.` : ""}
${pageContext?.type === "product" && pageContext.productName ? `\nKhách đang xem: "${pageContext.productName}"${pageContext.productPrice ? ` — ${pageContext.productPrice}` : ""}. Ưu tiên trả lời về SP này.` : ""}`;

  return prompt;
}

// =============================================
// 6. OLLAMA STREAMING
// =============================================
function escapeJsonString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}

async function streamFromOllama(
  messages: { role: string; content: string }[]
): Promise<ReadableStream<Uint8Array> | null> {
  const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  console.log(`[AI] Trying Ollama (model: ${model})...`);

  const abortCtrl = new AbortController();
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
          if (done) { ctrl.close(); activeAiRequests--; return; }

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
            } catch { /* skip */ }
          }
        } catch (err) {
          console.error("[AI] stream error:", err);
          ctrl.close();
          activeAiRequests--;
        }
      },
      cancel() { reader.cancel(); activeAiRequests--; },
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("[AI] Ollama fetch error:", err);
    return null;
  }
}

async function streamFromAI(
  message: string,
  history: { role: string; content: string }[],
  pageContext?: PageContext
): Promise<ReadableStream<Uint8Array> | null> {
  if (activeAiRequests >= MAX_CONCURRENT_AI) {
    console.log("[AI] Concurrency limit reached");
    return null;
  }
  activeAiRequests++;

  try {
    const systemPrompt = await buildSystemPrompt(pageContext);
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];

    const stream = await streamFromOllama(ollamaMessages);
    if (stream) {
      console.log("[AI] ✅ Using OLLAMA");
      return stream;
    }

    console.log("[AI] ❌ Ollama unavailable");
    activeAiRequests--;
    return null;
  } catch (err) {
    console.error("[AI] error:", err);
    activeAiRequests--;
    return null;
  }
}

// =============================================
// 7. DB PRODUCT QUERY — Cards với thumbnail
// =============================================
async function queryProducts(message: string): Promise<{ text: string; products: ProductCard[] } | null> {
  try {
    const q = message.toLowerCase();
    type OrderBy = { featured?: "desc" | "asc"; createdAt?: "desc" | "asc"; basePrice?: "desc" | "asc" };
    let orderBy: OrderBy[] = [{ featured: "desc" }, { createdAt: "desc" }];

    if (/rẻ|tiết kiệm|bình dân|giá thấp/i.test(q)) orderBy = [{ basePrice: "asc" }];
    else if (/đắt|cao cấp|premium|sang|luxury/i.test(q)) orderBy = [{ basePrice: "desc" }];

    // ── Parse giới hạn giá từ message ─────────────────────────────
    // Hỗ trợ: "dưới 400k", "dưới 500.000", "tầm 300k", "khoảng 200k"
    //           "đưới 1 triệu", "1.5 triệu", "dưới 1tr"
    let maxPriceFilter: number | null = null;

    const priceMaxMatch = q.match(
      /(?:dưới|tầm|khoảng|tối đa|không quá)[\s<≤]*([\d.,]+)\s*(k|nghìn|ng|triệu|tr⁠|\btr\b)?/i
    );

    const parsePrice = (raw: string, unit?: string): number => {
      const num = parseFloat(raw.replace(/\./g, "").replace(/,/, "."));
      const u = (unit || "").toLowerCase().trim();
      if (u === "triệu" || u === "tr⁠" || u === "tr") return num * 1_000_000;
      if (u === "k" || u === "nghìn" || u === "ng") return num * 1_000;
      // Không có đơn vị: số < 1000 → hiểu là "k"
      if (num < 1_000) return num * 1_000;
      return num;
    };

    if (priceMaxMatch) {
      maxPriceFilter = parsePrice(priceMaxMatch[1], priceMaxMatch[2]);
    }

    // Luôn sắp theo giá tăng dần khi user hỏi dưới tầm giá
    if (maxPriceFilter !== null) orderBy = [{ basePrice: "asc" }];

    // Build where: lọc giá theo salePrice (nếu có) hoặc basePrice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseWhere: any = { status: "ACTIVE", inventory: { gt: 0 } };
    if (maxPriceFilter !== null) {
      baseWhere.OR = [
        { salePrice: { not: null, lte: maxPriceFilter } },
        { salePrice: null, basePrice: { lte: maxPriceFilter } },
      ];
    }

    const products = await prisma.product.findMany({
      where: baseWhere,
      select: {
        name: true, slug: true, basePrice: true, salePrice: true,
        images: true, category: { select: { name: true } }, featured: true,
      },
      take: 6,
      orderBy,
    });

    if (products.length === 0) {
      if (maxPriceFilter !== null) {
        return {
          text: `🌿 Dạ, hiện Tiệm Rêu chưa có sản phẩm dưới **${maxPriceFilter.toLocaleString("vi-VN")}₫** đang còn hàng.\n\nAnh/chị có thể nâng ngân sách lên chút hoặc xem toàn bộ sản phẩm tại đây nhé!`,
          products: [],
        };
      }
      return null;
    }

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

    let intro = "🌿 Dạ, đây là một số sản phẩm nổi bật tại Tiệm Rêu:";
    if (maxPriceFilter !== null) {
      intro = `🌿 Dạ, đây là các sản phẩm trong tầm **${maxPriceFilter.toLocaleString("vi-VN")}₫** tại Tiệm Rêu:`;
    } else if (/rẻ|tiết kiệm|bình dân/i.test(q)) {
      intro = "🌿 Dạ, đây là các sản phẩm giá tốt nhất:";
    } else if (/đắt|cao cấp|premium/i.test(q)) {
      intro = "🌿 Dạ, đây là các sản phẩm cao cấp:";
    } else if (/đẹp|xinh|cute/i.test(q)) {
      intro = "🌿 Dạ, đây là các sản phẩm đẹp nhất tại Tiệm Rêu:";
    }

    return {
      text: `${intro}\n\n💡 Bấm vào sản phẩm để xem chi tiết. Freeship đơn từ 500.000₫ ạ!`,
      products: productCards,
    };
  } catch {
    return null;
  }
}

// =============================================
// 8. FALLBACK KB — Khi Ollama offline, trả lời kiến thức cơ bản
// =============================================
function getOfflineFallback(message: string): string | null {
  const q = message.toLowerCase().trim();

  if (/terrarium.*là.*gì|là.*gì.*terrarium|terrarium.*nghĩa/i.test(q))
    return "🌿 **Terrarium là gì?**\n\nTerrarium là một **vườn thu nhỏ** trong bình/lọ thủy tinh, mô phỏng hệ sinh thái tự nhiên.\n\n**2 loại chính:**\n• **Bể kín (closed):** Có nắp, tạo chu trình nước tuần hoàn, gần như tự duy trì — rất dễ chăm!\n• **Bể mở (open):** Không nắp, phù hợp sen đá, xương rồng.\n\n**Lịch sử:** Được phát minh bởi Nathaniel Ward (1842) khi phát hiện cây dương xỉ tự mọc trong lọ thủy tinh.\n\n**Cấu tạo:** Sỏi thoát nước → than hoạt tính → đất → rêu/cây → trang trí.\n\nAnh/chị muốn tìm hiểu thêm về gì ạ? 😊";

  if (/tưới|tưới nước|cách tưới|bao lâu.*tưới/i.test(q))
    return "💧 **Cách tưới terrarium:**\n\n• **Bể kín:** 1-2 tuần/lần, phun sương nhẹ. Sương đọng trên thành = đủ ẩm.\n• **Bể mở:** 3-5 ngày/lần. Sen đá: 7-10 ngày.\n• **Dấu hiệu thiếu nước:** Rêu nhạt màu, đất khô, lá héo mềm.\n• **Dấu hiệu thừa nước:** Lá vàng, đất sũng, sương đọng quá nhiều.\n• **Mẹo:** Dùng bình xịt phun sương, tưới vào gốc cây, tránh đọng nước trên lá.";

  if (/ánh sáng|nắng|để ở đâu|vị trí|đặt.*đâu|phòng tối/i.test(q))
    return "☀️ **Ánh sáng cho terrarium:**\n\n• Cần ánh sáng **gián tiếp** 6-8h/ngày (gần cửa sổ nhưng không nắng trực tiếp).\n• **TUYỆT ĐỐI** không để nắng chiếu thẳng → nấu chín cây!\n• **Phòng tối:** Dùng đèn LED grow light 8-10h/ngày, cách bể 30-50cm.\n• Nhiệt độ: 18-28°C, tránh điều hòa thổi trực tiếp.";

  if (/nấm|mốc|nấm mốc/i.test(q))
    return "🍄 **Xử lý nấm mốc:**\n\n1. Mở nắp 24-48h giảm ẩm\n2. Dùng nhíp gỡ phần nấm\n3. Rắc bột quế (kháng nấm tự nhiên)\n4. Giảm tưới, đảm bảo thoát nước\n5. Thêm springtails (bọ nhảy) giúp ăn nấm\n\n💡 Nấm nhẹ là bình thường trong hệ sinh thái kín!";

  if (/héo|lá héo|cây héo|rũ/i.test(q))
    return "🥀 **Cây bị héo:**\n\n• **Héo mềm:** Thiếu nước → tưới phun sương nhẹ\n• **Héo + đất ướt:** Thừa nước → ngừng tưới, mở nắp 24-48h\n• **Héo + vàng:** Rễ úng → kiểm tra thoát nước, có thể thay đất";

  if (/vàng|rêu vàng|lá vàng|úa/i.test(q))
    return "💛 **Rêu/lá vàng:**\n\n• **Thiếu sáng** → di chuyển đến nơi sáng hơn\n• **Tưới quá nhiều** → giảm tần suất, mở nắp thoát ẩm\n• **Già tự nhiên** → cắt tỉa phần vàng, rêu mới sẽ mọc\n• **Lá vàng + đất ướt** = thừa nước, **lá vàng + đất khô** = thiếu nước";

  if (/chăm sóc|cách chăm|hướng dẫn.*chăm/i.test(q))
    return "🌿 **Chăm sóc terrarium cơ bản:**\n\n1. **Ánh sáng:** Gián tiếp 6-8h/ngày\n2. **Tưới:** Bể kín 1-2 tuần, bể mở 3-5 ngày\n3. **Nhiệt độ:** 18-28°C\n4. **Cắt tỉa:** Loại bỏ lá vàng/héo\n5. **Nấm:** Mở nắp + bột quế\n6. **Thông khí:** Mở nắp 30 phút/tuần";

  if (/người mới|lần đầu|bắt đầu|newbie|beginner/i.test(q))
    return "🌱 **Terrarium cho người mới:**\n\n• Bắt đầu với **bể kín** — tự duy trì, ít chăm sóc nhất\n• Cây dễ sống: rêu, cỏ ngọc, fitonia, phong thảo\n• Bắt đầu bể nhỏ để tập quen\n• **Lớp đất:** Sỏi → than hoạt tính → đất → rêu\n\nAnh/chị muốn em gợi ý sản phẩm phù hợp không ạ?";

  if (/bể kín|hệ kín|kín.*hay.*mở|mở.*hay.*kín|loại.*terrarium/i.test(q))
    return "🏺 **Bể kín vs Bể mở:**\n\n**Bể kín:** Tự tuần hoàn, tưới 1-2 tuần/lần, phù hợp rêu/fitonia, dễ chăm.\n**Bể mở:** Thoáng khí, tưới 3-5 ngày, phù hợp sen đá/xương rồng.\n\n💡 Người mới nên chọn bể kín — dễ nhất!";

  if (/côn trùng|sâu|bọ|kiến|ruồi/i.test(q))
    return "🐛 **Côn trùng trong terrarium:**\n\n• **Ruồi nhỏ:** Để đất khô hơn, phủ cát mỏng, bẫy giấy vàng\n• **Kiến:** Ngâm chậu trong nước 30 phút\n• **Phòng ngừa:** Kiểm tra cây mới trước khi đưa vào bể";

  if (/diy|tự làm|tự trồng|cách làm|handmade/i.test(q))
    return "🛠️ **Tự làm terrarium DIY:**\n\n**Dụng cụ:** Bình thủy tinh, sỏi, than hoạt tính, đất, rêu, cây, nhíp dài, bình xịt\n\n**Các bước:**\n1. Rửa sạch bình, phơi khô\n2. Đổ sỏi (2cm) → than hoạt tính → đất (3-5cm)\n3. Dùng nhíp đặt cây, ấn nhẹ gốc\n4. Phủ rêu, trang trí\n5. Phun sương nhẹ, đóng nắp\n6. Đặt nơi sáng gián tiếp";

  if (/sen đá|xương rồng|succulent|cactus/i.test(q))
    return "🌵 **Sen đá & Xương rồng:**\n\n• Dùng **bể mở** (cần thoáng, không thích ẩm)\n• Đất: hỗn hợp đất + cát + đá pumice (thoát nước tốt)\n• Tưới: 7-10 ngày/lần, để đất khô hoàn toàn\n• Nắng: 4-6h/ngày\n• ⚠️ KHÔNG phù hợp bể kín (quá ẩm → thối rễ)";

  return null;
}

// =============================================
// ROUTE HANDLER — v11
// =============================================
export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { response: "Dạ anh/chị đang gửi hơi nhanh, vui lòng đợi 1 phút rồi hỏi lại nhé! 🌿", rateLimited: true },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, history = [], pageContext } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ response: "Vui lòng nhập câu hỏi." });
    }

    const trimmed = message.trim();
    if (trimmed.length > 400) {
      return NextResponse.json({ response: "Dạ câu hỏi hơi dài. Anh/chị tóm tắt ngắn gọn dưới 400 ký tự nhé! 🌿" });
    }

    console.log(`[CONSULT] "${trimmed.slice(0, 60)}..." from ${ip}`);

    // ── 1. GUARDRAIL: Chặn off-topic ──────────────────────
    if (isOffTopic(trimmed)) {
      console.log(`[CONSULT] ❌ OFF-TOPIC blocked: "${trimmed.slice(0, 40)}"`);
      return NextResponse.json({ response: OFF_TOPIC_RESPONSE, source: "guardrail" });
    }

    // ── 2. INSTANT KB: Greeting + Chính sách (< 5ms) ─────
    const instant = getInstantResponse(trimmed);
    if (instant) {
      console.log(`[CONSULT] ⚡ Instant KB hit`);
      return NextResponse.json({ response: instant, source: "knowledge" });
    }

    // ── 3. PRODUCT INTENT: DB query + thumbnails ──────────
    if (isProductIntent(trimmed)) {
      console.log(`[CONSULT] 🛒 Product intent detected`);
      const productResult = await queryProducts(trimmed);
      if (productResult) {
        return NextResponse.json({
          response: productResult.text,
          source: "db",
          products: productResult.products,
        });
      }
    }

    // ── 4. SKIP isOnTopic — Để Ollama tự xử lý câu hỏi không rõ ─
    // (isOnTopic() quá strict → chặn nhầm câu hỏi hợp lệ)

    // ── 5. OLLAMA AI — Xử lý mọi câu hỏi terrarium ──────
    console.log(`[CONSULT] 🧠 Sending to Ollama...`);
    const stream = await streamFromAI(trimmed, history, pageContext);
    if (stream) {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── 6. OLLAMA OFFLINE → Fallback KB ───────────────────
    console.log(`[CONSULT] ⚠️ Ollama offline, trying fallback KB`);
    const fallback = getOfflineFallback(trimmed);
    if (fallback) {
      return NextResponse.json({ response: fallback, source: "knowledge" });
    }

    // ── 7. PRODUCT FALLBACK (last resort) ─────────────────
    const fallbackProducts = await queryProducts(trimmed);
    if (fallbackProducts) {
      return NextResponse.json({
        response: fallbackProducts.text,
        source: "db",
        products: fallbackProducts.products,
      });
    }

    // ── 8. FINAL FALLBACK ─────────────────────────────────
    return NextResponse.json({
      response: "Dạ em tạm thời chưa thể trả lời câu hỏi này. Anh/chị có thể hỏi em về:\n\n• 🌿 **Kiến thức terrarium** (cách làm, chăm sóc, xử lý sự cố)\n• 🛒 **Sản phẩm** (gợi ý, giá cả, so sánh)\n• 📦 **Chính sách** (ship, đổi trả, thanh toán)\n\nHoặc liên hệ Zalo/Facebook Tiệm Rêu để được hỗ trợ trực tiếp nhé! 😊",
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
