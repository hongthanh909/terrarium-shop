UPDATE "ai_knowledge"
SET
  "response" = E'Quy định sản phẩm custom/đặt trước:\n- Đơn custom cần cọc 50% giá trị đơn.\n- Khách được chỉnh sửa nhẹ, không thay đổi quá nhiều bố cục đã thống nhất.\n- Hủy đơn custom không được hoàn tiền cọc.\n- Thời gian hoàn thiện dự kiến 3-5 ngày; mẫu phức tạp có thể lâu hơn.\n- Shop gửi ảnh/video để khách duyệt trước khi giao.\n- Nếu hết cây hoặc vật liệu, shop có thể đề xuất loại tương đương và phải thông báo khách trước.\n- Đơn custom gấp có phụ phí 10% giá trị sản phẩm.\n- Thay đổi thiết kế sau khi sản phẩm đã hoàn thiện sẽ phát sinh phí tùy sản phẩm và mức độ chỉnh sửa.\n- Sản phẩm custom không được đổi trả vì lý do không đúng sở thích.',
  "updatedAt" = NOW()
WHERE "id" = 'kb-custom-policy-v2';
