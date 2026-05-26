# Testing Log — Tiệm Rêu Décor

> Cập nhật lần cuối: 2026-05-26 (08:19)

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
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

### [REQ-007] Tích hợp PayOS thay VietQR
- **Vấn đề cũ:** QR VietQR tĩnh không hiện, user phải chuyển khoản thủ công, admin phải kiểm tra tay.
- **Giải pháp:** Tích hợp **PayOS** — payment gateway thực sự:
  1. Khi user chọn "Chuyển khoản" → tạo order → gọi PayOS API tạo link thanh toán → **redirect sang PayOS**
  2. PayOS hiển thị QR động + form thanh toán chuyên nghiệp
  3. User thanh toán xong → PayOS gọi **webhook** → tự cập nhật đơn sang `PAID` + `CONFIRMED`
  4. User được redirect về `/checkout/success` hoặc `/checkout/payment` (nếu hủy)
- **Files:**
  - `app/checkout/page.tsx` — nối PayOS vào submit flow
  - `app/checkout/success/page.tsx` [MỚI] — trang xác nhận thanh toán thành công
  - `app/checkout/payment/page.tsx` [MỚI] — trang fallback khi hủy thanh toán
  - `app/api/payment/create-payment-link/route.ts` — tạo link PayOS
  - `app/api/payment/webhook/route.ts` — nhận webhook xác nhận thanh toán
- **Bugs phát sinh và đã fix:**
  - ❌ `[PayOS] CLIENT_ID: thiếu` → `.env` ở root không được đọc khi chạy từ `apps/web` → ✅ Thêm PayOS keys vào `apps/web/.env.local`
  - ❌ `"Order is already paid"` → orders route set `paymentStatus = PAID` ngay khi tạo đơn BANK_TRANSFER → ✅ Fix thành `PENDING`, webhook PayOS sẽ cập nhật sau
  - ❌ `"PayOS is not a constructor"` (lần 1) → `require()` không lấy được ESM class → ✅ Fix dùng `PayOSModule.default || PayOSModule`
  - ❌ `"PayOS is not a constructor"` (lần 2) → vẫn lỗi, `require()` hoàn toàn không tương thích → ✅ Fix dùng `await import("@payos/node")`
  - ❌ Alert popup khó chịu khi PayOS lỗi → ✅ Xóa tất cả `alert()`, redirect sang trang QR riêng
- **Trạng thái:** ✅ ĐÃ FIX TOÀN BỘ

### [REQ-009] Trang thanh toán QR chờ + Tự hủy sau 30 phút
- **Yêu cầu:**
  - Không hiện alert khi PayOS lỗi
  - Tạo trang chờ QR đẹp riêng (`/checkout/pending`)
  - Tự hủy đơn sau 30 phút nếu chưa thanh toán
  - Chỉ hiện "Thành công" khi PayOS xác nhận (webhook)
- **Giải pháp:**
  1. `app/checkout/pending/page.tsx` [MỚI] — VietQR QR + đồng hồ 30 phút + polling 12s
  2. `app/api/orders/[id]/status/route.ts` [MỚI] — trả về payment status + tự hủy nếu hết hạn
  3. Flow: PayOS thành công → redirect PayOS, PayOS lỗi → redirect pending page
  4. COD → hiện trang success ngư cũ
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

## 📋 Checklist Test Manual

### Storefront
- [x] `/products/[slug]` — Skeleton loading hiển thị khi click
- [x] `/products/[slug]` — Trust Badges dưới banner vận chuyển
- [x] Header — Logout → giỏ hàng reset về 0
- [x] Header dropdown → có mục "❤️ Yêu thích"
- [x] `/profile/favorites` — Danh sách sản phẩm đã tym
- [x] `/orders` — Nút "Hủy đơn" hiện khi status PENDING, ẩn khi CONFIRMED+
- [ ] `/checkout` — Chọn Chuyển khoản → redirect sang PayOS (nếu OK) hoặc `/checkout/pending` (fallback)
- [ ] `/checkout/pending` — QR hiển đúng số tiền, đồng hồ 30 phút chạy đúng
- [ ] `/checkout/pending` — Khi thanh toán xong → tự chuyển sang `/checkout/success`
- [ ] `/checkout/pending` — Sau 30 phút chưa TT → đơn tự hủy
- [ ] `/checkout/success` — Hiển thị đúng sau khi PayOS xác nhận
- [ ] `/profile/points` — Điểm hiển thị đúng sau khi đơn DELIVERED

