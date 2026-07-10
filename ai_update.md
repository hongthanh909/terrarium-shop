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

## 6. Ke hoach them tinh nang phan tich anh tinh trang be bang API GPT

### 6.1. Muc tieu

Them kha nang de khach gui anh tinh trang be/cay/reu trong chatbox, sau do GPT phan tich anh va tu van cach cham soc phu hop.

Tinh nang nay phuc vu cac nhom cau hoi:

- Reu vang, reu nau, reu kho, reu bi moc.
- Cay heo, la ru, la vang, cay yeu, cay chet dan.
- Kinh dong suong qua nhieu, kinh mo, be qua am.
- Dat/reu qua kho hoac qua uot.
- Be co dau hieu nam, moc, con trung nho.
- Bo cuc/setup be co phu hop khong.
- Nen dat be o dau, anh sang hien tai co on khong neu anh the hien duoc moi truong.

GPT chi tu van dua tren anh va mo ta cua khach, khong duoc ket luan tuyet doi hoac cam ket cay/reu chac chan hoi phuc.

### 6.2. Model va chi phi

Cau hinh de xuat cho MVP:

```env
OPENAI_MODEL=gpt-5-mini
OPENAI_CARE_MODEL=gpt-5-mini
OPENAI_VISION_MODEL=gpt-5-mini
```

Ly do:

- Dung chung GPT-5 mini dang dung cho chatbox.
- Ho tro image input va text output.
- It phat sinh cau hinh moi.
- Chi phi van tru chung vao credit API hien tai cua project/key OpenAI.

Uoc tinh voi credit 5 USD:

- Anh da resize/nen tot + tra loi ngan: khoang 3.000-5.000 luot.
- Anh 768-1024px + tra loi vua: khoang 1.600-3.300 luot.
- Anh lon + tra loi dai: khoang 600-1.200 luot.

Muc an toan de tinh thuc te: 5 USD khoang 1.500-3.000 luot phan tich anh neu kiem soat anh va output tot.

### 6.3. Quy tac xu ly anh de toi uu chi phi

Mac dinh nen xu ly anh truoc khi gui OpenAI:

- Chi cho 1 anh/lan hoi trong MVP.
- Gioi han file upload ban dau: toi da 5MB.
- Resize canh dai ve 1024px.
- Nen JPEG/WebP quality 75-85%.
- Khong filter mau, khong chinh contrast/saturation qua manh.
- Khong gui metadata anh.
- Khong gui toan bo lich su chat dai khi phan tich anh.

Truong hop can chi tiet hon co the them che do sau:

- Canh dai 1536px.
- Quality 85-90%.
- Chi dung khi user can xem chi tiet nho nhu moc/re/la/reu.

Khong nen nen qua thap vi GPT can nhin duoc mau reu/cay, moc trang, la heo, do am, dong suong va tinh trang dat.

### 6.4. Flow UI chatbox

Các bước cần làm ở frontend:

1. Them nut upload anh trong khung nhap chatbox.
2. Chi cho chon dinh dang anh pho bien: JPG, JPEG, PNG, WebP.
3. Hien thi preview anh truoc khi gui.
4. Cho user nhap them mo ta kem anh, vi du:
   - "Reu bi vang nhu nay la sao?"
   - "Be nay co qua am khong?"
   - "Cay nay heo co cuu duoc khong?"
5. Neu user chi gui anh khong nhap text, tu gui prompt mac dinh:
   - "Anh/chi xem giup tinh trang be/cay/reu trong anh va tu van cach cham soc."
6. Hien thi trang thai dang phan tich:
   - "Reu dang xem anh..."
   - "Dang kiem tra tinh trang cay/reu..."
7. Sau khi GPT tra loi, anh va cau tra loi phai nam trong cung khung chat history.
8. Neu anh qua lon hoac sai dinh dang, bao loi ro rang.
9. Neu API loi/het credit, bao user thu lai sau hoac lien he Fanpage.

### 6.5. Flow backend API

Các bước cần làm ở backend:

1. Tao endpoint moi, vi du:

```txt
POST /api/consult/image
```

2. Endpoint nhan:

```txt
- message: cau hoi cua user
- image: file anh hoac base64
- history: lich su chat rut gon
- pageContext: thong tin trang/san pham neu co
```

3. Validate request:

- Co anh hop le.
- File dung dinh dang.
- File khong vuot qua gioi han.
- Message khong qua dai.
- Khong nhan nhieu anh o MVP.

4. Resize/nen anh server-side.

5. Tao prompt cho GPT Vision.

6. Goi OpenAI bang model:

```txt
process.env.OPENAI_VISION_MODEL || process.env.OPENAI_CARE_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini"
```

7. Tra ve JSON:

```json
{
  "response": "...",
  "source": "ai_vision",
  "imageAnalysis": true
}
```

8. Ghi log toi thieu:

- thoi gian request,
- model dung,
- kich thuoc anh truoc/sau resize,
- trang thai thanh cong/loi,
- usage token/cost neu API tra ve.

Khong log base64 anh hoac du lieu nhay cam cua khach.

### 6.6. Prompt cho GPT phan tich anh

Prompt can yeu cau GPT tra loi theo cau truc:

