# Testing Log — Tiệm Rêu Décor

> Cập nhật lần cuối: 2026-05-27

---

## ✅ Bug Tracker (Đã xử lý — 26/05 tối)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| BUG-008 | `ChunkLoadError: Loading chunk app/layout` — root layout dùng `headers()` không compatible với Turbopack | ✅ FIX: Dùng `ShopLayout` client component + `usePathname()` |
| BUG-009 | Footer hiển thị đè lên admin panel | ✅ FIX: `ShopLayout` ẩn Header/Footer khi path bắt đầu `/admin` |
| BUG-010 | `confirm()` browser dialog xấu — 10 chỗ toàn app | ✅ FIX: Tạo `ConfirmDialog` shadcn, fix orders + admin/products |
| BUG-011 | `/profile/favorites` spinner — icon lá không đẹp | ✅ FIX: Dùng `Loader2 animate-spin` |
| BUG-012 | Footer contact info sai (terrariumshop.vn, 0909.123.456) | ✅ FIX: tiemreudecor@gmail.com, 0706.668.296, 32/16 Hẻm 32 Đường Tam Đa |

---

## ✅ Bug Tracker (Đã xử lý — 25/05)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| BUG-001 | Hydration Mismatch — Cart Store SSR | ✅ ĐÃ FIX |
| BUG-002 | Product Detail 404 với slug tiếng Việt | ✅ ĐÃ FIX |
| BUG-003 | `a.map is not a function` tạo/sửa sản phẩm | ✅ ĐÃ FIX |
| BUG-004 | Admin Categories — Edit button 404 | ✅ ĐÃ FIX |
| BUG-005 | API Routes bị Static thay vì Dynamic | ✅ ĐÃ FIX |

---

## ✅ Tính Năng Mới & Fix (26/05 — Session tối)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| REQ-001 | Skeleton loading trang chi tiết sản phẩm | ✅ XONG |
| REQ-002 | Trust Badges dưới "Miễn phí vận chuyển" | ✅ XONG |
| REQ-003 | Reset giỏ hàng khi logout | ✅ XONG |
| REQ-004 | Logic điểm thưởng tự động khi DELIVERED | ✅ XONG |
| REQ-005 | Trang yêu thích `/profile/favorites` | ✅ XONG |
| REQ-006 | Hủy đơn hàng (User) — Logic & Button | ✅ XONG |
| REQ-007 | Tích hợp PayOS thay VietQR | ✅ XONG |
| REQ-009 | Trang thanh toán QR chờ + Tự hủy sau 30 phút | ✅ XONG |

---

## ✅ Fix (27/05 — Session sáng)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| BUG-013 | Font tiếng Việt bị garbled trong admin pages (vouchers, categories, discounts, blog) | ✅ FIX: Python script reverse cp1250 double-encoding |
| BUG-014 | Admin sidebar vẫn còn icon lá, chưa đồng bộ logo trang chủ | ✅ FIX: Thay bằng "tiệm Rêu Décor" Dancing Script font |
| BUG-015 | `webpack cache ENOENT` warning mỗi lần start server | ✅ FIX: Dùng `npm run dev` (Turbopack) thay `npx next dev` |
| BUG-016 | Trang trắng + no CSS khi load lần đầu | ✅ FIX: Turbopack compile 219ms, không có race condition |
| BUG-017 | Không có error boundary — page lỗi hiện trang trắng | ✅ FIX: Tạo `app/error.tsx` global error boundary |

---

## 🔴 Lỗi CẦN FIX trước Deploy

| ID | Mô tả | Ưu tiên | Ghi chú |
|----|-------|---------|---------|
| BUG-018 | `NEXTAUTH_URL` vẫn là `localhost:3000` | 🔴 Critical | Phải đổi thành domain thật trước deploy |
| BUG-019 | `NEXT_PUBLIC_SITE_URL` vẫn là `localhost:3000` | 🔴 Critical | PayOS redirect sẽ sai nếu không đổi |
| BUG-020 | PayOS webhook URL chưa được set trên dashboard PayOS | 🔴 Critical | Cần vào PayOS dashboard → set `https://yourdomain.com/api/payment/webhook` |
| BUG-021 | `npm run build` chưa được test — có thể có TypeScript errors | 🔴 Critical | Phải chạy build pass 0 errors trước deploy |

---

## 🟡 Issues Cần Test Sau Deploy (Staging)

| ID | Mô tả | Ghi chú |
|----|-------|---------|
| TEST-001 | `/checkout` → Chuyển khoản → PayOS redirect hoạt động | Cần HTTPS thật để PayOS accept |
| TEST-002 | `/checkout/pending` → QR hiển đúng số tiền, đồng hồ 30 phút | |
| TEST-003 | Sau khi scan QR + thanh toán → tự chuyển `/checkout/success` | Cần PayOS webhook gọi về domain thật |
| TEST-004 | 30 phút chưa TT → đơn tự hủy | |
| TEST-005 | Email reset password gửi được (Resend API key chưa có) | `RESEND_API_KEY` còn trống |
| TEST-006 | `/profile/points` → điểm hiển thị đúng sau khi đơn DELIVERED | |

---

## 🟢 Nice-to-have (Sau khi deploy xong)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| REQ-008 | Toast notifications (Sonner) thay alert() — UX tốt hơn | ⏳ Chờ deploy xong |
| REQ-010 | Admin Pin/Unpin WeeklyFeatured cho trang Explore | ⏳ Backlog |
| REQ-011 | Pagination cho Orders, Products, Customers | ⏳ Backlog (cần 100+ records) |
| REQ-012 | Open Graph image cho SEO | ⏳ Backlog |

---

## 📋 Checklist Deploy

### Bước 1 — Test Build Local
```bash
cd apps/web
npm run build     # Phải 0 errors
```

### Bước 2 — Chuẩn bị Env Vars cho Production
```env
# ĐỔI các giá trị này:
NEXTAUTH_URL="https://yourdomain.com"          # ← Đổi thành domain thật
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"  # ← Đổi thành domain thật

# Giữ nguyên:
DATABASE_URL="..."          # Supabase (cloud, OK)
PAYOS_CLIENT_ID="..."       # OK
PAYOS_API_KEY="..."         # OK
PAYOS_CHECKSUM_KEY="..."    # OK
NEXTAUTH_SECRET="..."       # OK
```

### Bước 3 — Deploy (Vercel — Recommended)
```bash
# Option A: GitHub auto-deploy (best)
# Connect GitHub repo → Vercel sẽ auto-deploy mỗi khi push

# Option B: CLI
npx vercel --prod
```

### Bước 4 — Sau Deploy
1. Vào PayOS Dashboard → Cập nhật Webhook URL: `https://yourdomain.com/api/payment/webhook`
2. Test checkout flow với số tiền nhỏ
3. Verify email (nếu Resend đã có key)

---

## 💡 REQ-008 — Hệ Thống Thông Báo UI (Kế hoạch)

> Dùng `sonner` (đã cài) để thay toàn bộ `alert()` — triển khai sau deploy.

| Tình huống | Toast |
|-----------|-------|
| Đặt hàng thành công | ✅ Success "Đặt hàng thành công! Mã #XYZ" |
| Thêm vào giỏ | ✅ Success "Đã thêm vào giỏ hàng" |
| Hủy đơn | ✅ Success "Đã hủy đơn hàng" |
| Lỗi API | ❌ Error "Vui lòng thử lại" |
| Admin: Lưu sản phẩm | ✅ Success "Đã lưu" |

**Files cần sửa:** `checkout/page.tsx`, `orders/page.tsx`, `admin/products/**`, `admin/categories/page.tsx`
