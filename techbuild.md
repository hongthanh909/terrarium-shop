# 🛠️ Tài Liệu Kiến Trúc & Công Nghệ Dự Án (Tech Stack & Architecture)

Tài liệu này tổng hợp toàn bộ công nghệ (Tech Stack), kiến trúc hệ thống và cách thức vận hành của dự án **Terrarium Shop (tiemreudecor.com)** để bàn giao hoặc giải thích cho các lập trình viên khác.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Dự án được xây dựng theo mô hình **Monorepo** quản lý bởi **Turborepo**, chia làm các phần chính:
*   `apps/web`: Ứng dụng Next.js (bao gồm cả Frontend và Backend API).
*   `packages/database`: Quản lý Prisma schema, các cấu hình kết nối database chung.

```
[Khách hàng / Internet]
         │
         ▼ Cổng :80 / :443 (HTTPS)
   [Nginx Reverse Proxy]
         │ Chuyển hướng nội bộ tới :3000
         ▼
[Next.js (PM2 Cluster - 1 Instance)]
    ├── Frontend (React, TailwindCSS, Framer Motion)
    └── Backend API (Next.js Route Handlers)
         │              │               │
      (Port 5432)   (Port 9000)   (Port 11434)
         ▼              ▼               ▼
   [PostgreSQL]     [MinIO]        [Ollama AI]
   (Database)     (Lưu trữ ảnh)    (AI Offline)
```

---

## 2. Frontend (FE)

*   **Framework chính:** **Next.js 14+ (App Router)** chạy trên nền React, hỗ trợ Server Components (RSC) để tối ưu SEO và Client Components cho tương tác mượt mà.
*   **Ngôn ngữ:** **TypeScript** (đảm bảo an toàn kiểu dữ liệu).
*   **Styling (Giao diện):** **TailwindCSS** kết hợp với **Framer Motion** để tạo các hiệu ứng chuyển động (animations) cao cấp và mượt mà.
*   **Icons:** **Lucide React**.
*   **Quản lý State & Fetching:**
    *   **TanStack Query (React Query):** Dùng để fetch dữ liệu từ API, tự động cache, tự động refetch đơn hàng/sản phẩm ở trang admin và client.
    *   **Zustand:** Quản lý state gọn nhẹ cho Giỏ hàng (`cartStore`).
*   **Authentication (Đăng nhập):** **NextAuth.js (Auth.js)** quản lý session của khách hàng và phân quyền Admin.

---

## 3. Backend (BE)

*   **Công nghệ:** **Next.js Route Handlers** (nằm tại `apps/web/app/api/...`).
*   **Đặc điểm:** Toàn bộ API viết dưới dạng các hàm async (`GET`, `POST`, `PATCH`, `DELETE`) xử lý request/response trực tiếp bằng Node.js.
*   **Xử lý thanh toán tự động (Payment Webhook):**
    *   Tích hợp **SePay Webhook** để tự động kiểm tra biến động số dư tài khoản ngân hàng (TPBank) và xác nhận trạng thái đơn hàng sang `PAID` ngay lập tức khi khách chuyển khoản khớp nội dung.
    *   Hỗ trợ cổng thanh toán **PayOS**.
*   **Bảo mật phân quyền:** Kiểm tra session bằng NextAuth trực tiếp trong các file API (ví dụ: các API trong `/api/admin/*` bắt buộc phải có quyền Admin).

---

## 4. Database & ORM (Cơ sở dữ liệu)

