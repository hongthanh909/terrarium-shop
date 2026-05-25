# Testing Log — Tiệm Rêu Décor

> Cập nhật lần cuối: 2026-05-25

---

## 🐛 Bug Tracker

### [BUG-001] Hydration Mismatch — Cart Store (SSR vs Client)
- **Trang:** Toàn bộ trang có Header (bao gồm `/admin/products/create`)
- **Lỗi:** `Application error: a client-side exception has occurred`
- **Nguyên nhân:** Zustand `persist` tự đọc `localStorage` khi SSR → server render `items=[]`, client render `items=[...]` → mismatch
- **Fix:** `skipHydration: true` + `rehydrate()` + `mounted` guard trong Header
- **Files:** `lib/store/cartStore.ts`, `components/Header.tsx`
- **Trạng thái:** ✅ ĐÃ FIX

---

### [BUG-002] Product Detail Page — 404 với slug tiếng Việt
- **Trang:** `/products/[slug]` (VD: `localhost:3000/products/sương-mờ-nhân-ảnh-foggy-tank`)
- **Lỗi:** `404 — This page could not be found`
- **Nguyên nhân:** `params.slug` từ Next.js là URL-encoded (`s%C6%B0%C6%A1ng-m%E1%BB%9D...`), không match slug gốc trong DB
- **Fix:** `decodeURIComponent(params.slug)` trước khi query Prisma
- **Files:** `app/products/[slug]/page.tsx`
- **Trạng thái:** ✅ ĐÃ FIX

---

### [BUG-003] Admin Create/Edit Product — `TypeError: a.map is not a function`
- **Trang:** `/admin/products/create`, `/admin/products/[id]/edit`
- **Lỗi:** `TypeError: a.map is not a function` trong console
- **Nguyên nhân:** `fetchCategories()` gọi `/api/categories` → API trả `{ categories: [...], pagination: {...} }` nhưng code gọi `setCategories(data)` (data là object, không phải array) → `.map()` crash
- **Fix:** `setCategories(Array.isArray(data) ? data : (data.categories ?? []))`
- **Files:** `app/admin/products/create/page.tsx`, `app/admin/products/[id]/edit/page.tsx`
- **Trạng thái:** ✅ ĐÃ FIX

---

### [BUG-004] Admin Categories — Edit button 404
- **Trang:** `/admin/categories`
- **Lỗi:** 4 × GET 404 cho `localhost:3000/admin/categories/[id]/edit` (Next.js prefetch)
- **Nguyên nhân:** Link `<Link href={/admin/categories/${id}/edit}>` tồn tại nhưng page `/admin/categories/[id]/edit/page.tsx` **hoàn toàn thiếu**
- **Fix:** Tạo mới page `app/admin/categories/[id]/edit/page.tsx` với form edit đầy đủ + API GET `/api/categories/[id]`
- **Files:** 
  - `app/admin/categories/[id]/edit/page.tsx` [MỚI]
  - `app/api/categories/[id]/route.ts` — thêm GET handler
- **Trạng thái:** ✅ ĐÃ FIX

---

### [BUG-005] API Routes bị Static thay vì Dynamic
- **Routes:** `/api/admin/stats`, `/api/blog`, `/api/profile`, `/api/profile/points`
- **Lỗi:** API bị pre-render thành static → data cũ, auth không hoạt động
- **Nguyên nhân:** Thiếu `export const dynamic = "force-dynamic"` 
- **Fix:** Thêm `export const dynamic = "force-dynamic"` vào 4 routes
- **Trạng thái:** ✅ ĐÃ FIX

---

### [BUG-006] Explore Page — Item slug 404
- **Trang:** `/explore` → click item → 404
- **Lỗi:** Tương tự BUG-002 — slug tiếng Việt bị URL-encode
- **Nguyên nhân:** Cùng nguyên nhân với BUG-002, slug từ explore card link vào `/products/[slug]`
- **Fix:** Được giải quyết cùng BUG-002 (fix tại `app/products/[slug]/page.tsx`)
- **Trạng thái:** ✅ ĐÃ FIX (cùng fix với BUG-002)

---

## 📋 Cần Rebuild

Sau các fix trên, cần chạy lại production build:

```bash
cd apps/web
npx next build
npx next start
```

---

## ✅ Checklist Test Manual

### Admin Dashboard
- [ ] `/admin` — Bảng điều khiển load stats
- [x] `/admin/login` — Đăng nhập admin
- [ ] `/admin/products` — Danh sách sản phẩm
- [x] `/admin/products/create` — Tạo sản phẩm (BUG-003 fixed)
- [ ] `/admin/products/[id]/edit` — Sửa sản phẩm (BUG-003 fixed)
- [x] `/admin/categories` — Danh sách danh mục
- [x] `/admin/categories/[id]/edit` — Sửa danh mục (BUG-004 fixed)
- [ ] `/admin/orders` — Đơn hàng
- [ ] `/admin/blog` — Blog
- [ ] `/admin/reviews` — Đánh giá

### Storefront
- [ ] `/products` — Danh sách sản phẩm
- [x] `/products/[slug]` — Chi tiết sản phẩm tiếng Việt (BUG-002 fixed)
- [x] `/explore` — Explore → click item (BUG-006 fixed)
- [ ] `/checkout` — Thanh toán
- [ ] `/cart` — Giỏ hàng hydration (BUG-001 fixed)
