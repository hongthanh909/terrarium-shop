// Create ai_knowledge table directly via SQL (bypass Prisma migrate timeout)
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL },
  },
});

async function main() {
  console.log("Creating ai_knowledge table...");
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ai_knowledge" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "keyword" TEXT NOT NULL,
      "response" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'general',
      "priority" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ai_knowledge_pkey" PRIMARY KEY ("id")
    );
  `);
  console.log("✅ Table created");

  // Create indexes
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ai_knowledge_isActive_priority_idx" ON "ai_knowledge"("isActive", "priority");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ai_knowledge_keyword_idx" ON "ai_knowledge"("keyword");
  `);
  console.log("✅ Indexes created");

  // Seed initial data
  const count = await prisma.$executeRawUnsafe(`SELECT COUNT(*) FROM "ai_knowledge"`);
  
  const entries = [
    { keyword: "chăm sóc", response: "🌿 Để chăm sóc terrarium:\\n• Đặt nơi có ánh sáng gián tiếp\\n• Tưới nước 1-2 tuần/lần (terrarium kín) hoặc 3-5 ngày/lần (mở)\\n• Cắt tỉa lá vàng định kỳ\\n• Tránh ánh nắng trực tiếp", category: "care", priority: 10 },
    { keyword: "tưới nước", response: "💧 Hướng dẫn tưới:\\n• Terrarium kín: 2-3 tuần/lần, xịt sương nhẹ\\n• Terrarium mở: 3-5 ngày/lần\\n• Lá héo = thiếu nước | Nấm mốc = thừa nước", category: "care", priority: 9 },
    { keyword: "ánh sáng", response: "☀️ Yêu cầu ánh sáng:\\n• Ánh sáng gián tiếp là tốt nhất\\n• Tránh nắng trực tiếp (cháy lá)\\n• Đèn LED grow light thay thế tốt\\n• Đặt cách cửa sổ 1-2m", category: "care", priority: 8 },
    { keyword: "phòng tối", response: "🌙 Cây phù hợp nơi ít sáng:\\n• Fern (Dương xỉ)\\n• Moss (Rêu)\\n• Pothos (Trầu bà)\\n• Fittonia (Cây thảm)\\n→ Bổ sung đèn LED grow light nếu cần", category: "care", priority: 7 },
    { keyword: "nấm", response: "🔬 Xử lý nấm mốc trong bể:\\n• Mở nắp 24-48h cho thoáng khí\\n• Dùng tăm bông lau sạch nấm\\n• Giảm tần suất tưới\\n• Thêm than hoạt tính vào lớp đất\\n• Nếu nặng: thay đất mới", category: "care", priority: 6 },
    { keyword: "côn trùng", response: "🐛 Xử lý côn trùng nhỏ:\\n• Để đất khô hơn giữa các lần tưới\\n• Phủ cát mỏng lên mặt đất\\n• Dùng bẫy dính vàng\\n• Tránh dùng thuốc trừ sâu hóa học", category: "care", priority: 5 },
    { keyword: "héo", response: "🍂 Cây bị héo:\\n• Lá mềm rũ = thiếu nước → tưới nhẹ\\n• Lá vàng + đất ướt = thừa nước → mở nắp thoáng, giảm tưới\\n• Lá cháy viền = nắng trực tiếp → di chuyển vào chỗ mát", category: "care", priority: 5 },
    { keyword: "mua", response: "🛒 Cách mua hàng:\\n• Vào trang Sản Phẩm → thêm vào giỏ hàng\\n• Thanh toán COD hoặc chuyển khoản\\n• Giao hàng toàn quốc 3-5 ngày\\n• Miễn phí ship đơn từ 500.000₫", category: "general", priority: 8 },
    { keyword: "vận chuyển", response: "🚚 Thông tin giao hàng:\\n• Tiêu chuẩn: 3-5 ngày (30.000₫)\\n• Nhanh: 1-2 ngày (50.000₫)\\n• Đóng gói cẩn thận, chống va đập\\n• Miễn phí khi đơn ≥ 500.000₫", category: "shipping", priority: 10 },
    { keyword: "bảo hành", response: "🛡️ Chính sách bảo hành:\\n• Bảo hành cây sống 7 ngày\\n• Đổi trả nếu hư hỏng khi vận chuyển\\n• Hỗ trợ tư vấn chăm sóc miễn phí suốt thời gian sử dụng", category: "policy", priority: 9 },
    { keyword: "voucher", response: "🎟️ Voucher giảm giá:\\n• Xem mã giảm giá tại trang Khám Phá\\n• Nhập mã khi thanh toán\\n• Một số voucher có giới hạn số lượng\\n• Miễn phí ship cho đơn từ 500.000₫", category: "general", priority: 7 },
    { keyword: "combo", response: "🎁 Combo sản phẩm:\\n• Combo tiết kiệm hơn mua lẻ\\n• Phù hợp làm quà tặng\\n• Có thể thêm đèn LED\\n• Xem tại trang Sản Phẩm mục Combo", category: "product", priority: 6 },
    { keyword: "terrarium kín", response: "🫙 Terrarium kín (bể kín):\\n• Hệ sinh thái tự cung tự cấp\\n• Tưới 2-3 tuần/lần (rất ít)\\n• Ánh sáng gián tiếp\\n• Nếu quá nhiều sương → mở nắp 30 phút/ngày\\n• Phù hợp: người bận rộn, ít kinh nghiệm", category: "product", priority: 5 },
    { keyword: "terrarium mở", response: "🌱 Terrarium mở:\\n• Cần tưới thường xuyên hơn (3-5 ngày/lần)\\n• Thoáng khí tốt, ít nấm mốc\\n• Phù hợp: cây mọng nước, xương rồng, fern\\n• Cần chú ý độ ẩm môi trường", category: "product", priority: 5 },
    { keyword: "ship", response: "🚚 Thông tin giao hàng:\\n• Tiêu chuẩn: 3-5 ngày (30.000₫)\\n• Nhanh: 1-2 ngày (50.000₫)\\n• Đóng gói cẩn thận, chống va đập\\n• Miễn phí khi đơn ≥ 500.000₫", category: "shipping", priority: 8 },
    { keyword: "đổi trả", response: "🔄 Chính sách đổi trả:\\n• Đổi trả miễn phí trong 7 ngày nếu sản phẩm bị hư hỏng do vận chuyển\\n• Gửi hình ảnh sản phẩm lỗi qua Zalo/Facebook\\n• Shop sẽ gửi sản phẩm thay thế hoặc hoàn tiền", category: "policy", priority: 8 },
    { keyword: "giá", response: "💰 Về giá cả:\\n• Xem giá chi tiết tại trang Sản Phẩm\\n• Combo tiết kiệm hơn mua lẻ\\n• Miễn phí ship cho đơn từ 500.000₫\\n• Có thể áp dụng voucher giảm giá thêm", category: "general", priority: 6 },
  ];

  // Check if already seeded
  const existing = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "ai_knowledge"`);
  if (existing[0].c > 0) {
    console.log(`⚠️ Already has ${existing[0].c} entries. Skipping seed.`);
    return;
  }

  for (const e of entries) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ai_knowledge" ("id", "keyword", "response", "category", "priority", "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW())`,
      e.keyword, e.response, e.category, e.priority
    );
  }

  console.log(`✅ Seeded ${entries.length} entries into ai_knowledge`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
