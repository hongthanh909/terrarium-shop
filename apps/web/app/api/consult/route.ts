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
import { streamFromOpenAI } from "@/lib/ai/openai";

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
        setupStatus: true, careLevel: true, chatTags: true, shortConsultNote: true,
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
      const setup = getSetupStatusLabel(p.setupStatus);
      const care = getCareLevelLabel(p.careLevel);
      const tags = [setup, care, p.shortConsultNote, ...p.chatTags].filter(Boolean).join("; ");
      return `• ${p.name}${star} — ${price} — ${p.category.name} — ${stock}${tags ? ` — ${tags}` : ""} — Link: /products/${p.slug}`;
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

interface KnowledgeHit {
  id: string;
  keyword: string;
  response: string;
  category: string;
  priority: number;
  score: number;
}

type OrderLookupResult = {
  text: string;
  found: boolean;
};

function getProductConsultNotes(normalizedMessage: string): string[] {
  const notes: string[] = [];

  if (/\bban lam viec\b|\bban hoc\b|\bdesk\b/.test(normalizedMessage)) {
    notes.push("Ưu tiên mẫu gọn, dễ đặt trên bàn làm việc/bàn học, không chiếm nhiều diện tích.");
  }
  if (/\bphong ngu\b|\bke dau giuong\b/.test(normalizedMessage)) {
    notes.push("Với phòng ngủ, nên chọn mẫu nhỏ-vừa, ít mùi ẩm, đặt nơi có ánh sáng gián tiếp nhẹ.");
  }
  if (/\bphong khach\b|\bke sach\b|\bke trang tri\b/.test(normalizedMessage)) {
    notes.push("Với phòng khách/kệ trang trí, có thể chọn mẫu nổi bật hơn để làm điểm nhấn decor.");
  }
  if (/\bvan phong\b|\bcong ty\b|\bmay lanh\b|\bdieu hoa\b/.test(normalizedMessage)) {
    notes.push("Với văn phòng/máy lạnh, nên tránh luồng gió điều hòa trực tiếp và ưu tiên mẫu dễ giữ ẩm.");
  }
  if (/\bqua tang\b|\bsinh nhat\b|\btan gia\b|\bban gai\b|\bban trai\b|\bsep\b|\bdong nghiep\b/.test(normalizedMessage)) {
    notes.push("Nếu làm quà tặng, nên chọn mẫu dễ chăm, bố cục xinh và an toàn khi vận chuyển.");
  }
  if (/\bnguoi moi\b|\blan dau\b|\bde cham\b|\bit cham\b|\bban ron\b|\bnewbie\b|\bbeginner\b/.test(normalizedMessage)) {
    notes.push("Với người mới, nên ưu tiên mẫu dễ chăm và chỉ cần theo dõi độ ẩm định kỳ.");
  }
  if (/\bphong toi\b|\bit sang\b|\bthieu sang\b/.test(normalizedMessage)) {
    notes.push("Nếu không gian ít sáng, nên đặt gần nguồn sáng gián tiếp hoặc bổ sung đèn LED nhẹ.");
  }

  return notes.slice(0, 3);
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
    return "🚚 Dạ phần vận chuyển/phí ship cần trả theo chính sách hiện tại của shop và khu vực nhận hàng.\n\nAnh/chị cho Rêu biết khu vực nhận hàng và sản phẩm muốn đặt, Rêu sẽ hướng theo thông tin shop đã chốt. Nếu là đơn đã đặt, anh/chị gửi SĐT đặt hàng để Rêu tra trạng thái, nhưng Rêu sẽ không hiển thị tracking link/tổng tiền/địa chỉ trong chatbox.";

  if (/đổi trả|trả hàng|bảo hành|hỏng|vỡ|bể.*vỡ|lỗi/i.test(q))
    return "🔄 Dạ phần bảo hành/đổi trả cần kiểm tra theo chính sách hiện tại và tình trạng thực tế.\n\nAnh/chị mô tả vấn đề, gửi ảnh/video nếu có, và cho biết thời điểm nhận hàng. Rêu có thể hướng dẫn bước đầu, nhưng kết luận bảo hành/đổi trả cần shop xác nhận.";

  if (/thanh toán|trả tiền|chuyển khoản|cod|payment|momo/i.test(q))
    return "💳 Dạ phần thanh toán sẽ theo phương thức đang bật ở bước checkout hoặc xác nhận trực tiếp từ shop.\n\nRêu không tự gửi số tài khoản, QR hay link thanh toán trong chatbox để tránh nhầm thông tin. Với đơn custom/đặt cọc, shop cần xác nhận riêng.";

  if (/khuyến mãi|voucher|mã giảm|discount|sale|giảm giá/i.test(q))
    return "🎉 Dạ voucher/khuyến mãi cần kiểm tra theo chương trình đang áp dụng trên website hoặc xác nhận từ shop.\n\nNếu anh/chị có mã giảm giá, hãy thử ở bước thanh toán để hệ thống kiểm tra điều kiện áp dụng.";

  if (/liên hệ|hotline|zalo|facebook|điện thoại|sdt|phone|email/i.test(q))
    return "📞 **Liên hệ Tiệm Rêu:**\n\n• **Facebook:** Tiệm Rêu Décor\n• **Zalo:** Tìm 'Tiệm Rêu'\n• **Website:** tiemreudecor.com\n• Giờ hỗ trợ: 8:00 - 21:00 hàng ngày\n\nHoặc anh/chị cứ chat với em ở đây, em hỗ trợ 24/7 ạ! 🌿";

  if (/đặt hàng.*sao|mua.*sao|cách.*mua|cách.*đặt|order.*sao/i.test(q))
    return "🛒 Dạ anh/chị có thể đặt hàng trực tiếp trên website: chọn sản phẩm, thêm vào giỏ, vào thanh toán và điền thông tin nhận hàng.\n\nNếu là mẫu custom/đặt theo yêu cầu, shop cần xác nhận riêng về mẫu, thời gian làm và thanh toán.";

  // Không match → return null → flow tiếp tục tới Ollama
  return null;
}

