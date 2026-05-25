# KẾ HOẠCH TỐI ƯU HIỆU NĂNG (PERFORMANCE IMPROVEMENT PLAN)

Tài liệu này liệt kê các bước cần thực hiện để giải quyết tình trạng delay giữa các trang và thanh điều hướng (navbar) không phản hồi ngay lập tức.

---

## 🔴 ƯU TIÊN CAO (THỰC HIỆN NGAY)

### 1. Sửa lỗi chặn render (Render-blocking) do Font
- **Vấn đề:** File `globals.css` đang dùng `@import url(...)` để tải Google Fonts, làm trình duyệt phải chờ tải xong font mới vẽ giao diện. Trong khi đó, `layout.tsx` đã sử dụng `next/font/google` rất tối ưu.
- **Hành động:** 
  - Mở `apps/web/app/globals.css`.
  - Xóa dòng `@import` ở đầu file.

### 2. Thêm Trạng thái tải trang (`loading.tsx`) cho Streaming UI
- **Vấn đề:** Khi click vào link trên Navbar, Next.js sẽ fetch data từ Supabase cho trang mới. Vì không có file `loading.tsx`, UI hiện tại bị "đóng băng" cho đến khi data trả về xong, tạo cảm giác Navbar bị đơ.
- **Hành động:**
  - Tạo `apps/web/app/loading.tsx` (cho Homepage).
  - Tạo `apps/web/app/explore/loading.tsx`.
  - Tạo `apps/web/app/blog/loading.tsx`.
  - *Mục tiêu:* Hiển thị ngay lập tức bộ khung (Skeleton) khi người dùng bấm chuyển trang, giúp ứng dụng có cảm giác phản hồi tức thì.

### 3. Tối ưu Header & Footer Component
- **Vấn đề Footer:** `Footer.tsx` là Client Component và gọi `fetch("/api/contact")` trong `useEffect` mỗi lần mount. Việc này gây lãng phí request và hiển thị skeleton nhấp nháy mỗi khi chuyển trang.
- **Hành động:** 
  - Chuyển việc lấy dữ liệu Contact thành Server Component (nếu Footer có thể tách) hoặc dùng TanStack Query với `staleTime` lớn (vd: 24h) để lấy từ cache.

### 4. Nâng cấp Product Detail Page (`/products/[slug]`)
- **Vấn đề:** Hiện tại trang chi tiết sản phẩm hoàn toàn là Client Component (`"use client"`), gọi 2 API tuần tự (`/api/products?slug=...` và `/api/products?categoryId=...`). Quá trình này rất chậm.
- **Hành động:**
  - Chuyển đổi file `page.tsx` thành Server Component để fetch data nhanh nhất có thể từ phía server.
  - Sau đó truyền data xuống một Client Component (như `ProductDetailClient.tsx`) để xử lý các logic tương tác (chọn variant, thêm vào giỏ).

---

## 🟡 ƯU TIÊN TRUNG BÌNH (TỐI ƯU SÂU)

### 5. Giảm tải truy vấn cho trang Khám phá (Explore)
- **Vấn đề:** Trang `app/explore/page.tsx` gọi đến **6 Prisma queries** song song (featured, pinned, topVoted, newArrivals, weeklyFeatured, userVotes).
- **Hành động:**
  - Cân nhắc sử dụng `unstable_cache` của Next.js để cache lại kết quả của các query không phụ thuộc vào user đăng nhập (như danh sách sản phẩm).
  - Thiết lập `revalidate` time (VD: 60 giây) để giảm tải cho database.

### 6. Tối ưu Hiệu ứng Cuộn (ScrollReveal)
- **Vấn đề:** Sử dụng component `ScrollReveal` (dựa trên `framer-motion`) quá nhiều trên Homepage (~20 lần). Mỗi lần sử dụng đều khởi tạo Intersection Observer và cần hydrate JS.
- **Hành động:**
  - Gộp các phần tử cần hiệu ứng thành từng cụm lớn hơn thay vì bọc từng dòng chữ.
  - Nếu có thể, xem xét chuyển sang CSS Animation + IntersectionObserver thuần để giảm dung lượng JS bundle.

---

## 📝 Quy trình thực thi đề xuất
1. **Bước 1:** Thực hiện mục 1 và 2 trước (Xóa `@import` font và thêm các file `loading.tsx`). Đây là thay đổi nhỏ nhưng mang lại hiệu quả thấy rõ nhất về độ phản hồi (UX).
2. **Bước 2:** Cấu trúc lại trang Chi tiết sản phẩm (mục 4) để cải thiện tốc độ load của trang quan trọng nhất.
3. **Bước 3:** Tối ưu Footer (mục 3).
4. **Bước 4:** Xử lý các vấn đề caching (mục 5) và animation (mục 6).
