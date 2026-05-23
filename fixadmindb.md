# Báo cáo Lỗi và Nâng cấp Admin Dashboard

> **Ngày**: 2026-05-23  
> **Dự án**: Terrarium Shop - Admin Dashboard

---

## ❌ Lỗi Cần Fix Ngay (Critical/Bug)

### 1. API & Logic
- **Categories DELETE**:
  - **Hiện tại**: `/api/categories?id=${id}` (Sử dụng query param).
  - **Cần sửa**: Chuyển sang `/api/categories/${id}` với DELETE để đồng bộ với pattern `/api/products/[id]`.
  - **File**: `apps/web/app/api/categories/route.ts` - Line 63-77.
- **Edit Product Fetch**:
  - **Hiện tại**: Gọi `/api/products?slug=${productId}` trong `EditProductPage`.
  - **Vấn đề**: Trang edit nhận `id` từ URL params, nhưng API search theo `slug` nên không tìm được sản phẩm.
  - **Cần sửa**: Thêm route GET `/api/products/${id}` hoặc chuyển sang dùng slug thống nhất.
  - **File**: `apps/web/app/admin/products/[id]/edit/page.tsx` - Line 111.
- **Blog Admin API**:
  - **Hiện tại**: Frontend gọi `/api/admin/blog/posts` và `/api/admin/blog/categories`, nhưng backend chỉ có `/api/blog`.
  - **Vấn đề**: Thiếu các route xử lý riêng cho admin (quản lý bài viết, duyệt bài).
  - **Cần thêm**: `/api/admin/blog/posts` (GET, POST, PUT, DELETE) và `/api/admin/blog/categories` với auth middleware.
- **Reviews Admin**:
  - **Hiện tại**: API `/api/reviews` mặc định lọc `approved: true` (cho public).
  - **Vấn đề**: Admin cần xem tất cả reviews (PENDING, APPROVED, REJECTED) để quản lý.
  - **Cần thêm**: Route `/api/admin/reviews` hoặc query param `?status=all` để admin xem toàn bộ.
- **Product Listing (Backend)**:
  - **Vấn đề**: GET `/api/products` chỉ trả về sản phẩm `ACTIVE`. Admin cần xem tất cả trạng thái (DRAFT, ARCHIVED).
  - **Cần sửa**: Thêm query param `?status=all` hoặc tạo endpoint admin riêng `/api/admin/products`.

### 2. Upload & Media
- **Image Upload Validation**:
  - **Hiện tại**: Backend check file type và size (5MB) ở `upload/route.ts`.
  - **Cần nâng cấp**: Thêm validate ở frontend trước khi upload, và hiển thị progress bar.
- **Image Preview Optimization**:
  - Sử dụng Next.js Image component thay vì img tag thông thường để tối ưu loading.
  - **File**: Các trang admin products (create, edit) dùng `<img>` thay vì `<Image />`.

### 3. Notifications & Feedback
- **UI Alerts**:
  - Hiện tại dùng `alert()` cơ bản, gây gián đoạn UX.
  - **Cần sửa**: Thay bằng toast notifications (sonner hoặc react-hot-toast).
  - **Affected files**: Tất cả trang admin có dùng `alert()`.

---

## 🔒 Bảo mật (Security)

### 1. Admin Authorization Middleware
- **Vấn đề**: Các API route tác động dữ liệu (POST/PUT/DELETE) không kiểm tra quyền admin.
- **Cần thêm**: Middleware kiểm tra session + role (admin) trước khi cho phép hành động.
- **Routes cần bảo vệ**:
  - `/api/products` (POST)
  - `/api/products/[id]` (PUT, DELETE)
  - `/api/categories` (POST, PUT, DELETE)
  - `/api/discount-campaigns` (POST, PUT, DELETE)
  - `/api/admin/*` nếu có
- **Triển khai**: Tạo middleware `middleware.ts` hoặc `lib/auth.ts` để check `session.user.role === 'ADMIN'`.

### 2. Rate Limiting
- **Khuyến nghị**: Thêm rate limiting cho upload và API để chống abuse.
- **Công cụ**: `@upstash/ratelimit` hoặc Redis-based.

### 3. Input Sanitization
- **Vấn đề**: Body request được parse trực tiếp mà không sanitize.
- **Cần thêm**: Dùng `zod` để validate schema và sanitize input.

---

## 🚀 Nâng cấp Chức năng (Feature Enhancements)

### 1. Pagination & Performance
- **Đơn hàng**: API `/api/admin/orders` hiện load toàn bộ, cần phân trang.
- **Danh mục**: `/api/categories` có thể thêm pagination.
- **Blog**: Chưa có admin route riêng, cần thêm pagination cho blog posts.

### 2. Bulk Operations
- **Sản phẩm/Danh mục**: Chọn nhiều để xóa cùng lúc.
- **Đơn hàng**: Cập nhật trạng thái hàng loạt.

