# FINAL CHECKLIST - TERRARIUM SHOP
> Cập nhật: 2026-05-25 | Trạng thái: **Feature-complete MVP — Ready for Deploy**

---

## ✅ ĐÃ HOÀN THÀNH — TOÀN BỘ CORE FEATURES

### 🔒 AUTH & SECURITY
- [x] **Hash password bcrypt** — register `bcrypt.hash()`, login `bcrypt.compare()` ✅
- [x] **NextAuth JWT** — Admin (`admin-login`) + Customer (`credentials`) providers ✅
- [x] **Auth Middleware** — Bảo vệ `/admin/*` + `/orders`, `/profile`, `/checkout` ✅
- [x] **Forgot Password / Reset Password** — Resend email + resetToken DB ✅
- [x] **Admin whitelist email** — `ADMIN_EMAIL` env var ✅
- [x] **Zod Validation** — Auth, products, categories, orders, reviews APIs ✅

### 🛍️ SHOP — CORE FEATURES
- [x] Product CRUD + variants + image upload (Supabase Storage) ✅
- [x] Category hierarchy (parent/child) ✅
- [x] Homepage với featured products, reviews, blog preview ✅
- [x] Product listing + filters (category, price range) ✅
- [x] Product detail với Care Guide tab + Vote (♥) + Related products ✅
- [x] Cart (Zustand persist), Checkout form, Order creation ✅
- [x] Voucher validation + apply discount ✅
- [x] COD payment ✅
- [x] **PayOS integration** (BANK_TRANSFER) — redirect tới PayOS, webhook tự cập nhật PAID ✅
- [x] `/checkout/pending` — trang QR chờ + đồng hồ 30 phút + fallback VietQR ✅
- [x] Tự hủy đơn sau 30 phút chưa thanh toán ✅

### 👤 CUSTOMER FEATURES
- [x] User Profile page (`/profile`) — xem/sửa thông tin ✅
- [x] Loyalty Tier Badge (Bronze/Silver/Gold/Platinum) ✅
- [x] Points History (`/profile/points`) ✅
- [x] Order history (`/orders`) — auto-refresh 30s ✅

### 🛠️ ADMIN PANEL
- [x] Dashboard stats (doanh thu, đơn, sản phẩm, khách) ✅
- [x] Products CRUD (tạo/sửa/xóa + variants + care guide + images) ✅
- [x] Categories CRUD ✅
- [x] Orders management + status update + auto-refresh ✅
- [x] Reviews approval ✅
- [x] Vouchers CRUD ✅
- [x] Blog CRUD + Rich Text Editor (react-quill) ✅
- [x] Blog Category CRUD ✅
- [x] Settings page ✅
- [x] AuditLog tích hợp toàn bộ API ✅
- [x] Admin link trong Header dropdown (chỉ hiện với ADMIN role) ✅
- [x] Nút Logout trong sidebar ✅

### 🌟 EXPLORE & CONTENT
- [x] Explore page (WeeklyFeatured + New Arrivals) ✅
- [x] Vote sản phẩm (♥) trên Product Detail ✅
- [x] Blog listing + Blog detail (`/blog/[slug]`) + generateMetadata ✅
- [x] Contact, Consult, Policies pages ✅
- [x] sitemap.xml + robots.txt ✅

### ⚡ PERFORMANCE & SEO
- [x] TanStack Query cache (useQuery cho 13+ files) ✅
- [x] Next.js Image (`<Image>`) cho tất cả files ✅
- [x] `force-dynamic` cho /explore + admin API routes ✅
- [x] generateMetadata() cho products/[slug] + blog/[slug] ✅

---

## 🟡 CHƯA HOÀN THIỆN — NICE TO HAVE

### 🌟 EXPLORE — Thiếu Admin Pin
- [ ] **Admin Pin/Unpin WeeklyFeatured** — UI trong admin để ghim sản phẩm lên trang Explore
  - API đã có: cần tạo `/admin/explore` page với form chọn sản phẩm + tuần
  - Hiện tại WeeklyFeatured chỉ có thể thêm qua Prisma Studio

### 🌿 CARE ITEMS — Sau mua hàng
- [ ] **Customer Care Items** — Sau khi đặt hàng thành công, tự động thêm vào danh sách chăm sóc của customer
  - Schema `CustomerCareItem` đã có trong Prisma
  - Cần trigger trong order creation API

### 🔍 ADMIN — Tìm kiếm & Phân trang
- [ ] **Phân trang (Pagination)** — Orders, Products, Customers list khi data lớn
  - Hiện tại load all → OK cho MVP, cần fix khi có 100+ records
- [ ] **Tìm kiếm nâng cao** — Search orders theo SĐT, email khách hàng

### 🖼️ SEO — Open Graph & Schema
- [ ] **Open Graph image** — og:image cho homepage, products (cần default OG image)
- [ ] **Schema.org JSON-LD** — Product, Organization, BreadcrumbList markup
- [ ] **Canonical URLs** — Tránh duplicate với `/products?page=1`

### ⚡ PERFORMANCE — Optional
- [ ] **Lazy load components nặng** — `dynamic(() => import(...))` cho ChatWidget, rich text editor
- [ ] **ISR cho `/products`** — `revalidate: 60` thay `force-dynamic`
- [ ] **Redis Cache (Upstash)** — Cache DB query cho homepage, products list

---

## 🔵 DEPLOY — CẦN LÀM NGAY

| # | Việc cần làm | Ưu tiên | Ghi chú |
|---|---|---|---|
| 1 | **Test `npm run build`** | 🔴 Critical | Đang chạy — phải 0 errors |
| 2 | **Deploy lên Vercel** | 🔴 Critical | `vercel deploy` từ root |
| 3 | **Cấu hình env vars trên Vercel** | 🔴 Critical | Copy từ `.env.local` |
| 4 | **Setup custom domain** | 🟡 Medium | tiemreudecor.vn |
| 5 | **Vercel Analytics** | 🟢 Low | Theo dõi traffic |
| 6 | **Core Web Vitals check** | 🟢 Low | Sau deploy |

---

## ⚡ Quick Commands

```bash
# Dev (từ D:\Projects\terrarium-shop)
cd apps/web && npm run dev          # Port 3000
npx prisma studio                   # Port 5555

# Build & Deploy
npm run build                       # Từ root (turbo)
vercel deploy                       # Deploy to Vercel

# DB
npx prisma generate                 # Sau khi đổi schema
npx prisma db push                  # Sync schema → DB
```

---

## 🔑 Environment Variables (.env.local)

```env
DATABASE_URL="postgresql://...?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_BUCKET_NAME="product-images"

# NextAuth
NEXTAUTH_SECRET="[32+ chars random string]"
NEXTAUTH_URL="https://yourdomain.com"  # Đổi khi deploy!

# Admin
ADMIN_EMAIL="hongthanh181221@gmail.com"

# Email
RESEND_API_KEY="re_..."

# Payment
BANK_NAME="TPBank"
BANK_ACCOUNT_NUMBER="07898110079"
BANK_ACCOUNT_NAME="NGUYỄN THANH HỒNG"
BANK_BRANCH="CN Thủ Đức"

# PayOS (nếu dùng)
PAYOS_CLIENT_ID="..."
PAYOS_API_KEY="..."
PAYOS_CHECKSUM_KEY="..."

# Site
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```