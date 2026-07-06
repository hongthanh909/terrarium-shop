# KB review cho Chatbox Rêu

Mục tiêu của file này: kiểm kê Knowledge Base hiện tại, phân loại vào 10 nhóm lớn, xác định phần giữ lại/sửa/xóa/bổ sung trước khi cập nhật lại DB `AiKnowledge`.

## 0. Hiện trạng nhanh

- Bảng DB local `AiKnowledge`: **0 mục**.
- Repo đang có bộ seed KB trong code:
  - `apps/web/lib/ai-knowledge-defaults.ts`
  - `apps/web/lib/ai-knowledge-additional.ts`
- Tổng seed khả dụng trong code: **52 mục**.
- Category seed hiện tại: `greeting`, `policy`, `shipping`, `general`, `care`, `product`, `system`.
- Vấn đề chính: category cũ còn quá rộng; cần chuẩn hóa lại theo 10 nhóm lớn để chatbox match đúng hơn.

Chưa cập nhật DB ở bước này.

## 1. Mười nhóm KB lớn đã chốt

1. Chào hỏi & Điều hướng
2. Chính sách Shop
3. Vận chuyển
4. Thanh toán & Đặt hàng
5. Tư vấn chọn sản phẩm
6. Chăm sóc Cơ bản
7. Xử lý Sự cố
8. Kiến thức Terrarium
9. Custom Theo Yêu Cầu
10. Quy tắc An toàn Cho Chatbox

## 2. Bản đồ seed cũ vào 10 nhóm

### 1. Chào hỏi & Điều hướng

Seed đang có:

- `xin chào, chào shop, hello, hi, tư vấn`
- `liên hệ, hotline, zalo, facebook, số điện thoại, tư vấn trực tiếp, hỗ trợ shop`
- `khi nào gửi ảnh, cần gửi hình, gửi video, shop kiểm tra, không biết bị gì, chẩn đoán cây`

Tình trạng:

- Cần giữ nhưng viết lại giọng thống nhất.
- Cần thêm case "không hiểu câu hỏi", "cần khách nói rõ hơn", "cần gửi ảnh/video".
- Cần cập nhật kênh liên hệ đúng: Instagram, Facebook, TikTok, hotline nếu shop chốt.

### 2. Chính sách Shop

Seed đang có:

- `đổi trả, bảo hành, cây hư, cây chết, hàng vỡ, bể vỡ, sản phẩm lỗi, hoàn hàng`

Tình trạng:

- Có nền tảng, nhưng cần tách thành nhiều case nhỏ:
  - bảo hành cây/rêu
  - đổi trả do vận chuyển
  - không bảo hành do chăm sai
  - cần video mở hàng
  - quy trình gửi ảnh/video cho shop
- Cần shop chốt chính sách chính xác theo ngày/điều kiện.

### 3. Vận chuyển

Seed đang có:

- `giao hàng, ship, vận chuyển, phí ship, bao lâu nhận hàng, giao tới tỉnh, ship tỉnh, nội thành`
- `freeship, miễn phí ship, miễn phí vận chuyển, đơn bao nhiêu được freeship`
- `bể bị xô lệch, vận chuyển bị lệch, cây bị đổ, nhận hàng bị lệch, bố cục bị xê dịch`

Tình trạng:

- Có nền tảng tốt.
- Cần tách rõ:
  - thời gian giao HCM
  - thời gian giao tỉnh
  - phí ship/freeship
  - đóng gói terrarium
  - xử lý khi hàng xô lệch/vỡ
- Không trả tracking link trong chatbox theo quyết định DB đã chốt.

### 4. Thanh toán & Đặt hàng

Seed đang có:

- `thanh toán, cod, trả tiền, chuyển khoản, momo, banking, thanh toán online, nhận hàng trả tiền`
- `cách đặt hàng, mua hàng, đặt hàng sao, order, làm sao để mua, thêm vào giỏ`

Tình trạng:

- Cần giữ nhưng phải đồng bộ với checkout hiện tại.
- Nếu hiện chỉ COD thì KB phải nói rõ, không mở lời chuyển khoản/Momo nếu web chưa hỗ trợ.
- Tra cứu đơn hàng đã chuyển sang DB bằng SĐT; KB chỉ giải thích cách dùng, không tự trả trạng thái đơn.

### 5. Tư vấn chọn sản phẩm

Seed đang có:

