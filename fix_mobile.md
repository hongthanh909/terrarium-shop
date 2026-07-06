# Fix Mobile UI

## Đã fix trong lượt này

1. **Trang chi tiết sản phẩm: giá ở sticky bar mobile bị lỗi ký tự**
   - File: `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Triệu chứng: giá hiển thị dạng `420.000â‚«` thay vì `420.000₫`.
   - Fix: đổi literal tiền tệ sang `₫`, thêm `whitespace-nowrap` và `clamp()` font-size để giá không bị vỡ dòng trên màn hẹp.

2. **Trang chi tiết sản phẩm: nút sticky mobile bị lỗi chữ**
   - File: `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Triệu chứng: nút hiện `ThẢªm giá»...`.
   - Fix: đổi text thành `Thêm giỏ`, thêm icon giỏ hàng và giảm `min-width` để nút linh hoạt hơn trên màn nhỏ.

3. **Trang chủ: hero banner mobile bị crop artwork**
   - File: `apps/web/app/page.tsx`
   - Triệu chứng: banner landscape bị ép `object-cover` trong viewport dọc nên ảnh bị cắt nhiều ở mobile.
   - Fix: mobile dùng 2 lớp ảnh: lớp nền `object-cover` blur nhẹ để vẫn phủ khung, lớp ảnh chính `object-contain` để giữ trọn artwork; desktop vẫn dùng `object-cover`.

4. **Trang chủ: CTA hero mobile còn cứng kích thước**
   - File: `apps/web/app/page.tsx`
   - Triệu chứng: hai nút hero có `min-width` lớn, dễ chèn hoặc lệch trên viewport nhỏ.
   - Fix: giảm min-width nút chính, nút phụ dùng `basis`/`flex-1` trên mobile và trở lại fixed sizing ở desktop.

## Lỗi mobile còn nên xử lý tiếp

1. **Chat bubble có thể che thumbnail/product info**
   - File nghi vấn: `apps/web/components/ChatWidget.tsx`
   - Nguyên nhân: bubble dùng vị trí fixed kéo thả với `bottom: 92px`; trên trang sản phẩm có sticky add-to-cart nên dễ đè lên dải thumbnail hoặc phần thông tin.
   - Hướng fix: khi pathname là `/products/[slug]`, tăng default bottom hoặc thêm CSS variable offset từ layout sản phẩm.

2. **Product card cần audit toàn bộ ký tự tiếng Việt và giá**
   - File nghi vấn: `apps/web/components/ui/product-card.tsx`, `apps/web/components/ui/featured-product-card.tsx`
   - Nguyên nhân: repo từng có một số literal bị mojibake; nếu build đọc đúng UTF-8 thì ổn, nhưng cần kiểm bằng browser trên `/products`.
   - Hướng fix: rà các text như `Sản phẩm`, `Mới`, `Bán chạy`, `Thêm vào giỏ`, `Hết hàng`, `₫`.

3. **Filter pills trang sản phẩm có nguy cơ overflow ngang**
   - File nghi vấn: `apps/web/app/products/ProductsClient.tsx`
   - Nguyên nhân: nhiều button dùng `whitespace-nowrap`; nếu container không scroll hoặc wrap đúng, viewport nhỏ dễ tràn.
   - Hướng fix: cho nhóm filter `overflow-x-auto`, `scrollbar-hide`, hoặc chuyển thành dropdown/segmented control mobile.

4. **Header mobile có nhiều icon ngang**
   - File nghi vấn: `apps/web/components/Header.tsx`
   - Nguyên nhân: logo ở giữa cộng 3 icon phải, trên màn 320-360px có thể ép khoảng cách hoặc cắt logo.
   - Hướng fix: giảm size logo ở `<380px`, ẩn bớt label phụ, hoặc gom user/cart vào menu phụ.

5. **Các trang dùng `min-h-screen` nên đổi dần sang `min-h-[100dvh]`**
   - File nghi vấn: blog, consult, checkout, orders, profile.
   - Nguyên nhân: `100vh`/`min-h-screen` trên mobile Safari dễ tính cả thanh địa chỉ, gây nhảy layout hoặc che nội dung dưới.
   - Hướng fix: ưu tiên `min-h-[100dvh]` cho các màn full-height.

6. **Modal/dialog default có thể quá cao trên mobile**
   - File nghi vấn: `apps/web/components/ui/dialog.tsx`, `apps/web/components/ui/alert-dialog.tsx`
   - Nguyên nhân: dialog center fixed nhưng chưa thấy `max-h-[calc(100dvh-...)] overflow-y-auto`.
   - Hướng fix: thêm max-height theo `100dvh`, padding safe-area và scroll nội bộ.

7. **Trang chủ service strip 3 cột ở đáy hero còn sát chữ**
   - File: `apps/web/app/page.tsx`
   - Nguyên nhân: 3 cột cố định trên mobile, nhãn dài như `Hướng Dẫn Chăm Sóc` có thể xuống dòng sát cạnh.
   - Hướng fix: cân nhắc carousel nhỏ hoặc chỉ hiện icon + nhãn ngắn ở viewport dưới 360px.
