# AI update cho Chatbox Rêu

Ngày cập nhật: 2026-07-08

## 1. Mục tiêu flow mới

Flow mới hướng đến việc tách rõ nguồn trả lời của chatbox:

- `DB`: dùng cho dữ liệu thay đổi theo thời gian như sản phẩm, giá, tồn kho, danh mục, đơn hàng.
- `KB`: dùng cho thông tin cố định hoặc cần đúng theo shop như chính sách, bảo hành, vận chuyển, thanh toán, quy tắc shop, thông tin custom.
- `API GPT`: dùng cho tư vấn linh hoạt về cây/rêu/terrarium như cách chăm sóc, tưới nước, nhiệt độ, độ ẩm, ánh sáng, xử lý dấu hiệu bất thường.

Lý do tách như vậy:

- Chính sách, bảo hành, vận chuyển, thông tin sản phẩm không nên để GPT tự đoán vì dễ sai.
- Tư vấn chăm sóc cây/rêu cần hiểu câu hỏi tự nhiên, nối ngữ cảnh và diễn giải mềm hơn KB cứng.
- Khi user hỏi khó hoặc hỏi theo nhiều cách khác nhau, GPT có phạm vi hiểu rộng hơn KB, phù hợp cho phần chăm sóc.

## 2. Những gì đã làm trong bước này

### 2.1. Chia intent cho chatbox

Đã bổ sung logic nhận diện nhóm câu hỏi trong `apps/web/app/api/consult/route.ts`:

- `isCareAiIntent`: nhận diện câu hỏi chăm sóc cây, rêu, terrarium, tưới nước, ánh sáng, nhiệt độ, độ ẩm, dấu hiệu cây/rêu bất thường.
- `isPolicyFactIntent`: nhận diện câu hỏi chính sách, bảo hành, vận chuyển, thanh toán, đổi trả, tracking, freeship.
- `isCustomFactIntent`: nhận diện câu hỏi custom, đặt làm riêng, setup theo yêu cầu, thời gian làm mẫu.

### 2.2. DB vẫn là nguồn chính cho dữ liệu động

Chatbox vẫn ưu tiên DB cho:

- Sản phẩm.
- Giá.
- Tồn kho.
- Danh mục.
- Gợi ý sản phẩm còn hàng.
- Tra cứu đơn hàng bằng SĐT.
- Trạng thái đơn hàng bằng tiếng Việt.

Với đơn hàng, chatbox đã giữ nguyên hướng bảo mật:

- Không trả tracking link.
- Không nói tổng tiền đơn.
- Không hiển thị địa chỉ/SĐT/email đầy đủ.
- Chỉ trả thông tin cần thiết như mã đơn, ngày đặt, trạng thái đơn, trạng thái thanh toán, danh sách sản phẩm rút gọn.

### 2.3. KB dùng cho thông tin shop cần đúng

Đã điều chỉnh flow để các câu hỏi thuộc nhóm chính sách/fact ưu tiên KB:

- Chính sách bảo hành.
- Đổi trả.
- Vận chuyển.
- Phí ship/freeship.
- Thanh toán.
- Voucher/mã giảm giá.
- Quy tắc shop.
- Custom theo yêu cầu.
- Các giới hạn chatbox được phép/không được phép trả lời.

Nếu user hỏi chính sách hoặc thông tin shop mà KB chưa có dữ liệu đủ chắc, chatbox sẽ trả lời an toàn hoặc hướng user liên hệ shop, không để GPT tự bịa.

### 2.4. API GPT dùng cho tư vấn cây/rêu/chăm sóc

Đã đổi hướng để câu hỏi chăm sóc được đưa qua AI/API:

