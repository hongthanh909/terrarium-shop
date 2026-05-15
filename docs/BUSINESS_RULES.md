# BUSINESS RULES - TERRARIUM SHOP

## 1. VOUCHER & DISCOUNT RULES

### 1.1. Cấu trúc Voucher

- **Mã:** Viết hoa, không dấu, duy nhất (ví dụ: `SUMMER20`, `FREESHIP`).
- **Loại giảm:**
  - `PERCENTAGE`: Giảm theo % (giá trị 1-99).
  - `FIXED`: Giảm số tiền cố định (đơn vị VNĐ).
  - `FREE_SHIPPING`: Miễn phí vận phí.
- **Thời hạn:**
  - `startsAt`: Thời điểm bắt đầu áp dụng.
  - `expiresAt`: Thời điểm hết hạn (hệ thống tự động tắt nếu quá thời điểm này).
- **Giới hạn:**
  - `usageLimit`: Tổng số lần dùng toàn hệ thống (null = vô hạn).
  - `minOrderAmount`: Giá trị đơn tối thiểu để áp dụng.
  - `maxDiscountAmount`: Mức giảm tối đa (chỉ áp dụng cho `PERCENTAGE`).

### 1.2. Logic Kiểm Tra (Validation Flow)

Khi người dùng nhập mã voucher vào checkout:

1. **Kiểm tra tồn tại:** Mã có trong DB không?
2. **Kiểm tra trạng thái:** `status` phải là `ACTIVE`.
3. **Kiểm tra thời gian:** `now >= startsAt` VÀ `now <= expiresAt`.
   - Nếu chưa bắt đầu: Lỗi "Voucher chưa hoạt động".
   - Nếu hết hạn: Lỗi "Voucher đã hết hạn".
4. **Kiểm tra số lượng:** `usageCount < usageLimit` (nếu có limit).
5. **Kiểm tra giá trị đơn:** `cartTotal >= minOrderAmount`.
6. **Kiểm tra đối tượng:** Nếu `applicableTo` là `PRODUCT` hoặc `CATEGORY`, kiểm tra xem cart có sản phẩm thuộc diện đó không.
7. **Tính toán:**
   - Nếu `PERCENTAGE`: `discount = cartTotal * (value / 100)`.
     - Nếu có `maxDiscountAmount`: `discount = Math.min(discount, maxDiscountAmount)`.
   - Nếu `FIXED`: `discount = value`.
   - Nếu `FREE_SHIPPING`: `shippingFee = 0`.

### 1.3. Áp dụng sau khi đặt hàng

- Tạo bản ghi trong `order_discounts`.
- Tăng `usageCount` trong `discount_campaigns`.
- Giảm `discount` trong `orders`.

---

## 2. REVIEW & RATING RULES

### 2.1. Quy định đánh giá

- **Điều kiện:** Khách hàng **PHẢI** đã mua sản phẩm (`OrderItem` tồn tại) VÀ đơn hàng đã ở trạng thái `DELIVERED`.
- **Một người:** Chỉ được đánh giá **một lần** cho một sản phẩm.
- **Nội dung:**
  - `rating` (bắt buộc): 1-5 sao.
  - `content` (tùy chọn): Nội dung đánh giá.
  - `images` (tùy chọn): Tối đa 5 ảnh.

### 2.2. Quy trình duyệt (Approval Flow)

1. **Submit:** Khách gửi đánh giá -> Trạng thái `approved: FALSE`, `verified: TRUE`.
2. **Admin:** Vào Admin Panel > Reviews > Duyệt (nhấn approve).
   - Admin đổi `approved: TRUE`.
3. **Public:** Chỉ khi `approved: TRUE`, đánh giá mới hiện trên trang chi tiết sản phẩm.

---

## 3. EXPLORE & DISCOVERY RULES (KHÔNG FAKE VOTE)

### 3.1. Nguyên tắc hiển thị

Trang "Khám phá" (Explore) hiển thị sản phẩm theo thứ tự ưu tiên:

1. **📌 Pinned / Featured (Ưu tiên cao nhất)**

   - **Nguồn:** Admin ghim sản phẩm.
   - **Điều kiện:** `Product.featured == TRUE` HOẶC `Product.pinnedUntil >= NOW`.
   - **Hành động:** Hiển thị ở slider đầu trang (Carousal).
2. **🆕 New Arrivals**

   - **Điều kiện:** `Product.createdAt >= NOW - 30 days`.
   - **Sắp xếp:** Mới nhất trước.
