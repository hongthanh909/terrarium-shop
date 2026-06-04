# FIXALL — Báo cáo Kiểm tra & Sửa lỗi Toàn hệ thống

> Ngày kiểm tra gần nhất: 2026-06-04  
> Phạm vi: Hosting migration, AI model update, UI/Mobile responsive

---

## 📋 Cập nhật 2026-06-04
# ✅ Session & Admin Security Enhancements
- Đặt `session.maxAge` = 1 giờ trong `apps/web/lib/auth.ts` để tự động logout người dùng sau 1 giờ không hoạt động.
- Admin dashboard (`/tiem-nho-nth24`) luôn yêu cầu đăng nhập lại; nếu không có token hoặc token không phải ADMIN, sẽ chuyển hướng tới `/tiem-nho-nth24/login`.
- Thêm kiểm tra `Referer` và `ADMIN_IP_WHITELIST` trong `middleware.ts` để bảo vệ URL admin tránh truy cập trái phép.


### ✅ Dọn dẹp Vercel (đã chuyển sang VPS)
- Xóa `vercel.json` (root + apps/web)
- Xóa thư mục `apps/web/.vercel/`
- Cần xóa project trên Vercel Dashboard thủ công

### ✅ Cập nhật AI Model
- Model chính: `llama3:8b` (~4.7GB) trên VPS CHEAP 6 (8GB RAM, 6vCPU)
- Đã đồng bộ `migrate.md`: VPS specs, RAM allocation, SSD usage
- `consult/route.ts` default model đã đúng: `llama3:8b`

### ✅ Mobile Responsive — Header
- Thêm hamburger menu icon (`Menu` từ lucide) cho mobile (`md:hidden`)
- Mobile menu drawer (Sheet, slide from left) với gradient xanh lá
- Chứa đầy đủ NAV_LINKS + POLICY_LINKS + user actions
- Tự động đóng khi chuyển trang (`usePathname` listener)

### ✅ Mobile Responsive — ChatWidget
- Chat panel responsive: full-width trên mobile (<640px), 360px trên desktop
- Height responsive: `calc(100vh - 160px)` trên mobile, 500px trên desktop

---

> Ngày kiểm tra trước: 2026-06-02  
> Phạm vi: Toàn bộ API routes, logic user→admin, DB connection

> [!IMPORTANT]
> **Root cause quan trọng**: Prisma singleton (`lib/prisma.ts`) được lưu trong `globalThis` của Node.js process.
> Khi thay đổi cấu hình singleton, **bắt buộc phải restart toàn bộ dev server** (không phải hot-reload).
> Hot module reload chỉ reload route files, không reset `globalThis`.

---

## Tóm tắt nhanh

| Mức độ | Số lỗi | Trạng thái |
|--------|--------|-----------|
| 🔴 CRITICAL | 2 | Đang fix |
| 🟡 MODERATE | 5 | Đang fix |
| 🟢 INFO | 3 | Ghi nhận |

---

## 🔴 CRITICAL — Phải fix ngay

### #1 — Prisma Connection Pool Exhaustion (Root cause của ALL timeouts)

**Triệu chứng:** Hầu hết API timeout sau 5 giây với lỗi:
```
FATAL: (ECHECKOUTTIMEOUT) unable to check out connection from the pool after 60000ms in Transaction mode
```

**Nguyên nhân gốc rễ:**
`api/products/route.ts` (GET + POST) và `api/admin/stats/route.ts` tạo ra `new PrismaClient()` **MỖI REQUEST** thay vì dùng singleton:

```typescript
// ❌ SAI — tạo mới PrismaClient mỗi lần gọi API
const client = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } }
});
```

Mỗi lần tạo `new PrismaClient()` = mở thêm 1 pool connections tới Supabase PgBouncer.
PgBouncer mặc định chỉ cho phép **15-20 concurrent connections** → pool cạn kiệt → toàn bộ API timeout.

**File bị ảnh hưởng:**
- `apps/web/app/api/products/route.ts` — cả GET lẫn POST
- `apps/web/app/api/admin/stats/route.ts` — GET

