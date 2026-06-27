export interface AiKnowledgeDefault {
  keyword: string;
  response: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export const DEFAULT_AI_KNOWLEDGE: AiKnowledgeDefault[] = [
  {
    keyword: "xin chào, chào shop, hello, hi, tư vấn",
    category: "greeting",
    priority: 100,
    isActive: true,
    response:
      "Xin chào anh/chị 🌿 Em là Rêu — trợ lý tư vấn của Tiệm Rêu Décor.\n\nEm có thể hỗ trợ anh/chị:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây/rêu\n• Giải đáp chính sách giao hàng, COD, đổi trả\n• Gợi ý sản phẩm theo ngân sách hoặc mục đích tặng quà",
  },
  {
    keyword: "thanh toán, cod, trả tiền, chuyển khoản, momo, banking, thanh toán online, nhận hàng trả tiền",
    category: "policy",
    priority: 100,
    isActive: true,
    response:
      "💳 **Thanh toán tại Tiệm Rêu**\n\nHiện tại Tiệm Rêu chỉ hỗ trợ **COD — thanh toán khi nhận hàng**.\n\nAnh/chị nhận sản phẩm trước, kiểm tra hàng rồi thanh toán trực tiếp cho shipper. Website hiện chưa hỗ trợ chuyển khoản ngân hàng, Momo hoặc thanh toán online.\n\nNếu cần hỗ trợ thêm về đơn hàng, anh/chị có thể nhắn shop qua Facebook/Zalo Tiệm Rêu Décor nhé 🌿",
  },
  {
    keyword: "giao hàng, ship, vận chuyển, phí ship, bao lâu nhận hàng, giao tới tỉnh, ship tỉnh, nội thành",
    category: "shipping",
    priority: 95,
    isActive: true,
    response:
      "🚚 **Chính sách giao hàng**\n\nTiệm Rêu hỗ trợ giao hàng toàn quốc.\n\n• Nội thành TP.HCM: thường giao trong **1–2 ngày**\n• Tỉnh/thành khác: thường từ **3–5 ngày làm việc**\n• Sản phẩm được đóng gói cẩn thận để hạn chế xô lệch, vỡ bể hoặc ảnh hưởng cây\n\nThời gian giao thực tế có thể thay đổi tùy khu vực và đơn vị vận chuyển.",
  },
  {
    keyword: "freeship, miễn phí ship, miễn phí vận chuyển, đơn bao nhiêu được freeship",
    category: "shipping",
    priority: 90,
    isActive: true,
    response:
      "🎁 **Freeship**\n\nTiệm Rêu hỗ trợ **freeship cho đơn hàng từ 500.000₫**.\n\nNếu đơn hàng chưa đạt mức freeship, phí vận chuyển sẽ phụ thuộc vào khu vực nhận hàng và phương thức giao.",
  },
  {
    keyword: "đổi trả, bảo hành, cây hư, cây chết, hàng vỡ, bể vỡ, sản phẩm lỗi, hoàn hàng",
    category: "policy",
    priority: 100,
    isActive: true,
    response:
      "🔄 **Đổi trả & bảo hành**\n\nTiệm Rêu hỗ trợ đổi trả nếu sản phẩm bị lỗi do vận chuyển hoặc giao sai sản phẩm.\n\nAnh/chị vui lòng quay video khi mở hàng và gửi hình/video tình trạng sản phẩm cho shop để được kiểm tra nhanh nhất.\n\nKhông áp dụng bảo hành cho các trường hợp:\n• Để bể dưới nắng trực tiếp\n• Tưới quá nhiều gây úng/thối\n• Làm rơi, va đập, tự ý tháo/bẻ bố cục\n• Chăm sóc sai hướng dẫn sau khi nhận hàng",
  },
  {
    keyword: "cách đặt hàng, mua hàng, đặt hàng sao, order, làm sao để mua, thêm vào giỏ",
    category: "policy",
    priority: 85,
    isActive: true,
    response:
      "🛒 **Cách đặt hàng**\n\nAnh/chị có thể đặt hàng trực tiếp trên website:\n\n1. Chọn sản phẩm yêu thích\n2. Nhấn **Thêm vào giỏ**\n3. Vào giỏ hàng và kiểm tra sản phẩm\n4. Nhấn **Thanh toán**\n5. Điền thông tin giao hàng\n6. Xác nhận đơn hàng COD\n\nSau khi đặt hàng thành công, shop sẽ tiếp nhận và xử lý đơn sớm nhất.",
  },
  {
    keyword: "liên hệ, hotline, zalo, facebook, số điện thoại, tư vấn trực tiếp, hỗ trợ shop",
    category: "policy",
    priority: 90,
    isActive: true,
    response:
      "📞 **Liên hệ Tiệm Rêu Décor**\n\nAnh/chị có thể liên hệ shop qua:\n\n• Facebook: **Tiệm Rêu Décor**\n• Zalo: tìm **Tiệm Rêu Décor**\n• Website: **tiemreudecor.com**\n\nNếu cần tư vấn chọn bể, chăm sóc cây hoặc xử lý vấn đề sau khi nhận hàng, anh/chị có thể gửi hình/video để shop hỗ trợ chính xác hơn 🌿",
  },
  {
    keyword: "terrarium là gì, bể terrarium, hệ sinh thái mini, bể cây, vườn trong lọ",
    category: "general",
    priority: 70,
    isActive: true,
    response:
      "🌿 **Terrarium là gì?**\n\nTerrarium là một khu vườn thu nhỏ trong bình hoặc bể thủy tinh, mô phỏng một hệ sinh thái nhỏ với cây, rêu, đất, sỏi và các vật trang trí.\n\nCó 2 loại phổ biến:\n• **Bể kín:** giữ ẩm tốt, phù hợp rêu và cây ưa ẩm\n• **Bể mở:** thoáng hơn, phù hợp sen đá, xương rồng hoặc cây cần khô ráo hơn\n\nTerrarium phù hợp để trang trí bàn làm việc, kệ sách, phòng ngủ hoặc làm quà tặng.",
  },
  {
    keyword: "bể kín, bể mở, hệ kín, hệ mở, kín hay mở, loại terrarium",
    category: "care",
    priority: 85,
    isActive: true,
    response:
      "🏺 **Bể kín và bể mở khác nhau thế nào?**\n\n• **Bể kín:** giữ ẩm tốt, phù hợp rêu/cây ưa ẩm, ít cần tưới hơn. Nên đặt nơi có ánh sáng gián tiếp.\n• **Bể mở:** thoáng khí hơn, phù hợp cây cần khô ráo như sen đá/xương rồng, cần theo dõi nước thường xuyên hơn.\n\nNgười mới thường nên bắt đầu với bể kín vì dễ giữ ẩm và dễ chăm hơn.",
  },
  {
    keyword: "tưới nước, bao lâu tưới, tưới terrarium, bể bị khô, chăm sóc nước, phun sương",
    category: "care",
    priority: 85,
    isActive: true,
    response:
      "💧 **Cách tưới nước terrarium**\n\nTần suất tưới phụ thuộc vào loại bể:\n\n• **Bể kín:** thường chỉ cần phun sương nhẹ, không tưới quá nhiều\n• **Bể mở:** cần kiểm tra độ ẩm đất thường xuyên hơn\n• Nếu thấy rêu/cây hơi khô, có thể phun sương nhẹ\n• Nếu thành kính đọng nước quá nhiều hoặc đất luôn ướt, nên mở nắp thoáng khí và giảm tưới\n\nNguyên tắc quan trọng: terrarium cần **ẩm vừa đủ**, không bị úng.",
  },
  {
    keyword: "mốc, nấm mốc, bể bị mốc, mốc trắng, nấm trắng, rêu bị mốc",
    category: "care",
    priority: 90,
    isActive: true,
    response:
      "🍄 **Xử lý terrarium bị mốc**\n\nNếu bể xuất hiện mốc nhẹ, anh/chị có thể xử lý như sau:\n\n1. Mở nắp bể 24–48 giờ để giảm ẩm\n2. Dùng nhíp gắp bỏ phần mốc\n3. Giảm lượng nước tưới/phun sương\n4. Đặt bể ở nơi có ánh sáng gián tiếp, thoáng hơn\n5. Có thể rắc rất ít bột quế ở vùng bị mốc để hỗ trợ kháng nấm\n\nNếu mốc lan rộng hoặc cây có dấu hiệu hư, anh/chị nên gửi ảnh/video cho shop kiểm tra.",
  },
  {
    keyword: "rêu vàng, lá vàng, cây vàng lá, cây úa, cây bị vàng, rêu bị úa",
    category: "care",
    priority: 85,
    isActive: true,
    response:
      "💛 **Cây/rêu bị vàng lá**\n\nTình trạng vàng lá thường do một trong các nguyên nhân:\n\n• Thiếu ánh sáng gián tiếp\n• Tưới quá nhiều làm bể bị úng\n• Bể quá bí, độ ẩm cao lâu ngày\n• Cây/rêu bị sốc sau vận chuyển hoặc thay đổi môi trường\n\nCách xử lý:\n• Đặt bể nơi sáng nhẹ, tránh nắng trực tiếp\n• Giảm tưới nếu đất còn ẩm\n• Mở nắp thoáng khí nếu bể quá ẩm\n• Cắt bỏ phần lá/rêu đã hư để tránh lan rộng",
  },
  {
    keyword: "cây héo, lá héo, cây bị héo, cây bị rũ, lá bị rũ, cây mềm lá, héo mềm, cây thiếu nước",
    category: "care",
    priority: 90,
    isActive: true,
    response:
      "🥀 **Cây bị héo hoặc rũ lá**\n\nCây bị héo thường do một trong các nguyên nhân:\n\n• Thiếu nước hoặc độ ẩm chưa đủ\n• Bể quá bí hoặc quá nóng\n• Cây bị sốc sau vận chuyển/thay đổi môi trường\n• Tưới quá nhiều làm rễ yếu hoặc úng\n\nCách xử lý:\n• Nếu đất khô: phun sương nhẹ, không tưới ồ ạt\n• Nếu đất còn ướt: mở nắp/để thoáng và ngưng tưới vài ngày\n• Đặt bể nơi có ánh sáng gián tiếp, tránh nắng trực tiếp\n• Cắt bỏ lá đã hư nặng để cây tập trung hồi phục\n\nNếu cây tiếp tục héo sau 1–2 ngày, anh/chị gửi ảnh/video cho shop để kiểm tra chính xác hơn nhé 🌿",
  },
  {
    keyword: "ánh sáng, để ở đâu, đặt bể ở đâu, nắng, phòng tối, đèn, ánh sáng gián tiếp",
    category: "care",
    priority: 85,
    isActive: true,
    response:
      "☀️ **Ánh sáng cho terrarium**\n\nTerrarium nên đặt ở nơi có **ánh sáng gián tiếp**, ví dụ gần cửa sổ có rèm, bàn làm việc sáng nhẹ hoặc kệ có ánh sáng tự nhiên.\n\nTránh:\n• Nắng gắt chiếu trực tiếp\n• Gần nguồn nhiệt mạnh\n• Điều hòa thổi trực tiếp vào bể\n\nNếu phòng quá tối, anh/chị có thể dùng đèn LED/grow light nhẹ trong vài giờ mỗi ngày.",
  },
  {
    keyword: "người mới, lần đầu chơi, mới mua terrarium, dễ chăm, bể dễ chăm, newbie, beginner",
    category: "product",
    priority: 80,
    isActive: true,
    response:
      "🌱 **Terrarium cho người mới**\n\nNếu anh/chị mới bắt đầu, nên chọn bể dễ chăm, bố cục đơn giản và cây/rêu chịu ẩm tốt.\n\nGợi ý:\n• Ưu tiên bể kín hoặc bán kín\n• Chọn size vừa phải, không quá nhiều chi tiết nhỏ\n• Đặt nơi sáng nhẹ, tránh nắng trực tiếp\n• Theo dõi độ ẩm trong 7 ngày đầu\n\nNếu anh/chị cho em biết ngân sách và vị trí đặt bể, em có thể gợi ý sản phẩm phù hợp hơn.",
  },
  {
    keyword: "quà tặng, tặng sinh nhật, tân gia, quà bạn gái, quà bạn trai, quà decor, quà văn phòng",
    category: "product",
    priority: 80,
    isActive: true,
    response:
      "🎁 **Gợi ý terrarium làm quà tặng**\n\nTerrarium rất hợp làm quà sinh nhật, tân gia, kỷ niệm hoặc quà decor bàn làm việc vì nhỏ gọn, xanh mát và có ý nghĩa lâu bền.\n\nKhi chọn quà, anh/chị nên cân nhắc:\n• Người nhận có thời gian chăm cây không\n• Vị trí đặt bể: bàn làm việc, phòng ngủ, kệ sách\n• Phong cách thích tối giản hay nhiều tiểu cảnh\n• Ngân sách mong muốn\n\nNếu muốn an toàn, nên chọn mẫu dễ chăm và kích thước vừa phải.",
  },
  {
    keyword: "sâu, bọ, kiến, ruồi nhỏ, côn trùng, bọ trong bể, ruồi trong terrarium",
    category: "care",
    priority: 80,
    isActive: true,
    response:
      "🐛 **Côn trùng trong terrarium**\n\nMột số bể có thể xuất hiện ruồi nhỏ/kiến/côn trùng nếu môi trường quá ẩm hoặc có chất hữu cơ phân hủy.\n\nCách xử lý:\n• Mở nắp để bể thoáng hơn\n• Giảm tưới/phun sương\n• Loại bỏ lá mục hoặc phần rêu hư\n• Với kiến/ruồi nhiều, anh/chị nên gửi ảnh/video cho shop để kiểm tra nguyên nhân chính xác\n\nKhông nên tự xịt thuốc mạnh vào bể vì dễ làm hại cây và rêu.",
  },
  {
    keyword: "chăm sóc 7 ngày đầu, mới nhận hàng, sau khi nhận bể, mới mua về, chăm sóc ban đầu",
    category: "care",
    priority: 90,
    isActive: true,
    response:
      "📦 **Chăm sóc 7 ngày đầu sau khi nhận terrarium**\n\nTrong 7 ngày đầu, cây/rêu có thể hơi sốc do vận chuyển và thay đổi môi trường.\n\nAnh/chị nên:\n• Đặt bể ở nơi sáng nhẹ, tránh nắng trực tiếp\n• Không tưới quá nhiều ngay khi mới nhận\n• Quan sát độ ẩm, màu lá/rêu mỗi ngày\n• Mở nắp thoáng khí nếu bể quá ẩm hoặc đọng nước nhiều\n• Không tự ý tháo bố cục/cắm thêm cây khi bể chưa ổn định\n\nNếu thấy cây héo, mốc hoặc vàng nhanh, anh/chị gửi ảnh/video cho shop kiểm tra nhé 🌿",
  },
];
