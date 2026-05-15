# DATA MODEL - TERRARIUM SHOP

## Tổng quan

- **Database Provider:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Tổng số bảng:** 25
- **ID Strategy:** `cuid()` (string)
- **Date Strategy:** `DateTime` (UTC)

---

## 1. CORE: Sản phẩm & Danh mục (7 Tables)

### `categories`

| Field               | Type    | Mô tả                           |
| ------------------- | ------- | --------------------------------- |
| `id`              | String  | PK                                |
| `slug`            | String  | UNIQUE                            |
| `name`            | String  | Tên danh mục                    |
| `parentId`        | String? | FK -> categories (Tree structure) |
| `metaTitle`       | String? | SEO                               |
| `metaDescription` | String? | SEO                               |
| `image`           | String? | Ảnh danh mục                    |
| `status`          | Enum    | ACTIVE, INACTIVE                  |

### `products`

| Field           | Type      | Mô tả                          |
| --------------- | --------- | -------------------------------- |
| `id`          | String    | PK                               |
| `slug`        | String    | UNIQUE                           |
| `name`        | String    | Tên sản phẩm                  |
| `basePrice`   | Decimal   | Giá gốc                        |
| `type`        | Enum      | PRODUCT, COMBO, CUSTOM_BUILDER   |
| `inventory`   | Int       | Tồn kho                         |
| `featured`    | Boolean   | ⭐ Dùng cho Explore (Admin pin) |
| `pinnedUntil` | DateTime? | ⭐ Ngày hết ghim               |
| `categoryId`  | String    | FK -> categories                 |
| `status`      | Enum      | DRAFT, ACTIVE, OUT_OF_STOCK      |
| `images`      | String[]  | Array URL                        |

### `product_variants`

| Field               | Type    | Mô tả                       |
| ------------------- | ------- | ----------------------------- |
| `id`              | String  | PK                            |
| `productId`       | String  | FK -> products                |
| `variantType`     | Enum    | SIZE, TYPE, DECOR, ACCESSORY  |
| `value`           | String  | S, M, L / Cơ bản, Suối     |
| `priceAdjustment` | Decimal | Thêm tiền so với giá gốc |
| `inventory`       | Int     | Tồn kho riêng variant       |
| `sku`             | String? | UNIQUE                        |

### `product_variant_options`

| Field           | Type     | Mô tả                |
| --------------- | -------- | ---------------------- |
| `id`          | String   | PK                     |
| `productId`   | String   | FK -> products         |
| `variantType` | Enum     | Loại variant          |
| `options`     | String[] | ["S", "M", "L"]        |
| `image`       | String?  | Ảnh minh họa variant |

### `combos`

| Field        | Type     | Mô tả                                  |
| ------------ | -------- | ---------------------------------------- |
| `id`       | String   | PK                                       |
| `type`     | Enum     | DIY, GIFT, CARE                          |
| `name`     | String   | Tên combo                               |
| `price`    | Decimal  | Giá combo                               |
| `features` | String[] | Các tính năng (hộp đẹp, thiệp...) |
| `image`    | String   | Ảnh combo                               |
| `status`   | Enum     | ACTIVE, INACTIVE                         |

### `combo_items`

| Field         | Type   | Mô tả        |
| ------------- | ------ | -------------- |
| `id`        | String | PK             |
| `comboId`   | String | FK -> combos   |
| `productId` | String | FK -> products |
| `quantity`  | Int    | Số lượng    |

### `care_guides`

| Field            | Type    | Mô tả                 |
| ---------------- | ------- | ----------------------- |
| `id`           | String  | PK                      |
| `productId`    | String  | UNIQUE FK -> products   |
| `watering`     | Text    | Hướng dẫn tưới     |
| `sunlight`     | Text    | Ánh sáng              |
| `temperature`  | Text    | Nhiệt độ             |
| `humidity`     | Text    | Độ ẩm                |
| `commonIssues` | Text?   | Vấn đề thường gặp |
| `videoUrl`     | String? | Video tutorial          |

---

## 2. CUSTOMERS: Khách hàng (4 Tables)

### `customers`

| Field             | Type    | Mô tả                        |
| ----------------- | ------- | ------------------------------ |
| `id`            | String  | PK                             |
| `email`         | String  | UNIQUE                         |
| `phone`         | String? |                                |
| `passwordHash`  | String? |                                |
| `name`          | String? |                                |
| `loyaltyPoints` | Int     | Tổng điểm                   |
| `loyaltyTier`   | Enum    | BRONZE, SILVER, GOLD, PLATINUM |

### `customer_care_preferences`