**Fix:**
- Thay toàn bộ `new PrismaClient()` → singleton `import { prisma } from "@/lib/prisma"`
- `admin/stats`: giữ pattern disconnect nhưng dùng singleton

**Status: ✅ ĐÃ FIX (xem bên dưới)**

---

### #2 — Prisma Singleton không dùng DIRECT_URL

**Nguyên nhân:** `lib/prisma.ts` tạo PrismaClient mà không chỉ định datasource URL, nên dùng `DATABASE_URL` (PgBouncer/transaction mode) theo mặc định. Trong development, DIRECT_URL (port 5432) ổn định hơn.

**Fix:** Cập nhật singleton để ưu tiên DIRECT_URL khi có

**Status: ✅ ĐÃ FIX (xem bên dưới)**

---

## 🟡 MODERATE — Nên fix

### #3 — Blog API: `force-dynamic` mâu thuẫn với `unstable_cache`

**File:** `apps/web/app/api/blog/route.ts`

```typescript
export const dynamic = "force-dynamic"; // ← vô hiệu hoá TẤT CẢ cache
// ...
const getCachedBlogData = unstable_cache(..., { revalidate: 300 }); // ← không bao giờ chạy được
```

`force-dynamic` ngăn mọi form of caching, làm `unstable_cache` vô dụng. Mỗi request phải query DB lại.

**Fix:** Xoá `export const dynamic = "force-dynamic"` để `unstable_cache` hoạt động đúng.

**Status: ✅ ĐÃ FIX**

---

### #4 — Explore API: 4 DB queries tuần tự, không song song

**File:** `apps/web/app/api/explore/route.ts`

```typescript
// ❌ SAI — 4 queries chạy tuần tự, tổng thời gian = 4 × round-trip
const featured = await prisma.product.findMany(...);
const pinned   = await prisma.product.findMany(...);
const topVoted = await prisma.product.findMany(...);
const newArrivals = await prisma.product.findMany(...);
```

**Fix:** Chạy song song bằng `Promise.all`

**Status: ✅ ĐÃ FIX**

---

### #5 — Admin Stats: N+1 query cho Top Products

**File:** `apps/web/app/api/admin/stats/route.ts` (lines 81-93)

```typescript
// ❌ SAI — 1 query groupBy + N queries findUnique (N = số top products)
topProducts.map(async (item) => {
  const product = await client.product.findUnique({ where: { id: item.productId } });
})
```

**Fix:** 1 query `findMany` với `{ id: { in: productIds } }` thay vì N queries.

**Status: ✅ ĐÃ FIX**

---

### #6 — Settings API không có auth check

**File:** `apps/web/app/api/settings/route.ts`

```typescript
// ❌ SAI — PUT không kiểm tra quyền admin
export async function PUT(request: NextRequest) {
  // Bất kỳ ai cũng có thể gọi API này và thay đổi cài đặt website!
  const body = await request.json();
  ...
}
```

**Fix:** Thêm `verifyAdminRequest` check trước khi xử lý PUT request.

**Status: ✅ ĐÃ FIX**

---

### #7 — Products API status filter logic không rõ ràng

**File:** `apps/web/app/api/products/route.ts` (dòng 89-91)

```typescript
const status = searchParams.get("status"); 
if (status !== "all") {          // ← null !== "all" = true
  where.status = "ACTIVE";       // → luôn filter ACTIVE khi không truyền status
}
```

Logic này **có thể chấp nhận được** cho public API (mặc định chỉ hiện ACTIVE), nhưng:
- Admin cần truyền `?status=all` để xem tất cả sản phẩm
- Không rõ ràng với developer khác

**Fix:** Làm rõ logic với explicit condition.

**Status: ✅ ĐÃ FIX**

---

## 🟢 INFO — Ghi nhận, không fix ngay

### #8 — NEXT_PUBLIC_SITE_URL chưa được set

PayOS payment redirect dùng:
```typescript
const domain = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
```
Khi deploy VPS, nếu không set env var này → PayOS redirect về localhost:3000.
**Cần thêm vào `.env.local` và VPS env trước khi deploy.**

### #9 — Bank Transfer info server-side là placeholder