*   **Hệ quản trị CSDL:** **PostgreSQL** (chạy trực tiếp trên VPS ở port `5432`).
*   **ORM (Object-Relational Mapping):** **Prisma ORM**.
    *   Schema được định nghĩa tập trung tại [schema.prisma](file:///d:/Projects/terrarium-shop/packages/database/prisma/schema.prisma).
    *   Mỗi khi thay đổi cấu trúc bảng, dùng `npx prisma db push` hoặc `npx prisma migrate dev` để đồng bộ.
*   **Cơ chế lưu trữ:** Lưu trữ trực tiếp trên ổ cứng của VPS. Có hệ thống script tự động **backup dữ liệu lúc 2:00 AM hàng ngày** thành file nén để đảm bảo an toàn.

---

## 5. Dịch Vụ Đi Kèm (Integrations & Services)

### 🔹 Lưu trữ hình ảnh (Object Storage)
*   **Công nghệ:** **MinIO** (Hệ thống lưu trữ tương thích S3, tự host ngay trên VPS của bạn ở port `9000`).
*   **Subdomain:** `storage.tiemreudecor.com`
*   **Mục đích:** Lưu trữ toàn bộ ảnh sản phẩm, ảnh bài viết blog mà không cần tốn tiền mua dịch vụ ngoài (AWS S3 hoặc Cloudinary).
*   *(Lưu ý: Hệ thống cũ dùng Supabase Storage hiện đã được chuyển đổi sang MinIO).*

### 🔹 Trí tuệ nhân tạo (AI Integration)
*   **AI Offline (Ollama):** Chạy trực tiếp trên VPS (mô hình `llama3.2:3b` ~2GB RAM) để xử lý các tác vụ AI nội bộ không tốn phí.
*   **AI Online (Gemini API):** Sử dụng model `gemini-2.0-flash` làm AI chính cho các tính năng chat hỗ trợ khách hàng và gợi ý chăm sóc cây.

### 🔹 Gửi Email (Email Service)
*   Tích hợp **Resend API** để gửi email tự động (xác nhận đơn hàng, reset mật khẩu).

---

## 6. Hạ Tầng & Triển Khai (Infrastructure & Deployment)

Dự án được deploy self-hosted hoàn toàn trên một **VPS riêng (Virtual Private Server)**:

*   **Thông tin VPS:**
    *   **Nhà cung cấp:** Vietnix.
    *   **Hệ điều hành:** Ubuntu 22.04 LTS.
    *   **IP:** `14.225.210.118`
*   **Web Server / Proxy:** **Nginx**
    *   Nhận request cổng `80` (HTTP) và `443` (HTTPS).
    *   Cấu hình SSL bảo mật miễn phí bằng **Certbot (Let's Encrypt)**.
    *   Chuyển tiếp request (Reverse Proxy) vào ứng dụng Next.js đang chạy ở cổng `3000`.
*   **Quản lý tiến trình (Process Manager):** **PM2**
    *   Chạy ứng dụng Next.js dưới dạng chạy ngầm (background process).
    *   Cấu hình Cluster Mode để tự động khởi động lại nếu app bị crash và tối ưu hóa tài nguyên CPU của VPS.
*   **Quy trình CI/CD (Tự động hóa deploy):**
    *   Sử dụng **GitHub Actions** (cấu hình tại [.github/workflows/deploy.yml](file:///d:/Projects/terrarium-shop/.github/workflows/deploy.yml)).
    *   Mỗi khi bạn `git push` code mới lên nhánh `main`, GitHub Actions sẽ tự động SSH vào VPS, kéo code mới, cài đặt thư viện, chạy build Next.js, chạy migrate database và reload ứng dụng bằng PM2 (không gây gián đoạn truy cập - zero downtime).

---

## 7. Các Lệnh Thường Dùng Cho Developer

### Chạy dưới máy cá nhân (Local)
```bash
# Khởi động dự án ở môi trường phát triển
npm run dev

# Đồng bộ schema database local
npm run db:push

# Mở giao diện xem database trực quan (Prisma Studio)
npm run db:studio
```

### Quản trị trên VPS (SSH)
```bash
# Xem trạng thái ứng dụng đang chạy trên VPS
pm2 status

# Xem log lỗi thời gian thực của web
pm2 logs terrarium-shop

# Khởi động lại ứng dụng không gây downtime
pm2 reload ecosystem.config.js --env production
```