| Field                   | Type     | Mô tả                          |
| ----------------------- | -------- | -------------------------------- |
| `id`                  | String   | PK                               |
| `customerId`          | String   | UNIQUE FK -> customers           |
| `favoritePlants`      | String[] | ["sen đá", "xương rồng"]    |
| `experienceLevel`     | Enum     | BEGINNER, INTERMEDIATE, ADVANCED |
| `homeEnvironment`     | Enum     | APARTMENT, HOUSE, OFFICE         |
| `careReminderEnabled` | Boolean  | Nhận reminder                   |

### `customer_addresses`

| Field           | Type    | Mô tả                |
| --------------- | ------- | ---------------------- |
| `id`          | String  | PK                     |
| `customerId`  | String  | FK -> customers        |
| `name`        | String  | Người nhận          |
| `phone`       | String  | SĐT                   |
| `province`    | String  | Tỉnh/Thành           |
| `district`    | String  | Quận/Huyện           |
| `ward`        | String  | Phường/Xã           |
| `fullAddress` | Text    | Địa chỉ chi tiết   |
| `isDefault`   | Boolean | Địa chỉ mặc định |

### `wishlists`

| Field             | Type   | Mô tả                 |
| ----------------- | ------ | ----------------------- |
| `id`            | String | PK                      |
| `customerId`    | String | FK -> customers         |
| `productId`     | String | FK -> products          |
| **Unique:** |        | (customerId, productId) |

---

## 3. ORDERS: Đơn hàng (4 Tables)

### `orders`

| Field              | Type    | Mô tả                                |
| ------------------ | ------- | -------------------------------------- |
| `id`             | String  | PK                                     |
| `orderNumber`    | String  | UNIQUE (ORD-20260515-001)              |
| `customerId`     | String  | FK -> customers                        |
| `subtotal`       | Decimal | Tiền sản phẩm                       |
| `shippingFee`    | Decimal | Phí ship                              |
| `discount`       | Decimal | Tổng giảm (voucher + loyalty)        |
| `total`          | Decimal | Tổng thanh toán                      |
| `shippingMethod` | Enum    | GHN_STANDARD, GHN_EXPRESS, GRAB        |
| `paymentMethod`  | Enum    | COD, MOMO, BANK_TRANSFER               |
| `paymentStatus`  | Enum    | PENDING, PAID, FAILED                  |
| `status`         | Enum    | PENDING, CONFIRMED, SHIPPED, DELIVERED |

### `order_items`

| Field             | Type    | Mô tả                        |
| ----------------- | ------- | ------------------------------ |
| `id`            | String  | PK                             |
| `orderId`       | String  | FK -> orders                   |
| `productId`     | String  | FK -> products                 |
| `productName`   | String  | Snapshot tên                  |
| `productImage`  | String  | Snapshot ảnh                  |
| `variants`      | Json    | {"SIZE": "M", "TYPE": "Suối"} |
| `quantity`      | Int     |                                |
| `price`         | Decimal | Giá tại thời điểm mua     |
| `customOptions` | Json?   | { "hasLight": true }           |

### `shipping_infos`

| Field              | Type    | Mô tả             |
| ------------------ | ------- | ------------------- |
| `id`             | String  | PK                  |
| `orderId`        | String  | UNIQUE FK -> orders |
| `trackingNumber` | String? | Mã vận đơn GHN  |
| `trackingUrl`    | String? | Link theo dõi      |

### `order_status_logs`

| Field       | Type    | Mô tả           |
| ----------- | ------- | ----------------- |
| `id`      | String  | PK                |
| `orderId` | String  | FK -> orders      |
| `status`  | Enum    | Trạng thái mới |
| `note`    | String? | Ghi chú admin    |

---

## 4. VOUCHER SYSTEM: Giảm giá (3 Tables)

### `discount_campaigns`

| Field                 | Type     | Mô tả                              |
| --------------------- | -------- | ------------------------------------ |
| `id`                | String   | PK                                   |
| `code`              | String   | UNIQUE (BANNAN2026)                  |
| `type`              | Enum     | PERCENTAGE, FIXED, FREE_SHIPPING     |
| `value`             | Decimal  | 20 (cho 20%) hoặc 50000             |
| `minOrderAmount`    | Decimal? | Tối thiểu đơn hàng              |
| `maxDiscountAmount` | Decimal? | Tối đa giảm (cho %)               |
| `startsAt`          | DateTime | Ngày bắt đầu                     |
| `expiresAt`         | DateTime | **Ngày hết hạn**            |
| `usageLimit`        | Int?     | Tổng số lần dùng (null=vô hạn) |
| `usageCount`        | Int      | Đã dùng bao nhiêu lần           |
| `status`            | Enum     | ACTIVE, INACTIVE, EXPIRED, SOLD_OUT  |
| `applicableTo`      | Enum     | ALL, CATEGORIES, PRODUCTS, COMBOS    |
| `description`       | Text?    | Mô tả                              |

