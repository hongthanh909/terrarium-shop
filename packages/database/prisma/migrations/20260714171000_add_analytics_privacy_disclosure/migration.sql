UPDATE "policies"
SET "content" = "content" || E'\n\nThống kê truy cập\nTiệm Rêu sử dụng mã nhận diện ngẫu nhiên first-party để thống kê lượt truy cập, trang và sản phẩm được xem, thao tác giỏ hàng và thời lượng phiên. Hệ thống không ghi nội dung chat, biểu mẫu, địa chỉ, số điện thoại, dữ liệu thanh toán hoặc thao tác chuột. Khách có thể chọn Chỉ cần thiết để không tham gia thống kê. Dữ liệu sự kiện chi tiết được giữ tối đa 90 ngày; số liệu tổng hợp được giữ tối đa 12 tháng.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'privacy'
  AND "content" NOT LIKE '%Thống kê truy cập%';

INSERT INTO "policies" ("id", "slug", "title", "content", "type", "order", "isActive", "createdAt", "updatedAt")
SELECT 'analytics-privacy-disclosure', 'thong-ke-truy-cap', 'Thống kê truy cập',
       'Tiệm Rêu sử dụng mã nhận diện ngẫu nhiên first-party để thống kê lượt truy cập, trang và sản phẩm được xem, thao tác giỏ hàng và thời lượng phiên. Hệ thống không ghi nội dung chat, biểu mẫu, địa chỉ, số điện thoại, dữ liệu thanh toán hoặc thao tác chuột. Khách có thể chọn Chỉ cần thiết để không tham gia thống kê. Dữ liệu sự kiện chi tiết được giữ tối đa 90 ngày; số liệu tổng hợp được giữ tối đa 12 tháng.',
       'privacy', 99, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "policies" WHERE "type" = 'privacy');