---

## 💡 REQ-008 — Hệ Thống Thông Báo UI (Đang lên kế hoạch)

> **Vấn đề hiện tại:** Toàn bộ thông báo đang dùng `alert()` / `confirm()` mặc định của trình duyệt (hộp thoại xấu, không khớp giao diện).

### Các Ideas Đề Xuất

---

#### 🥇 Idea A — Nâng cấp Toast (Sonner) — **ĐỀ XUẤT CHÍNH**
> Dự án đã cài `sonner`. Thay toàn bộ `alert()` bằng toast đẹp.

| Tình huống | Loại Toast | Nội dung |
|-----------|-----------|---------|
| Đặt hàng thành công | ✅ Success (xanh lá) | "Đặt hàng thành công! Mã đơn #XYZ" + nút [Xem đơn] |
| Thêm vào giỏ | ✅ Success | "Đã thêm [Tên sản phẩm] vào giỏ hàng" |
| Hủy đơn thành công | ✅ Success | "Đã hủy đơn hàng thành công" |
| Lỗi API | ❌ Error (đỏ) | "Không thể thực hiện. Vui lòng thử lại" |
| Admin: Lưu sản phẩm | ✅ Success | "Sản phẩm đã được lưu thành công" |
| Admin: Xóa danh mục | ✅ Success | "Đã xóa danh mục" |
| Loading khi submit | 🔄 Loading | "Đang xử lý..." → tự đổi sang ✅/❌ |

**Vị trí toast:** Góc dưới bên phải (bottom-right)
**Thời gian tự ẩn:** 4 giây

---

#### 🥈 Idea B — Custom Confirm Dialog (Thay browser confirm)
> Thay hộp thoại `confirm("Bạn có chắc...")` bằng modal đẹp theo brand.

- Nền tối mờ (backdrop)
- Box trắng bo góc, có icon cảnh báo ⚠️
- Màu nút đồng bộ: "Xác nhận" xanh lá `#425733`, "Hủy" xám
- Có animation slide-down khi mở

---

#### 🥉 Idea C — Overlay Loading khi Submit
> Khi bấm "Đặt hàng" / "Lưu" / "Xóa", hiện overlay mờ + spinner → sau đó chuyển sang ✅ animate.

```
[Bấm Đặt hàng]
     ↓
[Overlay tối + spinner xoay]
     ↓
[Icon ✅ to dần + text "Thành công!"]
     ↓
[Tự chuyển sang trang xác nhận]
```

---

### Phương án Triển khai Đề xuất
Kết hợp **Idea A + Idea B** là tối ưu nhất:
- **Idea A (Toast):** Cho tất cả thông báo thành công / lỗi / loading
- **Idea B (Custom Dialog):** Cho xác nhận nguy hiểm (hủy đơn, xóa sản phẩm/danh mục)
- Idea C (Loading Overlay): Có thể thêm sau nếu muốn premium hơn

**Files cần thay đổi:**
- `app/checkout/page.tsx` — thay `alert()` khi đặt hàng lỗi
- `app/orders/page.tsx` — thay `confirm()` hủy đơn
- `app/admin/products/create/page.tsx` — toast khi thêm sản phẩm
- `app/admin/products/[id]/edit/page.tsx` — toast khi lưu/xóa sản phẩm
- `app/admin/categories/page.tsx` — toast khi xóa danh mục
- Tạo mới `components/ui/ConfirmDialog.tsx` — component dùng chung

**Trạng thái:** ⏳ Chờ xác nhận từ bạn để triển khai