### `discount_applicables`

| Field          | Type   | Mô tả                  |
| -------------- | ------ | ------------------------ |
| `id`         | String | PK                       |
| `campaignId` | String | FK -> discount_campaigns |
| `targetType` | Enum   | CATEGORY, PRODUCT, COMBO |
| `targetId`   | String | ID danh mục/sản phẩm  |

### `order_discounts`

| Field              | Type    | Mô tả                  |
| ------------------ | ------- | ------------------------ |
| `id`             | String  | PK                       |
| `orderId`        | String  | FK -> orders             |
| `campaignId`     | String  | FK -> discount_campaigns |
| `discountAmount` | Decimal | Số tiền đã giảm     |
| `appliedCode`    | String  | Mã voucher đã dùng   |

---

## 5. REVIEWS & EXPLORE: Đánh giá & Khám phá (2 Tables)

### `reviews`

| Field          | Type     | Mô tả                            |
| -------------- | -------- | ---------------------------------- |
| `id`         | String   | PK                                 |
| `productId`  | String   | FK -> products                     |
| `customerId` | String   | FK -> customers                    |
| `rating`     | Int      | 1-5                                |
| `title`      | String?  |                                    |
| `content`    | Text     |                                    |
| `images`     | String[] | Ảnh đăng kèm                   |
| `verified`   | Boolean  | **Đã mua hàng chưa?**    |
| `approved`   | Boolean  | **Admin đã duyệt chưa?** |

### `product_votes`

| Field             | Type     | Mô tả                                      |
| ----------------- | -------- | -------------------------------------------- |
| `id`            | String   | PK                                           |
| `productId`     | String   | FK -> products                               |
| `customerId`    | String   | FK -> customers                              |
| `votedAt`       | DateTime | Thời gian vote                              |
| **Unique:** |          | (productId, customerId) - 1 khách 1 vote/sp |

---

## 6. CARE & LOYALTY: Chăm sóc & Điểm (2 Tables)

### `customer_care_items`

| Field             | Type      | Mô tả                   |
| ----------------- | --------- | ------------------------- |
| `id`            | String    | PK                        |
| `customerId`    | String    | FK -> customers           |
| `productId`     | String    | FK -> products            |
| `purchasedAt`   | DateTime  | Ngày mua                 |
| `careSchedule`  | Json      | {"watering": "weekly"}    |
| `lastWateredAt` | DateTime? | Ngày tưới gần nhất   |
| `lastPrunedAt`  | DateTime? | Ngày cắt tỉa           |
| `status`        | Enum      | ACTIVE, PAUSED, COMPLETED |

### `loyalty_points`

| Field          | Type      | Mô tả                         |
| -------------- | --------- | ------------------------------- |
| `id`         | String    | PK                              |
| `customerId` | String    | FK -> customers                 |
| `points`     | Int       | Số điểm                      |
| `source`     | Enum      | ORDER, REVIEW, BIRTHDAY, MANUAL |
| `orderId`    | String?   | FK -> orders (nếu từ đơn)   |
| `expiresAt`  | DateTime? | Ngày hết hạn điểm          |

---

## 7. CONTENT & SYSTEM (3 Tables)

### `blog_posts`

| Field           | Type      | Mô tả |
| --------------- | --------- | ------- |
| `id`          | String    | PK      |
| `slug`        | String    | UNIQUE  |
| `title`       | String    |         |
| `content`     | Text      |         |
| `published`   | Boolean   |         |
| `publishedAt` | DateTime? |         |

### `blog_categories`

| Field    | Type   | Mô tả |
| -------- | ------ | ------- |
| `id`   | String | PK      |
| `slug` | String | UNIQUE  |
| `name` | String |         |

### `seo_meta`

| Field               | Type    | Mô tả               |
| ------------------- | ------- | --------------------- |
| `id`              | String  | PK                    |
| `productId`       | String  | UNIQUE FK -> products |
| `metaTitle`       | String? |                       |
| `metaDescription` | String? |                       |
| `ogImage`         | String? |                       |

### `shipping_trackings`

| Field          | Type    | Mô tả                |
| -------------- | ------- | ---------------------- |
| `id`         | String  | PK                     |
| `orderId`    | String  | UNIQUE FK -> orders    |
| `ghnOrderId` | String? | Mã GHN                |
| `status`     | String? | Trạng thái GHN       |
| `timeline`   | Json?   | Lịch sử vận chuyển |