- Cách tưới nước.
- Bao lâu tưới một lần.
- Bể kín/bể mở.
- Đặt ở phòng máy lạnh.
- Nhiệt độ/độ ẩm phù hợp.
- Ánh sáng, phòng tối, đèn LED/grow light.
- Rêu vàng, rêu khô, rêu mốc.
- Cẩm nhung héo.
- Dương xỉ rụng lá.
- Dứa phụng nhạt màu.
- Cây chết, cây yếu, lá rụng.
- Chăm sóc 7 ngày đầu.
- Vệ sinh kính, mở nắp, thông khí.

Nếu KB có nội dung liên quan, AI sẽ dùng KB làm ngữ cảnh để trả lời chắc hơn. Nếu không có KB phù hợp, AI vẫn có thể trả lời phần chăm sóc theo kiến thức chung trong phạm vi terrarium/cây cảnh.

### 2.5. Cập nhật tài liệu KB routing

Đã cập nhật `kb_cases.md`, đặc biệt Group 10, để ghi rõ nguyên tắc:

- DB xử lý dữ liệu thật của shop.
- KB xử lý fact/chính sách/quy tắc.
- GPT xử lý care/tư vấn tự nhiên.
- Sale advice dùng DB để lấy sản phẩm thật, GPT chỉ diễn giải cách chăm và lý do phù hợp.

### 2.6. Validation

Đã chạy kiểm tra TypeScript:

```powershell
npx.cmd tsc --noEmit --incremental false -p apps\web\tsconfig.json
```

Kết quả: passed.

Đã commit:

```text
bd191ea Implement care-first GPT chat flow
```

## 3. Flow hoạt động hiện tại

```text
User hỏi
  |
  |-- Off-topic? -> từ chối lịch sự
  |
  |-- Hỏi đơn hàng/SĐT? -> DB order lookup
  |
  |-- Hỏi sản phẩm/giá/tồn kho/danh mục? -> DB product lookup
  |
  |-- Hỏi chính sách/bảo hành/vận chuyển/thanh toán/custom? -> KB
  |       |
  |       |-- KB có dữ liệu -> trả lời theo KB
  |       |-- KB thiếu -> trả lời an toàn / hướng liên hệ shop
  |
  |-- Hỏi chăm sóc cây/rêu/terrarium? -> API GPT
          |
          |-- Có KB care liên quan -> GPT trả lời dựa trên KB + kiến thức care
          |-- Không có KB care -> GPT trả lời theo phạm vi chăm sóc terrarium/cây cảnh
```

## 4. Những điểm nên nâng cấp tiếp theo

### 4.1. Tách rõ system prompt theo từng nguồn

Nên tách prompt thành 3 bộ:

- `policyPrompt`: chỉ dùng khi trả lời từ KB/chính sách, cấm bịa thông tin shop.
- `carePrompt`: dùng cho GPT tư vấn cây/rêu, cho phép trả lời linh hoạt trong phạm vi chăm sóc.
- `productPrompt`: dùng khi có DB sản phẩm, chỉ được gợi ý sản phẩm có thật từ DB.

Hiện tại prompt vẫn còn nhiều phần chung, nên sau này có thể làm rõ hơn để giảm nhầm nguồn.

### 4.2. Seed KB vào DB thay vì chỉ giữ trong markdown

`kb_cases.md` hiện là tài liệu chi tiết để duyệt nội dung. Bước tiếp theo nên:

- Chuyển từng case thành record trong bảng `AiKnowledge`.
- Có `caseId` ổn định để update không bị trùng.
- Có category rõ: policy, shipping, payment, care, troubleshooting, custom, routing.
- Có priority để ưu tiên câu trả lời đúng.
- Có trường `directAnswer` và `gptRewrite`.

### 4.3. Làm admin review KB

Nên có màn hình admin để:

- Xem danh sách KB theo group/case.
- Sửa câu trả lời.
- Thêm keyword.
- Bật/tắt case.
- Test thử câu hỏi xem match vào case nào.
- Xem nguồn trả lời là DB, KB, care-ai hay fallback.

Việc này giúp shop tự cập nhật chính sách mà không cần sửa code.

### 4.4. Cải thiện intent classification