// =============================================
// 3. PRODUCT INTENT DETECTION
// =============================================
function isProductIntent(message: string): boolean {
  const q = message.toLowerCase().trim();
  const n = normalizeVN(message);
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
    /\b(bể|terrarium|mẫu|sản phẩm)\b.*\b(rẻ|giá tốt|bình dân|tiết kiệm)\b/i,
    /\b(rẻ|giá tốt|bình dân|tiết kiệm)\b.*\b(bể|terrarium|mẫu|sản phẩm)\b/i,
    /(?:dưới|tầm|khoảng|tối đa|không quá|ngân sách)\s*[\d.,]+\s*(k|nghìn|ng|triệu|tr)?/i,
    /[\d.,]+\s*(k|nghìn|ng|triệu|tr)\s*(trở xuống|đổ lại|quay đầu|có gì|mua gì)?/i,
    /\b(bể|terrarium|mẫu|sản phẩm)\b.*\b(setup|set up|sẵn|làm sẵn|trưng ngay|full set)\b/i,
    /\b(setup|set up|sẵn|làm sẵn|trưng ngay|full set)\b.*\b(bể|terrarium|mẫu|sản phẩm)\b/i,
  ];
  const normalizedProductPatterns = [
    /\bsan\s*pham\b/,
    /\bsp\b/,
    /\bgia\b.*\b(bao|ca|tien|duoi|tam|khoang)\b/,
    /\bbao\s*nhieu\b/,
    /\bbn\b/,
    /\bmuon\s*mua\b/,
    /\bmua\s+(gi|cai|con|be|chau)\b/,
    /\bgoi\s*y\b.*\b(san|sp|be|terrarium|qua|combo)\b/,
    /\b(dat|mua)\s*hang\b/,
    /\b(con|het)\s*hang\b/,
    /\bqua\s*tang\b/,
    /\bcombo\b/,
    /\bxem\b.*\b(san|sp|be|hang)\b/,
    /\bco\b.*\b(ban|be|san|sp)\b/,
    /\blist\b.*\b(san|sp)\b/,
    /\b(be|terrarium|mau|san pham)\b.*\b(re|gia tot|binh dan|tiet kiem)\b/,
    /\b(re|gia tot|binh dan|tiet kiem)\b.*\b(be|terrarium|mau|san pham)\b/,
    /\bduoi\s*\d+\s*(k|nghin|trieu|tr)?\b.*\b(be|terrarium|san|sp)\b/,
    /\b(tu van|goi y|chon)\b.*\b(ban lam viec|ban hoc|phong ngu|phong khach|van phong|may lanh|khong gian|ngan sach|decor|qua tang)\b/,
    /\b(be|terrarium|cay|reu)\b.*\b(ban lam viec|ban hoc|phong ngu|phong khach|van phong|may lanh|duoi|tam|ngan sach|decor|qua tang)\b/,
    /\b(tu van|goi y|chon)\b.*\b(mau|qua|sinh nhat|tan gia|sep|dong nghiep|ban gai|ban trai)\b/,
    /\b(mau|set|be|terrarium)\b.*\b(qua|sinh nhat|tan gia|sep|dong nghiep|ban gai|ban trai)\b/,
    /\b(duoi|tam|khoang|toi da|khong qua|ngan sach)\b\s*[\d.,]+\s*(k|nghin|ng|trieu|tr)?\b/,
    /\b[\d.,]+\s*(k|nghin|ng|trieu|tr)\b\s*(tro xuong|do lai|quay dau|co gi|mua gi)?\b/,
    /\b(be|terrarium|mau|san pham)\b.*\b(setup|set up|san|lam san|trung ngay|full set)\b/,
    /\b(setup|set up|san|lam san|trung ngay|full set)\b.*\b(be|terrarium|mau|san pham)\b/,
  ];
  return productPatterns.some(p => p.test(q)) || normalizedProductPatterns.some((p) => p.test(n));
}

function isCareAiIntent(message: string): boolean {
  const n = normalizeVN(message);

  if (hasStrongKnowledgeIntent(message)) return true;

  return hasAnyPattern(n, [
    /\bcham soc\b/,
    /\bcach cham\b/,
    /\btuoi nuoc\b/,
    /\btuoi cay\b/,
    /\bphun suong\b/,
    /\banh sang\b/,
    /\bnhiet do\b/,
    /\bdo am\b/,
    /\bmay lanh\b/,
    /\bdieu hoa\b/,
    /\bmo nap\b/,
    /\bthong khi\b/,
    /\bve sinh kinh\b/,
    /\bcat tia\b/,
    /\b7 ngay dau\b/,
    /\bmoi nhan\b/,
    /\breu vang\b/,
    /\breu kho\b/,
    /\breu moc\b/,
    /\bmoc trang\b/,
    /\bcay heo\b/,
    /\bla heo\b/,
    /\bcay ru\b/,
    /\bla ru\b/,
    /\bla vang\b/,
    /\brung la\b/,
    /\bung re\b/,
    /\bthoi re\b/,
    /\bthoi goc\b/,
    /\bcam nhung\b/,
    /\bfittonia\b/,
    /\bduong si\b/,
    /\bduong xi\b/,
    /\bdua phung\b/,
    /\bsen da\b/,
    /\bxuong rong\b/,
    /\bsucculent\b/,
    /\bcactus\b/,
    /\bfern\b/,
    /\bmoss\b/,
    /\bplant care\b/,
    /\bwatering\b/,
    /\bgrow light\b/,
  ]);
}

function isPolicyFactIntent(message: string): boolean {
  const n = normalizeVN(message);
  return hasAnyPattern(n, [
    /\bbao hanh\b/,
    /\bdoi tra\b/,
    /\bhoan hang\b/,
    /\bchinh sach\b/,
    /\bvan chuyen\b/,
    /\bgiao hang\b/,
    /\bphi ship\b/,
    /\bfreeship\b/,
    /\bhoa toc\b/,
    /\btracking\b/,
    /\bma van don\b/,
    /\bthanh toan\b/,
    /\bcod\b/,
    /\bchuyen khoan\b/,
    /\bvoucher\b/,
    /\bma giam\b/,
    /\bgiam gia\b/,
    /\bkhuyen mai\b/,
    /\bdat hang\b/,
    /\bhuy don\b/,
    /\bdoi dia chi\b/,
    /\bdoi sdt\b/,
    /\blien he\b/,
    /\bhotline\b/,
    /\bfacebook\b/,
    /\binstagram\b/,
    /\btiktok\b/,
  ]);
}

function isCustomFactIntent(message: string): boolean {
  const n = normalizeVN(message);
  return hasAnyPattern(n, [
    /\bcustom\b/,
    /\btheo yeu cau\b/,
    /\bmau rieng\b/,
    /\bsize rieng\b/,
    /\bconcept\b/,
    /\bchu de\b/,
    /\bphong thuy\b/,
    /\btai loc\b/,
    /\btheo menh\b/,
    /\banh mau\b/,
    /\bpinterest\b/,
    /\bdat coc\b/,
    /\bbao gia custom\b/,
    /\blam rieng\b/,
  ]);
}

function isSetupReadyProductIntent(message: string): boolean {
  const n = normalizeVN(message);
  return hasAnyPattern(n, [
    /\bda setup\b/,
    /\bsetup san\b/,
    /\bset up san\b/,
    /\bbe san\b/,
    /\bmau san\b/,
    /\blam san\b/,
    /\bda lam san\b/,
    /\bnhan ve trung ngay\b/,
    /\btrung ngay\b/,
    /\bfull set\b/,
  ]);
}

// =============================================
// 4. FUZZY MATCHING — Sửa lỗi chính tả
// =============================================
function normalizeVN(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, "").trim();
}

function tokenizeForKnowledge(str: string): string[] {
  const stopWords = new Set([
    "toi", "minh", "em", "anh", "chi", "ban", "shop", "co", "khong", "ko",
    "la", "gi", "ve", "cho", "hoi", "hoi", "nhe", "a", "ạ", "duoc", "duoc",
    "sao", "the", "nao", "nhu", "bao", "nhieu", "may", "cai", "bi", "thi",
    "ntn", "ma", "vay", "cu", "hon", "ro",
    "cay", "reu", "la", "be", "binh", "terrarium",
  ]);

  return normalizeVN(str)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

function extractPhone(message: string): string | null {
  const phoneMatch = message.match(/(?:\+?84|0)(?:[\s.-]?\d){8,10}/);
  if (!phoneMatch) return null;

  const normalized = normalizePhone(phoneMatch[0]);
  return normalized.length >= 9 && normalized.length <= 11 ? normalized : null;
}

function isOrderLookupIntent(message: string, history: { role: string; content: string }[] = []): boolean {
  const normalized = normalizeVN(message);
  const hasOrderKeyword = hasAnyPattern(normalized, [
    /\bdon hang\b/,
    /\bma don\b/,
    /\bkiem tra don\b/,
    /\btra cuu don\b/,
    /\btinh trang don\b/,
    /\btrang thai don\b/,
    /\bdon cua toi\b/,
    /\bdon minh\b/,
    /\bhang cua toi\b/,
    /\bda giao chua\b/,
    /\bgiao den dau\b/,
  ]);

  if (hasOrderKeyword) return true;

  const hasPhone = Boolean(extractPhone(message));
  if (!hasPhone) return false;

  const recentOrderContext = history
    .slice(-4)
    .map((item) => item.content)
    .join(" ");

  return hasAnyPattern(normalizeVN(recentOrderContext), [
    /\bdon hang\b/,
    /\bso dien thoai\b/,
    /\bsdt\b/,
    /\btra cuu don\b/,
    /\btinh trang don\b/,
    /\btrang thai don\b/,
  ]);
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang chuẩn bị hàng",
    SHIPPING: "Đang giao hàng",
    SHIPPED: "Đã gửi đơn vị vận chuyển",
    DELIVERED: "Đã giao thành công",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền",
  };

  return labels[status] || status;
}

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    FAILED: "Thanh toán thất bại",
    REFUNDED: "Đã hoàn tiền",
  };

  return labels[status] || status;
}

