# Testing Log — Tiệm Rêu Décor

> Cập nhật lần cuối: 2026-05-26

---

## ✅ Bug Tracker (Đã xử lý 25/05)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| BUG-001 | Hydration Mismatch — Cart Store SSR | ✅ ĐÃ FIX |
| BUG-002 | Product Detail 404 với slug tiếng Việt | ✅ ĐÃ FIX |
| BUG-003 | `a.map is not a function` tạo/sửa sản phẩm | ✅ ĐÃ FIX |
| BUG-004 | Admin Categories — Edit button 404 | ✅ ĐÃ FIX |
| BUG-005 | API Routes bị Static thay vì Dynamic | ✅ ĐÃ FIX |

---

## ✅ Tính Năng Mới & Fix (26/05)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| REQ-001 | Skeleton loading trang chi tiết sản phẩm | ✅ XONG |
| REQ-002 | Trust Badges dưới "Miễn phí vận chuyển" | ✅ XONG |
| REQ-003 | Reset giỏ hàng khi logout | ✅ XONG |
| REQ-004 | Logic điểm thưởng tự động khi DELIVERED | ✅ XONG |
| REQ-005 | Trang yêu thích `/profile/favorites` | ✅ XONG |

---

## 🔥 Issues & Tính Năng Mới (26/05 — Đang thực thi)

### [BUG-007] Session user/admin vẫn còn sau khi restart server
- **Vấn đề:** Khởi động lại `npm run dev`, web vẫn nhớ trạng thái đăng nhập dù chưa logout.
- **Giải thích:** Đây là **hành vi đúng và bình thường** của NextAuth — session được lưu trong cookie trình duyệt (JWT) và database, không phải bộ nhớ server. Khi restart server, cookie trong trình duyệt vẫn còn hợp lệ.
- **Không phải bug** — Nếu bạn muốn test với trạng thái "khách", hãy bấm Logout hoặc dùng tab ẩn danh (Ctrl+Shift+N).
- **Trạng thái:** ℹ️ Giải thích xong, không cần fix.

---

### [REQ-006] Hủy đơn hàng (User) — Logic & Button
- **Yêu cầu:**
  - Đơn hàng ở trạng thái `PENDING` → User **có thể hủy**
  - Đơn hàng đã `CONFIRMED` trở lên → User **không thể hủy**
  - Thêm nút "Hủy đơn" trong chi tiết đơn hàng
  - Admin thấy trạng thái đồng bộ khi user hủy
- **Giải pháp:**
  1. Thêm `PATCH /api/orders/[id]/cancel` — endpoint cho user hủy đơn, chỉ cho phép nếu status = PENDING
  2. Thêm nút "Hủy đơn" vào phần expanded detail trong `/orders/page.tsx`
  3. Khi hủy, update status = CANCELLED + ghi log, admin sẽ thấy qua API đang dùng
- **Trạng thái:** 🔄 ĐANG THỰC HIỆN

---

### [REQ-007] QR thanh toán Banking — Hiển thị đúng số tiền + phí ship
- **Vấn đề:** Ảnh 1 cho thấy thanh toán chuyển khoản chỉ hiện "50.000đ" (chỉ phí ship) thay vì tổng đơn hàng thực tế.
- **Nguyên nhân gốc rễ:** Màn hình thanh toán thành công chỉ hiển thị QR sau khi đặt hàng xong — lúc này state `total` đã reset khi `clearCart()` được gọi. Ngoài ra `bankBin` đang dùng giá trị placeholder sai (`12345678` thay vì BIN của TPBank là `23895`).
- **Giải pháp:**
  1. Fix BIN ngân hàng TPBank = `23895`
  2. Lưu `total` vào state trước khi `clearCart()` để QR hiển thị đúng
  3. Hiển thị QR ngay trên trang xác nhận với đủ số tiền = subtotal + shippingFee - discount
- **Trạng thái:** 🔄 ĐANG THỰC HIỆN

---

## 📋 Checklist Test Manual

### Storefront
- [x] `/products/[slug]` — Skeleton loading hiển thị khi click
- [x] `/products/[slug]` — Trust Badges dưới banner vận chuyển
- [x] Header — Logout → giỏ hàng reset về 0
- [x] Header dropdown → có mục "❤️ Yêu thích"
- [x] `/profile/favorites` — Danh sách sản phẩm đã tym
- [ ] `/orders` — Nút "Hủy đơn" hiện khi status PENDING, ẩn khi CONFIRMED+
- [ ] `/checkout` — QR hiển thị đúng tổng tiền (subtotal + ship) khi chọn banking
- [ ] `/profile/points` — Điểm hiển thị đúng sau khi đơn DELIVERED

### Admin
- [ ] `/admin/orders` — Thấy đơn bị hủy bởi user (CANCELLED)
- [ ] `/admin/orders` — Đổi trạng thái → DELIVERED → điểm tự động cộng
