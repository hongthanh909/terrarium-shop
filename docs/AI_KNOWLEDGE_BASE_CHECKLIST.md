# AI Knowledge Base Checklist — Tiệm Rêu Décor

Mục tiêu: phủ càng nhiều câu hỏi thường gặp càng tốt để chatbot trả lời nhanh từ KB/admin DB. Ollama chỉ dùng khi câu hỏi chưa có case rõ.

## Quy ước khi thêm KB

Mỗi case nên có:

- Ý định chính của user.
- Ví dụ câu hỏi thật.
- Từ khóa nên match.
- Từ khóa/triệu chứng phân biệt với case khác.
- Câu trả lời gồm: kiểm tra nhanh → nguyên nhân → cách xử lý từng bước → khi nào cần gửi ảnh/shop.

## Nhóm 1 — Tưới nước

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã thêm | Cách tưới cây cơ bản | tưới nước ntn, tưới cây như thế nào, phun sương sao |
| Đã thêm | Bao lâu tưới một lần | mấy ngày tưới, một tuần tưới mấy lần |
| Đã thêm | Tưới bể kín | bể kín tưới sao, bể có nắp có cần tưới không |
| Đã thêm | Tưới bể mở | bể mở tưới sao, bể không nắp tưới thế nào |
| Đã thêm | Dấu hiệu cần tưới | làm sao biết thiếu nước, khi nào cần tưới |
| Đã thêm | Dấu hiệu tưới dư | đất ướt quá, tưới nhiều quá, dư nước |
| Đã có | Úng nước / lỡ tưới nhiều | lỡ tưới nhiều, đất sũng nước, nước đọng đáy |
| Cần bổ sung | Tưới bằng nước gì | dùng nước máy được không, nước lọc hay nước mưa |
| Cần bổ sung | Tưới sau khi mới nhận hàng | mới nhận có cần tưới không |

## Nhóm 2 — Ánh sáng / vị trí đặt

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Ánh sáng chung | đặt bể ở đâu, cần ánh sáng không |
| Đã có | Cháy lá do nắng | lá cháy, để nắng bị héo |
| Cần bổ sung | Ánh sáng gián tiếp là gì | ánh sáng gián tiếp là sao |
| Cần bổ sung | Có để gần cửa sổ được không | để cửa sổ được không |
| Cần bổ sung | Phòng tối | phòng em tối có nuôi được không |
| Cần bổ sung | Dùng đèn LED/grow light | dùng đèn bàn được không |

## Nhóm 3 — Mốc / nấm / mùi

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Mốc chung | bể bị mốc, nấm trắng |
| Đã có | Bể có mùi hôi | bể hôi, đất có mùi |
| Cần bổ sung | Mốc trắng trên đất | đất có mốc trắng |
| Cần bổ sung | Mốc trên gỗ/lũa | gỗ trong bể bị mốc |
| Cần bổ sung | Mốc trên rêu | rêu bị mốc trắng |
| Cần bổ sung | Có dùng bột quế không | rắc quế được không |
| Cần bổ sung | Có xịt thuốc nấm không | xịt thuốc nấm được không |

## Nhóm 4 — Vàng lá / héo / rụng lá

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Vàng lá chung | cây vàng lá, rêu vàng |
| Đã có | Héo/rũ chung | cây héo, lá rũ |
| Đã có | Rụng lá/sốc môi trường | cây rụng lá, mới nhận bị rụng |
| Cần bổ sung | Lá vàng mềm do úng | lá vàng mềm, đất còn ướt |
| Cần bổ sung | Lá vàng khô do thiếu nước/nắng | lá vàng khô, mép lá khô |
| Cần bổ sung | Héo nhưng đất ướt | cây héo mà đất ướt |
| Cần bổ sung | Héo nhưng đất khô | cây héo đất khô |
| Cần bổ sung | Có nên cắt lá vàng không | lá vàng có cần cắt không |

## Nhóm 5 — Rêu

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Rêu nâu/đen/chết | rêu nâu, rêu đen |
| Cần bổ sung | Rêu vàng | rêu vàng xử lý sao |
| Cần bổ sung | Rêu khô giòn | rêu bị khô giòn |
| Cần bổ sung | Rêu mọc lan quá dày | rêu mọc dày quá |
| Cần bổ sung | Có thay rêu được không | thay rêu sao |

## Nhóm 6 — Côn trùng

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Côn trùng chung | có sâu, kiến, ruồi nhỏ |
| Cần bổ sung | Ruồi nhỏ/fungus gnats | ruồi nhỏ bay quanh bể |
| Cần bổ sung | Kiến trong bể | bể có kiến |
| Cần bổ sung | Springtails/bọ trắng | bọ trắng nhỏ có hại không |
| Cần bổ sung | Có xịt thuốc sâu không | xịt thuốc sâu được không |

## Nhóm 7 — Nền / đất / đáy bể

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Nước đọng đáy / úng | đáy bể có nước |
| Cần bổ sung | Đất bị lún/xẹp | đất bị xẹp |
| Cần bổ sung | Than hoạt tính để làm gì | than trong bể để làm gì |
| Cần bổ sung | Có cần thay đất không | bao lâu thay đất |
| Cần bổ sung | Lớp sỏi đáy để làm gì | sỏi dưới đáy có tác dụng gì |

## Nhóm 8 — Theo loại cây

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Fittonia/cẩm nhung | cẩm nhung héo |
| Đã có | Dương xỉ | dương xỉ vàng/héo |
| Đã có | Sen đá/xương rồng | sen đá trong bể kín được không |
| Cần bổ sung | Peperomia | peperomia chăm sao |
| Cần bổ sung | Cỏ ngọc | cỏ ngọc bị vàng |
| Cần bổ sung | Cây không khí/tillandsia | cây không khí tưới sao |

## Nhóm 9 — Sau vận chuyển / bảo hành

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Chăm sóc 7 ngày đầu | mới nhận chăm sao |
| Đã có | Bể xô lệch | nhận hàng bị lệch |
| Đã có | Khi nào gửi ảnh/video | cần gửi hình không |
| Cần bổ sung | Cây sốc sau ship | mới nhận cây hơi rũ |
| Cần bổ sung | Bể vỡ khi nhận | nhận hàng bể vỡ |
| Cần bổ sung | Quay video mở hàng | có cần quay video không |

## Nhóm 10 — Tư vấn chọn mua

| Trạng thái | Case | Ví dụ câu hỏi |
|---|---|---|
| Đã có | Người mới nên chọn gì | mới chơi nên mua bể nào |
| Đã có | Quà tặng | tặng sinh nhật nên chọn gì |
| Cần bổ sung | Bể để bàn làm việc | để bàn làm việc chọn mẫu nào |
| Cần bổ sung | Bể cho phòng máy lạnh | văn phòng máy lạnh nên chọn loại nào |
| Cần bổ sung | Chọn theo ngân sách | tầm 300k/500k/1tr mua gì |
| Cần bổ sung | Size bể | nên mua size nhỏ hay lớn |