- `người mới, lần đầu chơi, mới mua terrarium, dễ chăm, bể dễ chăm, newbie, beginner`
- `người mới, lần đầu chơi terrarium, mới bắt đầu, dễ chăm, ít chăm, bận rộn, không biết chăm cây`
- `quà tặng, tặng sinh nhật, tân gia, quà bạn gái, quà bạn trai, quà decor, quà văn phòng`
- `quà tặng, sinh nhật, tân gia, bạn gái, bạn trai, đồng nghiệp, sếp, quà decor, quà văn phòng`
- `sản phẩm giá rẻ, bể giá rẻ, mẫu rẻ nhất, giá tốt, bình dân, tiết kiệm, ngân sách thấp, sản phẩm rẻ`
- `sản phẩm cao cấp, mẫu đẹp nhất, mẫu sang, premium, decor phòng khách, làm điểm nhấn, mẫu nổi bật`
- `để bàn làm việc, bàn học, văn phòng, phòng máy lạnh, điều hòa, đặt ở công ty, góc làm việc`
- `phòng ngủ, kệ đầu giường, phòng tối, ít ánh sáng, thiếu sáng, đặt trong phòng kín`
- `so sánh sản phẩm, mẫu nào tốt hơn, nên chọn mẫu nào, bể mini hay bể cơ bản, bể kín hay bể mở`
- `còn mẫu nào nữa không, mẫu khác, rẻ hơn, cao hơn, còn loại nào, thêm sản phẩm, gợi ý thêm`
- `hỏi giá, sản phẩm dưới 1tr, dưới 1 triệu, dưới 1000000, dưới 1.000.000, tầm 500k, khoảng 500k, ngân sách, không quá 1tr`
- `hết hàng, còn hàng, tồn kho, còn mẫu này không, khi nào có lại hàng, đặt trước được không`

Tình trạng:

- Có nhiều case tốt, nhưng đang trùng người mới/quà tặng.
- Những câu về giá, tồn kho, còn hàng phải ưu tiên DB, KB chỉ là quy tắc điều hướng.
- Cần gắn với field DB mới: `setupStatus`, `careLevel`, `chatTags`, `shortConsultNote`.
- Cần thêm case "bể đã setup sẵn", "DIY kit", "custom order" rõ hơn.

### 6. Chăm sóc Cơ bản

Seed đang có:

- `tưới nước, bao lâu tưới, tưới terrarium, bể bị khô, chăm sóc nước, phun sương`
- `cách tưới cây, tưới cây như thế nào, tưới nước ntn, tưới như thế nào, phun sương như thế nào, hướng dẫn tưới cây`
- `bao lâu tưới một lần, mấy ngày tưới, một tuần tưới mấy lần, lịch tưới nước, tần suất tưới, khi nào tưới`
- `tưới bể kín, bể kín tưới sao, bể có nắp tưới không, terrarium kín tưới nước, chăm bể kín`
- `tưới bể mở, bể mở tưới sao, terrarium mở tưới nước, chăm bể mở, bể không nắp tưới`
- `dấu hiệu cần tưới, làm sao biết thiếu nước, khi nào cần tưới, cây cần nước, bể thiếu nước, đất khô có cần tưới`
- `ánh sáng, để ở đâu, đặt bể ở đâu, nắng, phòng tối, đèn, ánh sáng gián tiếp`
- `chăm sóc 7 ngày đầu, mới nhận hàng, sau khi nhận bể, mới mua về, chăm sóc ban đầu`
- `phòng máy lạnh, điều hòa, máy lạnh, để trong phòng lạnh, gió điều hòa, văn phòng máy lạnh`
- `cắt tỉa, cây mọc um tùm, rêu mọc dày, cây quá to, tỉa lá, cắt cây`

Tình trạng:

- Đây là nhóm seed mạnh nhất.
- Cần gom bớt trùng giữa các câu tưới nước.
- Cần chuẩn hóa format trả lời: nguyên nhân, cách kiểm tra, cách xử lý, khi nào gửi ảnh/video.

### 7. Xử lý Sự cố

Seed đang có:

