# TECH STACK - TERRARIUM SHOP

## 1. TỔNG QUAN KIẾN TRÚC

- **Kiến trúc:** Monorepo (Next.js Full-stack với Supabase Backend-as-a-Service)
- **Phương thức:** Server-Side Rendering (SSR) & Static Generation (SSG) cho SEO
- **Triển khai:** Vercel (Frontend + API) + Supabase (DB + Auth + Storage)
- **Ngôn ngữ:** TypeScript (End-to-End Type Safety)

---

## 2. FRONTEND (FE) - Next.js 14+

| Công nghệ             | Phiên bản                               | Vai trò           | Lý do lựa chọn                                                                                                                                                      |
| :---------------------- | :---------------------------------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**     | **Next.js 14+**                     | Core Framework     | - SSR/SSG hỗ trợ SEO tối đa.`<br>`- App Router tổ chức code tốt.`<br>`- API Routes tích hợp sẵn (không cần BE riêng cho MVP).                         |
| **Language**      | **TypeScript**                      | Ngôn ngữ         | - Type safety end-to-end với Prisma.`<br>`- Giảm lỗi runtime.`<br>`- Dễ bảo trì khi scale.                                                               |
| **Styling**       | **Tailwind CSS**                    | CSS Framework      | - Customizable 100%, không bị "generic look".`<br>`- Tốc độ load nhanh (purge CSS unused).`<br>`- Dễ dàng tạo Design System.                               |
| **UI Components** | **shadcn/ui**                       | Component Library  | - Không phải npm package (copy code vào project).`<br>`- Dễ dàng customize để không giống AI/Template.`<br>`- Tích hợp Radix UI (Accessibility chuẩn). |
| **State Mgmt**    | **Zustand**                         | Client State       | - Nhẹ hơn Redux, không cần Boilerplate.`<br>`- Đủ năng cho Cart, Checkout, UI States.`<br>`- Hỗ trợ TypeScript tốt.                                      |
| **Form Handling** | **React Hook Form** + **Zod** | Forms & Validation | - Hiệu năng cao (không re-render thừa).`<br>`- Zod cho schema validation (client & server share).`<br>`- DX (Developer Experience) tuyệt vời.                |
| **Data Fetching** | **TanStack Query**                  | Data Sync          | - Cache, Background Revalidation.`<br>`- Xử lý loading, error states tự động.`<br>`- Optimize cho API calls.                                                  |
| **Icons**         | **Lucide React**                    | Icons              | - Icons hiện đại, tối giản, phong cách organic.`<br>`- Tree-shaking (chỉ bundle icon dùng).                                                                  |
| **Animations**    | **Framer Motion**                   | Animations         | - Tạo hiệu ứng mượt mà (organic feel).`<br>`- Hover effects, page transitions.                                                                                 |

---

## 3. BACKEND & DATABASE (BE & DB)

| Công nghệ              | Vai trò                        | Lý do lựa chọn                                                                                                                              |
| :----------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**       | **PostgreSQL** (Supabase) | - Relational DB mạnh mẽ.`<br>`- Hỗ trợ JSONB cho dữ liệu linh hoạt (variants, careSchedule).`<br>`- Free tier generous, dễ scale.  |
| **ORM**            | **Prisma**                | - Type-safe queries (auto generate types từ schema).`<br>`- Migrations dễ quản lý.`<br>`- Prisma Studio để xem dữ liệu trực quan. |
| **Authentication** | **NextAuth.js** (v5)      | - Tích hợp sâu với Next.js.`<br>`- Hỗ trợ Credentials + OAuth (Google).`<br>`- Session management tự động.                        |
| **Email Service**  | **Resend**                | - Giao diện đơn giản.`<br>`- Free tier tốt (3,000 email/tháng).`<br>`- Gửi transactional email (OTP, Order confirmation).           |
| **File Storage**   | **Supabase Storage**      | - Lưu ảnh sản phẩm, blog, care guides.`<br>`- RLS (Row Level Security) bảo mật ảnh.`<br>`- Chi phí thấp hơn S3.                  |

---

## 4. THIRD-PARTY SERVICES (VN & INTL)

| Dịch vụ                        | Mục đích | Lưu ý                                                                                           |
| :------------------------------- | :---------- | :------------------------------------------------------------------------------------------------ |
| **GHN (Giao Hàng Nhanh)** | Shipping    | - Lấy phí ship, tạo vận đơn, webhook tracking.`<br>`- API cần xử lý tốt async events. |
| **Momo**                   | Payment     | - Thanh toán ví điện tử phổ biến.`<br>`- Webhook cần verify signature bảo mật.        |
| **VNPAY**                  | Payment     | (Optional) Backup cho Momo.                                                                       |
| **Cloudflare R2**          | Image CDN   | (Optional) Nếu traffic lớn, chuyển ảnh từ Supabase sang R2 để tăng tốc.                  |
| **Vercel Analytics**       | Analytics   | - Privacy-friendly, không cần cookie banner.`<br>`- Theo dõi Core Web Vitals.                |

