# FINAL CHECKLIST - TERRARIUM SHOP
> Cập nhật: 2026-05-25 | Trạng thái: Đang phát triển

---

## 🔴 CẦN FIX NGAY — BẢO MẬT & QUAN TRỌNG

### 🔒 AUTH & SECURITY (Ưu tiên cao nhất)

- [x] **Hash password với bcrypt** — register dùng `bcrypt.hash()`, login dùng `bcrypt.compare()`
  - File: `apps/web/app/api/auth/register/route.ts` ✅
  - File: `apps/web/app/api/auth/login/route.ts` ✅

- [x] **JWT Cookie-based Auth** — NextAuth JWT cho cả Admin lẫn Customer
  - Admin auth: NextAuth + JWT session ✅ (`admin-login` provider)
  - Customer auth: NextAuth + JWT session ✅ (`customer-login` provider)

- [x] **Auth Middleware** — `middleware.ts` đã bảo vệ `/admin/*` bằng NextAuth token
  - Redirect về `/admin/login` nếu chưa login ✅
  - Redirect về `/` nếu `token.role !== "ADMIN"` ✅
  - Customer routes `/orders`, `/profile`, `/checkout` cũng được bảo vệ ✅

- [x] **Zod Validation cho tất cả API** — Đã áp dụng ở auth, products, profile, categories, orders, reviews.

- [x] **Forgot Password Flow** — Custom flow với Resend email
  - API: `/api/auth/forgot-password` + `/api/auth/reset-password` ✅
  - UI: `/forgot-password` + `/reset-password` ✅
  - resetToken + resetTokenExpiry lưu trong bảng Customer ✅

### 🔐 AUTH — CẦN FIX (Mới phát hiện)

- [ ] **[CRITICAL] Whitelist email Admin** — Hiện tại bất kỳ tài khoản có `role=ADMIN` trong DB đều vào được admin.
  - Yêu cầu: Chỉ `hongthanh181221@gmail.com` được phép vào admin
  - Fix: Thêm check `email === process.env.ADMIN_EMAIL` trong `admin-login` provider của `lib/auth.ts`
  - Thêm `ADMIN_EMAIL=hongthanh181221@gmail.com` vào `.env.local`

- [ ] **[HIGH] Trang /admin/login chưa tồn tại** — Thư mục `app/admin/login/` không có file `page.tsx`!
  - Middleware redirect về `/admin/login` nhưng trang này không tồn tại → 404
  - Cần tạo: `apps/web/app/admin/login/page.tsx` với form đăng nhập Admin

- [ ] **[HIGH] Session timeout khi restart `npm run dev`**
  - Vấn đề: JWT secret có thể thay đổi mỗi lần restart nếu `NEXTAUTH_SECRET` không được set cố định
  - Fix: Đảm bảo `NEXTAUTH_SECRET` trong `.env.local` là một chuỗi cố định, không tự generate
  - Hiện tại session `maxAge = 30 ngày` (production) — hợp lý

- [ ] **[MEDIUM] `signIn page` mặc định trỏ về `/admin/login`** — Nếu Customer chưa login bị redirect về `/admin/login` thay vì `/login`
  - Fix: Tách `pages.signIn` ra cho từng provider hoặc điều chỉnh trong middleware

- [ ] **[LOW] Không có nút Logout trong Admin sidebar**
  - Cần thêm nút "Đăng xuất" trong `admin/layout.tsx` gọi `signOut()` từ NextAuth

### 🗑️ SUPABASE STORAGE
- [x] **Xóa ảnh thực sự khi xóa sản phẩm** ✅

---

## 🟡 ADMIN DASHBOARD — CHECK API & LOGIC

### ✅ Đã hoạt động tốt
- [x] **Stats Dashboard** — `GET /api/admin/stats`: doanh thu, đơn hàng, sản phẩm, khách hàng ✅ (dùng `Promise.all` song song hiệu quả)
- [x] **Products CRUD** — Tạo/sửa/xóa sản phẩm với variants, images ✅
- [x] **Categories CRUD** — Tạo/sửa/xóa danh mục ✅
- [x] **Orders Management** — Xem danh sách, cập nhật trạng thái đơn hàng ✅
- [x] **Reviews Approval** — Duyệt/từ chối đánh giá ✅
- [x] **Vouchers CRUD** — Tạo/sửa/xóa phiếu giảm giá ✅
- [x] **Blog CRUD** — Tạo/đăng bài blog ✅