function getSetupStatusLabel(status?: string | null): string | null {
  const labels: Record<string, string> = {
    READY_TO_DISPLAY: "đã setup sẵn",
    DIY_KIT: "bộ tự làm DIY",
    CUSTOM_ORDER: "đặt custom",
  };

  return status ? labels[status] || null : null;
}

function getCareLevelLabel(level?: string | null): string | null {
  const labels: Record<string, string> = {
    EASY: "dễ chăm",
    MEDIUM: "cần chăm mức vừa",
    ADVANCED: "cần kinh nghiệm",
  };

  return level ? labels[level] || null : null;
}

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

async function lookupOrdersByPhone(message: string): Promise<OrderLookupResult> {
  const phone = extractPhone(message);

  if (!phone) {
    return {
      found: false,
      text: "Dạ anh/chị gửi giúp em **SĐT đã dùng khi đặt hàng** để em tra cứu trạng thái đơn nhé. Em chỉ hiển thị trạng thái đơn, không hiển thị địa chỉ/SĐT/thông tin nhạy cảm ạ.",
    };
  }

  const phoneTail = phone.slice(-6);
  const shippingInfos = await prisma.shippingInfo.findMany({
    where: {
      OR: [
        { phone: { contains: phone } },
        { phone: { contains: phoneTail } },
      ],
    },
    include: {
      order: {
        include: {
          items: {
            select: {
              productName: true,
              quantity: true,
            },
          },
        },
      },
    },
    orderBy: { order: { createdAt: "desc" } },
    take: 10,
  });

  const matchedOrders = shippingInfos
    .filter((info) => normalizePhone(info.phone || "") === phone)
    .map((info) => info.order)
    .slice(0, 3);

  if (matchedOrders.length === 0) {
    return {
      found: false,
      text: "Dạ em chưa tìm thấy đơn hàng theo SĐT này. Anh/chị kiểm tra lại SĐT đã dùng khi đặt hàng, hoặc nhắn shop trên Facebook/Zalo để Rêu kiểm tra thủ công nhé.",
    };
  }

  const lines = matchedOrders.map((order, index) => {
    const products = order.items
      .slice(0, 3)
      .map((item) => `${item.productName} x${item.quantity}`)
      .join(", ");
    const moreCount = Math.max(0, order.items.length - 3);
    const productText = products
      ? `${products}${moreCount > 0 ? `, +${moreCount} sản phẩm khác` : ""}`
      : "Chưa có chi tiết sản phẩm";

    return [
      `**${index + 1}. Đơn ${order.orderNumber}**`,
      `• Ngày đặt: ${formatOrderDate(order.createdAt)}`,
      `• Trạng thái đơn: **${getOrderStatusLabel(order.status)}**`,
      `• Thanh toán: **${getPaymentStatusLabel(order.paymentStatus)}**`,
      `• Sản phẩm: ${productText}`,
    ].join("\n");
  });

  return {
    found: true,
    text: `Dạ em tìm thấy ${matchedOrders.length} đơn hàng theo SĐT anh/chị cung cấp:\n\n${lines.join("\n\n")}\n\nEm đã ẩn địa chỉ, SĐT, tổng tiền và tracking link để bảo mật thông tin đơn hàng ạ.`,
  };
}

function isWateringGuideIntent(messageNorm: string): boolean {
  const asksWatering = hasAnyPattern(messageNorm, [
    /\btuoi\b/,
    /\bphun suong\b/,
    /\bcham nuoc\b/,
    /\bcho nuoc\b/,
  ]);

  const asksHow = hasAnyPattern(messageNorm, [
    /\bcach\b/,
    /\bnhu the nao\b/,
    /\bthe nao\b/,
    /\bntn\b/,
    /\blam sao\b/,
    /\bbao lau\b/,
    /\bmoi lan\b/,
    /\bmay lan\b/,
    /\bmoi ngay\b/,
    /\bhuong dan\b/,
  ]);

  return asksWatering && (asksHow || messageNorm.split(/\s+/).length <= 6);
}

function isOverwateringIntent(messageNorm: string): boolean {
  return hasAnyPattern(messageNorm, [
    /\bung nuoc\b/,
    /\btuoi qua nhieu\b/,
    /\btuoi nhieu qua\b/,
    /\blo tuoi nhieu\b/,
    /\blo tay\b/,
    /\bqua tay\b/,
    /\bdat sung\b/,
    /\bsung nuoc\b/,
    /\buot sung\b/,
    /\buot qua\b/,
    /\bdu nuoc\b/,
    /\bnuoc dong\b/,
    /\bdong nuoc\b/,
    /\bdong day\b/,
  ]);
}

function isDrynessIntent(messageNorm: string): boolean {
  return hasAnyPattern(messageNorm, [
    /\bthieu nuoc\b/,
    /\bthieu am\b/,
    /\bbi kho\b/,
    /\bdat kho\b/,
    /\breu kho\b/,
    /\bkho qua\b/,
    /\bkho gion\b/,
  ]);
}

function isYellowingIntent(messageNorm: string): boolean {
  return hasAnyPattern(messageNorm, [
    /\breu vang\b/,
    /\breu bi vang\b/,
    /\bla vang\b/,
    /\bvang la\b/,
    /\bcay vang\b/,
    /\bcay bi vang\b/,
    /\bcay ua\b/,
    /\breu ua\b/,
    /\bbi ua\b/,
  ]);
}

function isWiltingIntent(messageNorm: string): boolean {
  return hasAnyPattern(messageNorm, [
    /\bcay heo\b/,
    /\bla heo\b/,
    /\bbi heo\b/,
    /\bcay ru\b/,
    /\bla ru\b/,
    /\bbi ru\b/,
    /\bheo mem\b/,
    /\bmem la\b/,
  ]);
}

function hasStrongKnowledgeIntent(message: string): boolean {
  const normalized = normalizeVN(message);
  return (
    isWateringGuideIntent(normalized) ||
    isOverwateringIntent(normalized) ||
    isDrynessIntent(normalized) ||
    isYellowingIntent(normalized) ||
    isWiltingIntent(normalized)
  );
}

function getSafeHistory(history: unknown): { role: string; content: string }[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item): item is { role: string; content: string } => {
      return (
        item &&
        typeof item === "object" &&
        typeof (item as { role?: unknown }).role === "string" &&
        typeof (item as { content?: unknown }).content === "string"
      );
    })
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content.slice(0, 700),
    }))
    .slice(-6);
}

function isFollowUpQuestion(message: string): boolean {
  const normalized = normalizeVN(message);
  const tokens = tokenizeForKnowledge(message);

  return (
    tokens.length <= 1 ||
    /\b(nhu the nao|ntn|cu the|chi tiet|lam sao|cach nao|tie?p tuc|noi ro hon|huong dan ky|the thi sao|ra sao|vay thi sao)\b/i.test(normalized)
  );
}