Hiện tại intent chủ yếu dựa vào keyword/pattern. Nên nâng cấp theo 2 lớp:

- Lớp 1: rule nhanh cho câu rõ ràng như giá, bảo hành, ship, tưới nước.
- Lớp 2: GPT classifier nhẹ cho câu mơ hồ, ví dụ:
  - "bể này để văn phòng được không?"
  - "mới chơi nên mua loại nào?"
  - "cây bị vậy có đổi được không?"

Classifier chỉ phân loại route, không trả lời trực tiếp.

### 4.5. Log lại nguồn trả lời để debug

Nên lưu log nội bộ:

- User hỏi gì.
- Match intent nào.
- Nguồn trả lời: DB/KB/GPT/fallback.
- KB case nào được dùng.
- GPT model nào trả lời.
- Có lỗi API không.

Việc này giúp phát hiện câu nào đang route sai để bổ sung keyword hoặc chỉnh flow.

### 4.6. Thêm guardrail cho GPT care

GPT được dùng cho tư vấn chăm sóc nhưng vẫn cần giới hạn:

- Không chẩn đoán chắc chắn nếu thiếu ảnh/thông tin.
- Không khuyên dùng hóa chất mạnh.
- Không cam kết cây/rêu chắc chắn hồi phục.
- Nếu triệu chứng nặng, yêu cầu user gửi ảnh/video cho shop.
- Không trả lời ngoài phạm vi terrarium/cây cảnh/shop.

### 4.7. Cải thiện câu trả lời theo ngữ cảnh sản phẩm

Khi user đang xem một sản phẩm cụ thể, GPT care nên nhận thêm:

- Tên sản phẩm.
- Loại bể: kín/mở.
- Cây chính trong bể.
- Care level.
- Setup status.
- Ghi chú chăm sóc từ DB.

Như vậy nếu user hỏi "bể này tưới sao?", chatbox trả lời đúng theo sản phẩm đang xem.

### 4.8. Cải thiện fallback khi API lỗi

Nếu API GPT lỗi hoặc hết quota, nên có fallback:

- Với care phổ biến: dùng KB care cơ bản.
- Với chính sách: dùng KB/fallback an toàn.
- Với sản phẩm: dùng DB.
- Với câu khó: xin lỗi và hướng gửi ảnh/video hoặc liên hệ shop.

### 4.9. Theo dõi chi phí API

Nên thêm cấu hình:

- Giới hạn số token trả lời.
- Giới hạn số lượt hỏi theo IP/session nếu cần.
- Log lượng request.
- Có model mặc định như `gpt-5-mini`.
- Có env `OPENAI_MODEL` để đổi model không cần sửa code.

### 4.10. Test bộ câu hỏi mẫu trước khi redeploy

Trước mỗi lần deploy nên test các nhóm:

- Hỏi sản phẩm/giá/tồn kho.
- Hỏi đơn bằng SĐT.
- Hỏi bảo hành/đổi trả/ship.
- Hỏi chăm sóc bể kín/bể mở.
- Hỏi triệu chứng cây/rêu.
- Hỏi câu mơ hồ.
- Hỏi ngoài phạm vi.

Mục tiêu là đảm bảo chính sách không bị GPT bịa, còn phần chăm sóc vẫn trả lời tự nhiên.

## 5. Kết luận

Bước này đã chuyển chatbox sang hướng đúng hơn:

- Dữ liệu chắc chắn của shop đi qua DB/KB.
- Tư vấn chăm sóc cây/rêu đi qua API GPT để linh hoạt hơn.
- GPT không còn là nguồn tự do cho mọi câu hỏi.
- KB vẫn giữ vai trò kiểm soát chính sách và các fact quan trọng.

Bước tiếp theo nên ưu tiên seed KB vào DB và tạo công cụ admin review/test KB, sau đó mới mở rộng classifier thông minh hơn cho các câu hỏi mơ hồ.