`.env.local` có:
```
BANK_NAME="Vietcombank"
BANK_ACCOUNT_NUMBER="XXXXXXXXXX"  ← chưa điền
```
Tuy nhiên code thực tế chỉ dùng `NEXT_PUBLIC_BANK_*` vars (TPBank, đã điền đúng). Có thể xoá các var server-side thừa.

### #10 — Supabase region là ap-northeast-2 (Seoul)

Người dùng Việt Nam → latency cao hơn so với Singapore (ap-southeast-1).
Khi migrate VPS tại Việt Nam, vấn đề này sẽ biến mất hoàn toàn.

---

## Kết quả sau khi fix

| API Endpoint | Trước | Sau |
|-------------|-------|-----|
| `GET /api/products` | ✅ OK (dùng new PrismaClient) | ✅ Singleton |
| `POST /api/products` | ✅ OK (new PrismaClient) | ✅ Singleton |
| `GET /api/reviews` | ⏱ Timeout | ✅ OK |
| `GET /api/blog` | ⏱ Timeout | ✅ OK + cache working |
| `GET /api/settings` | ⏱ Timeout | ✅ OK |
| `GET /api/explore` | ⏱ Timeout | ✅ OK + parallel queries |
| `GET /api/search` | ⏱ Timeout | ✅ OK |
| `GET /api/admin/stats` | ⏱ Timeout | ✅ OK + no N+1 |
| `PUT /api/settings` | 🔓 No auth | 🔒 Admin-only |

---

## Flow User → Admin tổng quan

```
[User]
  ├── Trang chủ: GET /api/products?featured=true ✅
  ├── Sản phẩm: GET /api/products?categoryId=... ✅
  ├── Chi tiết SP: GET /api/products?slug=... ✅
  ├── Tìm kiếm: GET /api/search?q=... ✅
  ├── Giỏ hàng: Local state (Zustand) ✅ (không cần API)
  ├── Checkout: POST /api/orders → POST /api/payment/create-payment-link ✅
  ├── Đơn hàng: GET /api/orders?customerId=... ✅
  └── Đánh giá: POST /api/reviews (cần đã mua hàng) ✅

[Admin - /tiem-nho-nth24]
  ├── Dashboard stats: GET /api/admin/stats ✅ (fixed N+1)
  ├── Sản phẩm CRUD: GET/POST/PUT/DELETE /api/products + /api/products/[id] ✅
  ├── Đơn hàng: GET /api/admin/orders ✅
  ├── Khám phá: GET/POST /api/admin/explore ✅
  ├── Blog: GET/POST /api/admin/blog ✅
  ├── Cài đặt: GET/PUT /api/settings ✅ (fixed auth)
  └── AI tư vấn: POST /api/consult (Ollama streaming) ✅
```

---

## Hướng dẫn test sau khi fix

```bash
# Test tất cả API endpoints
$endpoints = @(
  "/api/products",
  "/api/categories",
  "/api/blog",
  "/api/settings",
  "/api/explore",
  "/api/search?q=terrarium",
  "/api/admin/stats"
)
foreach ($ep in $endpoints) {
  $r = Invoke-WebRequest "http://localhost:3000$ep" -TimeoutSec 5
  Write-Host "[$($r.StatusCode)] $ep"
}
```

## 🟢 INFO — AI Recommendation Integration

- Added **rateLimiter.ts** utility for simple in‑memory IP‑based rate limiting (used by AI endpoints).
- Added **aiPrompt.ts** with `buildProductPrompt` to construct system prompts for Ollama model using real product data.
- Created **/api/ai/recommend** endpoint (`apps/web/app/api/ai/recommend/route.ts`) that:
  - Validates request and applies rate limiting.
  - Retrieves product details via Prisma singleton.
  - Generates a prompt with `buildProductPrompt` and calls Ollama (`llama3:8b`).
  - Returns markdown recommendation.
- Updated **ChatWidget** (no direct change required; can now call `/api/ai/recommend` if needed).
- All changes follow existing code style and security headers.

> [!NOTE] The AI model now receives actual product catalog data; no trend data needed.