```txt
Ban la Reu, tro ly tu van cham soc terrarium cua Tiem Reu Decor.
Hay quan sat anh va cau hoi cua khach de tu van.

Quy tac:
- Chi nhan xet nhung gi co the thay tu anh hoac khach mo ta.
- Khong chan doan chac chan 100%.
- Neu anh khong du ro, noi ro can anh gan hon/sang hon/goc khac.
- Uu tien tu van thuc hanh: tinh trang co the la gi -> nguyen nhan kha di -> cach xu ly -> cach theo doi.
- Khong tu noi gia, bao hanh, doi tra, phi ship hoac cam ket cua shop.
- Neu tinh trang nang, khuyen khach gui them anh/video qua Fanpage de shop kiem tra.
- Tra loi tieng Viet, xung em, goi khach anh/chi.
```

Format tra loi de xuat:

```txt
Da em nhin anh thi kha nang cao be dang gap ...

Nguyen nhan co the:
- ...

Anh/chi xu ly nhu sau:
1. ...
2. ...
3. ...

Theo doi them:
- ...

Neu sau ... ngay khong cai thien, anh/chi nen gui them anh/video ro hon cho Fanpage tiemreudecor de shop kiem tra ky hon a.
```

### 6.7. Routing giua anh, DB, KB va GPT

Quy tac routing moi:

- Co anh + hoi cham soc/tinh trang/setup: dung `ai_vision`.
- Co anh + hoi chinh sach/bao hanh/doi tra: dung KB de tra chinh sach, khong de GPT tu suy doan quyen loi.
- Co anh + hoi san pham/gia/ton kho: dung DB neu nhan dien duoc san pham, neu khong thi hoi lai ten san pham.
- Khong anh + hoi cham soc/setup/style: dung GPT text hien tai.
- Khong anh + hoi chinh sach/shop facts: dung KB.
- Khong anh + hoi san pham/gia/ton kho/don hang: dung DB.

Vi du:

- "Reu trong anh bi vang la sao?" -> GPT Vision.
- "Be nay co bi qua am khong?" -> GPT Vision.
- "Anh nay cay gi va cham sao?" -> GPT Vision, tra loi o muc kha nang, khong khang dinh tuyet doi neu anh mo.
- "Neu van chuyen toi ma vo nhu anh thi bao hanh sao?" -> KB warranty/return, co the nhac can video mo hang va bao loi trong 3 ngay.
- "Be trong anh gia bao nhieu?" -> DB/product neu co product context, neu khong hoi lai ten/ma san pham.

### 6.8. Rate limit va kiem soat chi phi

Nen co rate limit rieng cho anh vi anh ton hon text:

- MVP: 5 anh/user/10 phut.
- Toi da 1 anh/request.
- Toi da output 500-700 tu.
- Timeout API 20-30 giay.
- Neu qua gioi han, bao user doi them.

Nen them env:

```env
CHAT_IMAGE_MAX_MB=5
CHAT_IMAGE_MAX_LONG_EDGE=1024
CHAT_IMAGE_JPEG_QUALITY=82
CHAT_IMAGE_RATE_LIMIT=5
CHAT_IMAGE_RATE_WINDOW_MINUTES=10
OPENAI_VISION_MODEL=gpt-5-mini
```

### 6.9. Cac file du kien can sua

Du kien can kiem tra va sua cac nhom file:

- `apps/web/components/ChatWidget.tsx`
  - them nut upload anh,
  - preview anh,
  - gui multipart/base64,
  - render message co anh.

- `apps/web/app/api/consult/image/route.ts`
  - endpoint moi cho phan tich anh.

- `apps/web/lib/ai/openai.ts`
  - them helper goi OpenAI voi image input neu chua co.

- `apps/web/app/api/consult/route.ts`
  - co the giu nguyen cho text,
  - chi bo sung shared helper/routing neu can.

- `.env.example` hoac tai lieu deploy
  - them `OPENAI_VISION_MODEL` va cau hinh gioi han anh.

### 6.10. Thu tu trien khai khuyen nghi

1. Tao helper xu ly anh server-side:
   - validate file,
   - resize,
   - nen,
   - convert sang base64/data URL phu hop OpenAI.

2. Tao endpoint `/api/consult/image`.

3. Them prompt vision va goi OpenAI.

4. Test endpoint bang request thu cong voi 1 anh mau.

5. Them UI upload anh trong chatbox.

6. Render preview anh va tin nhan anh trong chat history.

7. Them loading state khi phan tich anh.

8. Them loi ro rang cho:
   - anh qua lon,
   - sai dinh dang,
   - API loi,
   - het credit/quota,
   - qua rate limit.

9. Them rate limit rieng cho anh.

10. Log usage/cost neu OpenAI tra usage.

11. Test cac case thuc te:
   - reu vang,
   - cay heo,
   - moc trang,
   - kinh dong suong,
   - be qua kho,
   - setup/bo cuc,
   - anh mo/thieu sang,
   - hoi chinh sach kem anh,
   - hoi gia san pham kem anh.

12. Commit, push va redeploy.

13. Test live tren `tiemreudecor.com`.

### 6.11. Tieu chi nghiem thu

Tinh nang dat yeu cau khi:

- User gui duoc anh trong chatbox.
- Chatbox hien thi anh trong lich su chat.
- GPT tra loi duoc tinh trang be/cay/reu dua tren anh.
- Cau tra loi khong chung chung, co nguyen nhan va buoc xu ly cu the.
- GPT khong tu bia chinh sach/gia/bao hanh.
- Anh duoc resize/nen truoc khi gui API.
- Co gioi han so anh de tranh ton phi.
- Khi API loi, user nhan duoc thong bao ro rang.
- Text chat hien tai van hoat dong binh thuong.