3. **🏆 Top Voted (Thực tế)**

   - **Điều kiện:** Đếm số lượng vote từ bảng `product_votes` trong khung thời gian (7 ngày hoặc 30 ngày).
   - **Sắp xếp:** `COUNT(votes) DESC`.
   - **Lưu ý:** Không được fake vote. Chỉ hiển thị sản phẩm có thật.
4. **🖋️ Editor's Picks**

   - **Nguồn:** Admin chọn thủ công (có thể dùng lại `featured` hoặc chọn ngẫu nhiên từ `featured`).

### 3.2. Vote Logic

- **Khách hàng:** 1 khách chỉ được vote 1 lần cho 1 sản phẩm (Unique constraint: `productId` + `customerId`).
- **Vote Count:** Hiển thị số lượng vote thực tế.

---

## 4. PRICING & CALCULATION RULES

### 4.1. Công thức tính giá

```text
Subtotal = Σ (BasePrice + VariantAdjustment) * Quantity

Giảm giá Combo:
- Nếu sản phẩm thuộc Combo: Áp dụng discount của Combo (nếu có).

Giảm giá Voucher:
- Tính theo logic mục 1.2.

Giảm giá Loyalty:
- Đổi điểm thành tiền: 100 điểm = 1,000 VNĐ (tùy config).
- Max giảm: 10% hoặc 20% giá trị đơn.

Phí vận chuyển:
- Tính từ API GHN (dựa trên cân nặng, size, khoảng cách).

TOTAL = Subtotal - ComboDiscount - VoucherDiscount - LoyaltyDiscount + ShippingFee
```

### 4.2. Snapshot dữ liệu

- Khi tạo đơn hàng (`OrderItem`), **LUÔN** lưu snapshot:
  - `productName`, `productImage`, `variants` (JSON), `price` (giá lúc mua).
- Không được thay đổi giá sản phẩm trong quá trình thanh toán nếu không xác nhận lại.

---

## 5. CARE REMINDER RULES

### 5.1. Lịch chăm sóc

Dựa vào loại cây (`careSchedule` trong `CareGuide`):

| Loại cây                  | Tưới (ngày) | Phun sương (ngày) | Kiểm tra reminder     |
| :-------------------------- | :------------- | :------------------- | :--------------------- |
| **Sen đá**          | 7-10           | 2-3                  | `lastWateredAt + 10` |
| **Xương rồng**     | 14-21          | Không               | `lastWateredAt + 21` |
| **Cây nhiệt đới** | 3-5            | 1-2                  | `lastWateredAt + 5`  |
| **Rêu**              | 2-3            | Hàng ngày          | `lastWateredAt + 3`  |

### 5.2. Quy trình Reminder

1. **Cron Job:** Chạy mỗi ngày lúc 08:00 sáng.
2. **Query:** Tìm `customer_care_items` có `status = ACTIVE` và `lastWateredAt + interval > TODAY`.
3. **Gửi:**
   - Email / Zalo / Push Notification.
   - Nội dung: "Hôm nay là ngày tưới nước cho [Tên Terrarium] của bạn!"
4. **Cập nhật:** Khách bấm "Đã tưới" -> Cập nhật `lastWateredAt = NOW`.

---

## 6. ADMIN & PERMISSIONS

### 6.1. Phân quyền

- **Public:** Xem sản phẩm, Blog, Review (đã duyệt), Explorer (featured + votes).
- **Customer:** Quản lý đơn, Wishlist, Care Items, Viết Review (có điều kiện).
- **Admin:**
  - Quản lý sản phẩm, combo, danh mục.
  - Tạo/Xóa Voucher (DiscountCampaign).
  - Duyệt Review.
  - Ghim sản phẩm lên Explore (`featured`, `pinnedUntil`).
  - Xem báo cáo doanh thu.

---

## 7. EXCEPTION HANDLING

### 7.1. Hết hàng

- Nếu `inventory = 0` và `status = ACTIVE`:
  - Hiển thị nút "Hết hàng" (Disabled).
  - Không cho phép thêm vào giỏ hàng.

### 7.2. Voucher lỗi

- Nếu lỗi khi áp dụng voucher: Hiển thị lỗi rõ ràng (Vd: "Voucher hết hạn", "Đơn tối thiểu 500k").
- Không cho phép áp dụng nhiều voucher cùng lúc (chỉ 1 voucher/đơn).

### 7.3. Giao hàng

- Nếu GHN API lỗi:
  - Hiển thị "Không thể tính phí ship, vui lòng chọn phương thức khác".
  - Cho phép đặt hàng với phí ship ước tính (nhưng ghi chú admin cần xác nhận).