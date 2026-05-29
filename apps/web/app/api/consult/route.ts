import { NextResponse } from "next/server";

const knowledgeBase: Record<string, string> = {
  "chăm sóc": "🌿 Để chăm sóc terrarium:\n• Đặt nơi có ánh sáng gián tiếp\n• Tưới nước 1-2 tuần/lần (terrarium kín) hoặc 3-5 ngày/lần (terrarium mở)\n• Cắt tỉa lá vàng và lá chết\n• Không để dưới ánh nắng trực tiếp",
  "tưới nước": "💧 Hướng dẫn tưới nước:\n• Terrarium kín: 2-3 tuần/lần, chỉ xịt sương nhẹ\n• Terrarium mở: 3-5 ngày/lần, tưới ít nước vào gốc\n• Dấu hiệu thiếu nước: lá héo, đất khô\n• Dấu hiệu thừa nước: rêu xanh, nấm mốc",
  "ánh sáng": "☀️ Yêu cầu ánh sáng:\n• Ánh sáng gián tiếp là tốt nhất\n• Tránh ánh nắng trực tiếp (gây cháy lá)\n• Đèn LED grow light cũng hoạt động tốt\n• Đặt cách cửa sổ 1-2m",
  "phòng tối": "🌙 Cây phù hợp phòng ít sáng:\n• Fern (Dương xỉ)\n• Moss (Rêu)\n• Pothos (Trầu bà)\n• Fittonia (Cây thảm)\n• Sử dụng đèn LED grow light bổ sung",
  "mua": "🛒 Để mua sản phẩm:\n• Xem bộ sưu tập tại trang Sản Phẩm\n• Thêm vào giỏ hàng và thanh toán\n• Hỗ trợ COD và chuyển khoản\n• Giao hàng toàn quốc 3-5 ngày",
  "giá": "💰 Về giá cả:\n• Terrarium mini: từ 150.000₫\n• Terrarium trung: từ 300.000₫\n• Terrarium lớn: từ 500.000₫\n• Xem chi tiết tại trang Sản Phẩm",
  "bảo hành": "🛡️ Chính sách bảo hành:\n• Bảo hành cây sống 7 ngày\n• Đổi trả nếu sản phẩm bị hư hỏng khi vận chuyển\n• Hỗ trợ tư vấn chăm sóc miễn phí\n• Liên hệ hotline để được hỗ trợ",
  "vận chuyển": "🚚 Thông tin vận chuyển:\n• Giao hàng tiêu chuẩn: 3-5 ngày (30.000₫)\n• Giao hàng nhanh: 1-2 ngày (50.000₫)\n• Đóng gói cẩn thận, chống sốc\n• Miễn phí giao hàng đơn từ 500.000₫",
};

function findBestResponse(message: string): string {
  const lowerMsg = message.toLowerCase();

  for (const [keyword, response] of Object.entries(knowledgeBase)) {
    if (lowerMsg.includes(keyword)) {
      return response;
    }
  }

  // Common greetings
  if (lowerMsg.match(/xin chào|hello|hi|chào/)) {
    return "Xin chào! 🌿 Tôi là trợ lý tư vấn terrarium. Bạn có thể hỏi tôi về:\n• Chăm sóc terrarium\n• Tưới nước và ánh sáng\n• Cây phù hợp cho từng không gian\n• Giá cả và mua hàng\n• Vận chuyển và bảo hành";
  }

  if (lowerMsg.match(/cảm ơn|thank/)) {
    return "Không có gì! 😊 Nếu bạn cần thêm thông tin, đừng ngại hỏi nhé. Chúc bạn chăm sóc terrarium thật tốt! 🌱";
  }

  return "Cảm ơn câu hỏi của bạn! 🌿 Tôi có thể hỗ trợ bạn về:\n• Chăm sóc terrarium (tưới nước, ánh sáng, cắt tỉa)\n• Gợi ý cây phù hợp cho không gian\n• Thông tin sản phẩm và giá cả\n• Vận chuyển và bảo hành\n\nBạn hãy thử hỏi cụ thể hơn nhé!";
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ response: "Vui lòng nhập câu hỏi." });
    }

    const response = findBestResponse(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