function buildKnowledgeSearchQuery(message: string, history: { role: string; content: string }[]): string {
  if (hasStrongKnowledgeIntent(message)) return message;
  if (!isFollowUpQuestion(message) || history.length === 0) return message;

  const recentContext = history
    .slice(-4)
    .filter((item) => item.role === "user")
    .map((item) => item.content)
    .join(" ")
    .slice(-1200);

  if (!recentContext.trim()) return message;

  return `${recentContext}\n${message}`;
}

function shouldAnswerKnowledgeDirectly(hits: KnowledgeHit[]): boolean {
  if (process.env.AI_KB_FAST_MODE === "false") return false;

  const top = hits[0];
  if (!top) return false;

  // KB là nguồn chính thức và đã được admin duyệt. Với match rõ ràng, trả lời trực tiếp
  // giúp chat nhanh hơn rất nhiều so với chờ Ollama diễn giải lại.
  return top.score >= 8 || ["policy", "shipping", "greeting"].includes(top.category);
}

function scoreKnowledgeEntry(messageTokens: string[], messageNorm: string, currentMessageNorm: string, entry: {
  keyword: string;
  response: string;
  category: string;
  priority: number;
}): number {
  const keywordNorm = normalizeVN(entry.keyword);
  const responseNorm = normalizeVN(entry.response);
  const categoryNorm = normalizeVN(entry.category);
  const keywordParts = keywordNorm
    .split(/[,;|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const keywordTokens = new Set(tokenizeForKnowledge(entry.keyword));
  const isWateringEntry = /\btuoi nuoc\b|\bbao lau tuoi\b|\bcach tuoi\b|\bphun suong\b/.test(keywordNorm);
  const isOverwateringEntry = /\bung nuoc\b|\btuoi qua nhieu\b|\bdu nuoc\b|\bdat sung\b|\bnuoc dong\b/.test(keywordNorm);
  const isDrynessEntry = /\bbi kho\b|\bdat kho\b|\breu kho\b|\bthieu am\b|\bthieu nuoc\b/.test(keywordNorm);
  const isYellowingEntry = /\bvang\b|\bvang la\b|\bla vang\b|\breu vang\b|\bbi ua\b|\bcay ua\b/.test(keywordNorm);
  const isWiltingEntry = /\bheo\b|\bru\b|\bla ru\b|\bcay ru\b|\bheo mem\b/.test(keywordNorm);

  const wateringGuideIntent = isWateringGuideIntent(currentMessageNorm);
  const overwateringIntent = isOverwateringIntent(currentMessageNorm);
  const drynessIntent = isDrynessIntent(currentMessageNorm);
  const yellowingIntent = isYellowingIntent(currentMessageNorm);
  const wiltingIntent = isWiltingIntent(currentMessageNorm);

  // Chặn lỗi kinh điển: "tưới nước như thế nào?" không được rơi vào case "úng nước".
  if (wateringGuideIntent && !overwateringIntent && isOverwateringEntry) return 0;
  if (overwateringIntent && isWateringEntry) return 0;
  if (drynessIntent && isOverwateringEntry) return 0;
  if (yellowingIntent && isWiltingEntry) return 0;
  if (wiltingIntent && isYellowingEntry) return 0;

  let score = Math.min(entry.priority, 100) / 100;
  let hasKeywordMatch = false;

  if (wateringGuideIntent && isWateringEntry) {
    score += 18;
    hasKeywordMatch = true;
  }
  if (overwateringIntent && isOverwateringEntry) {
    score += 18;
    hasKeywordMatch = true;
  }
  if (drynessIntent && isDrynessEntry) {
    score += 18;
    hasKeywordMatch = true;
  }
  if (yellowingIntent && isYellowingEntry) {
    score += 18;
    hasKeywordMatch = true;
  }
  if (wiltingIntent && isWiltingEntry) {
    score += 18;
    hasKeywordMatch = true;
  }

  for (const part of keywordParts) {
    if (part.length >= 3 && messageNorm.includes(part)) {
      score += 8;
      hasKeywordMatch = true;
    }
  }

  for (const token of messageTokens) {
    if (keywordTokens.has(token)) {
      score += 4;
      hasKeywordMatch = true;
    }
    if (categoryNorm.includes(token)) score += 0.75;
    if (responseNorm.includes(token)) score += 0.25;
  }

  return hasKeywordMatch ? score : 0;
}

async function searchOfficialKnowledge(message: string, currentMessage = message): Promise<KnowledgeHit[]> {
  const messageNorm = normalizeVN(message);
  const currentMessageNorm = normalizeVN(currentMessage);
  const messageTokens = tokenizeForKnowledge(message);
  if (messageTokens.length === 0) return [];

  try {
    const entries = await prisma.aiKnowledge.findMany({
      where: { isActive: true },
      select: {
        id: true,
        keyword: true,
        response: true,
        category: true,
        priority: true,
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 80,
    });

    return entries
      .map((entry) => ({
        ...entry,
        score: scoreKnowledgeEntry(messageTokens, messageNorm, currentMessageNorm, entry),
      }))
      .filter((entry) => entry.score >= 4)
      .sort((a, b) => b.score - a.score || b.priority - a.priority)
      .slice(0, 4);
  } catch (error) {
    console.error("[CONSULT] Knowledge search error:", error);
    return [];
  }
}

function formatKnowledgeContext(hits: KnowledgeHit[]): string {
  return hits
    .map((hit, index) => {
      return `[#${index + 1}] Danh mục: ${hit.category} | Từ khóa: ${hit.keyword} | Ưu tiên: ${hit.priority}\n${hit.response}`;
    })
    .join("\n\n---\n\n");
}

function getUserQuestionSnippet(message: string): string {
  return message
    .replace(/\s+/g, " ")
    .replace(/[“”"]/g, "")
    .trim()
    .slice(0, 90);
}

function buildKnowledgeLeadIn(message: string, hit: KnowledgeHit): string {
  const q = normalizeVN(message);
  const question = getUserQuestionSnippet(message);

  if (hit.category === "greeting") return "";

  if (isWateringGuideIntent(q)) {
    return "Dạ, về **cách tưới cây trong terrarium**, mình nên tưới theo kiểu bổ sung ẩm nhẹ chứ không tưới ngập như chậu cây thường ạ.";
  }

  if (isOverwateringIntent(q)) {
    return "Dạ, nếu bể đang bị **dư nước/úng nước** thì ưu tiên đầu tiên là giảm ẩm và ngưng tưới thêm, vì rễ rất dễ yếu nếu ướt lâu ạ.";
  }

  if (isDrynessIntent(q)) {
    return "Dạ, nếu bể/cây đang có dấu hiệu **thiếu ẩm hoặc bị khô**, mình nên tăng ẩm từ từ bằng phun sương nhẹ, không đổ nước ào vào bể ạ.";
  }

  if (/\breu vang\b|\breu bi vang\b|\breu ua\b/.test(q)) {
    return "Dạ, **rêu vàng** thường liên quan đến ánh sáng, độ ẩm hoặc sốc môi trường. Mình cần kiểm tra xem rêu đang khô, bị úng hay thiếu sáng trước ạ.";
  }

  if (/\bla vang\b|\bcay vang\b|\bcay bi vang\b|\bcay ua\b|\bvang la\b/.test(q)) {
    return "Dạ, **cây/lá bị vàng** thường do thiếu sáng, dư nước, bể quá bí hoặc cây bị sốc sau khi đổi môi trường ạ.";
  }

  if (/\bheo\b|\bru\b|\bla ru\b|\bcay ru\b/.test(q)) {
    return "Dạ, **cây bị héo/rũ** có thể do thiếu nước, dư nước hoặc sốc môi trường; mình cần nhìn thêm tình trạng đất đang khô hay ướt để xử lý đúng ạ.";
  }

  if (/\bmoc\b|\bnam\b|\bnam moc\b/.test(q)) {
    return "Dạ, **mốc trong terrarium** thường xuất hiện khi độ ẩm cao, bể bí hoặc có lá/rêu mục. Nếu mốc còn nhẹ thì mình xử lý được khá sớm ạ.";
  }

  if (/\bsuong\b|\bdong hoi\b|\bkinh mo\b|\bkinh uot\b/.test(q)) {
    return "Dạ, **kính đọng sương** nhẹ là bình thường với bể kín, nhưng nếu đọng cả ngày thì bể đang hơi dư ẩm ạ.";
  }

  if (/\bthoi re\b|\bre thoi\b|\bthoi goc\b|\bnhun\b/.test(q)) {
    return "Dạ, **thối rễ/thối gốc** thường là dấu hiệu nặng hơn của việc bể quá ẩm lâu ngày, nên cần ngưng tưới và kiểm tra phần gốc trước ạ.";
  }

  if (/\bnang\b|\bchay la\b|\bchay\b|\bnong\b/.test(q)) {
    return "Dạ, nếu cây bị **nắng/nhiệt làm cháy lá**, phần lá cháy thường khó xanh lại, nhưng mình vẫn có thể cứu cây nếu gốc còn khỏe ạ.";
  }

  if (/\bcon trung\b|\bsau\b|\bbo\b|\bkien\b|\bruoi\b/.test(q)) {
    return "Dạ, **côn trùng trong bể** thường liên quan đến môi trường quá ẩm hoặc lá mục; mình nên xử lý nhẹ trước, tránh xịt thuốc mạnh vào bể ạ.";
  }

  if (/\bmay lanh\b|\bdieu hoa\b|\bphong lanh\b/.test(q)) {
    return "Dạ, terrarium vẫn có thể đặt trong **phòng máy lạnh**, nhưng cần tránh gió lạnh thổi trực tiếp làm cây mất ẩm ạ.";
  }

  if (/\bship\b|\bgiao hang\b|\bvan chuyen\b/.test(q)) {
    return "Dạ, về **vận chuyển/giao hàng**, em trả lời theo chính sách hiện tại của Tiệm Rêu như sau ạ:";
  }

  if (/\bbao hanh\b|\bdoi tra\b|\bvo\b|\bloi\b/.test(q)) {
    return "Dạ, về **đổi trả/bảo hành**, em trả lời theo chính sách hiện tại của Tiệm Rêu như sau ạ:";
  }

  if (/\bthanh toan\b|\bcod\b|\bchuyen khoan\b|\bmomo\b/.test(q)) {
    return "Dạ, về **thanh toán**, em trả lời theo phương thức hiện tại của Tiệm Rêu như sau ạ:";
  }

  if (question) {
    return `Dạ, với câu hỏi **“${question}”**, em hiểu ý anh/chị đang hỏi về phần này ạ:`;
  }

  return "Dạ, em gửi anh/chị thông tin phù hợp nhất trong Knowledge Base của Tiệm Rêu nhé:";
}

function buildKnowledgeFallback(hits: KnowledgeHit[], message?: string): string {
  const top = hits[0];
  if (!top) return "";

  if (message) {
    const leadIn = buildKnowledgeLeadIn(message, top);
    if (leadIn) return `${leadIn}\n\n${top.response}`;
  }

  return top.response;
}

// =============================================
// 5. SYSTEM PROMPT — Kiến thức terrarium chuyên sâu cho Ollama
// =============================================
async function buildSystemPrompt(pageContext?: PageContext, knowledgeContext?: string): Promise<string> {
  const catalog = await getProductCatalogText();

  const prompt = `Bạn là "Rêu" — trợ lý AI chuyên gia terrarium của "Tiệm Rêu Décor", shop terrarium tại Việt Nam.
Xưng "em", gọi khách "anh/chị". Trả lời bằng tiếng Việt, tự nhiên, dễ hiểu, có emoji.

═══════════════════════════════════════
QUY TẮC HÀNH VI (BẮT BUỘC)
═══════════════════════════════════════
1. Luôn CỐ GẮNG HIỂU Ý khách kể cả viết sai chính tả, viết tắt, tiếng lóng
2. Ưu tiên tuyệt đối "NGUỒN CHÍNH THỨC TỪ KNOWLEDGE BASE" nếu có. KHÔNG bịa thông tin shop
3. Độ dài phù hợp: câu đơn giản → 2-3 câu. Câu phức tạp → chia bullet points
4. Khi gợi ý sản phẩm: CHỈ lấy từ DANH SÁCH BÊN DƯỚI, kèm giá + "Link: /products/slug"
5. KHÔNG trả lời câu hỏi NGOÀI LĨNH VỰC terrarium/cây cảnh/shop
6. Nếu không chắc → hỏi lại lịch sự, KHÔNG bịa
7. Nếu câu hỏi liên quan chính sách/giá/tồn kho/voucher/đơn hàng mà CONTEXT không có dữ liệu → nói chưa có thông tin chắc chắn và hướng khách liên hệ shop
8. Nếu khách hỏi nối tiếp kiểu "như thế nào", "cụ thể hơn", "làm sao", "vậy thì sao" → hiểu theo chủ đề ngay trước đó trong lịch sử chat, không bắt khách nhắc lại từ khóa
9. Với câu hỏi chăm sóc, trả lời theo kiểu tư vấn thực hành: nguyên nhân → cách kiểm tra → thao tác từng bước → dấu hiệu cần dừng/liên hệ shop

${knowledgeContext ? `═══════════════════════════════════════
NGUỒN CHÍNH THỨC TỪ KNOWLEDGE BASE
═══════════════════════════════════════
${knowledgeContext}

Quy tắc sử dụng Knowledge Base:
- Đây là nguồn chính thức của Tiệm Rêu, ưu tiên cao hơn kiến thức chung của model.
- Không chép máy móc nếu không cần; hãy diễn giải thân thiện nhưng giữ đúng ý.
- Không tự thêm giá, điều kiện bảo hành, phí ship, phương thức thanh toán nếu KB không nêu.
` : ""}

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
  const timeout = setTimeout(() => abortCtrl.abort(), 18_000);

  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        keep_alive: "10m",
        options: {
          temperature: 0.45,
          top_p: 0.9,
          num_predict: 280,
        },
      }),
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
  pageContext?: PageContext,
  knowledgeContext?: string
): Promise<ReadableStream<Uint8Array> | null> {
  if (activeAiRequests >= MAX_CONCURRENT_AI) {
    console.log("[AI] Concurrency limit reached");
    return null;
  }
  activeAiRequests++;

  try {
    const systemPrompt = await buildSystemPrompt(pageContext, knowledgeContext);
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];
    const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();
    const preferOpenAI = provider === "openai";

    if (preferOpenAI) {
      const openAiStream = await streamFromOpenAI({
        systemPrompt,
        messages: aiMessages,
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        onDone: () => {
          activeAiRequests--;
        },
      });

      if (openAiStream) {
        console.log("[AI] Using OPENAI");
        return openAiStream;
      }

      console.log("[AI] OpenAI unavailable, trying Ollama fallback");
    }

    const stream = await streamFromOllama(aiMessages);
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
    const n = normalizeVN(message);
    const setupReadyIntent = isSetupReadyProductIntent(message);
    type OrderBy = { featured?: "desc" | "asc"; createdAt?: "desc" | "asc"; basePrice?: "desc" | "asc" };
    let orderBy: OrderBy[] = [{ featured: "desc" }, { createdAt: "desc" }];

    if (/rẻ|tiết kiệm|bình dân|giá thấp/i.test(q)) orderBy = [{ basePrice: "asc" }];
    else if (/đắt|cao cấp|premium|sang|luxury/i.test(q)) orderBy = [{ basePrice: "desc" }];

    // ── Parse giới hạn giá từ message ─────────────────────────────
    // Hỗ trợ: "dưới 400k", "dưới 500.000", "tầm 300k", "khoảng 200k",
    //          "dưới 1 triệu", "1.5 triệu", "dưới 1tr", "dưới 1.000.000tr".
    let maxPriceFilter: number | null = null;

    const priceMaxMatch =
      q.match(/(?:dưới|tầm|khoảng|tối đa|không quá)[\s<≤]*([\d.,]+)\s*(k|nghìn|ng|triệu|tr)?/i) ||
      n.match(/(?:duoi|tam|khoang|toi da|khong qua)[\s<≤]*([\d.,]+)\s*(k|nghin|ng|trieu|tr)?/i);

    const parsePrice = (raw: string, unit?: string): number => {
      const compact = raw.replace(/\s/g, "");
      const hasThousandsSeparator = /\d[.,]\d{3}(?:[.,]\d{3})*$/.test(compact);
      const num = hasThousandsSeparator
        ? Number(compact.replace(/[.,]/g, ""))
        : parseFloat(compact.replace(/\./g, "").replace(/,/, "."));
      const u = (unit || "").toLowerCase().trim();
      if (!Number.isFinite(num)) return 0;
      if (u === "triệu" || u === "trieu" || u === "tr⁠" || u === "tr") {
        // Người dùng hay gõ "1.000.000tr"; nếu số đã là tiền VND thì không nhân tiếp.
        return num >= 1_000 ? num : num * 1_000_000;
      }
      if (u === "k" || u === "nghìn" || u === "nghin" || u === "ng") return num * 1_000;
      if (num < 1_000) return num * 1_000;
      return num;
    };

    if (priceMaxMatch) {
      maxPriceFilter = parsePrice(priceMaxMatch[1], priceMaxMatch[2]);
    }

    if (maxPriceFilter !== null) orderBy = [{ basePrice: "asc" }];

    // ── Phát hiện danh mục từ tin nhắn ────────────────────────────────
    let categoryKeyword: string | null = null;

    if (setupReadyIntent || /\bbể\b|terrarium|bình\s*thủy\s*tinh|hủ|bình\s*cây|vườn\s*thủy\s*tinh/i.test(q) || /\bbe\b|terrarium|binh thuy tinh|hu|binh cay|vuon thuy tinh/.test(n)) {
      categoryKeyword = "bể";
    } else if (/\bcây\b|rêu|cỏ|fitonia|fittonia|cây\s*xanh|cây\s*cảnh|thực\s*vật/i.test(q) || /\bcay\b|reu|fitonia|fittonia|cay xanh|cay canh|thuc vat/.test(n)) {
      categoryKeyword = "cây";
    } else if (/phụ\s*kiện|dụng\s*cụ|nhíp|xẻ|phễu|sỏi|than\s*hoạt|substrate|tool/i.test(q) || /phu kien|dung cu|nhip|xe|phieu|soi|than hoat|substrate|tool/.test(n)) {
      categoryKeyword = "phụ kiện";
    } else if (/quà|combo|giỏ\s*quà|set/i.test(q) || /qua|combo|gio qua|set/.test(n)) {
      categoryKeyword = "combo";
    }

    // Build where: lọc giá theo salePrice (nếu có) hoặc basePrice
    const baseWhere: any = { status: "ACTIVE", inventory: { gt: 0 } };

    // Lọc theo danh mục nếu phát hiện keyword
    if (categoryKeyword) {
      baseWhere.category = { name: { contains: categoryKeyword, mode: "insensitive" } };
    }

    // Lọc giá: (salePrice <= max) OR (salePrice=null AND basePrice <= max)
    if (maxPriceFilter !== null) {
      baseWhere.OR = [
        { salePrice: { not: null, lte: maxPriceFilter } },
        { salePrice: null, basePrice: { lte: maxPriceFilter } },
      ];
    }

    let products = await prisma.product.findMany({
      where: baseWhere,
      select: {
        name: true, slug: true, basePrice: true, salePrice: true,
        images: true, category: { select: { name: true } }, featured: true,
        setupStatus: true, careLevel: true, chatTags: true, shortConsultNote: true,
      },
      take: 6,
      orderBy,
    });

    if (products.length === 0 && categoryKeyword) {
      const { category, ...broadWhere } = baseWhere;
      products = await prisma.product.findMany({
        where: broadWhere,
        select: {
          name: true, slug: true, basePrice: true, salePrice: true,
          images: true, category: { select: { name: true } }, featured: true,
          setupStatus: true, careLevel: true, chatTags: true, shortConsultNote: true,
        },
        take: 6,
        orderBy,
      });
    }

    if (setupReadyIntent) {
      products = [...products].sort((a, b) => {
        const aReady = a.setupStatus === "READY_TO_DISPLAY" || a.chatTags.includes("setup-san");
        const bReady = b.setupStatus === "READY_TO_DISPLAY" || b.chatTags.includes("setup-san");
        return Number(bReady) - Number(aReady);
      });
    }

    if (products.length === 0) {
      const catLabel = categoryKeyword ? ` loại **${categoryKeyword}**` : "";
      const priceLabel = maxPriceFilter !== null ? ` dưới **${maxPriceFilter.toLocaleString("vi-VN")}₫**` : "";
      if (catLabel || priceLabel) {
        return {
          text: `🌿 Dạ, hiện Tiệm Rêu chưa có sản phẩm${catLabel}${priceLabel} đang còn hàng.\n\nAnh/chị có thể xem thêm các sản phẩm khác hoặc nâng ngân sách nhé!`,
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

    const consultNotes = getProductConsultNotes(n);
    const productNotes = products
      .filter((p) => p.shortConsultNote || p.setupStatus || p.careLevel || p.chatTags.length > 0)
      .slice(0, 3)
      .map((p) => {
        const tags = [
          getSetupStatusLabel(p.setupStatus),
          getCareLevelLabel(p.careLevel),
          p.shortConsultNote,
        ].filter(Boolean);
        return tags.length > 0 ? `• ${p.name}: ${tags.join("; ")}` : null;
      })
      .filter(Boolean);
    const noteParts = [
      consultNotes.length > 0 ? `Em chọn theo nhu cầu của anh/chị:\n${consultNotes.map((note) => `• ${note}`).join("\n")}` : "",
      productNotes.length > 0 ? `Ghi chú từ dữ liệu shop:\n${productNotes.join("\n")}` : "",
    ].filter(Boolean);
    const noteText = noteParts.length > 0
      ? `\n\n${noteParts.join("\n\n")}`
      : "";

    let intro = "\u{1F33F} D\u1EA1, \u0111\u00e2y l\u00e0 m\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m n\u1ed5i b\u1eadt t\u1ea1i Ti\u1ec7m R\u00eau:";
    if (setupReadyIntent && categoryKeyword === "bể" && maxPriceFilter !== null) {
      intro = `🌿 Dạ, đây là các mẫu **bể đã setup sẵn** trong tầm **${maxPriceFilter.toLocaleString("vi-VN")}₫**. Anh/chị nhận về có thể trưng ngay, chỉ cần đặt nơi sáng nhẹ và chăm theo hướng dẫn của Rêu:`;
    } else if (setupReadyIntent && categoryKeyword === "bể") {
      intro = "🌿 Dạ, đây là các mẫu **bể đã setup sẵn** tại Tiệm Rêu. Anh/chị nhận về có thể trưng ngay, chỉ cần đặt nơi sáng nhẹ và theo dõi độ ẩm:";
    } else if (categoryKeyword && maxPriceFilter !== null) {
      intro = `\u{1F33F} D\u1EA1, \u0111\u00e2y l\u00e0 c\u00e1c **${categoryKeyword}** trong t\u1ea7m **${maxPriceFilter.toLocaleString("vi-VN")}\u20ab**:`;
    } else if (categoryKeyword === "bể" && /rẻ|tiết kiệm|bình dân|giá tốt/i.test(q)) {
      intro = "🌿 Dạ, bên Rêu có nhiều mẫu bể giá dễ thương cho anh/chị chọn. Em gửi trước vài bể giá tốt, đang còn hàng trong shop nhé:";
    } else if (categoryKeyword) {
      intro = `\u{1F33F} D\u1EA1, \u0111\u00e2y l\u00e0 c\u00e1c s\u1ea3n ph\u1ea9m **${categoryKeyword}** t\u1ea1i Ti\u1ec7m R\u00eau:`;
    } else if (maxPriceFilter !== null) {
      intro = `\u{1F33F} D\u1EA1, \u0111\u00e2y l\u00e0 c\u00e1c s\u1ea3n ph\u1ea9m trong t\u1ea7m **${maxPriceFilter.toLocaleString("vi-VN")}\u20ab** t\u1ea1i Ti\u1ec7m R\u00eau:`;
    } else if (/rẻ|tiết kiệm|bình dân|giá tốt/i.test(q)) {
      intro = categoryKeyword === "bể"
        ? "🌿 Dạ, bên Rêu có nhiều mẫu bể giá dễ thương cho anh/chị chọn. Em gửi trước vài bể giá tốt, đang còn hàng trong shop nhé:"
        : "🌿 Dạ, bên Rêu có nhiều sản phẩm giá dễ thương cho anh/chị chọn. Em gửi trước vài mẫu giá tốt, đang còn hàng trong shop nhé:";
    } else if (/đắt|cao cấp|premium/i.test(q)) {
      intro = "🌿 Dạ, đây là các sản phẩm cao cấp:";
    } else if (/đẹp|xinh|cute/i.test(q)) {
      intro = "🌿 Dạ, đây là các sản phẩm đẹp nhất tại Tiệm Rêu:";
    }

    return {
      text: `${intro}${noteText}\n\n💡 Bấm vào sản phẩm để xem chi tiết. Freeship đơn từ 500.000₫ ạ!`,
      products: productCards,
    };
  } catch (error) {
    console.error("[CONSULT] Product query error:", error);
    return null;
  }
}

// =============================================
// 8. FALLBACK KB — Khi Ollama offline, trả lời kiến thức cơ bản
// =============================================
function getOfflineFallback(message: string): string | null {
  const q = message.toLowerCase().trim();
  const n = normalizeVN(message);

  if (isOverwateringIntent(n))
    return "💦 **Bể bị dư nước / lỡ tưới quá nhiều**\n\nDạ nếu đất đang sũng nước hoặc có nước đọng đáy, mình nên xử lý theo hướng **giảm ẩm trước**, không tưới thêm ạ.\n\nCách xử lý nhanh:\n1. Ngưng tưới hoàn toàn vài ngày.\n2. Nếu là bể kín, mở nắp 24–48 giờ để thoát ẩm.\n3. Đặt bể nơi sáng gián tiếp, thoáng nhẹ, tránh nắng trực tiếp.\n4. Gắp bỏ lá vàng mềm/lá mục để hạn chế mốc lan.\n5. Nếu gốc cây mềm nhũn hoặc có mùi hôi, nên gửi ảnh/video cho shop để kiểm tra thối rễ.\n\nSau khi bể ổn lại, chỉ phun sương rất nhẹ khi mặt đất/rêu bắt đầu khô. Terrarium cần ẩm, nhưng không chịu được ngập nước lâu 🌿";

  if (isWateringGuideIntent(n))
    return "💧 **Cách tưới nước terrarium đúng cách**\n\nDạ, terrarium nên tưới theo kiểu **bổ sung ẩm nhẹ**, không tưới ngập như chậu cây thường.\n\nCách tưới:\n1. Dùng bình xịt phun sương hạt mịn.\n2. Xịt nhẹ quanh gốc cây/rêu, không xịt quá lâu một chỗ.\n3. Dừng khi mặt rêu/đất vừa ẩm, chưa bị sũng nước.\n4. Sau khi tưới, đặt bể nơi sáng gián tiếp, tránh nắng trực tiếp.\n\nTần suất tham khảo:\n• Bể kín: 1–2 tuần/lần hoặc lâu hơn nếu vẫn còn ẩm.\n• Bể mở: khoảng 3–5 ngày/lần.\n• Sen đá/xương rồng: 7–10 ngày/lần, chờ đất khô hẳn rồi mới tưới.\n\nMẹo dễ nhớ: **ẩm vừa đủ, không đọng nước** 🌿";

  if (isYellowingIntent(n))
    return "💛 **Rêu/cây bị vàng**\n\nDạ, rêu hoặc lá cây bị vàng thường do một trong các nguyên nhân sau:\n\n• Thiếu ánh sáng gián tiếp\n• Tưới quá nhiều làm bể bị úng\n• Bể quá bí, độ ẩm cao lâu ngày\n• Cây/rêu bị sốc sau vận chuyển hoặc đổi vị trí\n\nCách xử lý:\n1. Đặt bể nơi sáng nhẹ, tránh nắng trực tiếp.\n2. Kiểm tra đất/rêu: nếu còn ẩm thì chưa tưới thêm.\n3. Nếu bể kín bị đọng sương cả ngày, mở nắp thoáng 1–3 giờ.\n4. Gắp/cắt bỏ phần lá hoặc rêu đã vàng hư để tránh mốc lan.\n\nNếu vàng kèm gốc mềm nhũn, mùi hôi hoặc đất sũng nước thì nghiêng về dư nước/thối rễ — anh/chị nên gửi ảnh cho shop kiểm tra kỹ hơn ạ.";

  if (isWiltingIntent(n))
    return "🥀 **Cây bị héo hoặc rũ lá**\n\nDạ cây héo/rũ có thể do thiếu nước, dư nước hoặc sốc môi trường. Mình nên kiểm tra đất trước khi xử lý:\n\n• Nếu đất/rêu khô: phun sương nhẹ từng ít một, đợi 10–15 phút rồi quan sát.\n• Nếu đất đang ướt/sũng: ngưng tưới, mở nắp/để thoáng 24 giờ.\n• Đặt bể nơi sáng gián tiếp, tránh nắng gắt và gió điều hòa thổi trực tiếp.\n• Cắt bỏ lá hư nặng để cây tập trung hồi phục.\n\nNếu sau 1–2 ngày cây vẫn héo hoặc gốc mềm nhũn, anh/chị gửi ảnh/video để shop xem chính xác hơn nhé 🌿";

  if (/\bmoc\b|\bnam\b|\bnam moc\b/.test(n))
    return "🍄 **Xử lý terrarium bị mốc**\n\nMốc thường xuất hiện khi bể quá ẩm, bí khí hoặc có lá/rêu mục.\n\nCách xử lý:\n1. Mở nắp 24–48 giờ để giảm ẩm.\n2. Dùng nhíp/tăm bông gắp hoặc lau phần mốc.\n3. Gắp bỏ lá mục, rêu hư.\n4. Giảm tưới/phun sương trong vài ngày.\n5. Đặt bể nơi sáng gián tiếp, thoáng nhẹ.\n\nNếu mốc lan rộng hoặc có mùi hôi, anh/chị nên gửi ảnh/video cho shop kiểm tra ạ.";

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
    if (
      process.env.AI_CHAT_ENABLED === "false" ||
      process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "false"
    ) {
      return NextResponse.json(
        { response: "Tính năng tư vấn AI đang tạm tắt. Anh/chị vui lòng liên hệ shop để được hỗ trợ trực tiếp nhé 🌿", source: "disabled" },
        { status: 503 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { response: "Dạ anh/chị đang gửi hơi nhanh, vui lòng đợi 1 phút rồi hỏi lại nhé! 🌿", rateLimited: true },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, pageContext } = body;
    const history = getSafeHistory(body?.history);

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ response: "Vui lòng nhập câu hỏi." });
    }

    const trimmed = message.trim();
    if (trimmed.length > 400) {
      return NextResponse.json({ response: "Dạ câu hỏi hơi dài. Anh/chị tóm tắt ngắn gọn dưới 400 ký tự nhé! 🌿" });
    }

    console.log(`[CONSULT] "${trimmed.slice(0, 60)}..." from ${ip}`);
    const careAiIntent = isCareAiIntent(trimmed);
    const policyFactIntent = isPolicyFactIntent(trimmed);
    const customFactIntent = isCustomFactIntent(trimmed);

    // ── 1. GUARDRAIL: Chặn off-topic ──────────────────────
    if (isOffTopic(trimmed)) {
      console.log(`[CONSULT] ❌ OFF-TOPIC blocked: "${trimmed.slice(0, 40)}"`);
      return NextResponse.json({ response: OFF_TOPIC_RESPONSE, source: "guardrail" });
    }

    // ── 2. ORDER INTENT: DB lookup by phone, privacy-safe ──────────
    if (isOrderLookupIntent(trimmed, history)) {
      console.log(`[CONSULT] 📦 Order lookup intent detected`);
      const orderResult = await lookupOrdersByPhone(trimmed);
      return NextResponse.json({
        response: orderResult.text,
        source: "db",
        orderLookup: true,
        found: orderResult.found,
      });
    }

    // ── 3. PRODUCT INTENT: DB realtime query + thumbnails ──────────
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

    // ── 4. ADMIN KNOWLEDGE BASE RAG ───────────────────────
    // Dữ liệu admin nhập ở /tiem-nho-nth24/ai-knowledge là nguồn chính thức.
    // Fact query (policy/custom) phải bám KB/DB; care query có thể đưa KB làm nền để AI diễn giải linh hoạt.
    const knowledgeSearchQuery = buildKnowledgeSearchQuery(trimmed, history);
    const knowledgeHits = await searchOfficialKnowledge(knowledgeSearchQuery, trimmed);
    const knowledgeContext = knowledgeHits.length > 0 ? formatKnowledgeContext(knowledgeHits) : undefined;

    if ((policyFactIntent || customFactIntent) && knowledgeHits.length > 0) {
      console.log(`[CONSULT] 📚 Fact KB hit: ${knowledgeHits.map((hit) => hit.keyword).join(" | ")}`);
      return NextResponse.json({
        response: buildKnowledgeFallback(knowledgeHits, trimmed),
        source: "knowledge",
        knowledgeIds: knowledgeHits.map((hit) => hit.id),
      });
    }

    // ── 5. CARE AI ────────────────────────────────────────
    // Chăm sóc cây/rêu/terrarium và sự cố cây được GPT/Ollama trả lời linh hoạt.
    // KB chỉ làm context/guardrail; không ép trả y nguyên KB nếu câu hỏi cần tư vấn mềm.
    if (careAiIntent) {
      console.log(`[CONSULT] 🌿 Care AI intent detected`);
      const aiMessage =
        knowledgeSearchQuery === trimmed
          ? trimmed
          : `${trimmed}\n\nNgữ cảnh hội thoại gần đây để hiểu câu hỏi nối tiếp:\n${knowledgeSearchQuery}`;
      const stream = await streamFromAI(aiMessage, history, pageContext, knowledgeContext);
      if (stream) {
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Consult-Source": knowledgeHits.length > 0 ? "care-rag" : "care-ai",
          },
        });
      }

      const careFallback = getOfflineFallback(knowledgeSearchQuery);
      if (careFallback) {
        return NextResponse.json({ response: careFallback, source: "knowledge" });
      }
    }

    // ── 6. ADMIN KNOWLEDGE BASE FOR NON-CARE ──────────────
    if (knowledgeHits.length > 0) {
      console.log(`[CONSULT] 📚 KB RAG hit: ${knowledgeHits.map((hit) => hit.keyword).join(" | ")}`);

      if (shouldAnswerKnowledgeDirectly(knowledgeHits)) {
        return NextResponse.json({
          response: buildKnowledgeFallback(knowledgeHits, trimmed),
          source: "knowledge",
          knowledgeIds: knowledgeHits.map((hit) => hit.id),
        });
      }

      const aiMessage =
        knowledgeSearchQuery === trimmed
          ? trimmed
          : `${trimmed}\n\nNgữ cảnh hội thoại gần đây để hiểu câu hỏi nối tiếp:\n${knowledgeSearchQuery}`;
      const stream = await streamFromAI(aiMessage, history, pageContext, knowledgeContext);
      if (stream) {
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Consult-Source": "rag",
          },
        });
      }

      return NextResponse.json({
        response: buildKnowledgeFallback(knowledgeHits, trimmed),
        source: "knowledge",
        knowledgeIds: knowledgeHits.map((hit) => hit.id),
      });
    }

    // ── 7. INSTANT KB: Greeting + hard-coded fallback policies ─────
    const instant = getInstantResponse(trimmed);
    if (instant) {
      console.log(`[CONSULT] ⚡ Instant KB hit`);
      return NextResponse.json({ response: instant, source: "knowledge" });
    }

    if (policyFactIntent || customFactIntent) {
      const safeFactFallback = customFactIntent
        ? "Dạ phần custom/đặt theo yêu cầu cần shop xác nhận theo mẫu, ngân sách, thời gian và độ phức tạp. Anh/chị gửi giúp Rêu nhu cầu chính: size/vị trí đặt, chủ đề, ngân sách, thời gian cần nhận và ảnh mẫu nếu có. Rêu sẽ ghi nhận để shop tư vấn chính xác hơn, chứ không tự chốt giá/cọc/lịch làm trong chatbox ạ."
        : "Dạ phần này cần trả theo thông tin chính sách hiện tại của shop. Rêu chưa có đủ dữ liệu chắc chắn để tự kết luận, nên anh/chị cho Rêu thêm ngữ cảnh hoặc liên hệ shop để xác nhận chính xác nhé. Nếu liên quan đơn hàng, anh/chị gửi SĐT đặt hàng để Rêu tra trạng thái nhưng vẫn ẩn thông tin nhạy cảm ạ.";

      return NextResponse.json({ response: safeFactFallback, source: "guardrail" });
    }

    // ── 8. SKIP isOnTopic — Để Ollama tự xử lý câu hỏi không rõ ─
    // (isOnTopic() quá strict → chặn nhầm câu hỏi hợp lệ)

    // ── 9. OLLAMA/GPT AI — Xử lý câu hỏi terrarium không thuộc fact cứng ──────
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

    // ── 10. AI OFFLINE → Fallback KB ──────────────────────
    console.log(`[CONSULT] ⚠️ Ollama offline, trying fallback KB`);
    const fallback = getOfflineFallback(knowledgeSearchQuery);
    if (fallback) {
      return NextResponse.json({ response: fallback, source: "knowledge" });
    }

    // ── 11. PRODUCT FALLBACK (last resort) ─────────────────
    if (isProductIntent(trimmed)) {
      const fallbackProducts = await queryProducts(trimmed);
      if (fallbackProducts) {
        return NextResponse.json({
          response: fallbackProducts.text,
          source: "db",
          products: fallbackProducts.products,
        });
      }
    }

    // ── 12. FINAL FALLBACK ─────────────────────────────────
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