- `dấu hiệu tưới dư, làm sao biết tưới nhiều, tưới nhiều quá, dư nước, đất ướt quá, lỡ tưới nhiều`
- `mốc, nấm mốc, bể bị mốc, mốc trắng, nấm trắng, rêu bị mốc`
- `rêu vàng, lá vàng, cây vàng lá, cây úa, cây bị vàng, rêu bị úa`
- `cây héo, lá héo, cây bị héo, cây bị rũ, lá bị rũ, cây mềm lá, héo mềm, cây thiếu nước`
- `sâu, bọ, kiến, ruồi nhỏ, côn trùng, bọ trong bể, ruồi trong terrarium`
- `úng nước, tưới quá nhiều, đất sũng nước, bể bị úng, cây bị úng, nước đọng đáy, dư nước`
- `thối rễ, rễ thối, cây thối gốc, gốc bị mềm, thân bị nhũn, cây bị nhũn, cây chết gốc`
- `sương đọng, đọng hơi nước, kính mờ, thành kính ướt, bể nhiều hơi nước, bể kín đọng nước`
- `bể bị khô, đất khô, rêu khô, thiếu ẩm, cây thiếu nước, lá héo khô, rêu giòn`
- `cháy lá, lá bị cháy, nắng trực tiếp, cây bị nắng, lá khô mép, lá nâu mép, bể bị nóng`
- `rêu nâu, rêu đen, rêu chết, rêu khô nâu, rêu đổi màu, rêu bị thâm`
- `lá rụng, rụng lá, cây rụng lá, lá rơi, cây trụi lá, cây bị sốc`
- `mùi hôi, bể bị hôi, mùi ẩm, mùi thối, đất có mùi, terrarium có mùi`
- `cây mọc dài, cây vươn cao, cây vươn sáng, cây bị cao, cây ốm yếu, thiếu sáng`
- `fittonia, cẩm nhung, fitonia héo, cẩm nhung héo, lá cẩm nhung rũ, cây cẩm nhung`
- `dương xỉ, dương xỉ héo, dương xỉ khô, lá dương xỉ vàng, fern`

Tình trạng:

- Phủ khá rộng.
- Cần tách "triệu chứng" và "loài cây cụ thể" để tránh match nhầm.
- Cần thêm mức cảnh báo: nhẹ thì tự xử lý, nặng thì gửi ảnh/video.
- Không khuyên dùng thuốc mạnh trong bể.

### 8. Kiến thức Terrarium

Seed đang có:

- `terrarium là gì, bể terrarium, hệ sinh thái mini, bể cây, vườn trong lọ`
- `bể kín, bể mở, hệ kín, hệ mở, kín hay mở, loại terrarium`
- `sen đá, xương rồng, succulent, cactus, sen đá trong bể kín, xương rồng trong terrarium`

Tình trạng:

- Cần thêm kiến thức nền:
  - lớp sỏi, than hoạt tính, đất, rêu để làm gì
  - bể kín tự tuần hoàn như thế nào
  - vì sao không đặt nắng trực tiếp
  - springtails/isopods nếu shop có dùng
  - DIY terrarium cơ bản

### 9. Custom Theo Yêu Cầu

Seed đang có:

- `custom, thiết kế theo yêu cầu, làm theo mẫu riêng, đặt mẫu riêng, size riêng, theo phong thủy, theo chủ đề`

Tình trạng:

- Có một entry cơ bản.
- Cần shop chốt:
  - có nhận custom không
  - thời gian làm
  - cần khách gửi gì
  - có báo giá trước không
  - có đặt cọc không
  - khoảng giá custom

### 10. Quy tắc An toàn Cho Chatbox

Seed đang có:

- `vai trò ollama, ollama làm gì, ai trả lời gì, flow chatbot, kb trước hay ollama trước, knowledge base dùng khi nào`
- `hỏi giá... ngân sách...`
- `hết hàng, còn hàng, tồn kho...`
- `khi nào gửi ảnh, cần gửi hình, gửi video...`

Tình trạng:

- Cần chuyển từ nội dung khách thấy sang rule nội bộ/API.
- Không nên để khách đọc câu "vai trò ollama" như một KB bán hàng.
- Cần rule rõ:
  - DB trả giá/tồn kho/đơn hàng
  - KB trả chính sách/chăm sóc/sự cố
  - GPT chỉ diễn giải
  - không search web ngoài
  - không chẩn đoán chắc khi thiếu ảnh
  - không lộ thông tin nhạy cảm đơn hàng

## 3. Trùng lặp cần xử lý

- Người mới: có 2 entry gần giống nhau.
- Quà tặng: có 2 entry gần giống nhau.
- Tưới nước: nhiều entry cần giữ nhưng cần phân tầng rõ:
  - cách tưới chung
  - tần suất
  - bể kín
  - bể mở
  - dấu hiệu thiếu nước
  - dấu hiệu dư nước
