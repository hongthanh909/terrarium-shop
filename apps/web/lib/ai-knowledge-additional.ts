import type { AiKnowledgeDefault } from "./ai-knowledge-defaults";

export const ADDITIONAL_AI_KNOWLEDGE: AiKnowledgeDefault[] = [
  {
    keyword: "vai trò ollama, ollama làm gì, ai trả lời gì, flow chatbot, kb trước hay ollama trước, knowledge base dùng khi nào",
    category: "system",
    priority: 100,
    isActive: true,
    response:
      "🤖 **Vai trò của Ollama trong chatbot Tiệm Rêu**\n\nOllama không nên tự quyết các thông tin cần chính xác tuyệt đối như giá, tồn kho, link sản phẩm, phí ship hay chính sách đổi trả. Các phần đó phải ưu tiên **DB/Knowledge Base**.\n\nOllama phù hợp để:\n• Diễn giải câu trả lời từ KB cho tự nhiên hơn\n• Hiểu câu hỏi viết sai chính tả, viết tắt, hỏi nối tiếp\n• Tư vấn mềm theo ngữ cảnh: để bàn, làm quà, người mới, phòng máy lạnh\n• Tổng hợp nhiều ý chăm sóc thành hướng dẫn dễ hiểu\n• Hỏi lại khi thiếu thông tin thay vì bịa\n\nFlow đúng: **Guardrail → DB sản phẩm/giá/tồn kho → KB chăm sóc/chính sách → Ollama diễn giải nếu cần → fallback an toàn**.",
  },
  {
    keyword: "hỏi giá, sản phẩm dưới 1tr, dưới 1 triệu, dưới 1000000, dưới 1.000.000, tầm 500k, khoảng 500k, ngân sách, không quá 1tr",
    category: "product",
    priority: 99,
    isActive: true,
    response:
      "💰 **Cách hiểu câu hỏi về giá/ngân sách**\n\nKhi khách hỏi theo ngân sách, chatbot cần hiểu các cách viết phổ biến:\n• **1tr / 1 triệu / 1.000.000 / 1000000** = 1.000.000₫\n• **500k / 500 nghìn / 500.000** = 500.000₫\n• **dưới, tầm, khoảng, tối đa, không quá** đều là tín hiệu lọc theo ngân sách\n\nVới câu hỏi giá, ưu tiên lấy sản phẩm từ **database hiện tại** để có giá, tồn kho và link đúng. Không dùng Ollama để tự đoán giá hoặc tự bịa sản phẩm.",
  },
  {
    keyword: "sản phẩm giá rẻ, mẫu rẻ nhất, giá tốt, bình dân, tiết kiệm, ngân sách thấp, sản phẩm rẻ",
    category: "product",
    priority: 95,
    isActive: true,
    response:
      "🌿 **Tư vấn sản phẩm giá tốt**\n\nNếu khách hỏi sản phẩm giá rẻ/tiết kiệm, nên ưu tiên:\n• Sản phẩm còn hàng\n• Giá sale nếu đang có khuyến mãi\n• Mẫu nhỏ, dễ đặt bàn, dễ chăm\n• Tối đa 3-6 gợi ý để khách dễ chọn\n\nCâu trả lời nên kèm giá và link sản phẩm. Nếu không có sản phẩm trong ngân sách, hãy nói rõ hiện chưa có mẫu phù hợp và gợi ý nâng ngân sách hoặc xem mẫu gần mức giá đó.",
  },
  {
    keyword: "sản phẩm cao cấp, mẫu đẹp nhất, mẫu sang, premium, decor phòng khách, làm điểm nhấn, mẫu nổi bật",
    category: "product",
    priority: 88,
    isActive: true,
    response:
      "✨ **Tư vấn mẫu cao cấp/nổi bật**\n\nKhi khách muốn mẫu đẹp, sang hoặc làm điểm nhấn trang trí, nên ưu tiên sản phẩm có bố cục nổi bật, kích thước vừa-lớn, hình ảnh rõ và còn hàng.\n\nNên hỏi thêm nếu cần:\n• Đặt ở bàn, kệ, phòng khách hay văn phòng?\n• Muốn phong cách tối giản, xanh nhiều hay có tiểu cảnh?\n• Ngân sách dự kiến khoảng bao nhiêu?\n\nKhông tự bịa mẫu; nếu gợi ý sản phẩm thì lấy từ database.",
  },
  {
    keyword: "người mới, lần đầu chơi terrarium, mới bắt đầu, dễ chăm, ít chăm, bận rộn, không biết chăm cây",
    category: "product",
    priority: 92,
    isActive: true,
    response:
      "🌱 **Gợi ý cho người mới chơi terrarium**\n\nVới người mới, nên chọn mẫu:\n• Dễ chăm, không cần tưới quá thường xuyên\n• Kích thước nhỏ-vừa để dễ quan sát độ ẩm\n• Phù hợp ánh sáng gián tiếp trong nhà\n• Bố cục đơn giản, ít cây quá nhạy cảm\n\nSau khi nhận bể, chỉ cần đặt nơi sáng nhẹ, tránh nắng trực tiếp và kiểm tra độ ẩm trước khi tưới. Nếu khách muốn mua, hãy gợi ý sản phẩm còn hàng từ database.",
  },
  {
    keyword: "quà tặng, sinh nhật, tân gia, bạn gái, bạn trai, đồng nghiệp, sếp, quà decor, quà văn phòng",
    category: "product",
    priority: 91,
    isActive: true,
    response:
      "🎁 **Tư vấn terrarium làm quà tặng**\n\nTerrarium phù hợp làm quà vì nhỏ gọn, xanh mát và có tính trang trí lâu dài. Khi tư vấn quà tặng, nên ưu tiên:\n• Mẫu dễ chăm cho người nhận\n• Bố cục xinh, an toàn khi vận chuyển\n• Kích thước phù hợp bàn làm việc/kệ phòng\n• Có thể chọn mẫu theo ngân sách của khách\n\nNếu khách nói dịp tặng hoặc ngân sách, hãy dùng thông tin đó để lọc sản phẩm từ database và gợi ý tối đa vài mẫu phù hợp.",
  },
  {
    keyword: "để bàn làm việc, bàn học, văn phòng, phòng máy lạnh, điều hòa, đặt ở công ty, góc làm việc",
    category: "product",
    priority: 90,
    isActive: true,
    response:
      "🏢 **Chọn terrarium để bàn/văn phòng**\n\nVới bàn làm việc, bàn học hoặc văn phòng máy lạnh, nên chọn mẫu:\n• Gọn, không chiếm nhiều diện tích\n• Dễ quan sát độ ẩm\n• Ít mùi ẩm, dễ chăm\n• Đặt nơi có ánh sáng gián tiếp, tránh luồng điều hòa thổi trực tiếp\n\nNếu phòng ít sáng, có thể đặt gần cửa sổ có rèm hoặc dùng đèn LED nhẹ vài giờ/ngày. Khi khách muốn mua, hãy ưu tiên sản phẩm còn hàng và kích thước nhỏ-vừa.",
  },
  {
    keyword: "phòng ngủ, kệ đầu giường, phòng tối, ít ánh sáng, thiếu sáng, đặt trong phòng kín",
    category: "product",
    priority: 88,
    isActive: true,
    response:
      "🛏️ **Chọn terrarium cho phòng ngủ/phòng ít sáng**\n\nTerrarium có thể đặt trong phòng ngủ nếu có ánh sáng gián tiếp nhẹ và không quá bí. Nên chọn mẫu nhỏ-vừa, dễ chăm và đặt ở vị trí thoáng.\n\nLưu ý:\n• Không đặt nơi tối hoàn toàn nhiều ngày\n• Tránh nắng trực tiếp và nguồn nhiệt\n• Nếu phòng ít sáng, nên bổ sung đèn LED/grow light nhẹ\n• Kiểm tra độ ẩm trước khi tưới, không tưới theo cảm tính\n\nNếu khách muốn mua, hãy gợi ý mẫu dễ chăm từ database.",
  },
  {
    keyword: "còn mẫu nào nữa không, mẫu khác, rẻ hơn, cao hơn, còn loại nào, thêm sản phẩm, gợi ý thêm",
    category: "product",
    priority: 87,
    isActive: true,
    response:
      "🔁 **Câu hỏi nối tiếp khi đang tư vấn sản phẩm**\n\nNếu khách hỏi nối tiếp như “còn mẫu nào nữa không”, “rẻ hơn”, “mẫu khác”, “cao hơn”, chatbot cần hiểu theo ngữ cảnh ngay trước đó.\n\nCách xử lý:\n• Nếu khách muốn rẻ hơn: lọc/sắp xếp sản phẩm giá thấp hơn\n• Nếu muốn mẫu khác: gợi ý thêm sản phẩm cùng nhu cầu\n• Nếu muốn cao cấp hơn: ưu tiên mẫu nổi bật/giá cao hơn\n• Nếu thiếu ngân sách hoặc mục đích: hỏi lại ngắn gọn\n\nKhông trả lời chung chung nếu có thể truy vấn database sản phẩm.",
  },
  {
    keyword: "so sánh sản phẩm, mẫu nào tốt hơn, nên chọn mẫu nào, bể mini hay bể cơ bản, bể kín hay bể mở",
    category: "product",
    priority: 86,
    isActive: true,
    response:
      "⚖️ **So sánh và chọn mẫu phù hợp**\n\nKhi khách hỏi nên chọn mẫu nào, hãy so sánh theo tiêu chí thực tế:\n• Vị trí đặt: bàn làm việc, phòng khách, phòng ngủ, văn phòng\n• Mức dễ chăm: người mới nên chọn mẫu dễ giữ ẩm, ít yêu cầu chăm phức tạp\n• Ngân sách: ưu tiên mẫu trong tầm giá khách đưa ra\n• Mục đích: tự dùng, decor hay làm quà\n\nNếu hỏi bể kín/bể mở: bể kín giữ ẩm tốt và dễ cho người mới; bể mở thoáng hơn nhưng cần theo dõi nước thường xuyên hơn.",
  },
  {
    keyword: "hết hàng, còn hàng, tồn kho, còn mẫu này không, khi nào có lại hàng, đặt trước được không",
    category: "product",
    priority: 94,
    isActive: true,
    response:
      "📦 **Câu hỏi tồn kho/còn hàng**\n\nThông tin còn hàng phải lấy từ database hiện tại. Không dùng Ollama để đoán tồn kho.\n\nNếu sản phẩm còn hàng: trả lời rõ còn hàng và gửi link sản phẩm.\nNếu hết hàng hoặc không tìm thấy: nói rõ hiện chưa thấy mẫu phù hợp đang còn hàng, có thể gợi ý mẫu tương tự hoặc hướng khách liên hệ shop để đặt/custom theo yêu cầu.",
  },
  {
    keyword: "custom, thiết kế theo yêu cầu, làm theo mẫu riêng, đặt mẫu riêng, size riêng, theo phong thủy, theo chủ đề",
    category: "product",
    priority: 86,
    isActive: true,
    response:
      "🛠️ **Thiết kế terrarium theo yêu cầu**\n\nTiệm Rêu có thể tư vấn mẫu theo nhu cầu như kích thước, phong cách decor, làm quà tặng hoặc đặt trong không gian cụ thể.\n\nĐể tư vấn chính xác, nên hỏi khách:\n• Ngân sách dự kiến\n• Kích thước mong muốn\n• Đặt ở đâu: bàn, kệ, phòng khách, văn phòng\n• Thích phong cách xanh nhiều, tối giản hay có tiểu cảnh\n\nVới yêu cầu custom chi tiết, nên hướng khách gửi ảnh mẫu hoặc liên hệ Facebook/Zalo Tiệm Rêu để shop xác nhận khả năng làm và báo giá.",
  },
];
