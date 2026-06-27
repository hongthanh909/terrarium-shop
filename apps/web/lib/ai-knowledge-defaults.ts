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
    priority: 98,
    isActive: true,
    response:
      "💧 **Cách tưới nước terrarium đúng cách**\n\nTrước khi tưới, anh/chị nên nhìn 3 dấu hiệu: mặt đất có khô không, rêu/cây có nhạt màu hoặc hơi rũ không, thành kính có còn đọng sương nhiều không.\n\n**Cách tưới/phun:**\n1. Dùng bình xịt phun sương hạt mịn, không đổ nước ào trực tiếp vào bể.\n2. Phun nhẹ quanh gốc cây/rêu, tránh làm nước đọng thành vũng.\n3. Với bể nhỏ, thường chỉ cần vài lần bóp xịt là đủ; dừng khi bề mặt đất/rêu vừa ẩm.\n4. Sau khi tưới, đặt bể nơi sáng gián tiếp, không đem ra nắng trực tiếp.\n\n**Tần suất tham khảo:**\n• **Bể kín:** 1–2 tuần/lần hoặc lâu hơn nếu vẫn còn ẩm; chỉ phun rất nhẹ.\n• **Bể mở:** khoảng 3–5 ngày/lần, tùy độ khô của đất.\n• **Sen đá/xương rồng:** 7–10 ngày/lần, để đất khô hẳn rồi mới tưới.\n\n**Dấu hiệu tưới quá nhiều:** đất sũng, lá vàng mềm, thành kính đọng nước cả ngày, bể có mốc. Khi đó nên ngưng tưới và mở nắp thoáng khí.\n\nNguyên tắc dễ nhớ: terrarium cần **ẩm vừa đủ**, không phải càng nhiều nước càng tốt 🌿",
  },
  {
    keyword: "cách tưới cây, tưới cây như thế nào, tưới nước ntn, tưới như thế nào, phun sương như thế nào, hướng dẫn tưới cây",
    category: "care",
    priority: 100,
    isActive: true,
    response:
      "💧 **Cách tưới cây trong terrarium**\n\nAnh/chị nên tưới theo kiểu **phun sương nhẹ**, không đổ nước trực tiếp ào vào bể.\n\nCách làm:\n1. Dùng bình xịt hạt mịn.\n2. Xịt nhẹ quanh gốc cây/rêu, không xịt quá lâu một chỗ.\n3. Dừng khi mặt rêu/đất vừa ẩm, chưa bị sũng nước.\n4. Sau khi tưới, quan sát 10–15 phút: nếu đất vẫn quá khô mới phun thêm rất nhẹ.\n5. Đặt bể nơi sáng gián tiếp, không đem ra nắng trực tiếp sau khi tưới.\n\nMẹo dễ nhớ: tưới terrarium là **bổ sung ẩm**, không phải “tưới ngập đất” như chậu cây lớn 🌿",
  },
  {
    keyword: "bao lâu tưới một lần, mấy ngày tưới, một tuần tưới mấy lần, lịch tưới nước, tần suất tưới, khi nào tưới",
    category: "care",
    priority: 99,
    isActive: true,
    response:
      "🗓️ **Bao lâu nên tưới terrarium một lần?**\n\nKhông có lịch cố định cho mọi bể, vì còn tùy loại bể, vị trí đặt và độ ẩm thực tế. Anh/chị có thể tham khảo:\n\n• **Bể kín:** khoảng 1–2 tuần/lần hoặc lâu hơn nếu bể vẫn còn ẩm.\n• **Bể mở:** khoảng 3–5 ngày/lần, tùy đất khô nhanh hay chậm.\n• **Sen đá/xương rồng:** khoảng 7–10 ngày/lần, chỉ tưới khi đất khô hẳn.\n\nTrước khi tưới, nên kiểm tra:\n• Mặt đất/rêu có khô không?\n• Lá có héo mềm không?\n• Thành kính còn đọng hơi nước nhiều không?\n\nNếu kính còn đọng sương nhiều hoặc đất vẫn ẩm, anh/chị nên **chưa tưới vội**.",
  },
  {
    keyword: "tưới bể kín, bể kín tưới sao, bể có nắp tưới không, terrarium kín tưới nước, chăm bể kín",
    category: "care",
    priority: 98,
    isActive: true,
    response:
      "🏺 **Cách tưới bể kín**\n\nBể kín giữ ẩm tốt nên thường **không cần tưới nhiều**.\n\nCách chăm nước:\n• Chỉ phun sương rất nhẹ khi rêu/đất bắt đầu khô.\n• Nếu thành kính có sương nhẹ vào buổi sáng là bình thường.\n• Nếu kính đọng nước cả ngày, đất ướt sũng hoặc có mốc: ngưng tưới và mở nắp thoáng vài giờ.\n• Khi tưới, chỉ xịt vài lần quanh rêu/gốc cây, không đổ nước trực tiếp.\n\nTần suất tham khảo: 1–2 tuần/lần, nhưng nên dựa vào độ ẩm thực tế hơn là lịch cố định.",
  },
  {
    keyword: "tưới bể mở, bể mở tưới sao, terrarium mở tưới nước, chăm bể mở, bể không nắp tưới",
    category: "care",
    priority: 98,
    isActive: true,
    response:
      "🪴 **Cách tưới bể mở**\n\nBể mở thoát ẩm nhanh hơn bể kín, nên cần kiểm tra nước thường xuyên hơn.\n\nCách tưới:\n• Kiểm tra mặt đất/rêu trước khi tưới.\n• Nếu bề mặt đã khô, phun sương nhẹ quanh gốc cây/rêu.\n• Không để nước đọng thành vũng dưới đáy.\n• Nếu trồng sen đá/xương rồng, chờ đất khô hẳn rồi mới tưới.\n\nTần suất tham khảo:\n• Cây/rêu ưa ẩm: khoảng 3–5 ngày/lần.\n• Sen đá/xương rồng: khoảng 7–10 ngày/lần.\n\nNếu đặt trong phòng máy lạnh hoặc nơi gió mạnh, bể mở có thể khô nhanh hơn.",
  },
  {
    keyword: "dấu hiệu cần tưới, làm sao biết thiếu nước, khi nào cần tưới, cây cần nước, bể thiếu nước, đất khô có cần tưới",
    category: "care",
    priority: 97,
    isActive: true,
    response:
      "🔎 **Dấu hiệu terrarium cần tưới**\n\nAnh/chị nên tưới khi thấy một hoặc nhiều dấu hiệu sau:\n• Mặt đất/rêu khô hơn bình thường\n• Rêu nhạt màu, hơi co lại hoặc khô nhẹ\n• Lá cây hơi rũ mềm nhưng đất cũng đang khô\n• Bể kín lâu không còn hơi sương nhẹ\n\nCách tưới lúc này: phun sương nhẹ từng ít một, dừng khi bề mặt vừa ẩm.\n\nKhông nên tưới nếu:\n• Đất vẫn ẩm/sũng\n• Thành kính đọng nước cả ngày\n• Lá vàng mềm hoặc gốc có dấu hiệu nhũn\n\nVì các dấu hiệu đó thường nghiêng về **dư nước**, không phải thiếu nước.",
  },
  {
    keyword: "dấu hiệu tưới dư, làm sao biết tưới nhiều, tưới nhiều quá, dư nước, đất ướt quá, lỡ tưới nhiều",
    category: "care",
    priority: 99,
    isActive: true,
    response:
      "⚠️ **Dấu hiệu terrarium đang bị dư nước**\n\nCác dấu hiệu thường gặp:\n• Đất ướt sũng lâu, có nước đọng dưới đáy\n• Lá vàng mềm, thân/gốc mềm nhũn\n• Thành kính đọng nước cả ngày không tan\n• Bể dễ có mốc hoặc mùi ẩm nặng\n\nCách xử lý:\n1. Ngưng tưới vài ngày.\n2. Nếu là bể kín, mở nắp 24–48 giờ để thoát ẩm.\n3. Đặt bể nơi sáng gián tiếp, thoáng nhẹ.\n4. Gắp bỏ lá mục/lá vàng mềm để tránh mốc lan.\n5. Khi bể ổn lại, chỉ phun sương rất nhẹ khi đất/rêu bắt đầu khô.\n\nLưu ý: nếu gốc cây đã mềm nhũn hoặc có mùi hôi, nên gửi ảnh/video cho shop để kiểm tra thối rễ.",
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
  {
    keyword: "úng nước, tưới quá nhiều, đất sũng nước, bể bị úng, cây bị úng, nước đọng đáy, dư nước",
    category: "care",
    priority: 98,
    isActive: true,
    response:
      "💦 **Terrarium bị úng nước / tưới quá nhiều**\n\nDấu hiệu thường gặp:\n• Đất luôn ướt sũng, có nước đọng dưới đáy\n• Lá vàng mềm, thân mềm hoặc cây rũ xuống\n• Thành kính đọng sương cả ngày không tan\n• Bể dễ có mốc hoặc mùi ẩm khó chịu\n\nCách xử lý ngay:\n1. Ngưng tưới hoàn toàn vài ngày.\n2. Mở nắp 24–48 giờ để thoát ẩm nếu là bể kín.\n3. Đặt bể nơi sáng gián tiếp, thoáng nhẹ, tránh nắng trực tiếp.\n4. Gắp bỏ lá úng/vàng/mục để hạn chế nấm lan.\n5. Nếu nước đọng quá nhiều dưới đáy, nên gửi ảnh/video cho shop vì có thể cần xử lý lại lớp nền.\n\nSau khi bể ổn hơn, chỉ phun sương rất nhẹ khi mặt đất/rêu bắt đầu khô. Terrarium cần ẩm, nhưng không chịu được ngập nước lâu 🌿",
  },
  {
    keyword: "thối rễ, rễ thối, cây thối gốc, gốc bị mềm, thân bị nhũn, cây bị nhũn, cây chết gốc",
    category: "care",
    priority: 96,
    isActive: true,
    response:
      "🪴 **Cây bị thối rễ / thối gốc**\n\nThối rễ thường xảy ra khi đất quá ẩm lâu ngày hoặc bể quá bí. Dấu hiệu:\n• Gốc/thân mềm nhũn, chuyển nâu đen\n• Lá vàng mềm, rụng nhanh\n• Có mùi ẩm hôi nhẹ từ đất\n• Cây rũ dù đất vẫn ướt\n\nCách xử lý:\n1. Ngưng tưới và mở nắp cho thoáng.\n2. Nếu chỉ vài lá/gốc phụ bị hư: cắt bỏ phần mềm nhũn bằng kéo sạch.\n3. Gắp bỏ lá mục quanh gốc.\n4. Đặt bể nơi sáng gián tiếp, thoáng nhẹ.\n5. Nếu gốc chính đã nhũn nhiều, cây đó thường khó hồi phục; nên gửi ảnh cho shop để xem có cần thay cây/đổi nền không.\n\nKhông nên tưới thêm để “cứu cây” trong trường hợp này, vì càng ẩm rễ càng thối nhanh hơn.",
  },
  {
    keyword: "sương đọng, đọng hơi nước, kính mờ, thành kính ướt, bể nhiều hơi nước, bể kín đọng nước",
    category: "care",
    priority: 94,
    isActive: true,
    response:
      "🌫️ **Bể bị đọng sương / kính mờ nhiều**\n\nĐọng sương nhẹ vào sáng sớm là bình thường với bể kín. Nhưng nếu kính mờ/ướt cả ngày thì bể đang quá ẩm.\n\nCách xử lý:\n• Mở nắp 1–3 giờ mỗi ngày cho đến khi kính trong hơn\n• Tạm ngưng tưới/phun sương\n• Đặt bể nơi sáng gián tiếp, không đặt trong góc quá bí\n• Lau nhẹ mặt kính nếu cần quan sát cây\n\nMức ổn là: có hơi ẩm nhẹ theo thời điểm, nhưng không đọng nước chảy thành giọt cả ngày. Nếu kèm mốc hoặc lá vàng mềm thì xử lý như trường hợp dư nước.",
  },
  {
    keyword: "bể bị khô, đất khô, rêu khô, thiếu ẩm, cây thiếu nước, lá héo khô, rêu giòn",
    category: "care",
    priority: 94,
    isActive: true,
    response:
      "🏜️ **Terrarium bị khô / thiếu ẩm**\n\nDấu hiệu thiếu ẩm:\n• Rêu nhạt màu, khô giòn hoặc co lại\n• Lá héo mềm hoặc mép lá khô\n• Mặt đất khô, không còn độ ẩm nhẹ\n• Bể kín không còn hơi sương trong thời gian dài\n\nCách xử lý:\n1. Phun sương hạt mịn từng ít một, ưu tiên quanh rêu/gốc cây.\n2. Chờ 10–15 phút quan sát, nếu đất vẫn quá khô mới phun thêm nhẹ.\n3. Không đổ nước ào vào bể vì dễ gây úng ngược lại.\n4. Đặt bể nơi sáng gián tiếp, tránh gió điều hòa thổi trực tiếp.\n\nNếu rêu đã khô nâu/giòn hoàn toàn lâu ngày thì khả năng hồi phục thấp; anh/chị nên gửi ảnh để shop kiểm tra có cần thay rêu không.",
  },
  {
    keyword: "cháy lá, lá bị cháy, nắng trực tiếp, cây bị nắng, lá khô mép, lá nâu mép, bể bị nóng",
    category: "care",
    priority: 94,
    isActive: true,
    response:
      "☀️ **Cây bị cháy lá do nắng/nhiệt**\n\nTerrarium, đặc biệt là bể thủy tinh, rất dễ nóng lên nếu để nắng trực tiếp. Dấu hiệu:\n• Lá có mảng nâu khô, cháy mép\n• Rêu khô nhanh, chuyển vàng/nâu\n• Cây rũ sau khi bị nắng chiếu\n• Thành kính nóng khi chạm vào\n\nCách xử lý:\n1. Dời bể ngay sang nơi sáng gián tiếp, không có nắng gắt chiếu thẳng.\n2. Cắt bỏ lá cháy nặng nếu lá đã khô hẳn.\n3. Phun sương rất nhẹ nếu đất/rêu đang khô; không tưới nhiều nếu đất vẫn ẩm.\n4. Quan sát 2–3 ngày, phần cháy sẽ không xanh lại nhưng cây có thể ra lá mới nếu gốc còn khỏe.\n\nVị trí tốt: gần cửa sổ có rèm, bàn làm việc sáng nhẹ, kệ có ánh sáng tự nhiên tán xạ.",
  },
  {
    keyword: "rêu nâu, rêu đen, rêu chết, rêu khô nâu, rêu đổi màu, rêu bị thâm",
    category: "care",
    priority: 93,
    isActive: true,
    response:
      "🟤 **Rêu chuyển nâu/đen hoặc có dấu hiệu chết**\n\nRêu đổi màu thường do một trong các nhóm nguyên nhân:\n• Thiếu ẩm: rêu khô, giòn, nhạt rồi nâu\n• Dư ẩm/bí khí: rêu thâm đen, mềm mục\n• Nắng/nhiệt: rêu bị khô cháy từng mảng\n• Sốc môi trường sau vận chuyển\n\nCách kiểm tra nhanh:\n• Nếu rêu khô giòn → phun sương nhẹ, tăng ẩm từ từ\n• Nếu rêu mềm nhũn/đen → giảm ẩm, mở nắp, gắp bỏ phần hư\n• Nếu chỉ nâu vài đốm nhỏ → cắt/gắp bỏ, theo dõi thêm\n\nRêu đã đen mục hoặc khô chết hoàn toàn thường khó xanh lại. Nếu mảng hư lan nhanh, anh/chị gửi ảnh cho shop để xem nên thay rêu hay xử lý lại độ ẩm.",
  },
  {
    keyword: "lá rụng, rụng lá, cây rụng lá, lá rơi, cây trụi lá, cây bị sốc",
    category: "care",
    priority: 90,
    isActive: true,
    response:
      "🍂 **Cây trong terrarium bị rụng lá**\n\nRụng vài lá sau vận chuyển hoặc sau khi đổi vị trí là khá thường gặp. Nhưng rụng nhiều có thể do:\n• Sốc môi trường, thay đổi ánh sáng/nhiệt độ\n• Dư nước làm rễ yếu\n• Thiếu sáng kéo dài\n• Bể quá nóng hoặc quá bí\n\nCách xử lý:\n1. Gắp bỏ lá rụng khỏi bể để tránh mốc.\n2. Kiểm tra đất: nếu ướt sũng thì ngưng tưới và mở nắp; nếu khô thì phun sương nhẹ.\n3. Đặt bể nơi sáng gián tiếp ổn định, không đổi chỗ liên tục.\n4. Quan sát 3–7 ngày: nếu ngọn/gốc còn xanh, cây vẫn có khả năng hồi phục.\n\nNếu lá rụng kèm thân mềm, gốc đen hoặc mùi hôi thì khả năng úng/thối rễ cao hơn.",
  },
  {
    keyword: "mùi hôi, bể bị hôi, mùi ẩm, mùi thối, đất có mùi, terrarium có mùi",
    category: "care",
    priority: 92,
    isActive: true,
    response:
      "👃 **Terrarium có mùi hôi hoặc mùi ẩm nặng**\n\nBể khỏe thường có mùi đất/rêu nhẹ, không hôi. Nếu có mùi thối/ẩm nặng, nguyên nhân hay gặp là lá mục, úng nước, nấm mốc hoặc rễ thối.\n\nCách xử lý:\n1. Mở nắp cho thoáng 24 giờ.\n2. Gắp bỏ lá mục, rêu đen, phần cây mềm nhũn.\n3. Ngưng tưới vài ngày và đặt nơi sáng gián tiếp.\n4. Kiểm tra đáy bể có nước đọng nhiều không.\n5. Nếu mùi vẫn còn sau 1–2 ngày, nên gửi ảnh/video cho shop vì có thể cần xử lý lại nền hoặc thay cây hư.\n\nKhông nên xịt nước hoa/tinh dầu vào bể vì có thể làm cây và rêu bị sốc.",
  },
  {
    keyword: "cây mọc dài, cây vươn cao, cây vươn sáng, cây bị cao, cây ốm yếu, thiếu sáng",
    category: "care",
    priority: 88,
    isActive: true,
    response:
      "🌱 **Cây mọc dài, vươn cao hoặc yếu ớt**\n\nĐây thường là dấu hiệu cây đang thiếu sáng và cố vươn về phía nguồn sáng.\n\nCách xử lý:\n• Chuyển bể tới nơi có ánh sáng gián tiếp mạnh hơn\n• Xoay bể mỗi vài ngày để cây nhận sáng đều\n• Không đưa ra nắng gắt trực tiếp để tránh sốc/cháy lá\n• Nếu thân đã vươn quá dài, có thể cần cắt tỉa nhẹ phần ngọn\n\nNếu phòng ít ánh sáng tự nhiên, anh/chị có thể dùng đèn LED/grow light nhẹ vài giờ mỗi ngày. Cây sẽ không thấp lại ngay, nhưng phần lá/ngọn mới sẽ khỏe và gọn hơn.",
  },
  {
    keyword: "phòng máy lạnh, điều hòa, máy lạnh, để trong phòng lạnh, gió điều hòa, văn phòng máy lạnh",
    category: "care",
    priority: 88,
    isActive: true,
    response:
      "❄️ **Đặt terrarium trong phòng máy lạnh**\n\nCó thể đặt terrarium trong phòng máy lạnh, nhưng cần tránh gió lạnh thổi trực tiếp vào bể vì dễ làm cây mất ẩm, sốc nhiệt hoặc khô mép lá.\n\nLưu ý chăm sóc:\n• Đặt bể cách luồng gió điều hòa trực tiếp\n• Theo dõi độ ẩm thường xuyên hơn, nhất là bể mở\n• Nếu rêu/đất khô nhanh, phun sương nhẹ khi cần\n• Không đặt sát cửa kính nắng gắt sau thời gian bật máy lạnh\n\nVị trí đẹp là bàn làm việc/kệ có ánh sáng nhẹ, ổn định nhiệt độ và không bị gió thổi thẳng.",
  },
  {
    keyword: "cắt tỉa, cây mọc um tùm, rêu mọc dày, cây quá to, tỉa lá, cắt cây",
    category: "care",
    priority: 86,
    isActive: true,
    response:
      "✂️ **Cắt tỉa cây/rêu trong terrarium**\n\nKhi cây mọc quá cao, lá chạm thành kính hoặc rêu phủ quá dày, anh/chị có thể cắt tỉa nhẹ để bể thoáng và đẹp hơn.\n\nCách làm:\n1. Dùng kéo/nhíp sạch, lau khô trước khi thao tác.\n2. Cắt phần lá vàng, lá mục, cành mọc quá dài.\n3. Với rêu quá dày, gắp bớt từng ít một, không bóc toàn bộ mảng lớn.\n4. Sau khi tỉa, lấy hết phần vụn lá ra khỏi bể để tránh mốc.\n5. Không tưới nhiều ngay sau khi tỉa; chỉ phun sương nhẹ nếu bể khô.\n\nNên tỉa ít trước, quan sát bố cục rồi mới tỉa thêm để tránh làm bể bị trống quá.",
  },
  {
    keyword: "fittonia, cẩm nhung, fitonia héo, cẩm nhung héo, lá cẩm nhung rũ, cây cẩm nhung",
    category: "care",
    priority: 88,
    isActive: true,
    response:
      "🌿 **Cẩm nhung/Fittonia bị héo hoặc rũ lá**\n\nCẩm nhung khá nhạy với thiếu ẩm và thay đổi môi trường. Nếu lá rũ nhưng thân/gốc còn xanh, cây vẫn có thể hồi lại.\n\nCách xử lý:\n• Nếu đất hơi khô: phun sương nhẹ quanh gốc và rêu\n• Nếu đất đang ướt: không tưới thêm, mở nắp thoáng khí một lúc\n• Đặt nơi sáng gián tiếp, tránh nắng và gió điều hòa trực tiếp\n• Cắt bỏ lá hư nặng để cây tập trung hồi phục\n\nCẩm nhung thường hồi trong 12–48 giờ nếu nguyên nhân là thiếu ẩm/sốc nhẹ. Nếu gốc mềm nhũn hoặc lá vàng hàng loạt thì nghiêng về dư nước/thối rễ.",
  },
  {
    keyword: "dương xỉ, dương xỉ héo, dương xỉ khô, lá dương xỉ vàng, fern",
    category: "care",
    priority: 86,
    isActive: true,
    response:
      "🌿 **Dương xỉ trong terrarium bị khô/héo/vàng**\n\nDương xỉ thích ẩm và ánh sáng gián tiếp, nhưng không thích úng. Dấu hiệu cần kiểm tra:\n• Lá khô giòn: thiếu ẩm, gió điều hòa hoặc nắng nhẹ kéo dài\n• Lá vàng mềm: có thể dư nước hoặc bể quá bí\n• Ngọn non héo: sốc môi trường hoặc thiếu ẩm\n\nCách xử lý:\n1. Kiểm tra đất trước: khô thì phun sương nhẹ, ướt thì mở nắp thoáng.\n2. Đặt bể nơi sáng gián tiếp, tránh nắng trực tiếp.\n3. Cắt lá khô/vàng nặng để tránh mốc.\n4. Giữ ẩm ổn định, không để lúc quá khô lúc quá ướt.\n\nNếu dương xỉ mất gần hết lá nhưng gốc còn xanh, cây vẫn có thể ra mầm mới khi môi trường ổn định.",
  },
  {
    keyword: "sen đá, xương rồng, succulent, cactus, sen đá trong bể kín, xương rồng trong terrarium",
    category: "care",
    priority: 90,
    isActive: true,
    response:
      "🌵 **Sen đá/xương rồng trong terrarium chăm thế nào?**\n\nSen đá và xương rồng phù hợp hơn với **bể mở**, vì chúng cần thoáng khí, đất nhanh khô và nhiều sáng hơn cây/rêu ưa ẩm.\n\nCách chăm:\n• Tưới ít, thường 7–10 ngày/lần hoặc khi đất khô hẳn\n• Không phun sương lên lá quá thường xuyên\n• Đặt nơi sáng tốt, có nắng nhẹ buổi sáng nếu cây chịu được\n• Dùng nền thoát nước tốt, không giữ ẩm lâu\n\nKhông nên để sen đá/xương rồng trong bể kín ẩm lâu vì rất dễ úng và thối gốc. Nếu cây mềm nhũn hoặc lá trong suốt, cần ngưng tưới ngay.",
  },
  {
    keyword: "bể bị xô lệch, vận chuyển bị lệch, cây bị đổ, nhận hàng bị lệch, bố cục bị xê dịch",
    category: "shipping",
    priority: 90,
    isActive: true,
    response:
      "📦 **Bể bị xô lệch sau vận chuyển**\n\nNếu bể/cây hơi xê dịch nhẹ sau khi nhận, anh/chị có thể xử lý như sau:\n\n1. Đặt bể trên mặt phẳng, tránh lắc thêm.\n2. Dùng nhíp hoặc muỗng nhỏ chỉnh nhẹ cây/rêu về vị trí cũ.\n3. Gắp bỏ lá/rêu bị dập nặng nếu có.\n4. Không tưới nhiều ngay sau khi chỉnh; chỉ phun sương nhẹ nếu bể khô.\n5. Đặt bể nơi sáng gián tiếp để cây hồi lại.\n\nNếu bể vỡ, cây bật gốc nhiều hoặc bố cục hư nặng, anh/chị gửi video mở hàng/ảnh hiện trạng cho shop để được hỗ trợ đổi trả theo chính sách.",
  },
  {
    keyword: "khi nào gửi ảnh, cần gửi hình, gửi video, shop kiểm tra, không biết bị gì, chẩn đoán cây",
    category: "care",
    priority: 84,
    isActive: true,
    response:
      "📸 **Khi nào nên gửi ảnh/video cho shop kiểm tra?**\n\nAnh/chị nên gửi ảnh/video nếu gặp các trường hợp sau:\n• Cây vàng/héo lan nhanh trong 1–2 ngày\n• Gốc mềm nhũn, có mùi hôi hoặc nghi thối rễ\n• Bể mốc lan rộng, có côn trùng nhiều\n• Nước đọng đáy nhiều hoặc đất sũng lâu\n• Bể bị vỡ/xô lệch mạnh sau vận chuyển\n• Không chắc bể đang thiếu nước hay dư nước\n\nẢnh nên chụp: toàn cảnh bể, cận cảnh cây bị vấn đề, lớp đất/đáy bể và vị trí đặt bể. Như vậy shop sẽ tư vấn chính xác hơn thay vì đoán theo mô tả.",
  },
];