### 3. Advanced Filtering
- **Đơn hàng**: Lọc theo khoảng ngày, tổng tiền, trạng thái thanh toán.
- **Sản phẩm**: Lọc theo khoảng giá, có/biến thể, có/hết stock.
- **Voucher**: Lọc theo loại, trạng thái, sử dụng次数.

### 4. Audit Log
- **Khuyến nghị**: Ghi log tất cả thao tác admin (create, update, delete) để tracking.
- **Triển khai**: Thêm table `AuditLog` trong DB, log qua middleware hoặc trước mỗi API.

### 5. Dashboard Statistics
- **Hiện tại**: Admin chưa có trang tổng quan (dashboard) với KPIs.
- **Cần thêm**: Thống kê doanh thu, đơn hàng mới, sản phẩm bán chạy, voucher usage.

---

## 🛠️ Refactoring & Code Quality

### 1. Consistent Error Handling
- **Vấn đề**: Các API trả error format khác nhau (có `{error: "msg"}` nhưng một số không có).
- **Cần chuẩn hóa**: Tạo helper `createErrorResponse(message, status)`.

### 2. TypeScript Types
- **Khuyến nghị**: Tạo file `types/admin.ts` để định nghĩa tất cả DTOs cho admin (ProductForm, CategoryForm, VoucherForm...).

### 3. Component Reusability
- **Forms**: Tạo component `FormField`, `FormSelect`, `FormInput` để reuse trong các trang create/edit.
- **Tables**: Component `DataTable` chung với pagination, sorting, filtering.

### 4. API Response Standardization
- **Hiện tại**: Một số endpoint trả nguyên object, một số trả `{data: ...}`.
- **Cần chuẩn**: Dùng response format: `{ success: boolean, data?: any, error?: string, pagination?: ... }`.

---

## 📋 Checklist Triển Khai (Priority Order)

### P0 - Critical (Cần fix ngay)
- [x] Sửa Categories DELETE sang path param `/api/categories/${id}`.
- [x] Sửa Edit Product sang dùng ID thay vì slug.
- [x] Thêm Admin API cho Blog (posts & categories).
- [x] Thêm Admin API cho Reviews (all status).
- [x] Thêm Admin Middleware kiểm tra quyền.
- [x] Chuẩn hóa Product API cho admin xem tất cả status.

### P1 - High (Nâng cấo quan trọng)
- [x] Thay alert bằng toast notifications.
- [x] Thêm input validation với Zod ở backend.
- [x] Thêm pagination cho Orders, Blog, Categories.
- [x] Thêm bulk actions (delete multiple).
- [x] Thêm audit logging.

### P2 - Medium (Nâng cấp UX)
- [x] Upload progress bar + file preview.
- [x] Optimistic UI updates (không cần reload sau khi save).
- [x] Advanced filters (date range, price range).
- [x] Dashboard page với statistics.
- [x] Refactor forms thành component reusable.

---

## 🔍 Files Cần Kiểm Tra Thêm

### Frontend (React/Next.js)
- `apps/web/app/admin/products/create/page.tsx` - Form tạo SP
- `apps/web/app/admin/products/[id]/edit/page.tsx` - Form chỉnh sửa SP
- `apps/web/app/admin/categories/page.tsx` - Quản lý danh mục
- `apps/web/app/admin/vouchers/page.tsx` - Quản lý voucher
- `apps/web/app/admin/blog/create/page.tsx` - Tạo blog
- `apps/web/app/admin/reviews/page.tsx` - Quản lý reviews
- `apps/web/app/admin/orders/page.tsx` - Quản lý đơn hàng

### Backend (API Routes)
- `apps/web/app/api/categories/route.ts` - CRUD categories
- `apps/web/app/api/products/route.ts` - Products list/create
- `apps/web/app/api/products/[id]/route.ts` - Product detail/update/delete
- `apps/web/app/api/upload/route.ts` - Image upload
- `apps/web/app/api/discount-campaigns/route.ts` - Vouchers
- `apps/web/app/api/reviews/route.ts` - Reviews (public)
- `apps/web/app/api/blog/route.ts` - Blog (public)
- `apps/web/app/api/admin/orders/route.ts` - Admin orders

---

## 📊 Summary

| Category | Issues | Priority |
|----------|--------|----------|
| API Endpoints | 5 critical mismatches | P0 |
| Security | Auth missing on all mutating routes | P0 |
| Validation | No Zod validation | P1 |
| UX | Alert() usage, no feedback | P1 |
| Performance | No pagination | P1 |
| Code Quality | Inconsistent patterns | P2 |

**Tổng ước lượng**: 15-20 issues cần fix, 2-5 feature enhancements.

---

**Lưu ý**: Báo cáo này dựa trên code hiện tại. Cần test thực tế để phát hiện thêm edge cases.