# FINAL CHECKLIST - TERRARIUM SHOP
> Cập nhật: 2026-05-23 | Trạng thái: Đang phát triển

---

## 🔴 CẦN FIX NGAY — BẢO MẬT & QUAN TRỌNG

### 🔒 AUTH & SECURITY (Ưu tiên cao nhất)

- [ ] **Hash password với bcrypt** — Hiện đang lưu plain-text trong `passwordHash` (CỰC KỲ NGUY HIỂM)
  - File: `apps/web/app/api/auth/register/route.ts` — `passwordHash: password`
  - File: `apps/web/app/api/auth/login/route.ts` — `customer.passwordHash !== password`
  - Fix: `npm install bcryptjs @types/bcryptjs` → dùng `bcrypt.hash()` / `bcrypt.compare()`

- [ ] **JWT Cookie-based Auth** — Hiện dùng localStorage (không an toàn, XSS-prone)
  - Thay bằng HTTP-only cookie với JWT signed
  - Fix: `npm install jsonwebtoken @types/jsonwebtoken`
  - Tạo: `apps/web/lib/auth.ts` — helper `signToken()` + `verifyToken()`
  - API login/register → `response.cookies.set('token', jwt, { httpOnly: true, secure: true })`

- [ ] **Auth Middleware** — Chặn truy cập `/admin/*` nếu không phải ADMIN
  - Tạo: `apps/web/middleware.ts` — check cookie token, kiểm tra role
  - Redirect về `/login` nếu chưa login / `/` nếu không phải ADMIN

- [ ] **Zod Validation cho tất cả API** — Hiện chưa validate input
  - Áp dụng: tất cả route.ts dùng `zod.parse()` trước khi xử lý
  - Ưu tiên: auth, products, orders, reviews

### 🗑️ SUPABASE STORAGE
- [ ] **Xóa ảnh thực sự khi xóa sản phẩm** — Hiện chỉ xóa record DB, ảnh vẫn còn trong bucket
  - File: `apps/web/app/api/products/[id]/route.ts`
  - Fix: Gọi `supabase.storage.from('product-images').remove([...filePaths])` trước khi xóa DB

---

## 🟡 CHƯA HOÀN THIỆN — LOGIC & TÍNH NĂNG

### 👤 QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG

- [ ] **User Profile Page** — Trang `/profile` để xem & cập nhật thông tin
  - Tên, email, SĐT, đổi mật khẩu
  - Địa chỉ giao hàng (list + thêm/sửa/xóa)
  - Lịch sử đơn hàng (lấy từ userId thực sau khi auth)

- [ ] **Loyalty Tier Badge** — Hiển thị huy hiệu Bronze/Silver/Gold/Platinum
  - Trong Header + Profile page
  - Tự động upgrade khi đủ điểm

- [ ] **Points History Page** — Xem lịch sử tích điểm tại `/profile/points`

### 🌟 EXPLORE PAGE

- [ ] **New Arrivals Section** — Sản phẩm mới nhất (sort by createdAt DESC)
- [ ] **Top Voted Products** — Weekly/Monthly ranking dùng `ProductVote`
- [ ] **Vote Product** — Nút vote cho khách hàng đã đăng nhập
- [ ] **Admin Pin/Unpin** — Ghim sản phẩm nổi bật vào `WeeklyFeatured`

### 🌿 CARE GUIDES

- [ ] **Admin: Tạo/sửa Care Guide** — Form trong admin/products/[id]/edit
- [ ] **Hiển thị Care Guide trên Product Detail** — Tab "Hướng dẫn chăm sóc"
- [ ] **Customer Care Items** — Sau khi mua, tự động thêm vào danh sách chăm sóc

### 📅 CARE REMINDERS

- [ ] **care-schedule-engine.ts** — Logic tính lịch tưới nước / cắt tỉa
- [ ] **Vercel Cron Job** — Chạy hàng ngày, tìm cây cần chăm sóc
- [ ] **Email Reminders (Resend)** — Gửi email nhắc nhở chăm sóc cây

### 📝 BLOG