### ⚠️ Cần kiểm tra / bổ sung
- [ ] **Admin: Sửa/xóa bài viết blog** — `/admin/blog/[id]/edit` chưa được verify đầy đủ
- [ ] **Admin: Trang `/admin/settings`** — Có trong sidebar nhưng cần kiểm tra trang có tồn tại không
- [ ] **AuditLog** — Model đã có trong Prisma schema nhưng chưa được ghi log khi admin thực hiện CREATE/UPDATE/DELETE
- [ ] **Admin: Phân trang (Pagination)** — Các trang list (orders, products, customers) cần phân trang khi dữ liệu lớn
- [ ] **Admin: Tìm kiếm & lọc nâng cao** — Tìm kiếm đơn hàng theo số điện thoại, email khách hàng

---

## 🟡 CHƯA HOÀN THIỆN — LOGIC & TÍNH NĂNG

### 👤 QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG

- [x] **User Profile Page** — Trang `/profile` ✅
- [x] **Loyalty Tier Badge** ✅
- [ ] **Points History Page** — `/profile/points` (API đã có, UI cần verify)

### 🌟 EXPLORE PAGE

- [ ] **Top Voted Products** — Weekly/Monthly ranking
- [ ] **Vote Product** — Nút vote cho khách đã login
- [ ] **Admin Pin/Unpin** — Ghim sản phẩm vào `WeeklyFeatured`

### 🌿 CARE GUIDES

- [ ] **Admin: Tạo/sửa Care Guide** — Form trong admin/products/[id]/edit
- [ ] **Customer Care Items** — Sau khi mua, tự động thêm vào danh sách chăm sóc

### 📝 BLOG

- [ ] **Admin: Sửa/xóa bài viết** — `/admin/blog/[id]/edit`
- [ ] **SEO cho Blog** — generateMetadata()
- [ ] **Rich Text Editor** — Dùng `react-quill` hoặc `@uiw/react-md-editor`

---

## 🚀 PERFORMANCE — TƯ VẤN & CẢI THIỆN

### Vấn đề hiện tại
- Trang product detail (`/products/[slug]`) nặng nhất: **150 kB JS**
- Mỗi API call lên Supabase Cloud có độ trễ ~100-300ms
- Không có cache tầng client (mỗi lần navigate phải fetch lại)

### Giải pháp ngắn hạn (Không cần đổi cấu trúc)
- [ ] **`export const dynamic = 'force-dynamic'`** — Thêm vào `/explore/page.tsx` để fix warning build
- [ ] **`next/image` thay `<img>`** — Tự động tối ưu kích thước + convert sang WebP/AVIF
- [ ] **Lazy load components nặng** — Dùng `dynamic(() => import(...), { ssr: false })` cho carousel, chat widget
- [ ] **Gộp Prisma queries** — Trong Stats API đã tốt (Promise.all), áp dụng tương tự các API khác

### Giải pháp trung hạn (Cải thiện đáng kể)
- [ ] **TanStack Query cache** — Cache API responses phía client 5-10 phút, tránh refetch khi navigate
- [ ] **Next.js `revalidate`** — Áp dụng ISR (Incremental Static Regeneration) cho trang products list (revalidate mỗi 60 giây)
- [ ] **Prisma connection pooling** — Sử dụng `?pgbouncer=true` trong DATABASE_URL (đã có) → kiểm tra PgBouncer mode

### Giải pháp dài hạn (Cần thay đổi cấu trúc)
- [ ] **Redis Cache (Upstash)** — Cache kết quả DB query cho các trang phổ biến (homepage, product list)
- [ ] **CDN cho ảnh** — Cloudflare CDN trước Supabase Storage để giảm latency load ảnh tại Việt Nam
- [ ] **Edge Runtime cho Middleware** — Middleware hiện đang là Node.js runtime, chuyển sang Edge Runtime để nhanh hơn

---

## 🟢 SEO & PERFORMANCE

### SEO Optimization

- [/] **generateMetadata() cho tất cả pages** — Đã áp dụng ở products, blog
- [ ] **Open Graph tags** — og:image, og:title, og:description đầy đủ
- [ ] **Schema.org markup** — Product (JSON-LD), Organization, BreadcrumbList
- [x] **Dynamic sitemap.xml** — `apps/web/app/sitemap.ts` ✅
- [x] **robots.txt** — `apps/web/app/robots.ts` ✅
- [ ] **Canonical URLs** — Tránh duplicate content