- Sản phẩm/giá/tồn kho: một số entry đang là quy tắc DB, không nên trả như KB nội dung cho khách.

## 4. Thiếu case quan trọng

### Chào hỏi & Điều hướng

- Không hiểu câu hỏi.
- Khách hỏi ngoài phạm vi shop/terrarium.
- Khách cần gửi ảnh/video.
- Khách hỏi "Rêu là ai".

### Chính sách Shop

- Bảo hành cụ thể bao nhiêu ngày.
- Điều kiện bảo hành cây/rêu.
- Điều kiện không bảo hành.
- Đổi trả khi bể vỡ/xô lệch.
- Quy trình tiếp nhận khiếu nại.

### Vận chuyển

- Hỏa tốc nội thành.
- Đóng gói chống xô lệch.
- Hàng tỉnh có rủi ro gì.
- Khách nhận hàng cần kiểm tra gì.

### Thanh toán & Đặt hàng

- Hủy đơn.
- Đổi địa chỉ/SĐT sau khi đặt.
- Voucher/mã giảm giá.
- Tra cứu đơn bằng SĐT.

### Tư vấn chọn sản phẩm

- Bể đã setup sẵn.
- DIY kit.
- Bể cho người ít thời gian chăm.
- Bể cho phòng ít sáng.
- Bể cho văn phòng máy lạnh.
- Bể theo ngân sách cụ thể.

### Chăm sóc Cơ bản

- Vệ sinh kính.
- Mở nắp/thông khí định kỳ.
- Có cần thay đất/rêu không.
- Bao lâu nên kiểm tra bể.

### Xử lý Sự cố

- Đọng nước dưới đáy.
- Rêu/cây bị đen.
- Cây mọc quá rậm.
- Có mùi hôi nặng.
- Sốc vận chuyển.

### Kiến thức Terrarium

- Cấu tạo lớp nền.
- Bể kín tự tuần hoàn.
- Vì sao cần than hoạt tính.
- Vì sao không đặt nắng trực tiếp.
- Terrarium khác chậu cây thường thế nào.

### Custom Theo Yêu Cầu

- Quy trình custom.
- Thời gian hoàn thiện.
- Khách cần gửi ảnh mẫu/kích thước/ngân sách.
- Có duyệt mẫu trước không.

### Quy tắc An toàn

- Không trả giá/tồn kho nếu không từ DB.
- Không nói tổng tiền/tracking/địa chỉ trong chatbox.
- Không hướng dẫn thuốc/hóa chất mạnh.
- Không cam kết bảo hành ngoài chính sách.
- Không search web ngoài.

## 5. Kế hoạch làm KB sau audit

### Bước 1: Chốt 10 nhóm lớn

Trạng thái: đã chốt khung, đang audit.

### Bước 2: Viết lại taxonomy category

Đề xuất category mới cho DB:

- `greeting`
- `policy_warranty`
- `policy_shipping`
- `policy_payment_order`
- `product_consult`
- `care_basic`
- `care_troubleshooting`
- `terrarium_knowledge`
- `custom_order`
- `chat_safety`

### Bước 3: Viết lại từng nhóm

Đi theo thứ tự:

1. Chào hỏi & Điều hướng
2. Chính sách Shop
3. Vận chuyển
4. Thanh toán & Đặt hàng
5. Tư vấn chọn sản phẩm
6. Chăm sóc Cơ bản
7. Xử lý Sự cố
8. Kiến thức Terrarium
9. Custom Theo Yêu Cầu
10. Quy tắc An toàn

### Bước 4: Đưa vào DB

Sau khi anh chốt nội dung, mới seed/upsert vào `AiKnowledge`.

### Bước 5: Sửa API match KB

Sau khi KB chuẩn:

- API match theo category mới.
- Câu chính sách trả trực tiếp từ KB.
- Câu chăm sóc/sự cố rõ thì trả trực tiếp từ KB.
- Câu mơ hồ thì lấy KB liên quan đưa GPT diễn giải.
- Câu giá/tồn kho/đơn hàng vẫn đi DB.

## 6. Kết luận bước 1

DB KB local hiện rỗng, nên không nên "tiếp tục DB KB cũ" theo nghĩa live data. Ta nên dùng seed code hiện có làm nguyên liệu, viết lại theo 10 nhóm lớn rồi nạp vào DB sau khi duyệt.