---

## 5. AI & FUTURE FEATURES (Phase 2)

| Công nghệ         | Mục đích | Trạng thái                                                                                                                                      |
| :------------------ | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ollama**    | AI Chatbot  | - Chạy Local hoặc Cloud model (Llama 3, Mistral).`<br>`- Tư vấn cây, chăm sóc.`<br>`- **Không dùng cho MVP**, triển khai sau. |
| **Vector DB** | RAG Search  | - (Optional) Nếu cần search ngữ cảnh sâu trong chăm sóc cây.`<br>`- Có thể dùng Supabase pgvector.                                   |

---

## 6. DEVOPS & INFRASTRUCTURE

| Công cụ            | Vai trò            | Chi phí                                                                                                   |
| :------------------- | :------------------ | :--------------------------------------------------------------------------------------------------------- |
| **Vercel**     | Hosting FE + API    | - Free tier cho cá nhân/startup.`<br>`- Auto CI/CD từ GitHub.`<br>`- Edge Network toàn cầu.       |
| **Supabase**   | DB + Auth + Storage | - Free tier đủ cho MVP (500MB DB, 1GB Storage).`<br>`- Managed service (không lo server maintenance). |
| **GitHub**     | Version Control     | - Code repo, Actions (CI/CD).                                                                              |
| **Playwright** | E2E Testing         | - (Optional) Test luồng checkout, login.                                                                  |
| **Vitest**     | Unit Testing        | - (Optional) Test logic pricing, voucher.                                                                  |

---

## 7. MÔI TRỀ PHÁT TRIỂN (LOCAL DEV)

| Công cụ                     | Mục đích                                           |
| :---------------------------- | :---------------------------------------------------- |
| **Docker**              | Chạy local Supabase (nếu cần offline hoàn toàn). |
| **Ngrok**               | Test Webhook (GHN, Momo) trên local máy dev.        |
| **Turso/Devcontainers** | (Optional) Dev environment chuẩn hóa.               |

---

## 8. TẠI SAO KHÔNG CHỌN...?

| Công nghệ                       | Lý do loại                                                                                                                                          |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NestJS / Express riêng** | - Overkill cho MVP 1-2 người.`<br>`- Tăng độ phức tạp deploy 2 services.`<br>`- Next.js API Routes đủ mạnh cho traffic < 10k req/ngày. |
| **MySQL**                   | - PostgreSQL mạnh hơn về JSONB (quan trọng cho variants/careSchedule).`<br>`- Supabase tối ưu cho PG, không có MySQL.                       |
| **MongoDB**                 | - Không cần cho E-commerce có cấu trúc rõ ràng (orders, inventory cần transaction ACID).                                                      |
| **Material-UI / AntD**      | - Nhìn quá "corporate", khó tùy biến để tránh "AI Look".                                                                                      |
| **WordPress / Shopify**     | - Không thể tùy biến sâu tính năng Voucher, Care Reminder, Custom Builder.`<br>`- Chi phí cao về sau.                                      |

---

## 9. CHI PHÍ DỰ KIẾN (MVP)

| Dịch vụ          | Chi phí/tháng          | Ghi chú                          |
| :----------------- | :----------------------- | :-------------------------------- |
| **Vercel**   | $0                       | Free tier (Hobby).                |
| **Supabase** | $0                       | Free tier (Up to 500MB).          |
| **Resend**   | $0                       | Free tier (3k emails).            |
| **Domain**   | ~$15/năm                | Tên miền .com/.vn.              |
| **Tổng**    | **~$0 - $20/năm** | Chỉ tốn tiền Domain ban đầu. |

---

## 10. ROADSCALE (KHI SCALE)

| Khi nào                      | Hành động                                                                        |
| :---------------------------- | :---------------------------------------------------------------------------------- |
| **Traffic > 10k/ngày** | - Chuyển lên Vercel Pro ($20/tháng).`<br>`- Upgrade Supabase Pro ($25/tháng). |
| **Search phức tạp**   | - Tích hợp Algolia hoặc Meilisearch.                                             |
| **BE tách rời**       | - Di chuyển logic nặng sang NestJS riêng.                                        |
| **Redis**               | - Add Upstash Redis cho caching sessions/cart.                                      |
| **Worker**              | - Dùng Vercel Cron hoặc GitHub Actions cho Care Reminders.                        |