### Performance

- [ ] **Next.js Image component** — Thay `<img>` bằng `<Image>` từ next/image
- [ ] **Lazy loading** — Defer below-the-fold images + components
- [ ] **TanStack Query caching** — Dùng `useQuery` thay `useEffect + fetch`
- [ ] **Core Web Vitals** — Đo bằng Vercel Analytics sau deploy

---

## 🔵 DEPLOY & PRODUCTION

- [ ] **Deploy lên Vercel** — `vercel deploy`
- [ ] **Setup custom domain** — tiemreudecor.vn
- [ ] **Configure env vars trên Vercel** — Copy từ `.env.local`
- [ ] **Setup Vercel Analytics** — Theo dõi traffic và performance
- [ ] **Test production build** — `npm run build` ✅ (đã test, 58 trang)

---

## ✅ ĐÃ HOÀN THÀNH

### Phase 0 — Setup
- [x] Tạo Supabase project + keys, .env, repo GitHub, install dependencies
- [x] Setup Prisma schema (25 models) + migrations
- [x] Initialize Next.js 14 App Router, shadcn/ui, Tailwind (forest theme)

### Phase 1 — Core Features
- [x] Product CRUD + variants + image upload
- [x] Category hierarchy, Homepage, Shop, Product Detail
- [x] Cart (Zustand), Checkout, Voucher validation, Order creation

### Phase 2 — Payment
- [x] COD + Bank Transfer + Order management (Admin + Customer)

### Phase 3 — Voucher System
- [x] Voucher CRUD, validate, apply discount

### Phase 4 — Reviews
- [x] Submit review, Admin approval, Star rating, Verified badge

### Phase 5 — Auth
- [x] Đăng ký, Đăng nhập (Admin + Customer), Middleware bảo vệ routes
- [x] Forgot Password + Reset Password flow (Resend email)
- [x] Prisma Schema: `resetToken` + `resetTokenExpiry`

### Phase 6 — Move Project
- [x] Dọn sạch cache + node_modules
- [x] Copy project sang `D:\Projects\terrarium-shop`
- [x] Cài lại npm + prisma generate
- [x] Dev server chạy bình thường từ ổ D

### Content & System
- [x] Blog, Explore, Contact, Consult, Policies pages
- [x] Admin Dashboard, Sidebar navigation
- [x] sitemap.xml, robots.txt

---

## 📋 THỨ TỰ FIX ĐỀ XUẤT (Cập nhật)

| # | Việc cần làm | Độ ưu tiên | Ước tính |
|---|---|---|---|
| 1 | Tạo trang `/admin/login` (đang bị 404!) | 🔴 Critical | 30 phút |
| 2 | Whitelist email Admin (`ADMIN_EMAIL` env) | 🔴 Critical | 15 phút |
| 3 | Thêm nút Logout trong Admin sidebar | 🔴 High | 15 phút |
| 4 | Fix `signIn page` redirect sai về `/admin/login` | 🟠 High | 30 phút |
| 5 | Thêm `force-dynamic` vào `/explore` | 🟠 High | 5 phút |
| 6 | AuditLog khi admin thao tác | 🟡 Medium | 2 giờ |
| 7 | TanStack Query cache tầng client | 🟡 Medium | 3 giờ |
| 8 | Next.js Image optimization | 🟡 Medium | 2 giờ |
| 9 | Blog: Sửa/xóa bài viết | 🟡 Medium | 1 giờ |
| 10 | Deploy Vercel | 🔵 Deploy | 1 giờ |

---

## ⚡ Quick Commands Reference

```bash
# Development (từ D:\Projects\terrarium-shop)
cd apps/web && npm run dev       # Start dev server (port 3000)
npx prisma studio                # Open Prisma Studio (port 5555)
npx prisma generate              # Regenerate Prisma Client (sau khi đổi schema)
npx prisma db push               # Sync schema với DB

# Build & Deploy
cd apps/web && npm run build     # Build for production
cd apps/web && npm run start     # Start production server
vercel deploy                    # Deploy to Vercel
```

---

## 🔑 Environment Variables (.env.local)

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="..."
DIRECT_URL="..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
NEXT_PUBLIC_SUPABASE_BUCKET_NAME="product-images"

# NextAuth — PHẢI set cố định, không để trống!
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Admin whitelist
ADMIN_EMAIL="hongthanh181221@gmail.com"

# Email
RESEND_API_KEY="re_..."

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```