- [ ] **Admin: Tạo bài viết** — Form tại `/admin/blog/create` *(folder đã có)*
- [ ] **Admin: Sửa/xóa bài viết** — `/admin/blog/[id]/edit`
- [ ] **Blog Detail Page** — `/blog/[slug]` *(slug dir đã có, cần fill content)*
- [ ] **SEO cho Blog** — generateMetadata() với title, description, og:image
- [ ] **Markdown/Rich Text Editor** — Dùng `react-quill` hoặc `@uiw/react-md-editor`

---

## 🟢 SEO & PERFORMANCE

### SEO Optimization

- [ ] **generateMetadata() cho tất cả pages** — products, blog, categories
- [ ] **Open Graph tags** — og:image, og:title, og:description đầy đủ
- [ ] **Schema.org markup** — Product (JSON-LD), Organization, BreadcrumbList
- [ ] **Dynamic sitemap.xml** — `apps/web/app/sitemap.ts`
- [ ] **robots.txt** — `apps/web/app/robots.ts`
- [ ] **Canonical URLs** — Tránh duplicate content

### Performance

- [ ] **Next.js Image component** — Thay tất cả `<img>` bằng `<Image>` từ next/image
- [ ] **Lazy loading** — Defer below-the-fold images + components
- [ ] **TanStack Query caching** — Dùng `useQuery` thay `useEffect + fetch` trong các trang
- [ ] **Core Web Vitals** — Đo bằng Vercel Analytics sau deploy

---

## 🔵 DEPLOY & PRODUCTION

- [ ] **Deploy lên Vercel** — `vercel deploy`
- [ ] **Setup custom domain** — tiemreudecor.vn (hoặc tương tự)
- [ ] **Configure env vars trên Vercel** — Copy từ `.env`
- [ ] **Setup Vercel Analytics** — Theo dõi traffic và performance
- [ ] **Test production build** — `npm run build` → kiểm tra lỗi

---

## 🚀 POST-LAUNCH (Tùy chọn)

### AI Chatbot

- [ ] Setup Ollama hoặc OpenAI API
- [ ] Tạo system prompt cho terrarium bot
- [ ] Widget chat UI (`ChatWidget.tsx` đã có skeleton)
- [ ] Tích hợp gợi ý sản phẩm

### Advanced Features

- [ ] Advanced search (Algolia hoặc Supabase full-text search)
- [ ] Redis caching (Upstash)
- [ ] Push notifications (Web Push API)
- [ ] Mobile app (React Native / Expo)
- [ ] Multi-language (i18n — vi/en)

---

## ✅ ĐÃ HOÀN THÀNH

### Phase 0 — Setup

- [x] Tạo Supabase project + lấy keys
- [x] Tạo `.env` file với biến môi trường
- [x] Clone/create repo GitHub
- [x] Install dependencies
- [x] Setup Prisma schema (25 models)
- [x] Run migrations (2 migrations tồn tại)
- [x] Generate Prisma Client
- [x] Initialize Next.js 14 App Router (`apps/web/`)
- [x] Install shadcn/ui + core components
- [x] Configure Tailwind với custom colors (forest theme)
- [x] Setup fonts: Inter (layout.tsx)

### Phase 1 — Core Features

- [x] Product API (`/api/products`) — POST với variants, careGuide
- [x] Product listing (Admin) — `admin/products/page.tsx`
- [x] Product create/edit (Admin) — `admin/products/create` & `[id]/edit`
- [x] Product variant management — SIZE, TYPE, DECOR, ACCESSORY
- [x] Product image upload (Supabase Storage)
- [x] Category listing + create/edit (Admin)
- [x] Category hierarchy (parent/child)
- [x] Homepage với featured products — `app/page.tsx` (20.5KB)
- [x] Product listing page (Shop) — `app/products/page.tsx`
- [x] Product detail page — `app/products/[slug]/page.tsx`
- [x] Product filters (category, size, price)
- [x] Cart state management (Zustand) — `lib/store/cartStore.ts`
- [x] Cart drawer trên product detail page
- [x] Checkout form (shipping, payment) — `app/checkout/page.tsx`
- [x] Voucher input & validation trong checkout
- [x] Order creation API — `api/orders/route.ts`

### Phase 2 — Payment (Simplified)

