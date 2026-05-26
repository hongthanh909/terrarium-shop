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

## 🚀 Tính Năng Mới & Fix (26/05)

### [REQ-001] ✅ Giảm delay khi vào Chi tiết Sản phẩm
- **Vấn đề:** Click vào sản phẩm bị khựng lại trước khi hiển thị trang.
- **Fix:** Thêm `app/products/[slug]/loading.tsx` — skeleton UI hiển thị ngay lập tức khi navigate, người dùng thấy phản hồi liền.
- **File:** `app/products/[slug]/loading.tsx` [MỚI]
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

### [REQ-002] ✅ Trust Badges dưới "Miễn phí vận chuyển"
- **Vấn đề:** Trang chi tiết sản phẩm phía dưới banner vận chuyển bị trống.
- **Fix:** Thêm 4 ô cam kết "Tiệm Rêu":
  - ✅ 100% Cây Khỏe Mạnh
  - 🛡️ Bảo hành 7 ngày
  - 💡 Hỗ trợ chăm sóc trọn đời
  - 🎁 Tặng kèm cẩm nang
- **File:** `app/products/[slug]/ProductDetailClient.tsx`
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

### [REQ-003] ✅ Reset Giỏ hàng khi Đăng xuất
- **Vấn đề:** Logout xong giỏ hàng vẫn còn số lượng cũ.
- **Fix:** Gọi `useCartStore.getState().clearCart()` ngay trước `signOut()` trong Header.
- **File:** `components/Header.tsx`
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

### [REQ-004] ✅ Logic Điểm Thưởng (Loyalty Points)
- **Quy tắc:** Cứ **10.000 VNĐ = 1 Điểm**. VD: Đơn 1.200.000₫ → +120 điểm.
- **Thời điểm:** Điểm tự động cộng khi Admin đổi trạng thái đơn hàng sang `DELIVERED`.
- **Chống trùng lặp:** Kiểm tra `status cũ ≠ DELIVERED` trước khi cộng.
- **Dùng Prisma Transaction:** Đảm bảo cập nhật order và cộng điểm là 1 atomic operation.
- **File:** `app/api/admin/orders/route.ts`
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

### [REQ-005] ✅ Trang Sản phẩm Yêu thích (Wishlist)
- **Vấn đề:** User bấm ❤️ nhưng không có chỗ xem lại.
- **Fix:** 
  1. Trang mới `/profile/favorites` — hiện grid sản phẩm đã tym với nút bỏ yêu thích & thêm giỏ hàng.
  2. API mới `/api/profile/favorites` — query bảng `ProductVote`, trả về sản phẩm ACTIVE.
  3. Link "❤️ Yêu thích" trong dropdown menu avatar Header.
- **Files:**
  - `app/profile/favorites/page.tsx` [MỚI]
  - `app/api/profile/favorites/route.ts` [MỚI]
  - `components/Header.tsx`
- **Trạng thái:** ✅ ĐÃ THỰC HIỆN

---

## 📋 Checklist Test Manual

### Storefront
- [x] `/products/[slug]` — Click vào sản phẩm: skeleton hiện ngay, không bị delay trắng màn hình
- [x] `/products/[slug]` — Dưới "Miễn phí vận chuyển" có 4 ô cam kết
- [x] Header — Logout → giỏ hàng reset về 0
- [x] Header dropdown → có mục "❤️ Yêu thích"
- [x] `/profile/favorites` — Hiển thị sản phẩm đã tym, bỏ yêu thích, thêm giỏ hàng

### Admin
- [x] `/admin/orders/[id]` — Đổi trạng thái sang DELIVERED → điểm tự động cộng vào tài khoản user
- [ ] `/profile/points` — Xác nhận điểm hiển thị đúng sau khi đơn DELIVERED

> **Cần rebuild** (`npm run build`) để apply toàn bộ thay đổi.
