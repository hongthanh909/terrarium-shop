export interface AiKnowledgeDefault {
  keyword: string;
  response: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export const DEFAULT_AI_KNOWLEDGE: AiKnowledgeDefault[] = [
  {
    keyword:
      "bảo hành, đổi trả, báo lỗi, hàng lỗi, hàng vỡ, cây chết, rêu chết, video mở hàng, phí đổi trả",
    category: "warranty",
    priority: 100,
    isActive: true,
    response:
      "Chính sách bảo hành và đổi trả của Tiệm Rêu:\n" +
      "- Khách cần báo lỗi trong 3 ngày kể từ khi nhận hàng và bắt buộc có video mở hàng.\n" +
      "- Cây và rêu được bảo hành trong 7 ngày kể từ khi nhận hàng.\n" +
      "- Hình thức hỗ trợ phụ thuộc tình trạng thực tế; chatbox không tự cam kết hoàn tiền hoặc đổi mới.\n" +
      "- Nếu lỗi do khách, khách chịu phí vận chuyển và chi phí hỗ trợ phát sinh.\n" +
      "- Nếu lỗi do shop hoặc đơn vị vận chuyển, shop chịu phí vận chuyển đổi trả.\n" +
      "- Không bảo hành lỗi do chăm sai, nắng trực tiếp, tưới quá nhiều, va đập hoặc tự ý thay đổi bố cục. Shop có thể hỗ trợ có phụ phí tùy trường hợp.\n" +
      "- Khách cần cung cấp ảnh/video hiện trạng để shop kiểm tra.",
  },
  {
    keyword:
      "vận chuyển, giao hàng, ship, phí ship, freeship, hỏa tốc, giao HCM, giao tỉnh, đóng gói, bể lớn, dễ vỡ",
    category: "shipping",
    priority: 100,
    isActive: true,
    response:
      "Chính sách vận chuyển của Tiệm Rêu:\n" +
      "- Hàng có sẵn tại TP.HCM: giao dự kiến 1-3 ngày.\n" +
      "- Sản phẩm custom/đặt trước tại TP.HCM: dự kiến 3-5 ngày; mẫu phức tạp có thể lâu hơn.\n" +
      "- Giao tỉnh: dự kiến 3-5 ngày.\n" +
      "- Đơn từ 1.500.000đ được freeship nội thành TP.HCM.\n" +
      "- Có thể giao hỏa tốc theo yêu cầu nếu hàng có sẵn hoặc đơn custom được nhận làm gấp. Đơn vị giao có thể là Grab, Lalamove, Ahamove hoặc Be.\n" +
      "- Terrarium kích thước lớn hoặc dễ vỡ khi giao tỉnh cần trao đổi riêng với shop qua Fanpage/điện thoại.\n" +
      "- Chatbox không cung cấp tracking link và không báo phí ship chính xác khi chưa có địa chỉ, sản phẩm và kích thước kiện hàng.",
  },
  {
    keyword:
      "thanh toán, COD, chuyển khoản, cọc, đặt cọc, thanh toán đủ, ship xa, tài khoản ngân hàng, mã QR",
    category: "payment",
    priority: 100,
    isActive: true,
    response:
      "Chính sách thanh toán của Tiệm Rêu:\n" +
      "- Đơn giao tại TP.HCM hỗ trợ COD sau khi khách chuyển khoản cọc 30%.\n" +
      "- Đơn custom áp dụng cọc 50% giá trị đơn; quy định này được ưu tiên thay cho mức cọc 30%.\n" +
      "- Đơn giao tỉnh hoặc ship xa phải thanh toán đủ 100% trước khi shop gửi hàng.\n" +
      "- Shop có tài khoản ngân hàng riêng để nhận chuyển khoản.\n" +
      "- Chatbox không hiển thị số tài khoản hoặc mã QR; khách cần liên hệ kênh chính thức của shop để nhận thông tin thanh toán.\n" +
      "- Chatbox không tự xác nhận đã nhận tiền; trạng thái thanh toán phải lấy từ hệ thống hoặc admin.",
  },
  {
    keyword:
      "custom, đặt trước, thiết kế theo yêu cầu, sửa bố cục, hủy custom, hoàn cọc, duyệt mẫu, vật liệu thay thế, đơn gấp, phụ phí",
    category: "custom",
    priority: 100,
    isActive: true,
    response:
      "Quy định sản phẩm custom/đặt trước:\n" +
      "- Khách được chỉnh sửa nhẹ, không thay đổi quá nhiều bố cục đã thống nhất.\n" +
      "- Hủy đơn custom không được hoàn tiền cọc.\n" +
      "- Thời gian hoàn thiện dự kiến 3-5 ngày; mẫu phức tạp có thể lâu hơn.\n" +
      "- Shop gửi ảnh/video để khách duyệt trước khi giao.\n" +
      "- Nếu hết cây hoặc vật liệu, shop có thể đề xuất loại tương đương và phải thông báo khách trước.\n" +
      "- Đơn custom gấp có phụ phí 10% giá trị sản phẩm.\n" +
      "- Thay đổi thiết kế sau khi sản phẩm đã hoàn thiện sẽ phát sinh phí tùy sản phẩm và mức độ chỉnh sửa.\n" +
      "- Sản phẩm custom không được đổi trả vì lý do không đúng sở thích.",
  },
  {
    keyword:
      "liên hệ, fanpage, facebook, email, số điện thoại, hotline, địa chỉ, giờ mở cửa, giờ hoạt động",
    category: "contact",
    priority: 100,
    isActive: true,
    response:
      "Thông tin liên hệ Tiệm Rêu Décor:\n" +
      "- Kênh phản hồi nhanh nhất: Facebook Fanpage tiemreudecor.\n" +
      "- Email: tiemreudecor@gmail.com.\n" +
      "- Điện thoại: 0706 668 296.\n" +
      "- Địa chỉ: 32/16 Tam Đa, Phường Long Trường, TP. Hồ Chí Minh.\n" +
      "- Giờ hoạt động: Thứ Hai đến Chủ Nhật, 9:00-21:00.\n" +
      "- Với thanh toán, custom, khiếu nại hoặc gửi ảnh/video, chatbox ưu tiên hướng khách qua Fanpage.",
  },
  {
    keyword:
      "cam kết shop, giống ảnh, khác ảnh mẫu, cây khỏe, rêu khỏe, vật liệu tương đương, khuyến mãi, tồn kho",
    category: "shop",
    priority: 100,
    isActive: true,
    response:
      "Quy tắc và cam kết của Tiệm Rêu:\n" +
      "- Sản phẩm thực tế có thể khác ảnh mẫu do kết cấu lũa, rêu và cây tự nhiên; mức độ tương đồng khoảng 70-80%.\n" +
      "- Shop cam kết cây và rêu khỏe tại thời điểm giao.\n" +
      "- Khi hết vật liệu, shop được đề xuất loại tương đương và thông báo khách trước.\n" +
      "- GPT có thể tư vấn chăm sóc đầy đủ; chỉ hướng khách sang Fanpage theo nhu cầu hoặc khi cần gửi ảnh/xử lý trực tiếp.\n" +
      "- Chatbox không tự cam kết hoàn tiền, đổi hàng, giảm giá hoặc thời gian xử lý.\n" +
      "- Giá và tồn kho phải lấy trực tiếp từ database.\n" +
      "- Khuyến mãi chỉ được trả lời khi đang được admin kích hoạt trong hệ thống.",
  },
];