- [x] COD (Cash on Delivery) — Option trong checkout
- [x] Bank Transfer — Option với thông tin ngân hàng
- [x] Payment instructions tại checkout confirmation
- [x] Order listing (Admin) — `admin/orders/page.tsx`
- [x] Order detail (Admin) — `admin/orders/[id]/page.tsx`
- [x] Update order status — Manual admin dropdown
- [x] Order history (Customer) — `app/orders/page.tsx`

### Phase 3 — Voucher System

- [x] Voucher CRUD API
- [x] Admin: Tạo / list / sửa / toggle status campaign
- [x] `voucher-engine.ts` — Logic validate
- [x] Validate code, expiry, usage limit
- [x] Calculate discount (Percentage / Fixed)
- [x] Apply discount to order
- [x] Voucher input component trong checkout
- [x] Voucher list page (customer) — `/vouchers`
- [x] Error messages cho invalid vouchers

### Phase 4 — Reviews (Một phần)

- [x] Submit review (customer) — Trong product detail
- [x] Review approval (admin) — `admin/reviews/page.tsx`
- [x] Review list trên product detail
- [x] Star rating display (5 sao)
- [x] Verified badge cho verified purchases

### Content & System

- [x] Blog listing page — `app/blog/page.tsx` (có UI + API fetch)
- [x] Blog API — `api/blog/route.ts`
- [x] Admin Blog: listing + create/edit UI (`admin/blog/`)
- [x] Explore page — `app/explore/page.tsx` (10.7KB)
- [x] Explore API — `api/explore/route.ts` + `/weekly`
- [x] Contact page — `app/contact/`
- [x] Consult page — `app/consult/`
- [x] Policies page — `app/policies/`
- [x] Login UI + API — `app/login/` + `api/auth/login`
- [x] Register API — `api/auth/register`
- [x] Admin Dashboard stats API — `api/admin/stats`
- [x] Header + Footer components
- [x] ChatWidget component (skeleton)
- [x] Admin layout sidebar navigation

---

## 📋 THỨ TỰ FIX ĐỀ XUẤT

| # | Việc cần làm | Độ ưu tiên | Ước tính |
|---|---|---|---|
| 1 | Hash password bcrypt | 🔴 Critical | 30 phút |
| 2 | JWT HTTP-only cookie auth | 🔴 Critical | 2 giờ |
| 3 | Auth middleware bảo vệ /admin/* | 🔴 Critical | 1 giờ |
| 4 | Zod validation cho API auth | 🟠 High | 1 giờ |
| 5 | Blog detail page `/blog/[slug]` | 🟡 Medium | 1 giờ |
| 6 | Care Guide hiển thị trên product | 🟡 Medium | 1 giờ |
| 7 | User Profile page | 🟡 Medium | 3 giờ |
| 8 | SEO: generateMetadata() | 🟡 Medium | 2 giờ |
| 9 | Explore: Vote + Weekly Featured | 🟡 Medium | 2 giờ |
| 10 | Sitemap.xml + robots.txt | 🟢 Low | 30 phút |
| 11 | Next.js Image optimization | 🟢 Low | 2 giờ |
| 12 | Deploy Vercel | 🔵 Deploy | 1 giờ |

---

## ⚡ Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server (port 3000)
npx prisma studio        # Open Prisma Studio (port 5555)
npx prisma migrate dev   # Create & run migration
npx prisma generate      # Generate Prisma Client

# Database
npx prisma migrate dev --name <name>   # Create migration
npx prisma migrate deploy              # Deploy migration (prod)
npx prisma db seed                     # Seed database

# Build & Deploy
npm run build            # Build for production
npm run start            # Start production server
vercel deploy            # Deploy to Vercel
```

---

## 🔑 Environment Variables

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-[region].pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_BUCKET_NAME="product-images"

# Auth (cần thêm)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Payment
BANK_NAME="Vietcombank"
BANK_ACCOUNT_NUMBER="XXXXXXXXXX"
BANK_ACCOUNT_NAME="TÊN CHỦ TÀI KHOẢN"
BANK_BRANCH="CN Hà Nội"

# Email (Phase 5)
RESEND_API_KEY=""

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Resend Docs](https://resend.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Studio](http://localhost:5555)
- [Supabase Dashboard](https://app.supabase.com)