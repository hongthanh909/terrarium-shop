# KB cases cho Chatbox Rêu

File này là bản chi tiết từng case để sau này seed/upsert vào DB `AiKnowledge`.

Quy ước mỗi case:

- `caseId`: mã ổn định để quản lý nội dung.
- `group`: nhóm KB lớn.
- `category`: category đề xuất trong DB.
- `keywords`: keyword/từ viết tắt/sai dấu/sai chính tả nhẹ.
- `priority`: độ ưu tiên match.
- `directAnswer`: nếu `yes` thì API có thể trả trực tiếp từ KB.
- `gptRewrite`: nếu `yes` thì GPT có thể diễn giải lại dựa trên KB.
- `response`: câu trả lời chuẩn.

## Group 1: Chào hỏi & Điều hướng

Trạng thái: **đã chốt bản nháp để chuyển sang bước seed/upsert sau khi hoàn tất toàn bộ KB**.

Nguyên tắc trả lời cho Group 1:

- Nếu user chỉ chào ngắn (`hi`, `hello`, `alo`, `shop ơi`) thì trả lời ngắn, thân thiện và hỏi user cần hỗ trợ gì.
- Nếu user đã nói rõ nhu cầu (`need advice`, `tư vấn bể mini`, `check order`) thì không trả lời chào chung; phải đi thẳng vào nhu cầu đó.
- Nếu user dùng tiếng Anh đơn giản, Rêu có thể hiểu keyword tiếng Anh nhưng vẫn trả lời bằng tiếng Việt thân thiện.
- Nếu câu hỏi mơ hồ (`help`, `idk`, `không biết sao`) thì hỏi lại 1-2 thông tin cần thiết, không đổ một danh sách quá dài.
- Nếu user hỏi ngoài phạm vi shop/terrarium thì từ chối nhẹ và kéo về các nội dung Rêu hỗ trợ được.
- Giọng văn: gần gũi, ngắn gọn, giống nhân viên shop đang chat; tránh văn quá máy móc như FAQ.

### Case: greeting_hello

- `caseId`: `greeting_hello`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `100`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - xin chào
  - chào
  - chào shop
  - chào rêu
  - rêu ơi
  - shop ơi
  - alo
  - aloo
  - có ai không
  - co ai khong
  - shop còn không
  - shop con khong
  - còn ai không
  - con ai khong
  - anyone here
  - are you there
  - hello
  - helloo
  - hi
  - hey
  - hi shop
  - hello shop
  - hi reu
  - hello reu
  - helo
  - halo
  - hiii
  - yo
  - sup
  - tư vấn
  - tu van
  - tv
  - tvan
  - consult
  - consultation
  - cần tư vấn
  - can tu van
  - hỗ trợ
  - ho tro
  - support
  - need help
  - help
  - e ơi
  - em ơi
  - ad ơi
  - admin ơi

`response`:

Dạ Rêu đây ạ. Anh/chị cần em hỗ trợ gì cho terrarium hoặc đơn hàng hôm nay?

Em có thể giúp nhanh mấy phần này:
- Chọn mẫu terrarium theo nhu cầu/ngân sách
- Xem sản phẩm, giá, tồn kho
- Tra cứu đơn hàng bằng SĐT đã đặt
- Hỏi cách chăm sóc, tưới nước, xử lý mốc/vàng lá/héo cây
- Hỏi chính sách giao hàng, thanh toán, bảo hành

Anh/chị cứ nhắn ngắn thôi cũng được, ví dụ: “bể mini dưới 500k”, “đơn của mình tới đâu”, hoặc “rêu bị vàng lá”.

### Case: greeting_who_are_you

- `caseId`: `greeting_who_are_you`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - bạn là ai
  - ban la ai
  - rêu là ai
  - reu la ai
  - chatbox là gì
  - what is this
  - who are you
  - who r u
  - what can you do
  - can you help me
  - chatbot là gì
  - ai đây
  - ai day
  - đây là ai
  - day la ai
  - trợ lý là ai
  - tro ly la ai
  - bạn làm được gì
  - ban lam duoc gi
  - có thể giúp gì
  - co the giup gi

`response`:

Dạ em là Rêu, trợ lý chat của Tiệm Rêu Décor ạ.

Nói đơn giản là anh/chị hỏi gì liên quan tới terrarium và shop thì Rêu sẽ cố gắng hỗ trợ trước:
- Muốn mua bể nào hợp ngân sách
- Sản phẩm còn hàng không, giá bao nhiêu
- Đơn hàng đang ở trạng thái nào
- Bể/cây/rêu đang gặp vấn đề thì xử lý bước đầu ra sao
- Chính sách giao hàng, thanh toán, bảo hành thế nào

Nếu vấn đề liên quan tình trạng cây hoặc bể thật tế, anh/chị gửi thêm ảnh/video thì Rêu sẽ hướng dẫn sát hơn.

### Case: greeting_need_consult

- `caseId`: `greeting_need_consult`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - cần tư vấn
  - can tu van
  - tư vấn giúp
  - tu van giup
  - tư vấn với
  - consult me
  - need consult
  - need advice
  - advise me
  - recommend
  - recommendation
  - suggest
  - suggestion
  - tv giúp
  - tv voi
  - tvan giúp
  - cần hỗ trợ
  - can ho tro
  - hỗ trợ với
  - ho tro voi
  - mình muốn hỏi
  - minh muon hoi
  - hỏi chút
  - hoi chut
  - cho hỏi
  - cho hoi

`response`:

Dạ được ạ. Anh/chị đang muốn Rêu tư vấn theo hướng nào trước?

- Chọn bể để mua/tặng
- Tìm mẫu theo tầm giá
- Hỏi cách chăm hoặc xử lý bể đang lỗi
- Hỏi chính sách giao hàng/bảo hành/thanh toán
- Tra cứu đơn hàng đã đặt

Nếu anh/chị chưa biết bắt đầu từ đâu, cứ gửi cho Rêu 3 ý: ngân sách khoảng bao nhiêu, đặt ở đâu, mua dùng hay tặng. Rêu sẽ gợi ý tiếp.

### Case: greeting_thanks

- `caseId`: `greeting_thanks`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `90`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - cảm ơn
  - cam on
  - cám ơn
  - thanks
  - thx
  - ty
  - thank u
  - thank you
  - tks
  - thank
  - ok cảm ơn
  - oke cảm ơn
  - ổn rồi
  - on roi
  - được rồi
  - duoc roi
  - ok rồi
  - okay
  - okay thanks
  - got it
  - noted
  - oke roi

`response`:

Dạ vâng ạ. Khi nào cần xem thêm mẫu, hỏi đơn hàng hoặc chăm bể thì anh/chị cứ nhắn Rêu tiếp nhé.

### Case: greeting_goodbye

- `caseId`: `greeting_goodbye`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `88`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - tạm biệt
  - tam biet
  - bye
  - bai
  - bb
  - cya
  - see you
  - see ya
  - talk later
  - good bye
  - goodbye
  - hẹn gặp lại
  - hen gap lai
  - xong rồi
  - xong roi
  - không hỏi nữa
  - khong hoi nua

`response`:

Dạ Rêu chào anh/chị nhé. Khi nào cần tư vấn thêm về terrarium, sản phẩm hoặc đơn hàng thì cứ quay lại nhắn Rêu ạ.

### Case: guidance_unclear_question

- `caseId`: `guidance_unclear_question`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `80`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - không hiểu
  - khong hieu
  - không biết hỏi sao
  - khong biet hoi sao
  - hỏi sao nhỉ
  - hoi sao nhi
  - tư vấn gì cũng được
  - tu van gi cung duoc
  - giúp với
  - giup voi
  - help me
  - confused
  - not sure
  - idk
  - dont know
  - don't know
  - how
  - how to
  - what should i do
  - cứu với
  - cuu voi
  - ntn
  - như nào
  - nhu nao
  - sao ta
  - bị gì không biết
  - bi gi khong biet

`response`:

Dạ không sao ạ. Anh/chị cứ mô tả tự nhiên vài chữ trước, Rêu sẽ hỏi thêm nếu còn thiếu thông tin.

Gợi ý nhanh:
- Muốn mua bể: nói ngân sách, vị trí đặt, mua dùng hay tặng
- Bể đang có vấn đề: nói bể kín/mở, bị gì, lần tưới gần nhất
- Cần tra đơn: gửi SĐT đã đặt hàng
- Không biết cây/bể bị gì: gửi thêm ảnh hoặc video

Ví dụ anh/chị có thể nhắn: “bể bị mốc”, “tư vấn bể tặng sinh nhật”, “kiểm tra đơn bằng sđt”.

### Case: guidance_need_photo_video

- `caseId`: `guidance_need_photo_video`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `92`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - gửi ảnh
  - gui anh
  - gửi hình
  - gui hinh
  - gửi video
  - gui video
  - send photo
  - send image
  - send picture
  - send video
  - upload photo
  - upload image
  - check photo
  - cần gửi ảnh không
  - can gui anh khong
  - shop kiểm tra
  - shop kiem tra
  - xem giúp
  - xem giup
  - check giúp
  - check giup
  - không biết bị gì
  - khong biet bi gi
  - cây bị gì
  - cay bi gi
  - bể bị gì
  - be bi gi

`response`:

Dạ được ạ. Nếu cây/rêu/bể đang có dấu hiệu lạ, anh/chị gửi ảnh hoặc video sẽ dễ kiểm tra hơn nhiều.

Anh/chị gửi giúp Rêu mấy thông tin này nhé:
- Ảnh toàn cảnh bể
- Ảnh cận phần cây/rêu đang bị vấn đề
- Video ngắn nếu có nước đọng, mốc lan, cây rũ hoặc bể bị xô lệch
- Cho biết lần tưới gần nhất và vị trí đặt bể

Nhìn được tình trạng thật tế thì Rêu mới tránh tư vấn nhầm, nhất là các lỗi giống nhau như úng, thiếu ẩm, mốc hoặc sốc môi trường.

### Case: guidance_contact_shop

- `caseId`: `guidance_contact_shop`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `88`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - liên hệ
  - lien he
  - contact
  - contact shop
  - contact us
  - social
  - social media
  - fanpage
  - hotline
  - số điện thoại
  - so dien thoai
  - sdt
  - facebook
  - fb
  - instagram
  - insta
  - ig
  - tiktok
  - tik tok
  - zalo
  - gặp shop
  - gap shop
  - nhắn shop
  - nhan shop
  - tư vấn trực tiếp
  - tu van truc tiep

`response`:

Dạ anh/chị có thể nhắn Tiệm Rêu Décor qua các kênh này nhé:

- Facebook: https://www.facebook.com/tiemreudecor
- Instagram: https://www.instagram.com/tiemreudecor/
- TikTok: `tiemreudecor`
- Website: `tiemreudecor.com`

Nếu muốn shop xem tình trạng bể/cây, anh/chị gửi kèm ảnh hoặc video ngay từ đầu để shop kiểm tra nhanh hơn.

### Case: guidance_order_lookup_intro

- `caseId`: `guidance_order_lookup_intro`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `90`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - tra cứu đơn
  - tra cuu don
  - order
  - my order
  - order status
  - check order
  - track order
  - tracking
  - delivery status
  - shipment
  - kiểm tra đơn
  - kiem tra don
  - đơn hàng của tôi
  - don hang cua toi
  - đơn của mình
  - don cua minh
  - tình trạng đơn
  - tinh trang don
  - trạng thái đơn
  - trang thai don
  - hàng tới đâu
  - hang toi dau
  - đơn tới đâu
  - don toi dau

`response`:

Dạ được ạ. Anh/chị gửi giúp Rêu **SĐT đã dùng khi đặt hàng** để em kiểm tra trạng thái đơn.

Rêu chỉ báo trạng thái đơn bằng tiếng Việt và sẽ ẩn thông tin nhạy cảm như địa chỉ, SĐT, email, tổng tiền và tracking link để bảo mật cho anh/chị.

### Case: guidance_consult_by_profile

- `caseId`: `guidance_consult_by_profile`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `product_consult`
- `priority`: `93`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - tôi là sinh viên
  - toi la sinh vien
  - mình là sinh viên
  - minh la sinh vien
  - student
  - college student
  - university student
  - nhân viên văn phòng
  - nhan vien van phong
  - dân văn phòng
  - dan van phong
  - office worker
  - office staff
  - freelancer
  - làm freelance
  - lam freelance
  - work from home
  - wfh
  - remote worker
  - làm ở nhà
  - lam o nha
  - người mới đi làm
  - nguoi moi di lam
  - bàn làm việc
  - ban lam viec
  - desk setup
  - góc làm việc
  - goc lam viec

`response`:

Dạ được ạ, trường hợp này Rêu sẽ tư vấn theo nhu cầu dùng thật của anh/chị.

Anh/chị cho Rêu thêm 2 ý là đủ để gợi ý sát hơn:
- Ngân sách khoảng bao nhiêu?
- Bể đặt ở đâu: bàn học, bàn làm việc, phòng ngủ, quầy/kệ hay góc decor?

Nếu anh/chị là sinh viên, dân văn phòng hoặc freelancer thì Rêu thường ưu tiên mẫu gọn, dễ chăm, sạch bàn và nhìn thư giãn khi học/làm việc. Phần gợi ý sản phẩm chi tiết sẽ đi theo nhóm `Tư vấn chọn sản phẩm`.

### Case: guidance_consult_by_budget_or_gift

- `caseId`: `guidance_consult_by_budget_or_gift`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `product_consult`
- `priority`: `94`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - dưới 300k
  - duoi 300k
  - dưới 500k
  - duoi 500k
  - khoảng 500k
  - khoang 500k
  - tầm giá
  - tam gia
  - budget
  - my budget
  - under 500k
  - under 1m
  - affordable
  - cheap
  - giá rẻ
  - gia re
  - mua tặng
  - mua tang
  - làm quà
  - lam qua
  - gift
  - present
  - sinh nhật
  - sinh nhat
  - anniversary
  - khai trương
  - khai truong
  - để bàn
  - de ban
  - desk
  - decor desk

`response`:

Dạ nhu cầu này Rêu sẽ chuyển sang tư vấn sản phẩm phù hợp theo ngân sách/mục đích.

Anh/chị cho Rêu biết thêm một chút nhé:
- Mua dùng hay mua tặng?
- Muốn bể nhỏ gọn, nổi bật để decor, hay dễ chăm nhất?
- Nếu có tầm giá cụ thể, anh/chị gửi luôn để Rêu lọc mẫu sát hơn.

Sau đó Rêu sẽ dựa vào sản phẩm, giá và tồn kho hiện có của shop để gợi ý.

### Case: guidance_human_agent

- `caseId`: `guidance_human_agent`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `89`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - gặp người thật
  - gap nguoi that
  - gặp nhân viên
  - gap nhan vien
  - nhân viên tư vấn
  - nhan vien tu van
  - nói chuyện với người
  - noi chuyen voi nguoi
  - human agent
  - real person
  - staff
  - sale
  - sales
  - tư vấn viên
  - tu van vien
  - gọi shop
  - goi shop

`response`:

Dạ được ạ. Nếu anh/chị muốn nhân viên shop hỗ trợ trực tiếp, anh/chị có thể nhắn qua:

- Facebook: https://www.facebook.com/tiemreudecor
- Instagram: https://www.instagram.com/tiemreudecor/
- TikTok: `tiemreudecor`

Nếu anh/chị vẫn muốn Rêu hỗ trợ trước, cứ gửi câu hỏi tại đây; Rêu sẽ trả lời trong phạm vi sản phẩm, đơn hàng, chính sách và chăm sóc terrarium.

### Case: guidance_language_preference

- `caseId`: `guidance_language_preference`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `greeting`
- `priority`: `82`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - nói tiếng việt
  - noi tieng viet
  - trả lời tiếng việt
  - tra loi tieng viet
  - english
  - speak english
  - can you speak english
  - tiếng anh
  - tieng anh
  - dễ hiểu hơn
  - de hieu hon
  - nói ngắn gọn
  - noi ngan gon
  - short answer
  - explain simply

`response`:

Dạ được ạ. Rêu sẽ ưu tiên trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.

Nếu anh/chị dùng vài keyword tiếng Anh như `order status`, `budget`, `gift`, `support` thì Rêu vẫn hiểu và sẽ trả lời lại bằng tiếng Việt cho dễ theo dõi.

### Case: guidance_off_scope

- `caseId`: `guidance_off_scope`
- `group`: `Chào hỏi & Điều hướng`
- `category`: `chat_safety`
- `priority`: `85`
- `directAnswer`: `yes`
- `gptRewrite`: `no`
- `keywords`:
  - hỏi ngoài terrarium
  - hoi ngoai terrarium
  - off topic
  - unrelated
  - random question
  - general question
  - không liên quan
  - khong lien quan
  - hỏi chuyện khác
  - hoi chuyen khac
  - làm bài
  - lam bai
  - viết code
  - viet code
  - chính trị
  - chinh tri
  - y tế
  - y te
  - tài chính
  - tai chinh

`response`:

Dạ phần này nằm ngoài phạm vi hỗ trợ của Rêu rồi ạ.

Rêu hỗ trợ tốt nhất các nội dung liên quan đến Tiệm Rêu Décor và terrarium như:
- Sản phẩm, giá, tồn kho
- Tra cứu đơn hàng
- Chính sách giao hàng, thanh toán, bảo hành
- Chăm sóc terrarium và xử lý sự cố cây/rêu/bể
- Tư vấn chọn mẫu theo nhu cầu hoặc ngân sách

Nếu anh/chị muốn hỏi về bể, cây, rêu, đơn hàng hoặc chính sách shop thì gửi lại câu hỏi, Rêu sẽ hỗ trợ tiếp nhé.

## Group 2: Chính sách Shop

Trạng thái: **đã chốt bản nháp để chuyển sang bước seed/upsert sau khi hoàn tất toàn bộ KB**.

Phạm vi Group 2:

- Chỉ xử lý các câu hỏi về bảo hành, đổi trả, lỗi sản phẩm, giao sai sản phẩm, khiếu nại sau nhận hàng.
- Không trả lời sâu về phí ship/thời gian giao; phần đó thuộc Group 3 `Vận chuyển`.
- Không trả lời sâu về COD/chuyển khoản/cách đặt hàng; phần đó thuộc Group 4 `Thanh toán & Đặt hàng`.
- Không tự cam kết bảo hành ngoài chính sách đã chốt.
- Với tình trạng cây/bể thật tế, luôn khuyến khích gửi ảnh/video để shop kiểm tra trước khi kết luận.

### Case: policy_warranty_general

- `caseId`: `policy_warranty_general`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `100`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - bảo hành
  - bao hanh
  - warranty
  - warranty policy
  - có bảo hành không
  - co bao hanh khong
  - bảo hành cây
  - bao hanh cay
  - bảo hành rêu
  - bao hanh reu
  - bảo hành bể
  - bao hanh be
  - cây chết có bảo hành không
  - cay chet co bao hanh khong
  - rêu chết có bảo hành không
  - reu chet co bao hanh khong

`response`:

Dạ Tiệm Rêu có hỗ trợ kiểm tra và xử lý các trường hợp sản phẩm gặp vấn đề sau khi nhận hàng.

Để shop xét đúng tình trạng, anh/chị gửi giúp:
- Ảnh/video lúc mở hàng nếu có
- Ảnh toàn cảnh bể
- Ảnh cận phần cây/rêu/bể đang lỗi
- Thời điểm nhận hàng và mô tả ngắn tình trạng

Shop sẽ kiểm tra xem lỗi đến từ vận chuyển/giao sai/sản phẩm lỗi hay do điều kiện chăm sóc sau khi nhận. Rêu không tự kết luận bảo hành khi chưa có ảnh/video vì mỗi tình trạng cây/bể có thể giống nhau nhưng nguyên nhân khác nhau.

### Case: policy_return_exchange_general

- `caseId`: `policy_return_exchange_general`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `98`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - đổi trả
  - doi tra
  - return
  - exchange
  - refund
  - hoàn hàng
  - hoan hang
  - trả hàng
  - tra hang
  - đổi sản phẩm
  - doi san pham
  - đổi bể
  - doi be
  - sản phẩm lỗi
  - san pham loi
  - lỗi sản phẩm
  - loi san pham

`response`:

Dạ shop có hỗ trợ đổi trả khi sản phẩm bị lỗi do vận chuyển, giao sai sản phẩm hoặc có vấn đề cần shop xác minh.

Anh/chị vui lòng gửi ảnh/video tình trạng sản phẩm cho shop kiểm tra trước. Nếu có video mở hàng thì càng tốt, vì video giúp xác nhận tình trạng ngay khi nhận.

Các trường hợp do chăm sóc sai hướng dẫn, làm rơi/va đập, tự ý tháo bố cục hoặc đặt sai môi trường thường sẽ không được xử lý như lỗi đổi trả.

### Case: policy_shipping_damage

- `caseId`: `policy_shipping_damage`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `99`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - hàng vỡ
  - hang vo
  - bể vỡ
  - be vo
  - vỡ kính
  - vo kinh
  - bể nứt
  - be nut
  - giao tới bị vỡ
  - giao toi bi vo
  - broken
  - damaged
  - damaged item
  - broken glass
  - shipping damage
  - cây bật gốc
  - cay bat goc
  - bể bị hư
  - be bi hu

`response`:

Dạ nếu bể bị vỡ, nứt, cây bật gốc nhiều hoặc sản phẩm hư rõ khi vừa nhận, anh/chị giữ nguyên hiện trạng và gửi shop kiểm tra ngay giúp Rêu nhé.

Anh/chị nên gửi:
- Video mở hàng nếu có
- Ảnh hộp/bao bì bên ngoài
- Ảnh toàn cảnh bể
- Ảnh cận phần vỡ/nứt/hư

Shop sẽ kiểm tra theo chính sách lỗi vận chuyển/giao hàng. Anh/chị hạn chế tự chỉnh lại bố cục trước khi chụp để shop dễ xác minh tình trạng ban đầu.

### Case: policy_wrong_item

- `caseId`: `policy_wrong_item`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `97`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - giao sai
  - giao nhầm
  - giao nham
  - sai sản phẩm
  - sai san pham
  - nhầm sản phẩm
  - nham san pham
  - wrong item
  - wrong product
  - received wrong item
  - không đúng mẫu
  - khong dung mau
  - khác hình
  - khac hinh
  - không giống đơn
  - khong giong don

`response`:

Dạ nếu anh/chị nhận sản phẩm không đúng mẫu đã đặt, shop sẽ kiểm tra lại đơn và hỗ trợ xử lý.

Anh/chị gửi giúp Rêu:
- SĐT đã đặt hàng để tra cứu đơn
- Ảnh sản phẩm đã nhận
- Ảnh/ghi chú mẫu anh/chị đã đặt nếu có

Rêu chỉ dùng SĐT để kiểm tra trạng thái/mã đơn cần thiết và vẫn ẩn thông tin nhạy cảm như địa chỉ, tổng tiền, tracking link.

### Case: policy_not_covered

- `caseId`: `policy_not_covered`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - không bảo hành
  - khong bao hanh
  - trường hợp không bảo hành
  - truong hop khong bao hanh
  - bảo hành bị từ chối
  - bao hanh bi tu choi
  - tự làm hư
  - tu lam hu
  - lỡ làm rơi
  - lo lam roi
  - rơi vỡ
  - roi vo
  - tưới nhiều quá
  - tuoi nhieu qua
  - để nắng
  - de nang
  - chăm sai
  - cham sai
  - not covered

`response`:

Dạ các trường hợp thường không được tính là lỗi bảo hành/đổi trả gồm:

- Đặt bể dưới nắng trực tiếp hoặc nơi quá nóng
- Tưới quá nhiều làm úng/thối cây/rêu
- Làm rơi, va đập, nứt/vỡ sau khi đã nhận
- Tự ý tháo bố cục, bẻ cây, thay đất/rêu khi chưa hỏi shop
- Chăm sóc sai hướng dẫn hoặc để bể ở môi trường không phù hợp quá lâu

Nếu anh/chị chưa chắc nguyên nhân, cứ gửi ảnh/video hiện trạng. Shop sẽ xem trước và hướng dẫn hướng xử lý phù hợp nhất có thể.

### Case: policy_opening_video

- `caseId`: `policy_opening_video`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - video mở hàng
  - video mo hang
  - quay video mở hàng
  - quay video mo hang
  - unboxing video
  - opening video
  - mở hàng
  - mo hang
  - lúc nhận hàng
  - luc nhan hang
  - cần quay video không
  - can quay video khong
  - bằng chứng
  - bang chung
  - evidence

`response`:

Dạ anh/chị nên quay video khi mở hàng, nhất là với bể thủy tinh/terrarium vì sản phẩm có cây, rêu và bố cục bên trong.

Video mở hàng giúp shop xác minh nhanh nếu có các tình trạng như:
- Bể vỡ/nứt
- Cây bật gốc hoặc bố cục xô lệch nặng
- Giao sai sản phẩm
- Hộp/bao bì có dấu hiệu va đập mạnh

Nếu không có video, anh/chị vẫn có thể gửi ảnh hiện trạng để shop kiểm tra, nhưng video mở hàng sẽ giúp xử lý rõ ràng hơn.

### Case: policy_claim_process

- `caseId`: `policy_claim_process`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `94`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - khiếu nại
  - khieu nai
  - báo lỗi
  - bao loi
  - report issue
  - claim
  - complaint
  - cần shop xử lý
  - can shop xu ly
  - shop hỗ trợ sao
  - shop ho tro sao
  - gửi bảo hành ở đâu
  - gui bao hanh o dau
  - gửi khiếu nại
  - gui khieu nai
  - xử lý lỗi
  - xu ly loi

`response`:

Dạ để shop xử lý nhanh, anh/chị gửi thông tin theo thứ tự này giúp Rêu:

1. SĐT đã đặt hàng
2. Ảnh/video tình trạng sản phẩm
3. Thời điểm nhận hàng
4. Mô tả ngắn vấn đề đang gặp

Sau khi có đủ thông tin, shop sẽ kiểm tra đơn và tình trạng sản phẩm để hướng dẫn hướng xử lý phù hợp. Rêu sẽ không hiển thị địa chỉ, tổng tiền hoặc tracking link trong chatbox để bảo mật thông tin đơn hàng.

### Case: policy_care_after_receiving

- `caseId`: `policy_care_after_receiving`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `90`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - mới nhận hàng
  - moi nhan hang
  - vừa nhận bể
  - vua nhan be
  - sau khi nhận hàng
  - sau khi nhan hang
  - mới mua về
  - moi mua ve
  - nhận bể xong làm gì
  - nhan be xong lam gi
  - first day
  - after receiving
  - just received
  - newly received

`response`:

Dạ sau khi vừa nhận bể, anh/chị nên kiểm tra nhanh tình trạng trước:

- Bể/kính có nứt vỡ không
- Cây/rêu có bị bật gốc hoặc xô lệch nặng không
- Đất/rêu có quá khô hoặc quá ướt không
- Nếu có vấn đề rõ, chụp ảnh/video ngay để shop kiểm tra

Nếu bể ổn, anh/chị đặt ở nơi sáng gián tiếp, tránh nắng trực tiếp và chưa cần tưới quá nhiều ngay ngày đầu. Phần chăm sóc chi tiết sẽ nằm ở Group 6 `Chăm sóc Cơ bản`.

### Case: policy_living_plant_issue_boundary

- `caseId`: `policy_living_plant_issue_boundary`
- `group`: `Chính sách Shop`
- `category`: `policy_warranty`
- `priority`: `93`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - rêu vàng có bảo hành không
  - reu vang co bao hanh khong
  - cây chết có đổi không
  - cay chet co doi khong
  - cây chết có bảo hành không
  - cay chet co bao hanh khong
  - cây rụng lá có bảo hành không
  - cay rung la co bao hanh khong
  - bể bị mốc có đổi không
  - be bi moc co doi khong
  - mốc có bảo hành không
  - moc co bao hanh khong
  - plant died warranty
  - moss yellow warranty
  - mold warranty
  - leaves falling warranty

`response`:

Dạ các trường hợp như rêu vàng, mốc, cây chết hoặc rụng lá cần xem nguyên nhân trước khi kết luận bảo hành/đổi trả.

Rêu sẽ tách làm 2 hướng:
- Nếu cần xét chính sách: shop cần biết thời điểm nhận hàng, tình trạng lúc mở hàng và mô tả vấn đề.
- Nếu cần xử lý cây/rêu: phần hướng dẫn nguyên nhân và cách xử lý sẽ nằm ở Group 7 `Xử lý Sự cố`.

Hiện tại chatbox chưa phân tích ảnh tự động, nên anh/chị có thể mô tả bằng text trước: bể kín hay mở, bị bao lâu, đặt ở đâu, lần tưới gần nhất, đất đang ướt hay khô, có mùi hôi không. Nếu sau này shop bật tính năng ảnh thì sẽ là phase phát triển riêng.

## Group 3: Vận chuyển

Trạng thái: **bản nháp để duyệt**.

Phạm vi Group 3:

- Trả lời về khu vực giao hàng, thời gian giao dự kiến, phí ship/freeship, đóng gói, lưu ý khi nhận hàng.
- Không trả tracking link trong chatbox.
- Không nói tổng tiền đơn hàng trong chatbox.
- Nếu user hỏi trạng thái đơn cụ thể thì chuyển sang DB tra cứu đơn bằng SĐT, chỉ hiển thị trạng thái tiếng Việt.
- Nếu phát sinh vỡ/nứt/giao sai thì chuyển sang Group 2 `Chính sách Shop` để xử lý bảo hành/đổi trả.

### Case: shipping_general

- `caseId`: `shipping_general`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `100`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - giao hàng
  - giao hang
  - giao hàng không
  - giao hang khong
  - có giao hàng không
  - co giao hang khong
  - shop có giao không
  - shop co giao khong
  - có ship không
  - co ship khong
  - shop có ship không
  - shop co ship khong
  - vận chuyển
  - van chuyen
  - vận chuyển thế nào
  - van chuyen the nao
  - ship
  - ship không
  - ship khong
  - ship sao
  - ship thế nào
  - ship the nao
  - shipping
  - delivery
  - do you ship
  - delivery available
  - shipping available
  - can you deliver
  - can ship
  - ship to me
  - giao tận nơi
  - giao tan noi
  - ship tận nơi
  - ship tan noi
  - giao tới nhà
  - giao toi nha
  - ship tới nhà
  - ship toi nha
  - giao toàn quốc
  - giao toan quoc
  - ship toàn quốc
  - ship toan quoc
  - có giao tỉnh không
  - co giao tinh khong
  - có ship tỉnh không
  - co ship tinh khong
  - ship tỉnh không
  - ship tinh khong
  - gửi hàng
  - gui hang
  - gửi đi tỉnh
  - gui di tinh
  - ship bình dương
  - ship binh duong
  - ship đồng nai
  - ship dong nai
  - ship long an
  - ship vũng tàu
  - ship vung tau
  - ship tỉnh xa
  - ship tinh xa
  - giao tỉnh xa
  - giao tinh xa
  - ship miền bắc
  - ship mien bac
  - ship miền trung
  - ship mien trung
  - ship miền tây
  - ship mien tay
  - ship tây nguyên
  - ship tay nguyen
  - ship ha noi
  - giao ha noi
  - ship hn
  - giao hn
  - ship hcm
  - giao hcm
  - ship tphcm
  - giao tphcm
  - ship sg
  - giao sg
  - ship sai gon
  - giao sai gon
  - ship hue
  - giao hue
  - ship da nang
  - giao da nang
  - ship dn
  - giao dn
  - ship hai phong
  - giao hai phong
  - ship hp
  - giao hp
  - ship can tho
  - giao can tho
  - ship ct
  - giao ct
  - ship cao bang
  - giao cao bang
  - ship cb
  - giao cb
  - ship dien bien
  - giao dien bien
  - ship db
  - giao db
  - ship ha tinh
  - giao ha tinh
  - ship ht
  - giao ht
  - ship lai chau
  - giao lai chau
  - ship lang son
  - giao lang son
  - ship ls
  - giao ls
  - ship nghe an
  - giao nghe an
  - ship na
  - giao na
  - ship quang ninh
  - giao quang ninh
  - ship qn
  - giao qn
  - ship thanh hoa
  - giao thanh hoa
  - ship th
  - giao th
  - ship son la
  - giao son la
  - ship sl
  - giao sl
  - ship tuyen quang
  - giao tuyen quang
  - ship tq
  - giao tq
  - ship lao cai
  - giao lao cai
  - ship lc
  - giao lc
  - ship thai nguyen
  - giao thai nguyen
  - ship phu tho
  - giao phu tho
  - ship pt
  - giao pt
  - ship bac ninh
  - giao bac ninh
  - ship bn
  - giao bn
  - ship hung yen
  - giao hung yen
  - ship hy
  - giao hy
  - ship ninh binh
  - giao ninh binh
  - ship nb
  - giao nb
  - ship quang tri
  - giao quang tri
  - ship qt
  - giao qt
  - ship quang ngai
  - giao quang ngai
  - ship gia lai
  - giao gia lai
  - ship gl
  - giao gl
  - ship khanh hoa
  - giao khanh hoa
  - ship kh
  - giao kh
  - ship lam dong
  - giao lam dong
  - ship ld
  - giao ld
  - ship dak lak
  - giao dak lak
  - ship daklak
  - giao daklak
  - ship dl
  - giao dl
  - ship dong nai
  - giao dong nai
  - ship dnai
  - giao dnai
  - ship tay ninh
  - giao tay ninh
  - ship tn
  - giao tn
  - ship vinh long
  - giao vinh long
  - ship vl
  - giao vl
  - ship dong thap
  - giao dong thap
  - ship dt
  - giao dt
  - ship ca mau
  - giao ca mau
  - ship cm
  - giao cm
  - ship an giang
  - giao an giang
  - ship ag
  - giao ag
  - q1
  - q2
  - q3
  - q4
  - q5
  - q6
  - q7
  - q8
  - q9
  - q10
  - q11
  - q12
  - ship q1
  - ship q2
  - ship q3
  - ship q4
  - ship q5
  - ship q6
  - ship q7
  - ship q8
  - ship q9
  - ship q10
  - ship q11
  - ship q12
  - giao q1
  - giao q2
  - giao q3
  - giao q4
  - giao q5
  - giao q6
  - giao q7
  - giao q8
  - giao q9
  - giao q10
  - giao q11
  - giao q12
  - giao quận 1
  - giao quan 1
  - ship quận 1
  - ship quan 1
  - giao quận 2
  - giao quan 2
  - ship quận 2
  - ship quan 2
  - giao quận 3
  - giao quan 3
  - ship quận 3
  - ship quan 3
  - giao quận 4
  - giao quan 4
  - ship quận 4
  - ship quan 4
  - giao quận 5
  - giao quan 5
  - ship quận 5
  - ship quan 5
  - giao quận 6
  - giao quan 6
  - ship quận 6
  - ship quan 6
  - giao quận 7
  - giao quan 7
  - ship quận 7
  - ship quan 7
  - giao quận 8
  - giao quan 8
  - ship quận 8
  - ship quan 8
  - giao quận 9
  - giao quan 9
  - ship quận 9
  - ship quan 9
  - giao quận 10
  - giao quan 10
  - ship quận 10
  - ship quan 10
  - giao quận 11
  - giao quan 11
  - ship quận 11
  - ship quan 11
  - giao quận 12
  - giao quan 12
  - ship quận 12
  - ship quan 12
  - giao bình thạnh
  - giao binh thanh
  - ship bình thạnh
  - ship binh thanh
  - giao gò vấp
  - giao go vap
  - ship gò vấp
  - ship go vap
  - giao phú nhuận
  - giao phu nhuan
  - ship phú nhuận
  - ship phu nhuan
  - giao tân bình
  - giao tan binh
  - ship tân bình
  - ship tan binh
  - giao tân phú
  - giao tan phu
  - ship tân phú
  - ship tan phu
  - giao bình tân
  - giao binh tan
  - ship bình tân
  - ship binh tan
  - giao thủ đức
  - giao thu duc
  - ship thủ đức
  - ship thu duc
  - giao nhà bè
  - giao nha be
  - ship nhà bè
  - ship nha be
  - giao bình chánh
  - giao binh chanh
  - ship bình chánh
  - ship binh chanh
  - giao hóc môn
  - giao hoc mon
  - ship hóc môn
  - ship hoc mon
  - giao củ chi
  - giao cu chi
  - ship củ chi
  - ship cu chi
  - giao cần giờ
  - giao can gio
  - ship cần giờ
  - ship can gio
  - delivery policy
  - shipping policy

`response`:

Dạ Tiệm Rêu hỗ trợ giao hàng toàn quốc.

Thời gian tham khảo:
- Nội thành TP.HCM với sản phẩm có sẵn: shop xử lý theo lịch hiện tại và đơn vị vận chuyển
- Nội thành TP.HCM với sản phẩm đặt trước/custom/theo yêu cầu: thường khoảng 3-5 ngày, tùy độ phức tạp
- Tỉnh/thành khác: thường khoảng 3-5 ngày làm việc

Thời gian thực tế có thể thay đổi theo khu vực, thời điểm đặt hàng, tình trạng sản phẩm và đơn vị vận chuyển. Với terrarium, shop sẽ đóng gói kỹ để hạn chế xô lệch, vỡ bể hoặc ảnh hưởng cây/rêu trong quá trình giao.

### Case: shipping_hcm

- `caseId`: `shipping_hcm`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `keywords`:
  - giao hcm
  - giao tp hcm
  - giao tphcm
  - giao sài gòn
  - giao sai gon
  - nội thành
  - noi thanh
  - trong thành phố
  - trong thanh pho
  - hcm delivery
  - saigon delivery
  - same city
  - giao trong ngày
  - giao trong ngay
  - hỏa tốc
  - hoa toc
  - ship hỏa tốc
  - ship hoa toc
  - giao gấp
  - giao gap
  - cần gấp
  - can gap
  - grab
  - grap
  - lalamove
  - ahamove

`response`:

Dạ với khu vực TP.HCM, thời gian giao sẽ tùy loại sản phẩm:

- Sản phẩm có sẵn: shop sẽ xử lý theo lịch hiện tại và đơn vị vận chuyển.
- Sản phẩm đặt trước/custom/theo yêu cầu: thường khoảng 3-5 ngày, tùy mức độ phức tạp của mẫu khách yêu cầu.

Nếu anh/chị cần gấp, shop có thể hỗ trợ gửi qua đơn vị giao hỏa tốc bên thứ ba như Grab/Lalamove/Ahamove tùy thời điểm và khu vực.

Rêu không tự cam kết hỏa tốc nếu chưa có xác nhận từ shop, vì còn phụ thuộc tình trạng sản phẩm, thời gian chuẩn bị và bên giao hàng.

### Case: shipping_province

- `caseId`: `shipping_province`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi shop có giao tỉnh/tỉnh xa/thành phố ngoài TP.HCM không.
  - `mustAnswer`: có giao toàn quốc; thời gian thường 3-5 ngày làm việc; terrarium được đóng gói kỹ; nên quay video mở hàng.
  - `askIfNeeded`: nếu user hỏi phí chính xác, yêu cầu kiểm tra tại checkout hoặc liên hệ shop vì phí phụ thuộc địa chỉ/phương thức giao.
  - `routeToDb`: nếu user hỏi "đơn tới đâu", "đang giao chưa", "mã vận đơn", chuyển sang tra cứu đơn bằng SĐT.
  - `routeToPolicy`: nếu user nói hàng vỡ, giao sai, cây bật gốc nặng, chuyển sang Group 2 `Chính sách Shop`.
  - `doNotSay`: không trả tracking link, không nói tổng tiền đơn, không cam kết ngày giao chính xác.
- `keywords`:
  - giao tỉnh
  - giao tinh
  - ship tỉnh
  - ship tinh
  - gửi tỉnh
  - gui tinh
  - tỉnh khác
  - tinh khac
  - ngoại tỉnh
  - ngoai tinh
  - miền bắc
  - mien bac
  - miền trung
  - mien trung
  - miền tây
  - mien tay
  - tây nguyên
  - tay nguyen
  - tỉnh xa
  - tinh xa
  - giao xa
  - ship xa
  - ship tỉnh xa
  - ship tinh xa
  - giao tỉnh xa
  - giao tinh xa
  - có giao tỉnh không
  - co giao tinh khong
  - có ship tỉnh không
  - co ship tinh khong
  - ship tỉnh được không
  - ship tinh duoc khong
  - gửi đi tỉnh
  - gui di tinh
  - gửi hàng đi tỉnh
  - gui hang di tinh
  - ngoài hcm có giao không
  - ngoai hcm co giao khong
  - ngoài sài gòn có ship không
  - ngoai sai gon co ship khong
  - ship hn
  - ship ha noi
  - giao ha noi
  - ship da nang
  - giao da nang
  - ship hai phong
  - giao hai phong
  - ship can tho
  - giao can tho
  - ship hue
  - giao hue
  - ship mien bac
  - giao mien bac
  - ship mien trung
  - giao mien trung
  - ship mien tay
  - giao mien tay
  - ship dak lak
  - giao dak lak
  - ship ca mau
  - giao ca mau
  - ship an giang
  - giao an giang
  - province shipping
  - province delivery
  - nationwide shipping
  - ship nationwide
  - deliver nationwide
  - outside hcm
  - outside saigon
  - far province
  - remote province

`response`:

Dạ shop có hỗ trợ giao tỉnh/toàn quốc.

Thời gian tham khảo cho tỉnh/thành ngoài TP.HCM thường khoảng 3-5 ngày làm việc, tùy khu vực, thời điểm đặt và đơn vị vận chuyển.

Vì terrarium có kính, cây/rêu và bố cục trong bể, shop sẽ đóng gói kỹ để hạn chế xô lệch khi đi xa. Khi nhận hàng, anh/chị nên quay video mở hàng và kiểm tra bể ngay.

Nếu anh/chị hỏi phí ship chính xác cho tỉnh/thành cụ thể, phí sẽ phụ thuộc địa chỉ và phương thức giao; anh/chị nên kiểm tra tại bước thanh toán hoặc liên hệ shop để xác nhận.

### Case: shipping_fee

- `caseId`: `shipping_fee`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `94`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi phí ship, phí giao nhanh, phí hỏa tốc hoặc muốn biết ship tới địa chỉ/khu vực nào đó bao nhiêu tiền.
  - `mustAnswer`: phí ship phụ thuộc khu vực và phương thức giao; website có phí tham khảo; phí chính xác cần kiểm tra ở checkout hoặc xác nhận với shop.
  - `askIfNeeded`: nếu user muốn tính phí cụ thể, hỏi khu vực nhận hàng và loại giao mong muốn, nhưng không tự tính tổng tiền đơn.
  - `routeToCheckout`: nếu user đang đặt hàng, hướng dẫn kiểm tra phí tại giỏ hàng/thanh toán.
  - `routeToDb`: nếu user hỏi phí ship của đơn đã đặt hoặc đơn đang giao, chuyển sang tra cứu đơn bằng SĐT nhưng vẫn không nói tổng tiền.
  - `doNotSay`: không cam kết phí cố định cho mọi địa chỉ; không nói tổng tiền đơn; không trả tracking link.
- `keywords`:
  - phí ship
  - phi ship
  - ship phí sao
  - ship phi sao
  - tiền ship
  - tien ship
  - phí vận chuyển
  - phi van chuyen
  - tiền vận chuyển
  - tien van chuyen
  - phí giao
  - phi giao
  - ship bao nhiêu
  - ship bao nhieu
  - giao bao nhiêu
  - giao bao nhieu
  - vận chuyển bao nhiêu
  - van chuyen bao nhieu
  - phí ship bao nhiêu
  - phi ship bao nhieu
  - ship mắc không
  - ship mac khong
  - ship đắt không
  - ship dat khong
  - tiền ship mắc không
  - tien ship mac khong
  - ship về hn bao nhiêu
  - ship ve hn bao nhieu
  - ship về tỉnh bao nhiêu
  - ship ve tinh bao nhieu
  - ship hcm bao nhiêu
  - ship q1 bao nhiêu
  - ship q7 bao nhiêu
  - ship sg bao nhiêu
  - ship tỉnh bao nhiêu
  - ship tinh bao nhieu
  - shipping fee
  - shipping cost
  - delivery fee
  - cost shipping
  - ship cost
  - delivery cost
  - how much shipping
  - how much delivery
  - how much to ship
  - how much is shipping
  - phí giao hàng
  - phi giao hang
  - phí hỏa tốc
  - phi hoa toc
  - tiền hỏa tốc
  - tien hoa toc
  - phí grab
  - phi grab
  - phí grap
  - phi grap
  - phí lalamove
  - phi lalamove
  - phí ahamove
  - phi ahamove
  - grab bao nhiêu
  - grap bao nhieu
  - lalamove bao nhiêu
  - lalamove bao nhieu
  - ahamove bao nhiêu
  - ahamove bao nhieu

`response`:

Dạ phí ship sẽ tùy khu vực nhận hàng và phương thức giao anh/chị chọn.

Theo cấu hình hiện tại trên website:
- Giao tiêu chuẩn: thường tính phí tham khảo 30.000đ
- Giao nhanh: thường tính phí tham khảo 50.000đ

Với đơn cần gấp tại TP.HCM, shop có thể hỗ trợ giao hỏa tốc qua đơn vị thứ ba như Grab/Lalamove/Ahamove. Phí hỏa tốc sẽ phụ thuộc khoảng cách, thời điểm đặt xe và bảng giá của bên vận chuyển.

Nếu anh/chị muốn biết phí chính xác cho đơn mới, vui lòng kiểm tra ở bước thanh toán hoặc liên hệ shop để xác nhận theo địa chỉ nhận hàng. Với đơn đã đặt, Rêu có thể tra trạng thái bằng SĐT nhưng sẽ không hiển thị tổng tiền đơn hoặc tracking link trong chatbox.

### Case: shipping_freeship

- `caseId`: `shipping_freeship`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `93`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi điều kiện freeship, đơn bao nhiêu được miễn phí ship, hoặc có voucher/ưu đãi vận chuyển không.
  - `mustAnswer`: freeship nội thành TP.HCM cho đơn từ 1.500.000đ trở lên; đơn dưới mức này/giao tỉnh tính theo khu vực và phương thức giao.
  - `askIfNeeded`: nếu user hỏi đơn cụ thể có freeship không, hỏi khu vực nhận hàng và nhắc kiểm tra ở checkout.
  - `routeToCheckout`: ưu đãi/voucher cần kiểm tra tại giỏ hàng/thanh toán vì có thể thay đổi.
  - `routeToDb`: nếu hỏi đơn đã đặt có được freeship không, chuyển tra cứu bằng SĐT nhưng không nói tổng tiền.
  - `doNotSay`: không áp dụng freeship toàn quốc nếu chưa có chương trình; không cam kết voucher ngoài checkout.
- `keywords`:
  - freeship
  - free ship
  - free shipping
  - free delivery
  - fs
  - freeship ko
  - freeship không
  - freeship khong
  - miễn phí ship
  - mien phi ship
  - miễn phí vận chuyển
  - mien phi van chuyen
  - miễn ship
  - mien ship
  - miễn phí giao hàng
  - mien phi giao hang
  - đơn bao nhiêu được freeship
  - don bao nhieu duoc freeship
  - đơn bao nhiêu miễn ship
  - don bao nhieu mien ship
  - mua bao nhiêu freeship
  - mua bao nhieu freeship
  - bao nhiêu thì freeship
  - bao nhieu thi freeship
  - bao nhiêu được miễn ship
  - bao nhieu duoc mien ship
  - voucher freeship
  - mã freeship
  - ma freeship
  - voucher miễn ship
  - voucher mien ship
  - freeship nội thành
  - freeship noi thanh
  - miễn ship nội thành
  - mien ship noi thanh
  - freeship hcm
  - freeship tphcm
  - freeship sg
  - miễn ship hcm
  - mien ship hcm
  - miễn ship sài gòn
  - mien ship sai gon
  - đơn 1tr5
  - don 1tr5
  - đơn từ 1tr5
  - don tu 1tr5
  - đơn 1500k
  - don 1500k
  - đơn 1.5tr
  - don 1.5tr
  - đơn 1 triệu rưỡi
  - don 1 trieu ruoi
  - order free shipping
  - free ship condition

`response`:

Dạ shop hỗ trợ **freeship nội thành TP.HCM cho đơn từ 1.500.000đ trở lên**.

Với đơn dưới mức này hoặc giao tỉnh, phí vận chuyển sẽ phụ thuộc khu vực nhận hàng và phương thức giao. Ưu đãi/voucher có thể thay đổi theo từng thời điểm, nên anh/chị kiểm tra lại ở giỏ hàng hoặc bước thanh toán để thấy phí ship chính xác nhất.

### Case: shipping_packaging

- `caseId`: `shipping_packaging`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `92`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi shop đóng gói terrarium thế nào, có an toàn không, có dễ vỡ/xô lệch/cây hư khi ship không.
  - `mustAnswer`: terrarium có kính/cây/rêu/bố cục nên shop đóng gói kỹ; khách nên quay video mở hàng và kiểm tra ngay khi nhận.
  - `askIfNeeded`: nếu user lo đi tỉnh/tỉnh xa, giải thích shop đóng gói kỹ nhưng thời gian/rủi ro phụ thuộc đơn vị vận chuyển.
  - `routeToPolicy`: nếu user nói nhận hàng đã vỡ/nứt/hư/giao sai, chuyển Group 2.
  - `routeToShiftedLayout`: nếu chỉ xô lệch nhẹ, chuyển `shipping_shifted_layout`.
  - `doNotSay`: không đảm bảo 100% không xô lệch/vỡ; không bảo khách tự tháo toàn bộ bố cục khi chưa cần.
- `keywords`:
  - đóng gói
  - dong goi
  - đóng gói sao
  - dong goi sao
  - đóng gói terrarium
  - dong goi terrarium
  - shop đóng gói sao
  - shop dong goi sao
  - gói hàng sao
  - goi hang sao
  - gói kỹ không
  - goi ky khong
  - đóng gói kỹ không
  - dong goi ky khong
  - có dễ vỡ không
  - co de vo khong
  - sợ vỡ
  - so vo
  - sợ bể vỡ
  - so be vo
  - sợ cây hư
  - so cay hu
  - sợ xô lệch
  - so xo lech
  - đi xa có sao không
  - di xa co sao khong
  - đi tỉnh có an toàn không
  - di tinh co an toan khong
  - fragile
  - packaging
  - packed
  - how packed
  - how do you pack
  - safe packaging
  - safe delivery
  - fragile item
  - glass tank shipping
  - chống sốc
  - chong soc
  - chống xô lệch
  - chong xo lech
  - chống vỡ
  - chong vo
  - bảo vệ bể
  - bao ve be
  - quay video mở hàng
  - quay video mo hang
  - video mở hàng
  - video mo hang

`response`:

Dạ terrarium là sản phẩm có kính, cây/rêu và bố cục bên trong nên shop sẽ đóng gói cẩn thận để hạn chế xô lệch và va đập khi vận chuyển.

Khi nhận hàng, anh/chị nên:
- Quay video mở hàng
- Kiểm tra kính/bể có nứt vỡ không
- Kiểm tra cây/rêu có bật gốc hoặc xô lệch nặng không
- Giữ nguyên hiện trạng nếu có lỗi rõ và báo shop kiểm tra

Nếu chỉ xô lệch nhẹ, Rêu có thể hướng dẫn cách chỉnh lại an toàn. Nếu bể vỡ/nứt nặng, cây bật gốc nhiều hoặc giao sai sản phẩm, anh/chị giữ nguyên hiện trạng và gửi shop kiểm tra theo Group 2 `Chính sách Shop`.

### Case: shipping_shifted_layout

- `caseId`: `shipping_shifted_layout`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `91`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user nói bể/cây/rêu/bố cục bị xô lệch sau vận chuyển hoặc hỏi có tự chỉnh được không.
  - `mustAnswer`: phân biệt xô lệch nhẹ và hư nặng; xô lệch nhẹ có thể chỉnh rất nhẹ; hư nặng giữ hiện trạng và báo shop.
  - `askIfNeeded`: hỏi mức độ lệch, bể có vỡ/nứt không, cây bật gốc nhiều không, đất/rêu có đổ tung không.
  - `routeToPolicy`: nếu vỡ/nứt/cây bật gốc nhiều/hư nặng, chuyển Group 2.
  - `routeToCare`: nếu sau khi chỉnh cây héo/vàng/mốc, chuyển Group 7 xử lý sự cố.
  - `doNotSay`: không hướng dẫn tháo toàn bộ bố cục; không bảo tưới nhiều để cây hồi; không kết luận lỗi bảo hành khi thiếu mô tả.
- `keywords`:
  - bể bị xô lệch
  - be bi xo lech
  - bể lệch
  - be lech
  - bể bị nghiêng
  - be bi nghieng
  - bố cục bị lệch
  - bo cuc bi lech
  - layout bị lệch
  - layout bi lech
  - bố cục xô lệch
  - bo cuc xo lech
  - cảnh bị lệch
  - canh bi lech
  - rêu bị lệch
  - reu bi lech
  - đất bị đổ
  - dat bi do
  - đá bị đổ
  - da bi do
  - cây bị đổ
  - cay bi do
  - cây bật gốc
  - cay bat goc
  - cây bị lệch
  - cay bi lech
  - cây nằm xuống
  - cay nam xuong
  - cây ngã
  - cay nga
  - cây rơi ra
  - cay roi ra
  - nhận hàng bị lệch
  - nhan hang bi lech
  - vận chuyển bị lệch
  - van chuyen bi lech
  - ship bị lệch
  - ship bi lech
  - hàng bị xô
  - hang bi xo
  - hộp bị lắc
  - hop bi lac
  - có tự chỉnh được không
  - co tu chinh duoc khong
  - chỉnh lại sao
  - chinh lai sao
  - sửa bố cục
  - sua bo cuc
  - layout shifted
  - shifted
  - tank shifted
  - moss shifted
  - soil spilled
  - plant fell
  - plant uprooted
  - plant moved
  - can i fix it

`response`:

Dạ nếu bể chỉ xô lệch nhẹ sau vận chuyển và kính không vỡ/nứt, anh/chị có thể xử lý tạm như sau:

1. Đặt bể trên mặt phẳng, tránh lắc thêm.
2. Dùng nhíp hoặc muỗng nhỏ chỉnh nhẹ cây/rêu về vị trí cũ.
3. Gắp bỏ lá/rêu bị dập nặng nếu có.
4. Không tưới nhiều ngay sau khi chỉnh; chỉ phun sương nhẹ nếu bể khô.
5. Đặt bể nơi sáng gián tiếp để cây hồi lại.

Nếu bể vỡ/nứt, cây bật gốc nhiều, đất/rêu đổ tung hoặc bố cục hư nặng, anh/chị nên giữ nguyên hiện trạng và gửi mô tả/ảnh/video cho shop kiểm tra theo Group 2 `Chính sách Shop`.

### Case: shipping_tracking_boundary

- `caseId`: `shipping_tracking_boundary`
- `group`: `Vận chuyển`
- `category`: `policy_shipping`
- `priority`: `90`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi tracking link, mã vận đơn, đơn đang ở đâu, giao tới đâu, hoặc muốn xem trạng thái vận chuyển.
  - `mustAnswer`: chatbox không trả tracking link/mã vận đơn; có thể tra trạng thái đơn bằng SĐT; chỉ hiển thị trạng thái tiếng Việt ở mức cần thiết.
  - `askIfNeeded`: yêu cầu SĐT đã dùng đặt hàng nếu user muốn tra đơn.
  - `routeToDb`: mọi câu hỏi về đơn cụ thể phải đi DB order lookup.
  - `routeToShippingGeneral`: nếu user chỉ hỏi thời gian giao chung, chuyển case vận chuyển phù hợp.
  - `doNotSay`: không hiển thị tracking link, mã vận đơn, địa chỉ, SĐT đầy đủ, email, tổng tiền.
- `keywords`:
  - tracking
  - tracking link
  - track
  - track đơn
  - track don
  - mã vận đơn
  - ma van don
  - mã ship
  - ma ship
  - mã giao hàng
  - ma giao hang
  - mã đơn vận chuyển
  - ma don van chuyen
  - vận đơn
  - van don
  - xin mã vận đơn
  - xin ma van don
  - cho xin tracking
  - cho xin mã tracking
  - cho xin ma tracking
  - gửi tracking
  - gui tracking
  - đơn tới đâu
  - don toi dau
  - hàng tới đâu
  - hang toi dau
  - đơn đang ở đâu
  - don dang o dau
  - hàng đang ở đâu
  - hang dang o dau
  - đơn giao chưa
  - don giao chua
  - hàng giao chưa
  - hang giao chua
  - đơn đang giao chưa
  - don dang giao chua
  - khi nào nhận được
  - khi nao nhan duoc
  - bao giờ giao
  - bao gio giao
  - bao giờ nhận
  - bao gio nhan
  - kiểm tra vận chuyển
  - kiem tra van chuyen
  - kiểm tra giao hàng
  - kiem tra giao hang
  - tra cứu vận đơn
  - tra cuu van don
  - track my order
  - where is my order
  - order tracking
  - order status
  - shipment tracking
  - delivery status
  - shipment status
  - shipping status
  - trạng thái giao hàng
  - trang thai giao hang
  - trạng thái vận chuyển
  - trang thai van chuyen

`response`:

Dạ để bảo mật thông tin đơn hàng, Rêu không hiển thị tracking link hoặc mã vận đơn trong chatbox.

Nếu anh/chị muốn kiểm tra đơn đang ở trạng thái nào, anh/chị gửi **SĐT đã dùng khi đặt hàng**. Rêu sẽ tra cứu từ DB và chỉ báo trạng thái đơn bằng tiếng Việt ở mức cần thiết, không hiển thị địa chỉ, SĐT đầy đủ, email, tổng tiền hoặc tracking link.

## Group 4: Thanh toán & Đặt hàng

Trạng thái: **bản nháp để duyệt**.

Phạm vi Group 4:

- Trả lời về cách đặt hàng, phương thức thanh toán, COD, mã giảm giá, hủy/đổi thông tin đơn.
- Tra cứu đơn cụ thể phải đi DB bằng SĐT.
- Không hiển thị tổng tiền đơn, địa chỉ, SĐT đầy đủ, email, tracking link hoặc mã vận đơn trong chatbox.
- Không tự cung cấp số tài khoản/chuyển khoản/Momo nếu checkout hiện tại chưa hiển thị phương thức đó cho khách.
- Nếu user hỏi phí ship/thời gian giao thì chuyển Group 3 `Vận chuyển`.
- Nếu user hỏi đổi trả/bảo hành sau nhận hàng thì chuyển Group 2 `Chính sách Shop`.

### Case: payment_general

- `caseId`: `payment_general`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `100`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi shop thanh toán như thế nào hoặc có những phương thức thanh toán nào.
  - `mustAnswer`: checkout hiện tại ưu tiên COD/thanh toán khi nhận hàng; khách kiểm tra lại ở bước thanh toán để thấy phương thức đang được bật.
  - `askIfNeeded`: nếu user muốn thanh toán khác COD, hướng dẫn liên hệ shop xác nhận trước.
  - `routeToCheckout`: nếu user đang mua, hướng dẫn qua trang thanh toán.
  - `routeToInvoice`: nếu user hỏi hóa đơn/biên nhận/VAT, chuyển `payment_invoice_receipt`.
  - `doNotSay`: không tự cung cấp số tài khoản, QR, link thanh toán hoặc ví điện tử khi chưa có xác nhận từ checkout/shop.
- `keywords`:
  - thanh toán
  - thanh toan
  - phương thức thanh toán
  - phuong thuc thanh toan
  - trả tiền
  - tra tien
  - trả sao
  - tra sao
  - tính tiền
  - tinh tien
  - payment
  - payment method
  - pay
  - how to pay
  - pay how
  - thanh toán sao
  - thanh toan sao
  - shop thanh toán sao
  - shop thanh toan sao
  - có thanh toán online không
  - co thanh toan online khong
  - thanh toán khi nào
  - thanh toan khi nao
  - có xuất hóa đơn không
  - co xuat hoa don khong
  - có bill không
  - co bill khong
  - biên nhận
  - bien nhan

`response`:

Dạ trên website hiện đang ưu tiên **thanh toán khi nhận hàng (COD)**.

Anh/chị có thể chọn sản phẩm, vào giỏ hàng, điền thông tin nhận hàng rồi xác nhận đơn. Nếu muốn dùng phương thức khác như chuyển khoản/Momo/thanh toán online, anh/chị nên liên hệ shop để được xác nhận trước, vì Rêu không tự cung cấp thông tin thanh toán ngoài checkout.

### Case: payment_cod

- `caseId`: `payment_cod`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `98`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi COD, nhận hàng trả tiền, có được kiểm tra hàng rồi trả không.
  - `mustAnswer`: COD là thanh toán khi nhận hàng; khách thanh toán cho shipper/đơn vị giao khi nhận.
  - `askIfNeeded`: nếu user hỏi kiểm hàng, nhắc quay video mở hàng và kiểm tra tình trạng bên ngoài.
  - `routeToShipping`: nếu hỏi thời gian giao/shipper thì chuyển Group 3.
  - `doNotSay`: không cam kết kiểm hàng theo mọi đơn vị vận chuyển; không nói tổng tiền đơn trong chatbox.
- `keywords`:
  - cod
  - COD
  - nhận hàng trả tiền
  - nhan hang tra tien
  - thanh toán khi nhận hàng
  - thanh toan khi nhan hang
  - trả tiền khi nhận
  - tra tien khi nhan
  - trả tiền shipper
  - tra tien shipper
  - cash on delivery
  - pay on delivery
  - cod được không
  - cod duoc khong
  - cod ko
  - cod khong
  - cod nha
  - cod nhé
  - ship cod
  - giao cod
  - trả sau
  - tra sau
  - nhận rồi trả
  - nhan roi tra
  - có cod không
  - co cod khong
  - shop có cod không
  - shop co cod khong
  - kiểm hàng rồi trả tiền
  - kiem hang roi tra tien
  - kiểm tra hàng rồi trả
  - kiem tra hang roi tra
  - đồng kiểm
  - dong kiem
  - được kiểm hàng không
  - duoc kiem hang khong
  - xem hàng rồi trả
  - xem hang roi tra

`response`:

Dạ shop có hỗ trợ **COD - thanh toán khi nhận hàng** trên website.

Anh/chị đặt đơn trên web, khi đơn được giao tới thì thanh toán cho shipper/đơn vị giao hàng. Khi nhận terrarium, anh/chị nên quay video mở hàng và kiểm tra bể ngay để shop có cơ sở hỗ trợ nếu có vấn đề do vận chuyển.

Việc đồng kiểm/kiểm tra trước khi thanh toán có thể phụ thuộc đơn vị vận chuyển, nên Rêu không cam kết cho mọi đơn. Cách an toàn nhất là quay video mở hàng và báo shop ngay nếu có vấn đề.

### Case: payment_online_boundary

- `caseId`: `payment_online_boundary`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi chuyển khoản, Momo, banking, QR, online payment hoặc xin số tài khoản.
  - `mustAnswer`: checkout hiện tại chưa hiển thị rõ phương thức này cho khách; cần liên hệ shop xác nhận nếu muốn thanh toán ngoài COD.
  - `askIfNeeded`: nếu user muốn thanh toán trước/đặt cọc custom, chuyển sang shop hoặc Group 9 custom.
  - `routeToCheckout`: nếu trên checkout có phương thức được bật thì user làm theo checkout.
  - `doNotSay`: không tự đưa số tài khoản, QR, link PayOS, link chuyển khoản hoặc ví Momo.
- `keywords`:
  - chuyển khoản
  - chuyen khoan
  - ck
  - banking
  - bank
  - bank transfer
  - chuyển khoản trước
  - chuyen khoan truoc
  - ck trước
  - ck truoc
  - chuyển tiền
  - chuyen tien
  - momo
  - Momo
  - ví momo
  - vi momo
  - zalopay
  - vnpay
  - qr
  - qr code
  - mã qr
  - ma qr
  - quét qr
  - quet qr
  - thanh toán online
  - thanh toan online
  - online payment
  - pay online
  - số tài khoản
  - so tai khoan
  - stk
  - tài khoản ngân hàng
  - tai khoan ngan hang
  - thông tin chuyển khoản
  - thong tin chuyen khoan
  - gửi stk
  - gui stk
  - xin stk
  - xin số tài khoản
  - xin so tai khoan
  - payos
  - link thanh toán
  - link thanh toan
  - payment link
  - cọc
  - coc
  - đặt cọc
  - dat coc
  - trả trước
  - tra truoc
  - thanh toán trước
  - thanh toan truoc

`response`:

Dạ hiện trên checkout website đang ưu tiên COD. Với các phương thức như chuyển khoản, Momo, QR hoặc thanh toán online, anh/chị vui lòng liên hệ shop để được xác nhận trước.

Rêu không tự gửi số tài khoản, QR hoặc link thanh toán trong chatbox để tránh nhầm thông tin. Nếu là đơn custom/theo yêu cầu cần đặt cọc, phần đó nên để shop xác nhận riêng.

### Case: payment_invoice_receipt

- `caseId`: `payment_invoice_receipt`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `88`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi hóa đơn, biên nhận, bill, VAT, chứng từ mua hàng.
  - `mustAnswer`: Rêu chưa tự xác nhận xuất hóa đơn/VAT; khách cần liên hệ shop để shop kiểm tra yêu cầu cụ thể.
  - `askIfNeeded`: nếu cần hóa đơn công ty, hỏi user chuẩn bị thông tin công ty nhưng không gửi đầy đủ trong chatbox nếu không cần.
  - `routeToHuman`: chuyển shop xác nhận.
  - `doNotSay`: không cam kết xuất VAT hoặc gửi hóa đơn nếu shop chưa xác nhận.
- `keywords`:
  - hóa đơn
  - hoa don
  - xuất hóa đơn
  - xuat hoa don
  - hóa đơn vat
  - hoa don vat
  - vat
  - VAT
  - bill
  - receipt
  - biên nhận
  - bien nhan
  - chứng từ
  - chung tu
  - invoice
  - company invoice
  - hóa đơn công ty
  - hoa don cong ty
  - mua công ty
  - mua cong ty
  - cần bill
  - can bill
  - xin hóa đơn
  - xin hoa don

`response`:

Dạ phần hóa đơn/biên nhận/VAT anh/chị vui lòng liên hệ shop để được xác nhận theo từng đơn.

Nếu cần hóa đơn công ty, anh/chị nên chuẩn bị thông tin xuất hóa đơn để gửi trực tiếp cho shop. Rêu không tự cam kết xuất hóa đơn hoặc gửi chứng từ trong chatbox khi shop chưa xác nhận.

### Case: order_how_to_buy

- `caseId`: `order_how_to_buy`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `97`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi cách mua, cách đặt hàng, order trên web, thêm giỏ hàng.
  - `mustAnswer`: hướng dẫn các bước mua trên website: chọn sản phẩm, thêm giỏ, kiểm tra giỏ, thanh toán, điền thông tin, xác nhận COD.
  - `askIfNeeded`: nếu user chưa biết chọn mẫu, chuyển Group 5 tư vấn sản phẩm.
  - `routeToHold`: nếu user muốn giữ hàng/đặt trước, chuyển `order_hold_or_preorder`.
  - `routeToDb`: nếu user hỏi sản phẩm còn hàng/giá cụ thể, dùng DB sản phẩm.
  - `doNotSay`: không tự tạo đơn trong chatbox nếu hệ thống chưa hỗ trợ; không yêu cầu thông tin nhạy cảm quá mức.
- `keywords`:
  - cách đặt hàng
  - cach dat hang
  - đặt hàng sao
  - dat hang sao
  - mua hàng
  - mua hang
  - mua sao
  - order
  - order sao
  - how to order
  - how to buy
  - buy
  - purchase
  - đặt mua
  - dat mua
  - muốn mua
  - muon mua
  - làm sao để mua
  - lam sao de mua
  - thêm vào giỏ
  - them vao gio
  - giỏ hàng
  - gio hang
  - checkout
  - check out
  - đặt online
  - dat online
  - mua online
  - mua onl
  - chốt đơn
  - chot don
  - lên đơn
  - len don
  - tạo đơn
  - tao don
  - buy now
  - add to cart
  - cart
  - make order
  - thanh toán đơn
  - thanh toan don
  - mua trên web
  - mua tren web
  - đặt trên website
  - dat tren website

`response`:

Dạ anh/chị có thể đặt hàng trực tiếp trên website:

1. Chọn sản phẩm muốn mua.
2. Nhấn **Thêm vào giỏ**.
3. Vào giỏ hàng để kiểm tra sản phẩm/số lượng/phiên bản.
4. Nhấn **Thanh toán**.
5. Điền thông tin nhận hàng.
6. Xác nhận đơn với phương thức COD nếu checkout đang hiển thị.

Nếu anh/chị chưa biết chọn mẫu nào, cứ nói ngân sách, vị trí đặt và mục đích mua; Rêu sẽ chuyển sang tư vấn sản phẩm phù hợp.

### Case: order_required_info

- `caseId`: `order_required_info`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `92`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi cần điền thông tin gì khi đặt hàng hoặc có cần tài khoản không.
  - `mustAnswer`: thông tin nhận hàng thường gồm tên, SĐT, email nếu có, tỉnh/quận/phường/địa chỉ đầy đủ.
  - `askIfNeeded`: nếu user muốn tra đơn sau này, nhắc dùng đúng SĐT đã đặt.
  - `routeToPrivacy`: không lặp lại thông tin nhạy cảm trong chatbox.
  - `doNotSay`: không yêu cầu user gửi đầy đủ địa chỉ trong chatbox nếu có thể điền ở checkout.
- `keywords`:
  - cần thông tin gì
  - can thong tin gi
  - đặt hàng cần gì
  - dat hang can gi
  - điền thông tin
  - dien thong tin
  - thông tin nhận hàng
  - thong tin nhan hang
  - địa chỉ
  - dia chi
  - số điện thoại
  - so dien thoai
  - sdt
  - phone
  - name
  - address
  - shipping info
  - customer info
  - recipient
  - receiver
  - người nhận
  - nguoi nhan
  - tên người nhận
  - ten nguoi nhan
  - ghi chú đơn
  - ghi chu don
  - note đơn hàng
  - note don hang
  - ghi chú giao hàng
  - ghi chu giao hang
  - thời gian nhận
  - thoi gian nhan
  - giờ nhận hàng
  - gio nhan hang
  - có cần tài khoản không
  - co can tai khoan khong
  - cần đăng nhập không
  - can dang nhap khong

`response`:

Dạ khi đặt hàng, anh/chị cần điền thông tin nhận hàng như tên người nhận, SĐT, địa chỉ nhận và email nếu checkout yêu cầu.

Nếu có ghi chú giao hàng như thời gian nhận thuận tiện hoặc lưu ý cho shipper, anh/chị nên điền ở checkout hoặc liên hệ shop xác nhận. Anh/chị nên dùng đúng SĐT khi đặt đơn, vì sau này Rêu có thể tra cứu trạng thái đơn bằng SĐT đó. Để bảo mật, Rêu sẽ không hiển thị lại địa chỉ, SĐT đầy đủ, email, tổng tiền hoặc tracking link trong chatbox.

### Case: order_change_info_after_placed

- `caseId`: `order_change_info_after_placed`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `94`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn đổi địa chỉ, SĐT, tên người nhận, sản phẩm, số lượng sau khi đã đặt.
  - `mustAnswer`: cần kiểm tra trạng thái đơn trước; nếu đơn chưa xử lý có thể liên hệ shop hỗ trợ, nếu đã giao/đang xử lý thì khó đổi.
  - `askIfNeeded`: yêu cầu SĐT đã đặt để tra trạng thái, nhưng không yêu cầu gửi địa chỉ đầy đủ trong chatbox.
  - `routeToDb`: tra đơn bằng SĐT.
  - `routeToHuman`: thay đổi thông tin đơn nên liên hệ shop để xác nhận.
  - `doNotSay`: không tự sửa đơn từ chatbox nếu chưa có chức năng; không hiển thị thông tin nhạy cảm.
- `keywords`:
  - đổi địa chỉ
  - doi dia chi
  - sửa địa chỉ
  - sua dia chi
  - đổi sdt
  - doi sdt
  - sửa số điện thoại
  - sua so dien thoai
  - đổi thông tin đơn
  - doi thong tin don
  - sửa đơn
  - sua don
  - đổi sản phẩm
  - doi san pham
  - đổi số lượng
  - doi so luong
  - thêm sản phẩm vào đơn
  - them san pham vao don
  - đổi người nhận
  - doi nguoi nhan
  - đổi giờ nhận
  - doi gio nhan
  - đổi ngày nhận
  - doi ngay nhan
  - đổi thời gian giao
  - doi thoi gian giao
  - thêm ghi chú
  - them ghi chu
  - sửa ghi chú
  - sua ghi chu
  - đổi phương thức giao
  - doi phuong thuc giao
  - đổi thanh toán
  - doi thanh toan
  - đổi cod
  - doi cod
  - change address
  - change phone
  - change order
  - edit order
  - update order
  - change delivery time
  - change recipient
  - change payment

`response`:

Dạ nếu anh/chị muốn đổi thông tin đơn sau khi đặt, trước tiên cần kiểm tra đơn đang ở trạng thái nào.

Anh/chị gửi **SĐT đã dùng khi đặt hàng** để Rêu tra trạng thái đơn. Nếu đơn chưa được xác nhận/xử lý, anh/chị nên liên hệ shop để shop hỗ trợ đổi thông tin. Nếu đơn đã được xử lý hoặc đang giao, việc thay đổi có thể không còn kịp.

Rêu sẽ không hiển thị địa chỉ, SĐT đầy đủ, email, tổng tiền hoặc tracking link trong chatbox.

### Case: order_cancel

- `caseId`: `order_cancel`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn hủy đơn hoặc hỏi có hủy được không.
  - `mustAnswer`: đơn chỉ có thể tự hủy khi còn trạng thái chờ xác nhận/PENDING; nếu đã xác nhận/đang xử lý/đang giao thì cần shop kiểm tra.
  - `askIfNeeded`: yêu cầu SĐT đã đặt để tra trạng thái.
  - `routeToDb`: tra trạng thái đơn bằng SĐT.
  - `routeToHuman`: nếu không thể tự hủy hoặc đơn đã xử lý, hướng dẫn liên hệ shop.
  - `doNotSay`: không cam kết hủy thành công khi chưa biết trạng thái đơn; không nói tổng tiền/voucher chi tiết trong chatbox.
- `keywords`:
  - hủy đơn
  - huy don
  - huỷ đơn
  - cancel order
  - cancel my order
  - muốn hủy đơn
  - muon huy don
  - hủy được không
  - huy duoc khong
  - không mua nữa
  - khong mua nua
  - đặt nhầm
  - dat nham
  - đặt sai
  - dat sai
  - đổi ý
  - doi y
  - bỏ đơn
  - bo don
  - hủy đơn cod
  - huy don cod
  - hủy đơn đã đặt
  - huy don da dat
  - hủy đơn đang giao
  - huy don dang giao
  - hủy đơn đã xác nhận
  - huy don da xac nhan
  - hoàn voucher khi hủy
  - hoan voucher khi huy
  - hủy có mất phí không
  - huy co mat phi khong
  - cancel
  - can cancel

`response`:

Dạ đơn chỉ có thể tự hủy khi còn ở trạng thái chờ xác nhận/chưa xử lý.

Anh/chị gửi **SĐT đã dùng khi đặt hàng** để Rêu kiểm tra trạng thái đơn trước. Nếu đơn đã được xác nhận, đang xử lý hoặc đang giao, anh/chị nên liên hệ shop để shop kiểm tra còn hỗ trợ hủy được không.

Rêu không tự cam kết hủy thành công khi chưa biết trạng thái đơn.

### Case: order_hold_or_preorder

- `caseId`: `order_hold_or_preorder`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `90`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn giữ hàng, đặt trước, chờ shop làm, đặt mẫu sắp có hoặc hỏi có giữ sản phẩm được không.
  - `mustAnswer`: cần kiểm tra tồn kho/sản phẩm có sẵn hoặc thời gian làm; Rêu không tự giữ hàng nếu hệ thống chưa hỗ trợ.
  - `askIfNeeded`: hỏi mẫu muốn giữ/đặt trước và SĐT liên hệ nếu chuyển shop, nhưng không lộ thông tin nhạy cảm trong chatbox.
  - `routeToDb`: kiểm tra sản phẩm còn hàng/đặt trước nếu DB có thông tin.
  - `routeToCustom`: nếu là mẫu theo yêu cầu, chuyển Group 9 `Custom Theo Yêu Cầu`.
  - `routeToHuman`: giữ hàng/đặt cọc cần shop xác nhận.
  - `doNotSay`: không cam kết giữ hàng, không tự nhận cọc, không tự tạo đơn đặt trước.
- `keywords`:
  - giữ hàng
  - giu hang
  - giữ mẫu
  - giu mau
  - giữ bể
  - giu be
  - đặt trước
  - dat truoc
  - preorder
  - pre order
  - reserve
  - reservation
  - hold item
  - hold product
  - có giữ hàng không
  - co giu hang khong
  - giữ giúp mình
  - giu giup minh
  - mai lấy được không
  - mai lay duoc khong
  - hôm sau lấy
  - hom sau lay
  - chờ có hàng
  - cho co hang
  - khi nào có lại
  - khi nao co lai
  - đặt cọc giữ hàng
  - dat coc giu hang
  - đặt mẫu trước
  - dat mau truoc
  - nhận tại shop
  - nhan tai shop
  - lấy tại shop
  - lay tai shop
  - pickup
  - store pickup

`response`:

Dạ nếu anh/chị muốn giữ hàng hoặc đặt trước một mẫu, Rêu cần kiểm tra mẫu đó còn hàng/có nhận đặt trước không.

Rêu không tự cam kết giữ hàng hoặc nhận cọc trong chatbox. Với sản phẩm có sẵn, anh/chị nên đặt trực tiếp trên website hoặc liên hệ shop để shop xác nhận giữ mẫu. Với mẫu custom/theo yêu cầu, phần thời gian làm và đặt cọc cần shop xác nhận riêng.

### Case: order_voucher_discount

- `caseId`: `order_voucher_discount`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `93`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi mã giảm giá, voucher, coupon, áp mã không được, có khuyến mãi không.
  - `mustAnswer`: nhập mã ở bước checkout; hệ thống sẽ kiểm tra hợp lệ; voucher có thể giảm tiền hoặc miễn phí vận chuyển tùy chương trình.
  - `askIfNeeded`: nếu báo lỗi mã, hỏi user kiểm tra lại mã/điều kiện áp dụng nhưng không yêu cầu gửi thông tin đơn nhạy cảm.
  - `routeToCheckout`: mọi điều kiện cụ thể cần kiểm tra ở checkout.
  - `routeToShipping`: nếu voucher freeship thì có thể liên hệ Group 3 freeship.
  - `doNotSay`: không tự tạo mã giảm giá; không cam kết mã còn hiệu lực nếu chưa kiểm tra.
- `keywords`:
  - mã giảm giá
  - ma giam gia
  - voucher
  - coupon
  - discount code
  - promo code
  - code giảm giá
  - code giam gia
  - nhập mã
  - nhap ma
  - áp mã
  - ap ma
  - áp voucher
  - ap voucher
  - mã không được
  - ma khong duoc
  - voucher lỗi
  - voucher loi
  - không áp được mã
  - khong ap duoc ma
  - khuyến mãi
  - khuyen mai
  - giảm giá
  - giam gia
  - sale
  - promotion
  - promo
  - mã hết hạn
  - ma het han
  - voucher hết hạn
  - voucher het han
  - mã đã dùng
  - ma da dung
  - voucher đã dùng
  - voucher da dung
  - sai mã
  - sai ma
  - mã sai
  - ma sai
  - điều kiện voucher
  - dieu kien voucher
  - đơn tối thiểu
  - don toi thieu
  - min order
  - minimum order
  - coupon not working
  - voucher not working

`response`:

Dạ nếu có mã giảm giá/voucher, anh/chị nhập ở phần **Mã Giảm Giá** trong bước thanh toán rồi nhấn áp dụng.

Hệ thống sẽ kiểm tra mã có hợp lệ không. Voucher có thể là giảm tiền hoặc miễn phí vận chuyển tùy chương trình. Nếu mã không áp dụng được, anh/chị kiểm tra lại mã, điều kiện áp dụng và thời hạn chương trình ở checkout.

Rêu không tự tạo mã giảm giá hoặc cam kết mã còn hiệu lực nếu hệ thống chưa kiểm tra.

### Case: order_lookup_by_phone

- `caseId`: `order_lookup_by_phone`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `99`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn tra cứu đơn hàng bằng SĐT hoặc hỏi trạng thái đơn sau khi đặt.
  - `mustAnswer`: yêu cầu SĐT đã dùng khi đặt hàng; trạng thái trả về bằng tiếng Việt; ẩn thông tin nhạy cảm.
  - `routeToDb`: phải dùng DB order lookup.
  - `routeToShipping`: nếu chỉ hỏi thời gian giao chung thì chuyển Group 3.
  - `doNotSay`: không hiển thị địa chỉ, SĐT đầy đủ, email, tổng tiền, tracking link, mã vận đơn.
- `keywords`:
  - tra cứu đơn
  - tra cuu don
  - kiểm tra đơn
  - kiem tra don
  - đơn hàng của tôi
  - don hang cua toi
  - đơn của mình
  - don cua minh
  - trạng thái đơn
  - trang thai don
  - tình trạng đơn
  - tinh trang don
  - đơn tới đâu
  - don toi dau
  - đơn xử lý chưa
  - don xu ly chua
  - đơn xác nhận chưa
  - don xac nhan chua
  - check order
  - order status
  - my order
  - lookup order
  - find order
  - order by phone
  - mã đơn
  - ma don
  - mã đơn hàng
  - ma don hang
  - số đơn
  - so don
  - order number
  - order id
  - tìm đơn
  - tim don
  - không thấy đơn
  - khong thay don
  - không tìm thấy đơn
  - khong tim thay don
  - có mấy đơn
  - co may don
  - tra bằng sdt
  - tra bang sdt
  - kiểm tra bằng sdt
  - kiem tra bang sdt

`response`:

Dạ anh/chị gửi giúp Rêu **SĐT đã dùng khi đặt hàng** để em tra cứu trạng thái đơn.

Rêu sẽ chỉ hiển thị trạng thái đơn bằng tiếng Việt ở mức cần thiết và sẽ ẩn thông tin nhạy cảm như địa chỉ, SĐT đầy đủ, email, tổng tiền, tracking link và mã vận đơn.

### Case: order_checkout_error_or_inventory

- `caseId`: `order_checkout_error_or_inventory`
- `group`: `Thanh toán & Đặt hàng`
- `category`: `policy_payment_order`
- `priority`: `91`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user gặp lỗi khi đặt hàng, không thanh toán được, sản phẩm không đủ tồn kho, giỏ hàng lỗi.
  - `mustAnswer`: hướng dẫn kiểm tra lại số lượng, sản phẩm còn hàng, thông tin nhận hàng, voucher; nếu vẫn lỗi thì liên hệ shop.
  - `routeToDb`: nếu hỏi sản phẩm còn hàng/giá, dùng DB sản phẩm.
  - `routeToHuman`: lỗi checkout lặp lại thì gửi shop kiểm tra.
  - `doNotSay`: không tự hứa giữ hàng nếu tồn kho không đủ; không tự tạo đơn thay user.
- `keywords`:
  - lỗi đặt hàng
  - loi dat hang
  - đặt hàng lỗi
  - dat hang loi
  - checkout lỗi
  - checkout loi
  - không đặt được
  - khong dat duoc
  - không thanh toán được
  - khong thanh toan duoc
  - không mua được
  - khong mua duoc
  - giỏ hàng lỗi
  - gio hang loi
  - lỗi giỏ hàng
  - loi gio hang
  - sản phẩm không đủ tồn kho
  - san pham khong du ton kho
  - không đủ tồn kho
  - khong du ton kho
  - hết hàng khi thanh toán
  - het hang khi thanh toan
  - voucher không áp dụng được
  - voucher khong ap dung duoc
  - checkout error
  - order error
  - cannot checkout
  - payment failed
  - cart error
  - out of stock
  - insufficient stock
  - lỗi đăng nhập
  - loi dang nhap
  - lỗi địa chỉ
  - loi dia chi
  - sai số điện thoại
  - sai so dien thoai
  - thiếu thông tin
  - thieu thong tin
  - không bấm đặt hàng được
  - khong bam dat hang duoc
  - nút đặt hàng bị mờ
  - nut dat hang bi mo
  - button đặt hàng bị disable
  - voucher đang kiểm tra
  - voucher dang kiem tra
  - sản phẩm đã hết
  - san pham da het
  - stock changed
  - invalid address
  - invalid phone
  - login error

`response`:

Dạ nếu checkout báo lỗi, anh/chị thử kiểm tra nhanh các phần này:

- Sản phẩm/số lượng trong giỏ có còn đủ tồn kho không
- Thông tin nhận hàng đã điền đủ chưa
- Mã giảm giá/voucher có hợp lệ không
- Phương thức giao và thanh toán đã chọn đúng chưa

Nếu vẫn lỗi, anh/chị có thể liên hệ shop và gửi mô tả lỗi đang gặp. Với câu hỏi sản phẩm còn hàng/giá hiện tại, Rêu sẽ ưu tiên tra từ DB sản phẩm để tránh trả sai.

## Group 5: Tư vấn chọn sản phẩm

Trạng thái: **bản nháp để duyệt**.

Phạm vi Group 5:

- Tư vấn chọn terrarium theo ngân sách, mục đích, người nhận, vị trí đặt, mức dễ chăm, ánh sáng và thói quen chăm.
- Giá, tồn kho, sản phẩm còn hàng, sản phẩm cụ thể phải ưu tiên DB.
- GPT chỉ diễn giải tự nhiên dựa trên DB + KB; không tự bịa sản phẩm/giá/tồn kho.
- Nếu user hỏi custom/theo yêu cầu/đặt mẫu riêng thì chuyển Group 9.
- Nếu user hỏi cách chăm sau khi chọn mẫu thì chuyển Group 6/7.

Nguyên tắc normalize cho Group 5:

- Hiểu các kiểu viết ngân sách phổ biến:
  - `1tr`, `1 triệu`, `1.000.000`, `1000000`, `1000k` = khoảng 1.000.000đ.
  - `1tr5`, `1.5tr`, `1 triệu rưỡi`, `1.500.000`, `1500k` = khoảng 1.500.000đ.
  - `500k`, `500.000`, `500 nghìn`, `nửa triệu` = khoảng 500.000đ.
- Hiểu câu không dấu, viết tắt, chat ngắn: `sv`, `hs`, `nvvp`, `vp`, `wfh`, `decor ban`, `be mini`, `re`, `de cham`.
- Nếu user vừa nói ngân sách vừa nói mục đích/vị trí đặt, ưu tiên route vào case cụ thể hơn thay vì hỏi lại chung.
- Nếu câu có sản phẩm/giá/tồn kho cụ thể, luôn lấy DB trước rồi GPT chỉ diễn giải.
- Nếu thiếu 1 trong 3 thông tin quan trọng `ngân sách`, `vị trí đặt`, `mua dùng hay tặng`, hỏi lại ngắn gọn 1-2 ý.

### Case: product_consult_beginner

- `caseId`: `product_consult_beginner`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `100`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user mới chơi terrarium, chưa biết chọn bể nào, muốn mẫu dễ chăm.
  - `mustAnswer`: ưu tiên mẫu dễ chăm, ổn định, kích thước vừa/mini, không cần can thiệp nhiều; hỏi ngân sách và vị trí đặt nếu thiếu.
  - `askIfNeeded`: nếu user chỉ nói mới chơi, hỏi ngân sách và vị trí đặt; nếu user nói thêm bận/lười chăm thì ưu tiên case ít chăm.
  - `routeToDb`: lấy sản phẩm có `careLevel` dễ/trung bình, `chatTags` người mới/easy-care nếu có.
  - `doNotSay`: không gợi ý sản phẩm hết hàng; không hứa "không cần chăm".
- `keywords`:
  - người mới
  - nguoi moi
  - mới chơi
  - moi choi
  - lần đầu chơi
  - lan dau choi
  - mới bắt đầu
  - moi bat dau
  - mới tập chơi
  - moi tap choi
  - chưa chơi bao giờ
  - chua choi bao gio
  - chưa biết gì
  - chua biet gi
  - chưa biết chọn
  - chua biet chon
  - không biết chọn bể
  - khong biet chon be
  - beginner
  - newbie
  - noob
  - new to terrarium
  - new terrarium
  - starter
  - starter kit
  - first terrarium
  - first time
  - lần đầu mua
  - lan dau mua
  - mua lần đầu
  - mua lan dau
  - mới mua lần đầu
  - moi mua lan dau
  - dễ chăm
  - de cham
  - de cham nhat
  - dễ chăm nhất
  - dễ nuôi
  - de nuoi
  - dễ sống
  - de song
  - khó chết
  - kho chet
  - bền
  - ben
  - ổn định
  - on dinh
  - ít chăm
  - it cham
  - không biết chăm
  - khong biet cham
  - tư vấn cho người mới
  - tu van cho nguoi moi
  - be nao de cham
  - bể nào dễ chăm
  - nên mua bể nào đầu tiên
  - nen mua be nao dau tien
  - recommend for beginner
  - beginner friendly
  - easy for beginner

`response`:

Dạ nếu anh/chị mới chơi terrarium, Rêu sẽ ưu tiên các mẫu dễ chăm, bố cục ổn định, không cần can thiệp nhiều và phù hợp đặt nơi sáng gián tiếp.

Anh/chị cho Rêu thêm 2 ý để gợi ý sát hơn:
- Ngân sách khoảng bao nhiêu?
- Bể đặt ở đâu: bàn học, bàn làm việc, phòng ngủ, kệ hay văn phòng?

Sau đó Rêu sẽ ưu tiên lọc sản phẩm còn hàng từ DB, không tự bịa mẫu/giá.

### Case: product_consult_budget

- `caseId`: `product_consult_budget`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `99`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi sản phẩm theo ngân sách/tầm giá/rẻ/cao cấp.
  - `mustAnswer`: hỏi hoặc nhận diện budget; gợi ý lọc sản phẩm theo DB; nếu chưa có budget thì hỏi khoảng giá.
  - `askIfNeeded`: nếu user ghi ngân sách không rõ như `tầm vừa vừa`, `rẻ thôi`, hỏi khoảng giá cụ thể.
  - `routeToDb`: lọc sản phẩm theo giá, salePrice, tồn kho, category.
  - `doNotSay`: không nói giá nếu không lấy từ DB; không gợi ý mẫu hết hàng.
- `keywords`:
  - ngân sách
  - ngan sach
  - budget
  - my budget
  - budget 500k
  - budget 1tr
  - ngan sach 500k
  - ngan sach 1tr
  - tầm giá
  - tam gia
  - khoảng giá
  - khoang gia
  - giá rẻ
  - gia re
  - rẻ
  - re
  - re re
  - rẻ rẻ
  - rẻ nhất
  - re nhat
  - rẻ xíu
  - re xiu
  - giá mềm
  - gia mem
  - hạt dẻ
  - hat de
  - bình dân
  - binh dan
  - tiết kiệm
  - tiet kiem
  - dưới 300k
  - duoi 300k
  - <300k
  - 300k đổ lại
  - 300k do lai
  - khoảng 300k
  - khoang 300k
  - tầm 300k
  - tam 300k
  - dưới 500k
  - duoi 500k
  - <500k
  - 500k đổ lại
  - 500k do lai
  - nửa triệu
  - nua trieu
  - 500 nghìn
  - 500 nghin
  - 500.000
  - 500000
  - dưới 1tr
  - duoi 1tr
  - dưới 1 triệu
  - duoi 1 trieu
  - <1tr
  - 1tr đổ lại
  - 1tr do lai
  - 1 triệu đổ lại
  - 1 trieu do lai
  - 1000k
  - 1.000.000
  - 1000000
  - khoảng 500k
  - khoang 500k
  - tầm 1tr
  - tam 1tr
  - khoảng 1tr
  - khoang 1tr
  - tầm 1 triệu
  - tam 1 trieu
  - 1tr5
  - 1.5tr
  - 1 triệu rưỡi
  - 1 trieu ruoi
  - 1.500.000
  - 1500k
  - 2tr
  - 2 triệu
  - 2 trieu
  - 2.000.000
  - 2000k
  - không quá 1tr
  - khong qua 1tr
  - max 1tr
  - max 500k
  - under 500k
  - under 1m
  - under 1 million
  - below 500k
  - below 1m
  - affordable
  - cheap
  - best price
  - best budget
  - premium
  - cao cấp
  - cao cap
  - mẫu sang
  - mau sang
  - mẫu xịn
  - mau xin
  - luxury
  - high end

`response`:

Dạ Rêu có thể gợi ý theo ngân sách của anh/chị.

Anh/chị gửi khoảng giá mong muốn, ví dụ `dưới 500k`, `khoảng 1tr`, hoặc `mẫu cao cấp hơn`. Rêu sẽ ưu tiên lấy sản phẩm còn hàng và giá hiện tại từ DB để gợi ý, tránh trả sai giá/tồn kho.

### Case: product_consult_gift

- `caseId`: `product_consult_gift`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `98`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user mua terrarium làm quà tặng.
  - `mustAnswer`: hỏi dịp tặng, người nhận, ngân sách; ưu tiên mẫu đẹp, dễ chăm, an toàn vận chuyển.
  - `askIfNeeded`: nếu user chưa biết gu người nhận, hỏi thích đơn giản/sang/cute/tự nhiên.
  - `routeToDb`: lọc theo `chatTags` gift/decor/easy-care nếu có.
  - `doNotSay`: không gợi ý mẫu quá khó chăm cho người nhận chưa có kinh nghiệm.
- `keywords`:
  - quà tặng
  - qua tang
  - mua tặng
  - mua tang
  - làm quà
  - lam qua
  - gift
  - present
  - tặng sinh nhật
  - tang sinh nhat
  - sinh nhật
  - sinh nhat
  - sn
  - birthday
  - bday
  - tân gia
  - tan gia
  - housewarming
  - khai trương
  - khai truong
  - opening gift
  - anniversary
  - kỷ niệm
  - ky niem
  - valentine
  - 8/3
  - 20/10
  - 20/11
  - noel
  - christmas
  - giáng sinh
  - giang sinh
  - bạn gái
  - ban gai
  - ny
  - người yêu
  - nguoi yeu
  - crush
  - vợ
  - vo
  - chồng
  - chong
  - bạn trai
  - ban trai
  - mẹ
  - me
  - bố
  - bo
  - ba
  - cha
  - đồng nghiệp
  - dong nghiep
  - sếp
  - sep
  - thầy cô
  - thay co
  - quà văn phòng
  - qua van phong
  - quà decor
  - qua decor
  - quà xanh
  - qua xanh
  - quà nhỏ xinh
  - qua nho xinh
  - quà để bàn
  - qua de ban
  - quà dễ chăm
  - qua de cham
  - quà dưới 500k
  - qua duoi 500k
  - quà khoảng 1tr
  - qua khoang 1tr
  - gift for girlfriend
  - gift for boyfriend
  - gift for boss
  - gift for coworker
  - gift idea
  - cute gift
  - desk gift
  - plant gift

`response`:

Dạ terrarium làm quà khá hợp vì gọn, xanh và có tính decor lâu dài.

Anh/chị cho Rêu biết thêm:
- Tặng dịp gì?
- Người nhận là nam/nữ, độ tuổi hoặc phong cách thích đơn giản/sang/đáng yêu?
- Ngân sách khoảng bao nhiêu?

Rêu sẽ ưu tiên mẫu đẹp, dễ chăm và phù hợp vận chuyển/tặng quà từ danh sách sản phẩm còn hàng.

### Case: product_consult_profile_work_life

- `caseId`: `product_consult_profile_work_life`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `97`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user tự mô tả nghề/ngữ cảnh sống như sinh viên, nhân viên văn phòng, freelancer, work from home để hỏi mẫu phù hợp.
  - `mustAnswer`: tư vấn theo ngữ cảnh sử dụng: bàn học/bàn làm việc/góc decor; hỏi ngân sách và vị trí đặt nếu thiếu.
  - `routeToDb`: lọc sản phẩm theo tag desk/office/student/workspace/easy-care.
  - `doNotSay`: không áp một mẫu cố định cho mọi người; phải hỏi thêm nếu thiếu ngân sách/vị trí.
- `keywords`:
  - tôi là sinh viên
  - toi la sinh vien
  - mình là sinh viên
  - minh la sinh vien
  - sv
  - hs
  - học sinh
  - hoc sinh
  - sinh viên
  - sinh vien
  - student
  - college student
  - university student
  - nhân viên văn phòng
  - nhan vien van phong
  - nv văn phòng
  - nv van phong
  - nvvp
  - vp
  - dân văn phòng
  - dan van phong
  - office worker
  - office staff
  - freelancer
  - freelance
  - fl
  - làm freelance
  - lam freelance
  - work from home
  - wfh
  - remote worker
  - làm remote
  - lam remote
  - làm ở nhà
  - lam o nha
  - designer
  - dev
  - coder
  - kế toán
  - ke toan
  - giáo viên
  - giao vien
  - teacher
  - chủ shop
  - chu shop
  - bàn học
  - ban hoc
  - decor bàn học
  - decor ban hoc
  - bàn làm việc
  - ban lam viec
  - bàn lv
  - ban lv
  - decor bàn làm việc
  - decor ban lam viec
  - góc làm việc
  - goc lam viec
  - desk setup
  - workspace
  - working desk
  - study desk
  - decor bàn
  - decor ban
  - bể để bàn
  - be de ban
  - bể mini để bàn
  - be mini de ban
  - cây để bàn
  - cay de ban
  - xanh bàn làm việc
  - xanh ban lam viec
  - thư giãn mắt
  - thu gian mat
  - giảm stress
  - giam stress
  - chill desk
  - office decor
  - setup góc học tập
  - setup goc hoc tap

`response`:

Dạ với sinh viên, dân văn phòng hoặc freelancer, Rêu thường ưu tiên mẫu gọn, sạch bàn, dễ chăm và nhìn thư giãn khi học/làm việc.

Anh/chị cho Rêu thêm ngân sách và vị trí đặt bể nhé. Nếu đặt bàn học/bàn làm việc, Rêu sẽ ưu tiên mẫu mini hoặc vừa, ít chiếm diện tích và không cần chăm quá cầu kỳ.

### Case: product_consult_low_maintenance

- `caseId`: `product_consult_low_maintenance`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user bận, lười chăm, hay quên tưới, muốn mẫu ít chăm.
  - `mustAnswer`: ưu tiên bể dễ chăm/ổn định; nói vẫn cần kiểm tra ánh sáng/độ ẩm định kỳ.
  - `routeToDb`: lọc theo careLevel dễ, setupStatus đã setup, chatTags low-maintenance.
  - `doNotSay`: không nói "không cần chăm hoàn toàn".
- `keywords`:
  - bận
  - ban
  - bận rộn
  - ban ron
  - bận lắm
  - ban lam
  - ít thời gian
  - it thoi gian
  - ít chăm
  - it cham
  - lười chăm
  - luoi cham
  - lười tưới
  - luoi tuoi
  - hay quên tưới
  - hay quen tuoi
  - quên tưới
  - quen tuoi
  - đi công tác
  - di cong tac
  - hay đi xa
  - hay di xa
  - ít ở nhà
  - it o nha
  - không rành chăm
  - khong ranh cham
  - không có thời gian chăm
  - khong co thoi gian cham
  - low maintenance
  - easy care
  - minimal care
  - low care
  - tự sống được không
  - tu song duoc khong
  - không cần chăm
  - khong can cham
  - không cần tưới
  - khong can tuoi
  - lâu lâu mới tưới
  - lau lau moi tuoi
  - chăm đơn giản
  - cham don gian
  - low effort
  - easy to maintain

`response`:

Dạ nếu anh/chị bận hoặc muốn mẫu ít chăm, Rêu sẽ ưu tiên các bể dễ chăm, ổn định và không cần tưới quá thường xuyên.

Tuy vậy terrarium vẫn cần kiểm tra ánh sáng, độ ẩm và tình trạng cây/rêu định kỳ. Rêu sẽ lọc sản phẩm theo mức dễ chăm từ DB nếu dữ liệu có sẵn, thay vì nói chung chung.

### Case: product_consult_location_light

- `caseId`: `product_consult_location_light`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi đặt ở phòng ngủ, bàn làm việc, phòng máy lạnh, ít sáng, gần cửa sổ.
  - `mustAnswer`: chọn theo ánh sáng/môi trường; tránh nắng trực tiếp; phòng ít sáng cần mẫu chịu sáng yếu hơn hoặc dùng đèn hỗ trợ.
  - `askIfNeeded`: nếu user chỉ nói vị trí, hỏi thêm nơi đó có sáng tự nhiên không và có máy lạnh/gió trực tiếp không.
  - `routeToCare`: nếu hỏi chăm trong môi trường đó, chuyển Group 6.
  - `routeToDb`: lọc sản phẩm theo tag office/bedroom/low-light/aircon nếu có.
  - `doNotSay`: không khuyên đặt nắng trực tiếp trong bể kính.
- `keywords`:
  - đặt ở đâu
  - dat o dau
  - để đâu
  - de dau
  - phòng ngủ
  - phong ngu
  - phòng ngủ ít sáng
  - phong ngu it sang
  - đầu giường
  - dau giuong
  - kệ đầu giường
  - ke dau giuong
  - phòng khách
  - phong khach
  - phòng khách sáng
  - phong khach sang
  - kệ sách
  - ke sach
  - kệ tivi
  - ke tivi
  - quầy lễ tân
  - quay le tan
  - quầy thu ngân
  - quay thu ngan
  - bàn làm việc
  - ban lam viec
  - văn phòng
  - van phong
  - công ty
  - cong ty
  - office desk
  - reception
  - phòng máy lạnh
  - phong may lanh
  - phòng lạnh
  - phong lanh
  - điều hòa
  - dieu hoa
  - aircon
  - ac room
  - ít sáng
  - it sang
  - thiếu sáng
  - thieu sang
  - tối
  - toi
  - phòng tối
  - phong toi
  - không có nắng
  - khong co nang
  - không có cửa sổ
  - khong co cua so
  - low light
  - no sunlight
  - no window
  - cửa sổ
  - cua so
  - gần cửa sổ
  - gan cua so
  - cạnh cửa sổ
  - canh cua so
  - có nắng
  - co nang
  - nắng nhẹ
  - nang nhe
  - nắng trực tiếp
  - nang truc tiep
  - ánh sáng yếu
  - anh sang yeu
  - ánh sáng gián tiếp
  - anh sang gian tiep
  - desk
  - bedroom
  - office
  - shelf
  - windowsill
  - ban công
  - ban cong
  - balcony
  - quán cafe
  - quan cafe
  - cafe decor
  - shop decor
  - studio

`response`:

Dạ vị trí đặt ảnh hưởng nhiều tới việc chọn bể.

Nguyên tắc nhanh:
- Bàn làm việc/văn phòng: ưu tiên mẫu gọn, dễ chăm.
- Phòng máy lạnh: cần chú ý độ ẩm, tránh gió lạnh thổi trực tiếp.
- Phòng ít sáng: nên chọn mẫu dễ chịu sáng yếu hơn hoặc có đèn hỗ trợ.
- Gần cửa sổ: chỉ nên là ánh sáng gián tiếp, tránh nắng gắt chiếu trực tiếp vào bể kính.

Anh/chị cho Rêu biết vị trí đặt cụ thể và ngân sách, Rêu sẽ lọc mẫu phù hợp hơn.

### Case: product_consult_closed_open

- `caseId`: `product_consult_closed_open`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `94`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user phân vân bể kín/bể mở, sen đá/xương rồng/rêu/cây ưa ẩm.
  - `mustAnswer`: giải thích chọn bể theo môi trường cây; bể kín hợp rêu/cây ưa ẩm, bể mở hợp cây cần thoáng hơn.
  - `routeToTerrariumKnowledge`: nếu hỏi kiến thức nền, chuyển Group 8.
  - `routeToDb`: lọc theo category/setup/product tags nếu có.
  - `doNotSay`: không khuyên sen đá/xương rồng vào bể kín ẩm lâu.
- `keywords`:
  - bể kín
  - be kin
  - be kin hay khong
  - có nắp
  - co nap
  - bể có nắp
  - be co nap
  - bể mở
  - be mo
  - không nắp
  - khong nap
  - bể không nắp
  - be khong nap
  - kín hay mở
  - kin hay mo
  - nên mua bể kín hay mở
  - nen mua be kin hay mo
  - loại nào dễ chăm
  - loai nao de cham
  - closed terrarium
  - open terrarium
  - sealed terrarium
  - jar terrarium
  - hồ kín
  - ho kin
  - hồ mở
  - ho mo
  - sen đá
  - sen da
  - sen da duoc khong
  - sen đá được không
  - xương rồng
  - xuong rong
  - xương rồng được không
  - xuong rong duoc khong
  - succulent
  - cactus
  - rêu
  - reu
  - moss
  - fittonia
  - cẩm nhung
  - cam nhung
  - dương xỉ
  - duong xi
  - fern
  - cây ưa ẩm
  - cay ua am
  - cây khô
  - cay kho
  - cây chịu ẩm
  - cay chiu am
  - cây chịu khô
  - cay chiu kho

`response`:

Dạ nếu anh/chị thích rêu/cây xanh ưa ẩm, bể kín hoặc bán kín thường hợp hơn vì giữ ẩm tốt. Nếu thích sen đá/xương rồng hoặc cây cần thoáng, bể mở sẽ phù hợp hơn.

Người mới thường nên chọn mẫu dễ chăm và ổn định trước. Nếu anh/chị nói thêm vị trí đặt và mức chăm mong muốn, Rêu sẽ lọc sản phẩm phù hợp từ DB.

### Case: product_consult_setup_diy

- `caseId`: `product_consult_setup_diy`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `93`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi bể đã setup sẵn, DIY kit, tự làm, mua về dùng ngay.
  - `mustAnswer`: phân biệt đã setup sẵn và DIY; người mới nên ưu tiên setup sẵn nếu muốn tiện.
  - `routeToDb`: dùng `setupStatus` nếu có.
  - `routeToCustom`: nếu user muốn làm theo mẫu riêng, chuyển Group 9.
  - `doNotSay`: không nói mọi sản phẩm đều đã setup nếu DB không xác nhận.
- `keywords`:
  - setup sẵn
  - setup san
  - set up sẵn
  - set up san
  - setup full
  - fullset
  - full set
  - đã setup
  - da setup
  - bể đã làm sẵn
  - be da lam san
  - làm sẵn
  - lam san
  - thành phẩm
  - thanh pham
  - có cây sẵn
  - co cay san
  - có rêu sẵn
  - co reu san
  - có phụ kiện sẵn
  - co phu kien san
  - mua về dùng ngay
  - mua ve dung ngay
  - mua về đặt luôn
  - mua ve dat luon
  - không cần tự làm
  - khong can tu lam
  - full setup
  - ready made
  - ready to display
  - ready to use
  - diy
  - DIY
  - diy kit
  - tự làm
  - tu lam
  - muốn tự làm
  - muon tu lam
  - tự trồng
  - tu trong
  - kit terrarium
  - bộ tự làm
  - bo tu lam
  - bộ diy
  - bo diy
  - vật liệu tự làm
  - vat lieu tu lam
  - nguyên liệu
  - nguyen lieu
  - tự setup
  - tu setup
  - tự decor
  - tu decor

`response`:

Dạ nếu anh/chị muốn tiện và ít rủi ro, nên chọn bể đã setup sẵn/mua về đặt dùng ngay. Nếu anh/chị thích tự tay làm thì có thể hỏi các mẫu DIY/kit nếu shop có hỗ trợ.

Rêu sẽ ưu tiên kiểm tra DB theo trạng thái setup của sản phẩm. Nếu anh/chị muốn làm theo mẫu riêng hoặc chủ đề riêng, phần đó sẽ chuyển sang Group 9 `Custom Theo Yêu Cầu`.

### Case: product_consult_compare

- `caseId`: `product_consult_compare`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `92`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn so sánh 2 hoặc nhiều mẫu, hỏi mẫu nào tốt hơn/hợp hơn.
  - `mustAnswer`: so sánh theo nhu cầu, kích thước, giá, độ dễ chăm, vị trí đặt, mục đích mua.
  - `routeToDb`: lấy thông tin sản phẩm thực tế từ DB.
  - `askIfNeeded`: nếu user chưa nêu mẫu, hỏi tên/link/screenshot hoặc nhu cầu.
  - `doNotSay`: không khẳng định mẫu tốt nhất nếu chưa biết nhu cầu.
- `keywords`:
  - so sánh
  - so sanh
  - so sanh giup
  - so sánh giúp
  - mẫu nào tốt hơn
  - mau nao tot hon
  - nên chọn mẫu nào
  - nen chon mau nao
  - chọn cái nào
  - chon cai nao
  - nên lấy mẫu nào
  - nen lay mau nao
  - lấy mẫu nào
  - lay mau nao
  - cái nào hợp hơn
  - cai nao hop hon
  - mẫu nào hợp với mình
  - mau nao hop voi minh
  - bể mini hay bể cơ bản
  - be mini hay be co ban
  - bể mini hay bể cao cấp
  - be mini hay be cao cap
  - bể kín hay bể mở
  - be kin hay be mo
  - mẫu này hay mẫu kia
  - mau nay hay mau kia
  - compare
  - which one
  - which is better
  - better choice
  - recommend between
  - a or b
  - this or that
  - choose for me

`response`:

Dạ Rêu có thể so sánh giúp anh/chị, nhưng cần biết mình đang phân vân giữa những mẫu nào hoặc nhu cầu chính là gì.

Rêu sẽ so theo các tiêu chí: giá hiện tại, còn hàng không, kích thước/độ nổi bật, mức dễ chăm, vị trí đặt và mục đích mua dùng hay tặng. Thông tin giá/tồn kho sẽ ưu tiên lấy từ DB.

### Case: product_consult_concerns_before_buying

- `caseId`: `product_consult_concerns_before_buying`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn mua nhưng đang lo ngại trước khi mua: sợ chết cây, sợ mốc, sợ côn trùng, sợ bẩn bàn, nhà có trẻ nhỏ/thú cưng, dị ứng, mùi.
  - `mustAnswer`: trấn an vừa đủ, không phủ nhận rủi ro; chọn mẫu dễ kiểm soát hơn và hỏi môi trường đặt.
  - `askIfNeeded`: hỏi vị trí đặt, có trẻ nhỏ/thú cưng không, phòng có máy lạnh/ít sáng không, user có muốn mẫu kín/ít phải mở không.
  - `routeToCare`: nếu user hỏi cách phòng mốc/côn trùng/chăm sau mua, chuyển Group 6/7.
  - `routeToDb`: lọc mẫu dễ chăm, ổn định, ít rụng lá, gọn, có nắp/bán kín nếu phù hợp.
  - `doNotSay`: không hứa tuyệt đối không mốc/không chết/không có côn trùng; không tư vấn y tế về dị ứng.
- `keywords`:
  - sợ chết cây
  - so chet cay
  - sợ cây chết
  - so cay chet
  - sợ cây héo
  - so cay heo
  - sợ mốc
  - so moc
  - sợ bị mốc
  - so bi moc
  - sợ côn trùng
  - so con trung
  - sợ bọ
  - so bo
  - sợ ruồi
  - so ruoi
  - sợ kiến
  - so kien
  - có mùi không
  - co mui khong
  - sợ mùi
  - so mui
  - có hôi không
  - co hoi khong
  - bẩn bàn không
  - ban ban khong
  - sợ bẩn bàn
  - so ban ban
  - có rơi đất không
  - co roi dat khong
  - nhà có mèo
  - nha co meo
  - nhà có chó
  - nha co cho
  - nhà có pet
  - nha co pet
  - pet friendly
  - cat friendly
  - dog friendly
  - nhà có trẻ nhỏ
  - nha co tre nho
  - trẻ nhỏ
  - tre nho
  - em bé
  - em be
  - có độc không
  - co doc khong
  - dị ứng
  - di ung
  - allergy
  - allergic
  - safe for kids
  - safe for pets
  - afraid mold
  - afraid bugs
  - plant die easily

`response`:

Dạ các lo ngại này rất hợp lý trước khi mua terrarium.

Rêu sẽ không hứa tuyệt đối là bể không bao giờ mốc/cây không bao giờ héo, vì còn phụ thuộc ánh sáng, độ ẩm và cách đặt bể. Nhưng Rêu có thể ưu tiên các mẫu dễ chăm, gọn, ổn định và ít phải can thiệp hơn.

Anh/chị cho Rêu biết thêm:
- Bể đặt ở đâu?
- Nhà có trẻ nhỏ/thú cưng không?
- Anh/chị muốn bể kín/bán kín hay bể mở?
- Mức chăm mong muốn: rất ít chăm hay có thể kiểm tra định kỳ?

Nếu câu hỏi liên quan dị ứng hoặc an toàn sức khỏe, Rêu chỉ có thể tư vấn ở mức thông tin sản phẩm; anh/chị nên cân nhắc kỹ môi trường sử dụng thực tế.

### Case: product_consult_price_stock_boundary

- `caseId`: `product_consult_price_stock_boundary`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `101`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi giá, còn hàng, mẫu cụ thể, sản phẩm nào còn, khi nào có lại.
  - `mustAnswer`: giá/tồn kho/sản phẩm cụ thể phải lấy từ DB; nếu hết hàng có thể gợi ý mẫu tương tự còn hàng.
  - `routeToDb`: bắt buộc.
  - `askIfNeeded`: hỏi tên mẫu/ngân sách/category nếu câu hỏi chưa rõ.
  - `doNotSay`: không tự bịa giá, tồn kho, link sản phẩm hoặc ngày restock.
- `keywords`:
  - giá bao nhiêu
  - gia bao nhieu
  - giá bn
  - gia bn
  - bn tiền
  - bn tien
  - nhiêu tiền
  - nhieu tien
  - bao nhiêu tiền
  - bao nhieu tien
  - xin giá
  - xin gia
  - báo giá
  - bao gia
  - giá hiện tại
  - gia hien tai
  - giá sale
  - gia sale
  - còn hàng không
  - con hang khong
  - còn ko
  - con ko
  - còn k
  - con k
  - còn không
  - con khong
  - hết hàng
  - het hang
  - sold out
  - tồn kho
  - ton kho
  - còn mấy cái
  - con may cai
  - còn bao nhiêu
  - con bao nhieu
  - còn mẫu này không
  - con mau nay khong
  - còn size này không
  - con size nay khong
  - còn phiên bản này không
  - con phien ban nay khong
  - khi nào có lại
  - khi nao co lai
  - bao giờ có lại
  - bao gio co lai
  - có lại hàng chưa
  - co lai hang chua
  - restock
  - back in stock
  - available
  - availability
  - in stock
  - out of stock
  - product price
  - price
  - how much
  - price pls
  - price please
  - is it available
  - still available
  - còn loại nào
  - con loai nao
  - mẫu khác
  - mau khac
  - gợi ý thêm
  - goi y them
  - link sản phẩm
  - link san pham
  - link mua
  - link order
  - sản phẩm này
  - san pham nay
  - mẫu này
  - mau nay

`response`:

Dạ các câu hỏi về giá, tồn kho, mẫu còn hàng hoặc sản phẩm cụ thể Rêu sẽ ưu tiên tra từ DB để trả đúng thông tin hiện tại.

Anh/chị gửi tên mẫu, tầm giá hoặc nhu cầu muốn tìm. Nếu mẫu đang hết hàng, Rêu có thể gợi ý vài mẫu tương tự còn hàng nếu DB có dữ liệu phù hợp.

### Case: product_consult_more_suggestions

- `caseId`: `product_consult_more_suggestions`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `91`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn xem thêm mẫu, mẫu khác, rẻ hơn/cao hơn/nhiều lựa chọn hơn.
  - `mustAnswer`: hỏi hướng muốn đổi: rẻ hơn, cao cấp hơn, dễ chăm hơn, nhỏ hơn/lớn hơn, làm quà/decor, hoặc đổi phong cách.
  - `routeToDb`: lấy thêm sản phẩm từ DB theo tiêu chí mới.
  - `doNotSay`: không lặp lại quá nhiều mẫu; không gợi ý ngoài tồn kho.
- `keywords`:
  - mẫu khác
  - mau khac
  - mẫu nữa
  - mau nua
  - còn mẫu nào nữa
  - con mau nao nua
  - còn loại nào
  - con loai nao
  - gợi ý thêm
  - goi y them
  - thêm sản phẩm
  - them san pham
  - xem thêm
  - xem them
  - show thêm
  - show them
  - còn gì nữa không
  - con gi nua khong
  - rẻ hơn
  - re hon
  - rẻ hơn nữa
  - re hon nua
  - thấp hơn
  - thap hon
  - dưới giá đó
  - duoi gia do
  - cao hơn
  - cao hon
  - xịn hơn
  - xin hon
  - đẹp hơn
  - dep hon
  - xinh hơn
  - xinh hon
  - cute hơn
  - cute hon
  - dễ chăm hơn
  - de cham hon
  - sang hơn
  - sang hon
  - nhỏ hơn
  - nho hon
  - mini hơn
  - mini hon
  - lớn hơn
  - lon hon
  - to hơn
  - to hon
  - nổi bật hơn
  - noi bat hon
  - hợp hơn
  - hop hon
  - phong cách khác
  - phong cach khac
  - style khác
  - style khac
  - tối giản
  - toi gian
  - minimalist
  - minimal
  - tự nhiên
  - tu nhien
  - natural
  - rừng
  - rung
  - forest
  - xanh nhiều
  - xanh nhieu
  - nhiều rêu
  - nhieu reu
  - nhiều cây
  - nhieu cay
  - có phụ kiện
  - co phu kien
  - có đèn
  - co den
  - size nhỏ
  - size nho
  - size lớn
  - size lon
  - mini
  - medium
  - large
  - more options
  - show more
  - another one
  - any other
  - other options
  - cheaper
  - more premium
  - bigger
  - smaller
  - easier care

`response`:

Dạ được ạ. Anh/chị muốn Rêu gợi ý theo hướng nào hơn?

- Rẻ hơn
- Cao cấp/nổi bật hơn
- Dễ chăm hơn
- Nhỏ gọn hơn
- Hợp làm quà hơn
- Đổi phong cách: tối giản, cute, xanh nhiều, rừng/rêu tự nhiên, có đèn/phụ kiện

Rêu sẽ dùng tiêu chí đó để lọc thêm sản phẩm còn hàng từ DB.

### Case: product_consult_positive_preference

- `caseId`: `product_consult_positive_preference`
- `group`: `Tư vấn chọn sản phẩm`
- `category`: `product_consult`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi theo hướng tích cực/gu mong muốn: mẫu đẹp nhất, đáng mua, bán chạy, sang trọng, phong thủy, tài lộc, nổi bật.
  - `mustAnswer`: hỏi thêm ngân sách/vị trí/mục đích; ưu tiên lọc DB theo tag nổi bật/premium/gift/decor/bestseller nếu có.
  - `routeToDb`: sản phẩm bán chạy, nổi bật, giá và tồn kho phải lấy từ DB.
  - `routeToCustom`: nếu user muốn phong thủy/chủ đề riêng chi tiết, chuyển Group 9 custom.
  - `doNotSay`: không tự bịa best seller; không cam kết ý nghĩa phong thủy chắc chắn.
- `keywords`:
  - đẹp nhất
  - dep nhat
  - mẫu đẹp nhất
  - mau dep nhat
  - mẫu đáng mua
  - mau dang mua
  - đáng mua nhất
  - dang mua nhat
  - best seller
  - bestseller
  - bán chạy
  - ban chay
  - hot nhất
  - hot nhat
  - mẫu hot
  - mau hot
  - mẫu nổi bật
  - mau noi bat
  - nổi bật
  - noi bat
  - sang trọng
  - sang trong
  - sang
  - luxury
  - premium
  - high end
  - tinh tế
  - tinh te
  - tối giản đẹp
  - toi gian dep
  - aesthetic
  - aesthetic decor
  - phong thủy
  - phong thuy
  - tài lộc
  - tai loc
  - may mắn
  - may man
  - hợp mệnh
  - hop menh
  - mệnh mộc
  - menh moc
  - mệnh hỏa
  - menh hoa
  - quà sếp
  - qua sep
  - quà cao cấp
  - qua cao cap
  - decor phòng khách
  - decor phong khach
  - điểm nhấn
  - diem nhan

`response`:

Dạ nếu anh/chị muốn mẫu đẹp/nổi bật/đáng mua, Rêu sẽ lọc theo sản phẩm còn hàng trong DB và ưu tiên mẫu hợp mục đích sử dụng.

Anh/chị cho Rêu thêm 2 ý:
- Ngân sách khoảng bao nhiêu?
- Mua để bàn làm việc, phòng khách, làm quà hay decor không gian nào?

Với các yêu cầu như phong thủy, tài lộc hoặc chủ đề riêng, Rêu có thể tư vấn định hướng nhẹ; nếu cần làm đúng concept riêng thì nên chuyển sang Group 9 `Custom Theo Yêu Cầu`.

## Group 6: Chăm sóc Cơ bản

Trạng thái: **bản nháp để duyệt**.

Phạm vi Group 6:

- Hướng dẫn chăm sóc cơ bản sau khi nhận bể: tưới/phun sương, ánh sáng, vị trí đặt, mở nắp/thông khí, vệ sinh kính, cắt tỉa, kiểm tra định kỳ.
- Trả lời bằng mô tả text; hiện tại chưa dùng ảnh để chẩn đoán tự động.
- Nếu user mô tả vấn đề nghiêm trọng như mốc lan, vàng lá nhiều, úng, thối rễ, côn trùng, mùi hôi, cây chết/rụng lá nhiều thì chuyển Group 7 `Xử lý Sự cố`.
- Không khuyên dùng thuốc/hóa chất mạnh trong bể.
- Không khuyên tưới theo lịch cứng cho mọi bể; luôn ưu tiên kiểm tra độ ẩm thực tế.

Nguyên tắc normalize cho Group 6:

- Hiểu các cách viết tắt/không dấu: `tuoi`, `phun suong`, `bn ngay tuoi`, `ntn`, `cham be`, `mo nap`, `kinh mo`.
- Hiểu các mốc thời gian: `3 ngày`, `3 ngay`, `1 tuần`, `1 tuan`, `7 ngày đầu`, `newly received`, `just received`.
- Nếu user hỏi “bao lâu tưới”, trả lời theo loại bể và dấu hiệu thực tế, không chỉ đưa một con số.
- Nếu user chưa nói bể kín/mở, hỏi lại hoặc trả lời phân nhánh bể kín/bể mở.

### Case: care_watering_general

- `caseId`: `care_watering_general`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `100`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi cách tưới/phun sương terrarium nói chung.
  - `subIntents`:
    - `general`: hỏi cách tưới chung, chưa nói loại bể.
    - `closedTank`: hỏi hoặc có ngữ cảnh bể kín/bể có nắp.
    - `openTank`: hỏi hoặc có ngữ cảnh bể mở/bể không nắp.
    - `newlyReceived`: mới nhận bể, chưa biết có nên tưới ngay không.
    - `afraidOverwater`: sợ tưới nhiều, lỡ tưới quá tay, không biết bao nhiêu là đủ.
    - `dryMossLight`: rêu/đất hơi khô nhưng chưa có dấu hiệu hư nặng.
  - `mustAnswer`: tưới bằng phun sương nhẹ; kiểm tra đất/rêu trước; không đổ nước ào vào bể; dừng khi bề mặt vừa ẩm.
  - `preferAnswer`: nếu user nhắc bể kín, ưu tiên trả lời theo bể kín vì bể kín dễ bị dư ẩm hơn thiếu ẩm.
  - `askIfNeeded`: hỏi bể kín hay mở nếu user muốn tần suất cụ thể hoặc mô tả chưa rõ.
  - `routeToTroubleshooting`: nếu user nói đã lỡ tưới nhiều, đất sũng, mốc, lá vàng mềm, chuyển Group 7.
  - `doNotSay`: không bảo tưới ngập; không nói cứ tưới mỗi ngày; không khuyên tưới thêm khi đất/kính đang ướt.
- `keywords`:
  - tưới nước
  - tuoi nuoc
  - cách tưới
  - cach tuoi
  - tưới sao
  - tuoi sao
  - tưới ntn
  - tuoi ntn
  - tưới như nào
  - tuoi nhu nao
  - phun sương
  - phun suong
  - xịt nước
  - xit nuoc
  - xịt sương
  - xit suong
  - chăm nước
  - cham nuoc
  - water terrarium
  - watering
  - misting
  - spray water
  - how to water
  - how to mist
  - tưới cây terrarium
  - tuoi cay terrarium
  - tưới rêu
  - tuoi reu
  - chăm nước bể kín
  - cham nuoc be kin
  - bể kín tưới thế nào
  - be kin tuoi the nao
  - bể kín phun sương sao
  - be kin phun suong sao
  - bể có nắp tưới sao
  - be co nap tuoi sao
  - bể mới nhận có tưới không
  - be moi nhan co tuoi khong
  - mới nhận có nên tưới
  - moi nhan co nen tuoi
  - mới mua về có tưới không
  - moi mua ve co tuoi khong
  - phun bao nhiêu là đủ
  - phun bao nhieu la du
  - xịt mấy lần
  - xit may lan
  - xịt bao nhiêu
  - xit bao nhieu
  - tưới nhiều sợ úng
  - tuoi nhieu so ung
  - sợ tưới nhiều
  - so tuoi nhieu
  - sợ úng
  - so ung
  - rêu hơi khô
  - reu hoi kho
  - đất hơi khô
  - dat hoi kho
  - mặt rêu khô
  - mat reu kho
  - mist closed terrarium
  - water closed terrarium
  - should i water
  - how much water
  - how many sprays

`response`:

Dạ terrarium nên tưới theo kiểu **phun sương nhẹ**, không đổ nước ào trực tiếp vào bể.

Cách làm:
1. Kiểm tra mặt đất/rêu trước khi tưới.
2. Dùng bình xịt hạt mịn, phun nhẹ quanh rêu/gốc cây.
3. Dừng khi bề mặt vừa ẩm, chưa bị sũng nước.
4. Sau khi tưới, đặt bể nơi sáng gián tiếp, tránh nắng trực tiếp.

Nếu anh/chị muốn biết tần suất cụ thể, Rêu cần biết bể của mình là bể kín hay bể mở.

`responseVariants`:

- `defaultGeneral`:

  Dạ với terrarium, mình nên hiểu là **bổ sung ẩm nhẹ** chứ không tưới ngập như chậu cây thường.

  Anh/chị làm theo cách này:
  1. Nhìn mặt đất/rêu trước: còn ẩm thì khoan tưới.
  2. Nếu bắt đầu khô, dùng bình phun sương hạt mịn.
  3. Phun nhẹ quanh rêu/gốc cây, dừng khi bề mặt vừa ẩm.
  4. Không để nước đọng thành vũng dưới đáy.

  Nếu chưa rõ bể kín hay mở, anh/chị nói giúp Rêu loại bể để Rêu hướng dẫn sát hơn.

- `closedTankFocus`:

  Dạ nếu là **bể kín/bể có nắp**, anh/chị nên tưới rất nhẹ thôi vì bể giữ ẩm lâu.

  Cách kiểm tra nhanh:
  - Kính có sương nhẹ vào buổi sáng: thường vẫn ổn, chưa cần tưới.
  - Đất/rêu còn ẩm: khoan tưới.
  - Rêu hơi nhạt màu, mặt đất bắt đầu khô: phun sương rất nhẹ vài lần quanh rêu/gốc cây.
  - Kính ướt cả ngày hoặc có giọt nước chảy: không tưới thêm, nên mở nắp thoáng vài giờ.

  Với bể kín, lỗi hay gặp là **tưới dư** hơn là thiếu nước, nên mình đi chậm từng ít một sẽ an toàn hơn.

- `openTankFocus`:

  Dạ nếu là **bể mở/bể không nắp**, bể sẽ khô nhanh hơn bể kín nên cần kiểm tra thường xuyên hơn.

  Khi thấy mặt đất/rêu bắt đầu khô, anh/chị phun sương nhẹ quanh gốc cây/rêu. Không nên đổ nước trực tiếp vì dễ làm xô nền hoặc đọng nước dưới đáy.

  Nếu bể đặt trong phòng máy lạnh, gần quạt hoặc nơi gió mạnh, bể mở có thể khô nhanh hơn bình thường.

- `newlyReceived`:

  Dạ nếu bể mới nhận về, anh/chị **chưa nên tưới nhiều ngay**.

  Trước tiên mình kiểm tra:
  - Đất/rêu còn ẩm không?
  - Kính có đọng sương không?
  - Cây có bị xô lệch/héo bất thường không?

  Nếu bể vẫn ẩm, chỉ cần đặt nơi sáng gián tiếp và quan sát 1-2 ngày đầu. Nếu bề mặt khô rõ thì phun sương rất nhẹ, không tưới ào.

- `afraidOverwater`:

  Dạ nếu anh/chị sợ tưới nhiều bị úng thì cứ dùng nguyên tắc: **thiếu chút còn dễ bổ sung, dư nước thì khó xử lý hơn**.

  Mỗi lần chỉ phun vài nhịp nhẹ, chờ 10-15 phút rồi quan sát lại. Nếu mặt rêu/đất vừa ẩm là dừng. Nếu kính đã ướt, đất sẫm màu và nặng ẩm thì không tưới thêm.

  Dấu hiệu nên dừng ngay: đất sũng, nước đọng đáy, kính ướt cả ngày, lá vàng mềm.

- `dryMossLight`:

  Dạ nếu rêu/mặt đất chỉ **hơi khô nhẹ**, anh/chị có thể phun sương mỏng quanh vùng rêu, từng ít một.

  Sau khi phun, chờ 10-15 phút để ẩm thấm đều rồi mới quyết định có cần thêm không. Không nên phun liên tục đến khi nước đọng dưới đáy.

  Nếu rêu đã khô nâu/giòn hoặc cây héo rõ, đó là tình huống xử lý sự cố, Rêu sẽ cần thêm mô tả để hướng dẫn đúng hơn.

### Case: care_watering_frequency

- `caseId`: `care_watering_frequency`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `99`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi bao lâu tưới một lần, lịch tưới, mấy ngày tưới.
  - `subIntents`:
    - `general`: hỏi tần suất chung, chưa nói loại bể.
    - `closedTank`: hỏi tần suất cho bể kín/bể có nắp.
    - `openTank`: hỏi tần suất cho bể mở/bể không nắp.
    - `succulentCactus`: hỏi sen đá/xương rồng bao lâu tưới.
    - `airconRoom`: hỏi bể trong phòng máy lạnh/văn phòng lạnh.
    - `temperatureHumidity`: hỏi nhiệt độ/độ ẩm phòng ảnh hưởng tưới thế nào.
    - `newlyReceived`: hỏi mới nhận bể thì bao lâu tưới lần đầu.
    - `dailyWatering`: hỏi có tưới mỗi ngày được không.
  - `mustAnswer`: không có lịch cố định; bể kín thường lâu hơn bể mở; kiểm tra dấu hiệu trước khi tưới.
  - `askIfNeeded`: hỏi loại bể, vị trí đặt, máy lạnh/ánh sáng/nhiệt độ phòng nếu cần.
  - `routeToTroubleshooting`: nếu user đang tưới quá nhiều/quá ít và cây có dấu hiệu xấu, chuyển Group 7.
  - `doNotSay`: không áp dụng một lịch cho mọi bể; không khuyên tưới mỗi ngày; không bảo tưới nếu đất/kính vẫn ẩm.
- `keywords`:
  - bao lâu tưới
  - bao lau tuoi
  - mấy ngày tưới
  - may ngay tuoi
  - bao nhiêu ngày tưới
  - bao nhieu ngay tuoi
  - bn ngày tưới
  - bn ngay tuoi
  - một tuần tưới mấy lần
  - mot tuan tuoi may lan
  - tuần tưới mấy lần
  - tuan tuoi may lan
  - lịch tưới
  - lich tuoi
  - tần suất tưới
  - tan suat tuoi
  - khi nào tưới
  - khi nao tuoi
  - khi nao can tuoi
  - khi nào cần tưới
  - khi nào phun sương
  - khi nao phun suong
  - bao lâu phun sương
  - bao lau phun suong
  - mấy ngày phun sương
  - may ngay phun suong
  - phun sương mấy lần
  - phun suong may lan
  - bao lâu xịt nước
  - bao lau xit nuoc
  - xịt nước mấy ngày
  - xit nuoc may ngay
  - 1 tuần tưới mấy lần
  - 1 tuan tuoi may lan
  - tuần tưới 1 lần được không
  - tuan tuoi 1 lan duoc khong
  - 2 tuần tưới 1 lần
  - 2 tuan tuoi 1 lan
  - ngày nào cũng tưới
  - ngay nao cung tuoi
  - tưới hằng ngày
  - tuoi hang ngay
  - tưới hàng ngày
  - tuoi hang ngay
  - tưới mỗi ngày
  - tuoi moi ngay
  - bể kín bao lâu tưới
  - be kin bao lau tuoi
  - bể kín mấy ngày tưới
  - be kin may ngay tuoi
  - bể mở bao lâu tưới
  - be mo bao lau tuoi
  - bể mở mấy ngày tưới
  - be mo may ngay tuoi
  - sen đá bao lâu tưới
  - sen da bao lau tuoi
  - xương rồng bao lâu tưới
  - xuong rong bao lau tuoi
  - phòng máy lạnh tưới mấy lần
  - phong may lanh tuoi may lan
  - máy lạnh bao lâu tưới
  - may lanh bao lau tuoi
  - nhiệt độ bao nhiêu
  - nhiet do bao nhieu
  - nhiệt độ phòng
  - nhiet do phong
  - bao nhiêu độ thì ổn
  - bao nhieu do thi on
  - mấy độ thì ổn
  - may do thi on
  - độ ẩm bao nhiêu
  - do am bao nhieu
  - độ ẩm phòng
  - do am phong
  - phòng khô
  - phong kho
  - phòng ẩm
  - phong am
  - phòng nóng
  - phong nong
  - phòng lạnh
  - phong lanh
  - máy lạnh khô
  - may lanh kho
  - không máy lạnh
  - khong may lanh
  - nhiệt độ ảnh hưởng tưới
  - nhiet do anh huong tuoi
  - độ ẩm ảnh hưởng tưới
  - do am anh huong tuoi
  - mới nhận bao lâu tưới
  - moi nhan bao lau tuoi
  - mới mua bao lâu tưới
  - moi mua bao lau tuoi
  - watering schedule
  - watering frequency
  - how often water
  - how often mist
  - how often should i water
  - how often spray
  - water every day
  - daily watering
  - weekly watering
  - closed terrarium watering schedule
  - open terrarium watering schedule
  - cactus watering
  - succulent watering
  - room temperature
  - humidity
  - room humidity
  - dry room
  - humid room
  - temperature for terrarium
  - tưới mỗi ngày được không
  - tuoi moi ngay duoc khong

`response`:

Dạ không nên tưới theo một lịch cố định cho mọi bể, vì còn tùy bể kín/mở, vị trí đặt và độ ẩm thực tế.

Tần suất tham khảo:
- Bể kín: khoảng 1-2 tuần/lần hoặc lâu hơn nếu vẫn còn ẩm.
- Bể mở: khoảng 3-5 ngày/lần, tùy đất/rêu khô nhanh hay chậm.
- Sen đá/xương rồng trong bể mở: thường 7-10 ngày/lần, chỉ tưới khi đất khô hẳn.

Nhiệt độ phòng ổn định thường khoảng 22-28°C. Phòng máy lạnh thường khô hơn, còn phòng không máy lạnh nhưng bí/ẩm lại giữ nước lâu hơn, nên mình cần nhìn độ ẩm thực tế trước khi tưới.

Trước khi tưới, anh/chị nên kiểm tra mặt đất/rêu, lá cây và thành kính. Nếu đất vẫn ẩm hoặc kính còn đọng nước nhiều, chưa nên tưới vội.

`responseVariants`:

- `defaultGeneral`:

  Dạ tần suất tưới terrarium không nên cố định tuyệt đối, vì mỗi bể giữ ẩm khác nhau.

  Mốc tham khảo:
  - Bể kín: thường 1-2 tuần/lần hoặc lâu hơn nếu vẫn ẩm.
  - Bể mở: khoảng 3-5 ngày/lần tùy độ khô.
  - Sen đá/xương rồng: khoảng 7-10 ngày/lần và chỉ tưới khi đất khô hẳn.

  Trước khi tưới, anh/chị kiểm tra đất/rêu/kính trước. Nếu còn ẩm hoặc kính đọng nước nhiều thì khoan tưới.

- `closedTankFrequency`:

  Dạ với **bể kín**, mình không nên tưới theo kiểu vài ngày/lần như chậu cây thường.

  Thường bể kín có thể 1-2 tuần mới cần phun rất nhẹ, thậm chí lâu hơn nếu bể vẫn giữ ẩm tốt. Cứ nhìn dấu hiệu trước:
  - Có sương nhẹ buổi sáng: thường ổn.
  - Đất/rêu còn ẩm: chưa cần tưới.
  - Kính ướt cả ngày: đang dư ẩm, không tưới thêm.
  - Rêu/đất bắt đầu khô: phun rất nhẹ vài nhịp.

  Với bể kín, ưu tiên **ít nhưng đúng lúc** sẽ an toàn hơn tưới theo lịch cứng.

- `openTankFrequency`:

  Dạ với **bể mở**, bể khô nhanh hơn nên có thể cần kiểm tra mỗi vài ngày.

  Tham khảo khoảng 3-5 ngày/lần, nhưng vẫn nên dựa vào mặt đất/rêu. Nếu bề mặt còn ẩm thì chưa cần tưới. Nếu bể đặt nơi máy lạnh/gió mạnh, có thể khô nhanh hơn.

- `succulentCactusFrequency`:

  Dạ với sen đá/xương rồng trong bể mở, mình nên tưới ít hơn cây/rêu ưa ẩm.

  Thường khoảng 7-10 ngày/lần hoặc khi đất đã khô hẳn. Không nên phun sương lên lá quá thường xuyên và không để nền ẩm lâu vì dễ úng/thối gốc.

- `airconRoomFrequency`:

  Dạ nếu bể đặt trong phòng máy lạnh, tần suất tưới sẽ phụ thuộc bể kín hay mở.

  - Bể kín: vẫn tưới rất ít, chỉ phun khi đất/rêu bắt đầu khô.
  - Bể mở: có thể khô nhanh hơn, nên kiểm tra mỗi vài ngày.

  Anh/chị tránh đặt bể ngay luồng gió điều hòa vì dễ làm cây/rêu mất ẩm không đều.

- `temperatureHumidityGuide`:

  Dạ nhiệt độ và độ ẩm phòng ảnh hưởng trực tiếp tới việc tưới.

  Mốc tham khảo an toàn cho đa số terrarium cây/rêu:
  - Khoảng **22-28°C**: tương đối ổn định.
  - Khoảng **18-22°C**: vẫn được, nhưng nếu máy lạnh thổi trực tiếp thì bể có thể khô mép lá/rêu.
  - Trên **30°C**: bể dễ nóng, mất ẩm nhanh; đặc biệt không đặt nơi có nắng chiếu vào kính.
  - Dưới **18°C** kéo dài: cây có thể chậm phát triển hoặc sốc lạnh tùy loại.

  Về độ ẩm:
  - Phòng máy lạnh thường **khô hơn**, nhất là bể mở, nên cần kiểm tra mặt rêu/đất thường xuyên hơn.
  - Phòng không máy lạnh nhưng bí/ẩm có thể làm bể kín giữ ẩm lâu, dễ đọng nước nếu tưới nhiều.

  Cách quyết định tưới:
  - Máy lạnh + bể mở: kiểm tra mỗi vài ngày, phun nhẹ khi bề mặt khô.
  - Máy lạnh + bể kín: vẫn tưới rất ít, tránh gió thổi trực tiếp.
  - Không máy lạnh + phòng nóng: tránh nắng/nhiệt, kiểm tra khô nhanh hơn.
  - Không máy lạnh + phòng bí ẩm: hạn chế tưới, mở thoáng nếu kính ướt cả ngày.

- `newlyReceivedFirstWater`:

  Dạ bể mới nhận về thì không nên tưới ngay theo thói quen.

  Trong 1-2 ngày đầu, anh/chị kiểm tra bể trước: nếu đất/rêu vẫn ẩm thì chỉ đặt nơi sáng gián tiếp và quan sát. Nếu bề mặt khô rõ thì phun sương rất nhẹ. 7 ngày đầu nên hạn chế tưới quá nhiều vì cây/rêu còn đang thích nghi sau vận chuyển.

- `dailyWateringNo`:

  Dạ thường **không nên tưới terrarium mỗi ngày**, nhất là bể kín.

  Tưới mỗi ngày dễ làm đất sũng, kính đọng nước cả ngày, phát sinh mốc hoặc úng cây. Mình nên kiểm tra độ ẩm trước, chỉ phun nhẹ khi bề mặt bắt đầu khô.

### Case: care_closed_terrarium_watering

- `caseId`: `care_closed_terrarium_watering`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `98`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi chăm/tưới bể kín, bể có nắp.
  - `mustAnswer`: bể kín giữ ẩm tốt, tưới rất ít; nếu kính đọng nước cả ngày thì mở nắp và ngưng tưới.
  - `routeToTroubleshooting`: nếu có mốc, mùi hôi, lá vàng mềm, đất sũng thì Group 7.
  - `doNotSay`: không khuyên tưới thường xuyên cho bể kín.
- `keywords`:
  - tưới bể kín
  - tuoi be kin
  - chăm bể kín
  - cham be kin
  - bể kín tưới sao
  - be kin tuoi sao
  - bể có nắp tưới không
  - be co nap tuoi khong
  - terrarium kín
  - terrarium kin
  - closed terrarium care
  - closed terrarium watering
  - sealed terrarium
  - bể kín đọng sương
  - be kin dong suong
  - bể kín có cần tưới không
  - be kin co can tuoi khong

`response`:

Dạ bể kín giữ ẩm tốt nên thường **không cần tưới nhiều**.

Anh/chị chỉ nên phun sương rất nhẹ khi rêu/đất bắt đầu khô. Nếu thành kính có sương nhẹ vào buổi sáng là bình thường.

Nếu kính đọng nước cả ngày, đất ướt sũng hoặc bắt đầu có mốc, anh/chị nên ngưng tưới và mở nắp thoáng vài giờ. Khi tưới lại, chỉ xịt rất nhẹ quanh rêu/gốc cây.

### Case: care_open_terrarium_watering

- `caseId`: `care_open_terrarium_watering`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `97`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi chăm/tưới bể mở, bể không nắp.
  - `mustAnswer`: bể mở khô nhanh hơn; kiểm tra mặt đất/rêu trước khi tưới; tránh nước đọng.
  - `subIntents`:
    - `openTankGeneral`: hỏi chăm bể mở/bể không nắp nói chung.
    - `openTankWatering`: hỏi tưới bể mở bao nhiêu, bao lâu, xịt thế nào.
    - `openTankAircon`: bể mở để phòng máy lạnh/văn phòng lạnh.
    - `openTankWithMoss`: bể mở có rêu, sợ rêu khô/vàng.
    - `openTankWithSucculent`: bể mở có sen đá/xương rồng/cây ưa khô.
  - `routeToCareLight`: nếu bể mở trong máy lạnh/gió mạnh, nhắc khô nhanh hơn.
  - `doNotSay`: không đổ nước nhiều để bù khô.
- `keywords`:
  - tưới bể mở
  - tuoi be mo
  - chăm bể mở
  - cham be mo
  - bể mở tưới sao
  - be mo tuoi sao
  - bể mở chăm sao
  - be mo cham sao
  - bể mở chăm ntn
  - be mo cham ntn
  - be mo tuoi ntn
  - be mo tuoi bn lan
  - be mo may ngay tuoi
  - be mo co can nap k
  - be mo co can nap ko
  - bể không nắp
  - be khong nap
  - bể k nắp
  - be k nap
  - bể ko nắp
  - be ko nap
  - bể không có nắp
  - be khong co nap
  - bể mở khô nhanh
  - be mo kho nhanh
  - be mo nhanh kho
  - be mo kho qua
  - bể mở thiếu nước
  - be mo thieu nuoc
  - bể mở trong máy lạnh
  - be mo trong may lanh
  - be mo trong ml
  - be mo de phong lanh
  - bể mở có rêu
  - be mo co reu
  - be mo reu kho
  - bể mở có sen đá
  - be mo co sen da
  - be mo co xuong rong
  - open tank
  - no lid terrarium
  - lidless terrarium
  - open terrarium care
  - open terrarium watering
  - không nắp tưới sao
  - khong nap tuoi sao

`response`:

Dạ bể mở thoát ẩm nhanh hơn bể kín, nên cần kiểm tra nước thường xuyên hơn.

Cách tưới:
- Kiểm tra mặt đất/rêu trước.
- Nếu bề mặt đã khô, phun sương nhẹ quanh gốc cây/rêu.
- Không để nước đọng thành vũng dưới đáy.
- Nếu có sen đá/xương rồng, chờ đất khô hẳn rồi mới tưới.

Nếu đặt trong phòng máy lạnh hoặc nơi có gió mạnh, bể mở có thể khô nhanh hơn bình thường.

`responseVariants`:

- `openTankGeneral`:

  Dạ bể mở/bể không nắp sẽ thoát hơi nước nhanh hơn bể kín, nên mình chăm theo nguyên tắc **kiểm tra rồi mới tưới**.

  Anh/chị nên quan sát 3 điểm:
  - Mặt đất/rêu: khô nhẹ thì phun sương, còn ẩm thì khoan tưới.
  - Lá cây: nếu hơi rũ mà nền cũng khô thì có thể thiếu ẩm.
  - Đáy bể: không để nước đọng thành vũng.

  Bể mở hợp vị trí sáng gián tiếp, thoáng nhẹ, tránh nắng gắt và gió máy lạnh thổi trực tiếp.

- `openTankAircon`:

  Dạ bể mở trong phòng máy lạnh sẽ khô nhanh hơn bình thường vì hơi lạnh thường làm không khí khô.

  Cách chăm nên là kiểm tra mỗi vài ngày, nhất là mặt rêu và mép lá. Nếu bề mặt khô, mình phun sương nhẹ; nếu vẫn còn ẩm thì không cần tưới thêm. Tránh đặt ngay dưới luồng gió điều hòa vì cây/rêu sẽ mất ẩm không đều.

- `openTankWithMoss`:

  Dạ nếu bể mở có rêu, mình cần giữ rêu **ẩm nhẹ**, không để khô giòn nhưng cũng không làm sũng nước.

  Rêu khô nhẹ có thể phun sương mỏng đều bề mặt. Nếu rêu vàng, nâu, khô giòn hoặc mốc, đó là dấu hiệu sự cố và nên chuyển sang Group 7 để kiểm tra nguyên nhân cụ thể.

### Case: care_need_water_signs

- `caseId`: `care_need_water_signs`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `96`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi dấu hiệu cần tưới, thiếu nước, đất khô có nên tưới không.
  - `mustAnswer`: nhìn đất/rêu/lá/thành kính; tưới từng ít một nếu khô; không tưới nếu đất vẫn ẩm.
  - `subIntents`:
    - `drySoil`: đất/nền khô, hỏi có nên tưới không.
    - `dryMoss`: rêu khô, nhạt màu, co lại.
    - `droopingLeaves`: lá rũ/héo nhẹ, cần phân biệt thiếu nước với úng.
    - `closedTankNoCondensation`: bể kín không còn sương, hỏi có thiếu nước không.
    - `avoidOverwatering`: user sợ thiếu nước nên muốn tưới nhiều.
  - `routeToTroubleshooting`: nếu cây đã héo nặng/rêu khô nâu/mềm nhũn thì Group 7.
  - `doNotSay`: không dựa vào một dấu hiệu duy nhất để kết luận.
- `keywords`:
  - dấu hiệu cần tưới
  - dau hieu can tuoi
  - làm sao biết thiếu nước
  - lam sao biet thieu nuoc
  - sao biết thiếu nước
  - sao biet thieu nuoc
  - biet thieu nuoc ntn
  - thieu nuoc ntn
  - khi nào cần tưới
  - khi nao can tuoi
  - khi nào tưới
  - khi nao tuoi
  - luc nao tuoi
  - bao giờ tưới
  - bao gio tuoi
  - bn ngày tưới
  - bn ngay tuoi
  - mấy ngày tưới
  - may ngay tuoi
  - cây cần nước
  - cay can nuoc
  - bể thiếu nước
  - be thieu nuoc
  - bể khô
  - be kho
  - be kho co sao k
  - be kho co sao ko
  - nền khô
  - nen kho
  - đất hơi khô
  - dat hoi kho
  - dat kho qua
  - nen kho qua
  - rêu nhạt màu
  - reu nhat mau
  - rêu co lại
  - reu co lai
  - reu kho nhẹ
  - reu kho nhe
  - lá rũ có tưới không
  - la ru co tuoi khong
  - la ru co nen tuoi
  - cây rũ có tưới không
  - cay ru co tuoi khong
  - kính không đọng sương
  - kinh khong dong suong
  - be kin khong co suong
  - be kin het suong
  - no condensation
  - wilting and dry soil
  - đất khô có cần tưới
  - dat kho co can tuoi
  - rêu khô có tưới không
  - reu kho co tuoi khong
  - need water
  - needs watering
  - dry soil
  - dry moss
  - how to know water

`response`:

Dạ anh/chị nên tưới khi thấy một hoặc vài dấu hiệu:

- Mặt đất/rêu khô hơn bình thường.
- Rêu nhạt màu, hơi co lại hoặc khô nhẹ.
- Lá hơi rũ mềm và đất cũng đang khô.
- Bể kín lâu không còn hơi sương nhẹ.

Cách tưới lúc này là phun sương nhẹ từng ít một, dừng khi bề mặt vừa ẩm. Không nên tưới nếu đất vẫn ẩm/sũng, kính đọng nước cả ngày hoặc lá vàng mềm.

`responseVariants`:

- `drySoilButPlantOk`:

  Dạ nếu chỉ thấy mặt đất hơi khô nhưng cây vẫn đứng khỏe, lá không rũ và rêu chưa khô giòn, anh/chị chỉ cần phun sương rất nhẹ hoặc chờ kiểm tra thêm.

  Terrarium không cần lúc nào cũng ướt. Mình ưu tiên nền **ẩm vừa**, không sũng nước.

- `droopingLeavesCheck`:

  Dạ lá rũ chưa chắc là thiếu nước. Anh/chị kiểm tra thêm nền:
  - Lá rũ + nền khô: có thể thiếu ẩm, phun sương nhẹ.
  - Lá rũ + nền sũng/kính ướt cả ngày: có thể dư ẩm/úng, không tưới thêm.
  - Lá rũ sau vận chuyển: có thể sốc nhẹ, đặt mát sáng gián tiếp và quan sát 1-2 ngày.

- `closedTankNoMist`:

  Dạ bể kín lâu không có sương nhẹ có thể là dấu hiệu hơi khô, nhưng mình vẫn nên kiểm tra mặt rêu/đất trước.

  Nếu rêu/đất còn ẩm thì chưa cần tưới. Nếu bề mặt khô rõ, phun sương rất nhẹ vài nhịp rồi đóng nắp lại theo dõi.

### Case: care_light_placement

- `caseId`: `care_light_placement`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `95`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi đặt bể ở đâu, ánh sáng thế nào, có được để nắng/phòng tối không.
  - `mustAnswer`: ánh sáng gián tiếp; tránh nắng gắt, nguồn nhiệt, điều hòa thổi trực tiếp; phòng tối dùng đèn hỗ trợ.
  - `subIntents`:
    - `placementGeneral`: hỏi nên đặt bể ở đâu.
    - `directSun`: hỏi có để nắng được không.
    - `lowLightRoom`: phòng tối/ít sáng/không có cửa sổ.
    - `ledGrowLight`: dùng đèn LED/grow light.
    - `officeDesk`: đặt bàn làm việc/văn phòng.
    - `windowPlacement`: đặt gần cửa sổ, ban công, kệ kính.
  - `routeToTroubleshooting`: nếu đã cháy lá/héo/vàng vì nắng/thiếu sáng thì Group 7.
  - `doNotSay`: không khuyên đặt nắng trực tiếp trong bể kính.
- `keywords`:
  - ánh sáng
  - anh sang
  - đặt bể ở đâu
  - dat be o dau
  - dat be dau tot
  - dat be vi tri nao
  - để bể ở đâu
  - de be o dau
  - để nơi nào
  - de noi nao
  - de cho nao
  - de dau cho hop
  - nắng
  - nang
  - nắng trực tiếp
  - nang truc tiep
  - nắng sáng
  - nang sang
  - nắng chiều
  - nang chieu
  - nắng cửa sổ
  - nang cua so
  - phơi nắng được không
  - phoi nang duoc khong
  - co de nang dc k
  - co de nang dc ko
  - ánh sáng gián tiếp
  - anh sang gian tiep
  - phòng tối
  - phong toi
  - phòng không cửa sổ
  - phong khong cua so
  - phong it cua so
  - ít sáng
  - it sang
  - thiếu sáng
  - thieu sang
  - tối quá
  - toi qua
  - đèn led
  - den led
  - đèn cây
  - den cay
  - đèn trồng cây
  - den trong cay
  - đèn grow light
  - den grow light
  - growlight
  - den growlight
  - bật đèn bao lâu
  - bat den bao lau
  - bật đèn mấy tiếng
  - bat den may tieng
  - để gần cửa sổ
  - de gan cua so
  - gần cửa sổ
  - gan cua so
  - để ban công
  - de ban cong
  - ban công được không
  - ban cong duoc khong
  - bàn làm việc
  - ban lam viec
  - office desk
  - plant light
  - grow light
  - near window
  - sunlight
  - indirect light
  - low light
  - no window

`response`:

Dạ terrarium nên đặt ở nơi có **ánh sáng gián tiếp**, ví dụ gần cửa sổ có rèm, bàn làm việc sáng nhẹ hoặc kệ có ánh sáng tự nhiên tán xạ.

Nên tránh:
- Nắng gắt chiếu trực tiếp vào bể kính.
- Gần nguồn nhiệt mạnh.
- Điều hòa/gió lạnh thổi trực tiếp vào bể.

Nếu phòng quá tối, anh/chị có thể dùng đèn LED/grow light nhẹ vài giờ mỗi ngày.

`responseVariants`:

- `directSunWarning`:

  Dạ không nên để terrarium dưới nắng trực tiếp, nhất là nắng chiếu qua kính.

  Bể kính có thể bị hấp nhiệt, làm cây héo, rêu vàng hoặc cháy lá rất nhanh. Vị trí tốt hơn là sáng gián tiếp: gần cửa sổ có rèm, bàn/kệ sáng nhẹ, không bị nắng gắt chiếu thẳng.

- `lowLightRoom`:

  Dạ nếu phòng khá tối hoặc không có cửa sổ, cây/rêu vẫn có thể yếu dần vì thiếu sáng.

  Anh/chị nên dùng đèn LED/grow light nhẹ, đặt cách bể vừa phải, bật theo chu kỳ ổn định. Nếu cây bắt đầu vươn dài, nhạt màu hoặc dứa phụng mất màu hồng, đó thường là dấu hiệu thiếu sáng.

- `officeDeskPlacement`:

  Dạ đặt ở bàn làm việc/văn phòng được, miễn là bể có ánh sáng gián tiếp và không bị máy lạnh thổi trực tiếp.

  Nếu bàn quá tối, nên dùng đèn hỗ trợ. Nếu bàn gần cửa kính nắng gắt, nên lùi bể vào trong hoặc dùng rèm để tránh hấp nhiệt.

### Case: care_first_7_days

- `caseId`: `care_first_7_days`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `94`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user mới nhận bể/mới mua về, hỏi 7 ngày đầu chăm sao.
  - `mustAnswer`: đặt sáng nhẹ, không tưới nhiều ngay, quan sát mỗi ngày, không tự tháo bố cục/cắm thêm cây.
  - `subIntents`:
    - `justReceived`: mới nhận bể, chưa biết làm gì.
    - `firstWatering`: có cần tưới ngay không.
    - `transportShock`: cây/rêu hơi rũ sau vận chuyển.
    - `doAndDont`: những việc nên/không nên làm 7 ngày đầu.
    - `damageBoundary`: bể vỡ/xô lệch/cây bật gốc khi nhận.
  - `routeToPolicy`: nếu bể vỡ/xô lệch nặng lúc nhận thì Group 2/3.
  - `routeToTroubleshooting`: nếu héo/mốc/vàng nhanh thì Group 7.
  - `doNotSay`: không bảo thay đất/thay cây ngay khi mới nhận nếu chưa có vấn đề rõ.
- `keywords`:
  - mới nhận hàng
  - moi nhan hang
  - ms nhận hàng
  - ms nhan hang
  - mới nhận
  - moi nhan
  - ms nhận
  - ms nhan
  - vừa nhận bể
  - vua nhan be
  - vừa nhận có tưới không
  - vua nhan co tuoi khong
  - vua nhan tuoi chua
  - mới mua về
  - moi mua ve
  - ms mua về
  - ms mua ve
  - moi mua tuoi chua
  - sau khi nhận bể
  - sau khi nhan be
  - mới nhận có tưới không
  - moi nhan co tuoi khong
  - moi nhan co can tuoi k
  - moi nhan co can tuoi ko
  - mới nhận tưới chưa
  - moi nhan tuoi chua
  - mới nhận cần làm gì
  - moi nhan can lam gi
  - moi nhan lam gi truoc
  - ngay dau lam gi
  - cây sốc vận chuyển
  - cay soc van chuyen
  - cây hơi rũ khi nhận
  - cay hoi ru khi nhan
  - unpack terrarium
  - acclimation
  - chăm sóc 7 ngày đầu
  - cham soc 7 ngay dau
  - 7 ngày đầu
  - 7 ngay dau
  - ngày đầu chăm sao
  - ngay dau cham sao
  - first week care
  - first 7 days
  - newly received
  - just received
  - after receiving

`response`:

Dạ trong 7 ngày đầu, cây/rêu có thể hơi sốc do vận chuyển và đổi môi trường.

Anh/chị nên:
- Đặt bể nơi sáng nhẹ, tránh nắng trực tiếp.
- Không tưới quá nhiều ngay khi mới nhận.
- Quan sát độ ẩm, màu lá/rêu mỗi ngày.
- Mở nắp thoáng nếu bể quá ẩm hoặc kính đọng nước nhiều.
- Không tự ý tháo bố cục/cắm thêm cây khi bể chưa ổn định.

Nếu thấy cây héo, mốc hoặc vàng nhanh, phần đó nên chuyển sang Group 7 để xử lý sự cố.

`responseVariants`:

- `firstDayDoDont`:

  Dạ ngày đầu mới nhận bể, anh/chị ưu tiên để bể **ổn định môi trường** trước.

  Nên làm:
  - Đặt nơi sáng gián tiếp, mát.
  - Kiểm tra bể có xô lệch/vỡ/nứt không.
  - Quan sát đất/rêu đang khô hay ẩm.

  Không nên làm ngay:
  - Không tưới nhiều nếu bể vẫn ẩm.
  - Không đem phơi nắng.
  - Không tháo bố cục hoặc cắm thêm cây khi bể chưa ổn định.

- `firstWatering`:

  Dạ mới nhận bể không nhất thiết phải tưới ngay.

  Nếu đất/rêu vẫn ẩm, anh/chị chỉ cần đặt bể nơi sáng nhẹ và theo dõi. Nếu bề mặt khô rõ, có thể phun sương rất nhẹ. Trong 7 ngày đầu nên tránh tưới quá tay vì cây/rêu còn đang thích nghi sau vận chuyển.

- `transportShock`:

  Dạ cây/rêu hơi rũ nhẹ sau vận chuyển có thể là sốc môi trường.

  Anh/chị đặt bể nơi mát, sáng gián tiếp, tránh gió máy lạnh trực tiếp và quan sát 1-2 ngày. Nếu rũ nặng, vàng nhanh, mốc hoặc gốc mềm thì chuyển sang Group 7 để xử lý theo triệu chứng.

### Case: care_aircon_room

- `caseId`: `care_aircon_room`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `93`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi để terrarium trong phòng máy lạnh/điều hòa/văn phòng lạnh.
  - `mustAnswer`: được nhưng tránh gió thổi trực tiếp; bể mở khô nhanh hơn; theo dõi độ ẩm.
  - `subIntents`:
    - `airconGeneral`: hỏi để trong phòng máy lạnh được không.
    - `officeColdRoom`: văn phòng lạnh cả ngày.
    - `airconDrying`: rêu/đất khô nhanh vì máy lạnh.
    - `directWind`: bể bị gió điều hòa thổi trực tiếp.
    - `temperatureRange`: hỏi nhiệt độ phòng máy lạnh bao nhiêu ổn.
  - `routeToTroubleshooting`: nếu lá khô mép/héo/rêu khô vì máy lạnh thì Group 7.
  - `doNotSay`: không đặt sát luồng gió lạnh.
- `keywords`:
  - phòng máy lạnh
  - phong may lanh
  - phòng ml
  - phong ml
  - máy lạnh
  - may lanh
  - ml
  - điều hòa
  - dieu hoa
  - đh
  - dh
  - phòng lạnh
  - phong lanh
  - gió điều hòa
  - gio dieu hoa
  - gió máy lạnh
  - gio may lanh
  - gio ml
  - văn phòng máy lạnh
  - van phong may lanh
  - văn phòng lạnh
  - van phong lanh
  - vp lạnh
  - vp lanh
  - vp máy lạnh
  - vp may lanh
  - máy lạnh cả ngày
  - may lanh ca ngay
  - bật máy lạnh cả ngày
  - bat may lanh ca ngay
  - điều hòa cả ngày
  - dieu hoa ca ngay
  - nhiệt độ máy lạnh
  - nhiet do may lanh
  - nhiệt độ phòng lạnh
  - nhiet do phong lanh
  - máy lạnh bao nhiêu độ
  - may lanh bao nhieu do
  - de dieu hoa bao nhieu do
  - 24 độ
  - 25 độ
  - 26 độ
  - ac temperature
  - aircon dry
  - aircon
  - ac room
  - air conditioner
  - office aircon
  - lạnh có sao không
  - lanh co sao khong

`response`:

Dạ có thể đặt terrarium trong phòng máy lạnh, nhưng nên tránh luồng gió lạnh thổi trực tiếp vào bể.

Lưu ý:
- Đặt bể cách hướng gió điều hòa.
- Theo dõi độ ẩm thường xuyên hơn, nhất là bể mở.
- Nếu rêu/đất khô nhanh, chỉ phun sương nhẹ khi cần.
- Không đặt sát cửa kính có nắng gắt sau thời gian bật máy lạnh.

Vị trí tốt là bàn/kệ có ánh sáng nhẹ, nhiệt độ ổn định và không bị gió thổi thẳng.

`responseVariants`:

- `temperatureRange`:

  Dạ phòng máy lạnh vẫn đặt terrarium được nếu nhiệt độ ổn định. Mốc dễ chăm thường khoảng **22-28°C**.

  Nếu phòng khoảng 24-26°C là khá ổn, nhưng cần tránh gió thổi trực tiếp. Gió lạnh làm bể mở/rêu khô nhanh, còn bể kín thì có thể chênh nhiệt làm kính đọng sương nhiều.

- `officeColdAllDay`:

  Dạ văn phòng lạnh cả ngày vẫn dùng được, nhưng mình nên đặt bể ở vị trí không bị gió điều hòa tạt thẳng.

  Với bể mở, kiểm tra rêu/đất thường xuyên hơn vì khô nhanh. Với bể kín, theo dõi kính: sương nhẹ thì bình thường, đọng nước cả ngày thì cần mở thoáng ngắn và giảm tưới.

- `directWindProblem`:

  Dạ nếu bể đang nằm ngay luồng gió điều hòa, anh/chị nên dời vị trí.

  Gió thổi trực tiếp dễ làm lá khô mép, cẩm nhung rũ, rêu nhạt/vàng hoặc khô không đều. Dời bể sang vị trí sáng nhẹ, khuất gió sẽ an toàn hơn tưới thêm liên tục.

### Case: care_ventilation_open_lid

- `caseId`: `care_ventilation_open_lid`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `92`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi có cần mở nắp/thông khí không, mở bao lâu.
  - `mustAnswer`: bể kín có thể mở thoáng khi quá ẩm/kính mờ nhiều; mở theo tình trạng, không phải luôn mở cả ngày.
  - `subIntents`:
    - `normalCondensation`: sương nhẹ buổi sáng.
    - `tooMuchCondensation`: kính ướt/mờ cả ngày.
    - `afterWatering`: mở nắp sau khi lỡ tưới nhiều.
    - `odorMoldBoundary`: có mùi/mốc, cần chuyển Group 7.
    - `openHowLong`: hỏi mở nắp bao lâu.
  - `routeToTroubleshooting`: nếu mốc/đọng nước cả ngày/mùi hôi thì Group 7.
  - `doNotSay`: không khuyên mở nắp lâu trong nơi bụi/nắng/gió mạnh.
- `keywords`:
  - mở nắp
  - mo nap
  - mở nắp ntn
  - mo nap ntn
  - có cần mở nắp không
  - co can mo nap khong
  - có cần mở nắp k
  - co can mo nap k
  - có cần mở nắp ko
  - co can mo nap ko
  - mở nắp bao lâu
  - mo nap bao lau
  - mở nắp mấy tiếng
  - mo nap may tieng
  - mở nắp cả ngày
  - mo nap ca ngay
  - thông khí
  - thong khi
  - thong gio
  - thoáng khí
  - thoang khi
  - bể bí
  - be bi
  - bể kín quá
  - be kin qua
  - kính mờ
  - kinh mo
  - kinh bi mo
  - kính bị mờ
  - đọng sương
  - dong suong
  - đọng hơi nước
  - dong hoi nuoc
  - kính đọng nước
  - kinh dong nuoc
  - kính ướt cả ngày
  - kinh uot ca ngay
  - sương nhẹ
  - suong nhe
  - mở nắp qua đêm
  - mo nap qua dem
  - có nên mở nắp qua đêm
  - co nen mo nap qua dem
  - bể có mùi
  - be co mui
  - be hoi
  - be bi mui
  - foggy
  - mist on glass
  - condensation
  - ventilate
  - open lid
  - lid open

`response`:

Dạ với bể kín, anh/chị có thể mở nắp để thông khí khi bể quá ẩm, kính mờ/đọng nước nhiều hoặc sau khi vừa tưới hơi nhiều.

Tham khảo:
- Nếu chỉ có sương nhẹ buổi sáng: thường không cần mở lâu.
- Nếu kính ướt/mờ cả ngày: mở nắp vài giờ để thoát ẩm.
- Nếu có mốc/mùi hôi/đất sũng: nên chuyển sang hướng xử lý sự cố ở Group 7.

Khi mở nắp, tránh đặt bể ở nơi nắng gắt, gió mạnh hoặc nhiều bụi.

`responseVariants`:

- `normalMorningMist`:

  Dạ nếu bể kín chỉ có sương nhẹ vào buổi sáng rồi giảm dần trong ngày thì thường là bình thường.

  Trường hợp này không cần mở nắp lâu. Mình chỉ cần theo dõi để kính không ướt đặc cả ngày và đất/rêu không bị sũng.

- `tooWetOpenLid`:

  Dạ nếu kính mờ/ướt cả ngày, đất sũng hoặc vừa lỡ tưới nhiều, anh/chị có thể mở nắp thoáng vài giờ.

  Mục tiêu là giảm ẩm từ từ, không phải phơi bể. Khi mở nắp nhớ tránh nắng, gió mạnh và nơi nhiều bụi.

- `odorMoldBoundary`:

  Dạ nếu bể có mùi hôi, mốc lan hoặc kính ướt cả ngày nhiều ngày liên tục, đây không còn là thông khí bình thường nữa.

  Anh/chị nên chuyển sang xử lý sự cố ở Group 7: kiểm tra dư ẩm, mốc, lá mục hoặc nền bị bí.

### Case: care_clean_glass

- `caseId`: `care_clean_glass`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `91`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi vệ sinh kính, lau kính mờ, bụi, vệt nước.
  - `mustAnswer`: lau nhẹ bằng khăn mềm/tăm bông; tránh hóa chất mạnh; không xịt nước lau kính vào trong bể.
  - `subIntents`:
    - `outsideGlass`: lau mặt ngoài kính.
    - `insideGlass`: lau mặt trong kính.
    - `waterStain`: vệt nước/cặn khoáng.
    - `foggyGlass`: kính mờ do hơi nước.
    - `chemicalBoundary`: hỏi dùng nước lau kính/cồn/xà phòng.
  - `routeToTroubleshooting`: nếu kính mờ do đọng nước cả ngày thì chuyển thông khí/Group7 nếu kèm mốc.
  - `doNotSay`: không khuyên dùng hóa chất lau kính trong bể.
- `keywords`:
  - vệ sinh kính
  - ve sinh kinh
  - vệ sinh kính ntn
  - ve sinh kinh ntn
  - lau kính
  - lau kinh
  - lau kính bằng gì
  - lau kinh bang gi
  - lấy gì lau kính
  - lay gi lau kinh
  - kính bẩn
  - kinh ban
  - kinh bi ban
  - kính mờ
  - kinh mo
  - kính ố
  - kinh o
  - vệt nước
  - vet nuoc
  - cặn nước
  - can nuoc
  - cặn trắng
  - can trang
  - lau mặt trong
  - lau mat trong
  - nước lau kính
  - nuoc lau kinh
  - xịt nước lau kính
  - xit nuoc lau kinh
  - dùng cồn lau kính
  - dung con lau kinh
  - dùng xà phòng
  - dung xa phong
  - hóa chất lau kính
  - hoa chat lau kinh
  - alcohol wipe
  - glass cleaner
  - water stain
  - bụi kính
  - bui kinh
  - clean glass
  - glass cleaning
  - wipe glass
  - dirty glass
  - foggy glass
  - lau bể
  - lau be
  - vệ sinh bể
  - ve sinh be

`response`:

Dạ anh/chị có thể vệ sinh kính nhẹ nhàng bằng khăn mềm, giấy mềm hoặc tăm bông.

Lưu ý:
- Không xịt nước lau kính/hóa chất mạnh trực tiếp vào trong bể.
- Nếu lau mặt trong, thao tác nhẹ để tránh làm lệch bố cục/cây/rêu.
- Nếu kính mờ do đọng sương nhiều cả ngày, nguyên nhân có thể là bể quá ẩm; lúc đó nên mở nắp thoáng và giảm tưới.

`responseVariants`:

- `insideGlassCareful`:

  Dạ nếu lau mặt trong kính, anh/chị dùng khăn mềm hoặc tăm bông hơi ẩm, lau rất nhẹ để tránh làm lệch cây/rêu.

  Không xịt trực tiếp nước lau kính, cồn, xà phòng hoặc hóa chất vào trong bể vì có thể ảnh hưởng cây/rêu và hệ vi sinh trong bể.

- `waterStain`:

  Dạ vệt nước/cặn trắng trên kính thường do nước đọng rồi khô lại.

  Anh/chị lau nhẹ bằng khăn mềm hơi ẩm. Nếu vệt nằm mặt trong, thao tác từ từ, tránh chạm mạnh vào bố cục. Về lâu dài nên hạn chế để kính ướt cả ngày và không xịt nước quá mạnh lên thành kính.

- `foggyGlassHumidity`:

  Dạ nếu kính mờ vì hơi nước, mình cần xem đó là sương nhẹ hay dư ẩm.

  Sương nhẹ buổi sáng thường ổn. Nhưng nếu kính mờ/ướt cả ngày, bể có thể đang quá ẩm; anh/chị nên mở nắp thoáng ngắn và giảm tưới.

### Case: care_pruning_basic

- `caseId`: `care_pruning_basic`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `90`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi cắt tỉa cây/rêu, cây mọc um tùm, lá chạm kính.
  - `mustAnswer`: dùng kéo/nhíp sạch, tỉa nhẹ, lấy vụn lá ra khỏi bể, không bóc rêu mảng lớn.
  - `subIntents`:
    - `trimLeaves`: tỉa lá vàng/lá già/lá chạm kính.
    - `overgrownPlant`: cây mọc cao/um tùm.
    - `thickMoss`: rêu mọc quá dày.
    - `afterPruningCare`: chăm sau khi tỉa.
    - `toolSafety`: dùng kéo/nhíp sạch, tránh nhiễm bẩn.
  - `routeToTroubleshooting`: nếu lá vàng/mục/mốc nhiều thì Group 7.
  - `doNotSay`: không tỉa quá mạnh hoặc tháo toàn bộ bố cục.
- `keywords`:
  - cắt tỉa
  - cat tia
  - cắt tỉa ntn
  - cat tia ntn
  - cắt tỉa sao
  - cat tia sao
  - tỉa cây
  - tia cay
  - tỉa lá
  - tia la
  - cắt cây
  - cat cay
  - cây mọc um tùm
  - cay moc um tum
  - cây um tùm
  - cay um tum
  - cây mọc nhiều quá
  - cay moc nhieu qua
  - cây quá cao
  - cay qua cao
  - cây cao quá
  - cay cao qua
  - cây chạm kính
  - cay cham kinh
  - rêu mọc dày
  - reu moc day
  - rêu quá dày
  - reu qua day
  - reu day qua
  - reu moc nhieu
  - lá chạm kính
  - la cham kinh
  - lá già
  - la gia
  - lá mục
  - la muc
  - lá hư
  - la hu
  - lá thối
  - la thoi
  - cắt rêu
  - cat reu
  - nhíp
  - nhip
  - kéo sạch
  - keo sach
  - prune
  - pruning
  - trim plant
  - trimming
  - overgrown
  - lá vàng có cắt không
  - la vang co cat khong

`response`:

Dạ khi cây mọc quá cao, lá chạm kính hoặc rêu phủ quá dày, anh/chị có thể cắt tỉa nhẹ.

Cách làm:
1. Dùng kéo/nhíp sạch và khô.
2. Cắt phần lá vàng, lá mục hoặc cành mọc quá dài.
3. Với rêu quá dày, gắp bớt từng ít một, không bóc toàn bộ mảng lớn.
4. Lấy hết vụn lá ra khỏi bể để tránh mốc.
5. Không tưới nhiều ngay sau khi tỉa; chỉ phun nhẹ nếu bể đang khô.

Nên tỉa ít trước, quan sát bố cục rồi mới tỉa thêm.

`responseVariants`:

- `trimYellowLeaves`:

  Dạ lá vàng/lá già có thể cắt bỏ nếu lá đã yếu, mềm mục hoặc làm bể mất thoáng.

  Anh/chị dùng kéo sạch cắt sát phần cuống hư, sau đó lấy lá ra khỏi bể. Không để vụn lá mục nằm lại vì dễ phát sinh mốc.

- `overgrownPlant`:

  Dạ nếu cây mọc um tùm hoặc chạm kính, mình nên tỉa nhẹ từng chút.

  Ưu tiên cắt cành/lá quá dài, lá che quá nhiều ánh sáng hoặc lá ép vào kính. Không nên cắt trụi một lần vì cây có thể sốc và bố cục bị trống đột ngột.

- `thickMoss`:

  Dạ nếu rêu quá dày, anh/chị chỉ nên gắp/tỉa từng phần nhỏ.

  Không bóc nguyên mảng lớn nếu chưa cần, vì có thể làm hở nền, xô bố cục hoặc ảnh hưởng độ ẩm. Sau khi tỉa, lấy vụn rêu/lá ra ngoài để tránh mốc.

### Case: care_routine_checklist

- `caseId`: `care_routine_checklist`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `89`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user muốn checklist chăm định kỳ, chăm hàng tuần/tháng, kiểm tra bể.
  - `mustAnswer`: kiểm tra ánh sáng, độ ẩm, lá/rêu, kính, mùi, côn trùng; không chăm quá tay.
  - `routeToTroubleshooting`: nếu phát hiện dấu hiệu xấu thì Group 7.
  - `doNotSay`: không biến checklist thành lịch tưới cứng.
- `keywords`:
  - checklist chăm
  - checklist cham
  - chăm định kỳ
  - cham dinh ky
  - chăm hàng tuần
  - cham hang tuan
  - chăm mỗi tuần
  - cham moi tuan
  - kiểm tra bể
  - kiem tra be
  - bảo dưỡng
  - bao duong
  - routine care
  - care checklist
  - weekly care
  - monthly care
  - maintenance
  - chăm terrarium
  - cham terrarium
  - chăm bể cây
  - cham be cay

`response`:

Dạ anh/chị có thể kiểm tra bể định kỳ theo checklist ngắn này:

- Ánh sáng: bể đang ở nơi sáng gián tiếp, không nắng gắt.
- Độ ẩm: đất/rêu vừa ẩm, không khô giòn cũng không sũng nước.
- Lá/rêu: không vàng/héo/mốc lan nhanh.
- Kính: không đọng nước cả ngày.
- Mùi: chỉ có mùi đất/rêu nhẹ, không hôi nặng.
- Bố cục: cây/rêu chưa mọc quá um tùm hoặc lệch nhiều.

Nếu thấy dấu hiệu bất thường như mốc, lá vàng mềm, mùi hôi, côn trùng hoặc cây héo nhanh, nên chuyển sang Group 7 để xử lý đúng nguyên nhân.

### Case: care_succulent_cactus_basic

- `caseId`: `care_succulent_cactus_basic`
- `group`: `Chăm sóc Cơ bản`
- `category`: `care_basic`
- `priority`: `88`
- `directAnswer`: `yes`
- `gptRewrite`: `yes`
- `trainingFlow`:
  - `intent`: user hỏi chăm sen đá/xương rồng trong terrarium.
  - `mustAnswer`: hợp bể mở hơn; cần thoáng, sáng tốt, đất khô rồi mới tưới; không phun lên lá quá thường xuyên.
  - `subIntents`:
    - `succulentGeneral`: chăm sen đá/xương rồng trong terrarium.
    - `openTankRecommended`: hỏi có nên để bể kín hay bể mở.
    - `wateringSucculent`: tưới sen đá/xương rồng bao lâu.
    - `lightSucculent`: ánh sáng cho sen đá/xương rồng.
    - `rotBoundary`: mềm nhũn, lá trong, thối gốc chuyển Group 7.
  - `routeToTroubleshooting`: nếu cây mềm nhũn/lá trong suốt/thối gốc thì Group 7.
  - `doNotSay`: không khuyên để sen đá/xương rồng trong bể kín ẩm lâu.
- `keywords`:
  - sen đá
  - sen da
  - sđ
  - sd
  - xương rồng
  - xuong rong
  - xr
  - succulent
  - cactus
  - chăm sen đá
  - cham sen da
  - chăm sđ
  - cham sd
  - chăm xương rồng
  - cham xuong rong
  - sen đá trong terrarium
  - sen da trong terrarium
  - xương rồng trong terrarium
  - xuong rong trong terrarium
  - sen đá bể kín
  - sen da be kin
  - sen đá trong bể kín
  - sen da trong be kin
  - xương rồng bể kín
  - xuong rong be kin
  - xương rồng trong bể kín
  - xuong rong trong be kin
  - sen đá bể mở
  - sen da be mo
  - xương rồng bể mở
  - xuong rong be mo
  - tưới sen đá bao lâu
  - tuoi sen da bao lau
  - sen đá tưới mấy ngày
  - sen da tuoi may ngay
  - sen đá tưới bn ngày
  - sen da tuoi bn ngay
  - xương rồng tưới bao lâu
  - xuong rong tuoi bao lau
  - xương rồng tưới mấy ngày
  - xuong rong tuoi may ngay
  - sen đá bị úng
  - sen da bi ung
  - xương rồng bị úng
  - xuong rong bi ung
  - cactus in terrarium
  - succulent terrarium
  - cactus care
  - succulent care

`response`:

Dạ sen đá và xương rồng phù hợp hơn với **bể mở**, vì chúng cần thoáng khí, nền nhanh khô và nhiều sáng hơn cây/rêu ưa ẩm.

Cách chăm cơ bản:
- Tưới ít, thường 7-10 ngày/lần hoặc khi đất khô hẳn.
- Không phun sương lên lá quá thường xuyên.
- Đặt nơi sáng tốt, có nắng nhẹ buổi sáng nếu cây chịu được.
- Không để trong bể kín ẩm lâu vì dễ úng/thối gốc.

Nếu cây mềm nhũn, lá trong suốt hoặc gốc chuyển đen, đó là hướng xử lý sự cố ở Group 7.

`responseVariants`:

- `openTankRecommended`:

  Dạ sen đá/xương rồng nên ưu tiên bể mở vì nhóm cây này cần thoáng khí, nền nhanh khô và ánh sáng tốt hơn cây/rêu ưa ẩm.

  Nếu để trong bể kín ẩm lâu, cây dễ bị mềm nhũn, úng gốc hoặc thối rễ. Vì vậy không nên chăm sen đá/xương rồng giống bể rêu kín.

- `wateringSucculent`:

  Dạ với sen đá/xương rồng, mình tưới theo độ khô của nền, không tưới theo cảm giác “thấy khát”.

  Thường tham khảo 7-10 ngày/lần, nhưng chỉ tưới khi đất đã khô hẳn. Tưới ít quanh gốc, tránh phun sương lên lá quá thường xuyên vì dễ đọng nước ở kẽ lá.

- `lightSucculent`:

  Dạ sen đá/xương rồng cần sáng tốt hơn nhiều loại cây ưa ẩm.

  Có thể đặt nơi sáng gián tiếp mạnh hoặc nắng nhẹ buổi sáng nếu cây chịu được. Tránh nắng trưa/nắng gắt chiếu qua kính vì bể có thể nóng lên nhanh và làm cây sốc nhiệt.

## Group 7: Xử lý Sự cố Cây/Rêu

### Phạm vi group

- Xử lý các dấu hiệu bất thường sau khi khách đã mua/đang chăm bể: cây héo, rêu vàng, rụng lá, mốc, úng, đổi màu, lá nhạt màu.
- Ưu tiên hỏi điều kiện thực tế trước khi kết luận: loại cây/rêu, bể kín hay mở, vị trí đặt, nhiệt độ, máy lạnh/không máy lạnh, độ ẩm, lịch tưới, ánh sáng.
- Không chẩn đoán chắc chắn 100% nếu chưa có ảnh/video. Nếu triệu chứng nặng, lan nhanh hoặc liên quan bảo hành, hướng khách gửi ảnh/video cho shop kiểm tra.
- Trả lời theo hướng: nguyên nhân thường gặp -> cách kiểm tra -> cách xử lý an toàn -> khi nào cần gửi shop.

### Case: troubleshooting_fittonia_wilting

- `caseId`: `troubleshooting_fittonia_wilting`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `plant_troubleshooting`
- `intent`: user hỏi lá cẩm nhung héo, rũ, mềm, cụp lá, cháy mép.
- `trainingFlow`:
  - `subIntents`:
    - `heatStress`: héo do nhiệt độ quá nóng, nắng chiếu, bể bị hấp nhiệt.
    - `dryStress`: héo do thiếu ẩm, phòng máy lạnh khô, bể mở khô nhanh.
    - `overHumidityRootStress`: héo do dư ẩm/úng rễ, lá mềm nhưng đất vẫn sũng.
    - `transportShock`: mới nhận bể, cây sốc nhẹ sau vận chuyển.
  - `mustAnswer`: cẩm nhung nhạy với nóng và thiếu ẩm; nhiệt cao trên 30°C hoặc nắng qua kính dễ làm héo nhanh; không tưới thêm nếu đất đang sũng.
  - `askIfNeeded`: hỏi bể kín/mở, đặt ở đâu, có nắng/máy lạnh không, đất/rêu đang khô hay ướt, héo toàn cây hay chỉ vài lá.
  - `doNotSay`: không nói cứ héo là tưới thật nhiều; không kết luận chết cây nếu chưa kiểm tra gốc/lá.

`keywords`:

  - cẩm nhung héo
  - cam nhung heo
  - lá cẩm nhung héo
  - la cam nhung heo
  - cẩm nhung rũ lá
  - cam nhung ru la
  - cẩm nhung cụp lá
  - cam nhung cup la
  - fittonia wilting
  - fittonia drooping
  - nerve plant wilting
  - cây cẩm nhung bị héo
  - cay cam nhung bi heo
  - cẩm nhung nóng quá
  - cam nhung nong qua
  - lá héo do nóng
  - la heo do nong
  - cây bị héo trong bể
  - cay bi heo trong be

`response`:

Dạ với **cẩm nhung**, lá héo/rũ thường gặp nhất khi bể bị **nóng quá hoặc mất ẩm nhanh**.

Các nguyên nhân hay gặp:
- **Nhiệt độ cao trên khoảng 30°C**, đặc biệt khi bể đặt gần cửa kính/nắng chiếu, cây dễ héo rất nhanh.
- **Phòng máy lạnh khô hoặc gió thổi trực tiếp** làm mép lá/rêu mất ẩm.
- **Thiếu ẩm thật sự**: mặt đất/rêu khô, lá rũ nhưng không mềm nhũn.
- **Dư ẩm/úng**: đất vẫn sũng, kính đọng nước cả ngày, lá mềm rũ hoặc gốc có dấu hiệu thâm.
- **Mới vận chuyển**: cây có thể rũ nhẹ 1-2 ngày đầu do sốc môi trường.

Cách xử lý an toàn:
1. Dời bể ra nơi sáng gián tiếp, mát, tránh nắng chiếu vào kính.
2. Nếu đất/rêu khô: phun sương nhẹ quanh gốc và rêu, không đổ nước mạnh.
3. Nếu đất đang sũng: không tưới thêm, mở thoáng nhẹ để giảm ẩm.
4. Tránh để máy lạnh thổi trực tiếp vào bể.
5. Cắt bỏ lá héo nặng nếu lá đã mềm hư, nhưng giữ lại phần cây còn khỏe.

Nếu cẩm nhung héo toàn cây, gốc thâm hoặc không hồi sau 1-2 ngày chỉnh môi trường, anh/chị gửi ảnh/video cho shop kiểm tra kỹ hơn.

`responseVariants`:

- `heatStressSpecific`:

  Dạ nếu lá cẩm nhung héo trong khi bể đặt nơi nóng, gần cửa kính hoặc có nắng hắt vào, khả năng cao là **sốc nhiệt**.

  Cẩm nhung hợp môi trường mát ẩm, khoảng 22-28°C sẽ ổn hơn. Khi nhiệt lên trên 30°C, nhất là trong bể kính, không khí bên trong có thể nóng hơn phòng và làm lá rũ nhanh.

  Anh/chị nên dời bể vào nơi sáng gián tiếp, thoáng nhẹ, tránh nắng trực tiếp. Chỉ phun sương nhẹ nếu bề mặt đã khô; nếu đất còn ướt thì khoan tưới thêm.

- `dryVsWetCheck`:

  Dạ mình cần phân biệt héo do khô và héo do úng:
  - Đất/rêu khô, lá rũ nhưng gốc còn xanh: có thể thiếu ẩm, phun sương nhẹ.
  - Đất sũng, kính ướt cả ngày, lá mềm nhũn: có thể dư ẩm/úng, không tưới thêm và mở thoáng.

  Hai trường hợp nhìn đều là “héo”, nhưng cách xử lý ngược nhau nên mình kiểm tra độ ẩm trước khi tưới.

### Case: troubleshooting_moss_yellowing

- `caseId`: `troubleshooting_moss_yellowing`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `moss_troubleshooting`
- `intent`: user hỏi rêu vàng, rêu ngả vàng, rêu úa, rêu mất xanh.
- `trainingFlow`:
  - `subIntents`:
    - `highTemperature`: rêu vàng do nóng, nắng, nhiệt trong bể cao.
    - `tooHumidStagnant`: rêu vàng do độ ẩm cao kéo dài, bí khí, đọng nước cả ngày.
    - `tooDry`: rêu vàng/khô do thiếu ẩm, máy lạnh, bể mở khô nhanh.
    - `tooMuchLight`: rêu vàng do nắng trực tiếp hoặc đèn quá gắt/quá gần.
    - `waterQuality`: nước máy nhiều clo/khoáng làm rêu yếu.
  - `mustAnswer`: rêu vàng không chỉ do một nguyên nhân; cần xét nhiệt độ, độ ẩm, ánh sáng và nước tưới.
  - `askIfNeeded`: hỏi rêu vàng khô giòn hay vàng mềm/ướt, bể có đọng nước không, có nắng không, đang dùng nước gì.
  - `doNotSay`: không nói cứ rêu vàng là tưới thêm; không hứa rêu vàng sẽ xanh lại hoàn toàn.

`keywords`:

  - rêu vàng
  - reu vang
  - rêu bị vàng
  - reu bi vang
  - rêu úa
  - reu ua
  - rêu mất màu
  - reu mat mau
  - rêu ngả vàng
  - reu nga vang
  - moss yellowing
  - yellow moss
  - moss turning yellow
  - moss losing color
  - rêu khô vàng
  - reu kho vang
  - rêu vàng do nóng
  - reu vang do nong
  - rêu vàng do ẩm
  - reu vang do am

`response`:

Dạ **rêu vàng** có thể do nhiều nguyên nhân, thường liên quan tới nhiệt độ, độ ẩm, ánh sáng và nước tưới.

Các trường hợp hay gặp:
- **Nhiệt độ cao/nắng chiếu**: rêu bị nóng, mất xanh, vàng nhanh. Trường hợp này hay xảy ra khi bể gần cửa kính hoặc nơi trên 30°C.
- **Độ ẩm cao nhưng bí**: bể kín đọng nước cả ngày, không thoáng, rêu có thể vàng mềm, yếu hoặc đi kèm mốc.
- **Thiếu ẩm**: rêu vàng khô, sờ thấy khô/giòn, hay gặp ở bể mở hoặc phòng máy lạnh.
- **Ánh sáng quá gắt**: rêu bị vàng/cháy mảng ở phía hứng sáng.
- **Nước tưới chưa phù hợp**: nước máy mới lấy trực tiếp có thể làm rêu yếu nếu dùng lâu dài.

Cách xử lý:
1. Dời bể về nơi sáng gián tiếp, mát, tránh nắng trực tiếp.
2. Nếu rêu khô: phun sương nhẹ bằng nước sạch/đã để bay clo.
3. Nếu rêu ướt mềm, kính đọng nước cả ngày: ngưng tưới, mở thoáng nhẹ.
4. Cắt/gắp phần rêu đã vàng nâu hư nặng nếu lan rộng.
5. Theo dõi 2-3 ngày sau khi chỉnh môi trường.

Nếu rêu vàng lan nhanh, có mốc trắng/mùi hôi hoặc rêu chuyển nâu đen, anh/chị nên gửi ảnh/video để shop kiểm tra đúng tình trạng.

`responseVariants`:

- `hotAndHumidSpecific`:

  Dạ nếu rêu vừa vàng vừa đặt trong môi trường nóng/ẩm bí, khả năng cao là rêu đang bị **stress do nhiệt và độ ẩm không thoát**.

  Rêu thích ẩm nhưng không thích bị hấp nóng hoặc bị ướt bí cả ngày. Anh/chị nên giảm nhiệt trước: dời bể khỏi nắng/cửa kính, đặt nơi sáng nhẹ, sau đó kiểm tra kính và mặt rêu. Nếu bể đang quá ướt thì khoan tưới, mở thoáng ngắn để giảm ẩm.

- `dryYellowSpecific`:

  Dạ nếu rêu vàng kèm khô, giòn hoặc bạc màu thì có thể là thiếu ẩm/khô gió.

  Anh/chị phun sương rất nhẹ, đều bề mặt rêu, rồi đặt bể nơi mát sáng gián tiếp. Tránh xịt quá mạnh làm rêu bật nền hoặc đọng nước thành vũng.

### Case: troubleshooting_fern_leaf_drop

- `caseId`: `troubleshooting_fern_leaf_drop`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `plant_troubleshooting`
- `intent`: user hỏi dương sỉ rụng lá, vàng lá, khô lá, lá rụng trong bể.
- `trainingFlow`:
  - `subIntents`:
    - `dryAir`: rụng lá do khô, thiếu ẩm, máy lạnh/gió.
    - `heatLightStress`: rụng lá do nóng, nắng gắt, nhiệt trong kính cao.
    - `overWaterRootIssue`: rụng do úng/rễ yếu, đất sũng lâu.
    - `adaptationShock`: rụng nhẹ do cây đang thích nghi sau setup/vận chuyển.
  - `mustAnswer`: dương sỉ thích ẩm mát và sáng gián tiếp; xử lý tùy lá rụng khô giòn hay mềm vàng.
  - `askIfNeeded`: hỏi lá rụng khô hay mềm vàng, đất đang khô hay sũng, bể kín/mở, có máy lạnh/nắng không.
  - `doNotSay`: không khuyên đem phơi nắng; không tưới nhiều khi chưa biết đất khô hay ướt.

`keywords`:

  - dương sỉ rụng lá
  - duong si rung la
  - dương xỉ rụng lá
  - duong xi rung la
  - dương sỉ vàng lá
  - duong si vang la
  - dương sỉ khô lá
  - duong si kho la
  - fern dropping leaves
  - fern leaf drop
  - fern leaves falling
  - fern yellow leaves
  - fern dry leaves
  - lá dương sỉ rụng
  - la duong si rung

`response`:

Dạ **dương sỉ rụng lá** cần xem lá rụng kiểu nào để xử lý đúng.

Nguyên nhân thường gặp:
- **Khô/thiếu ẩm**: lá khô giòn, mép lá nâu, hay gặp khi bể mở hoặc để gần máy lạnh.
- **Nóng/nắng gắt**: lá héo, vàng hoặc khô nhanh, nhất là khi bể đặt gần cửa kính.
- **Dư ẩm/úng**: lá vàng mềm, đất sũng lâu, có thể kèm mùi hoặc mốc.
- **Sốc môi trường**: mới setup/mới vận chuyển, cây có thể rụng vài lá cũ trong giai đoạn thích nghi.

Cách xử lý:
1. Cắt bỏ lá đã vàng/khô bằng kéo sạch để cây tập trung nuôi lá mới.
2. Đặt bể nơi sáng gián tiếp, mát, tránh nắng trực tiếp và gió máy lạnh thổi thẳng.
3. Nếu đất/rêu khô: phun sương nhẹ quanh gốc.
4. Nếu đất sũng/kính ướt cả ngày: ngưng tưới, mở thoáng ngắn.
5. Theo dõi lá non: nếu lá non vẫn lên xanh là cây còn phục hồi tốt.

Nếu rụng lá hàng loạt, gốc thâm mềm hoặc cây lụi nhanh, anh/chị gửi ảnh/video cho shop để kiểm tra kỹ hơn.

`responseVariants`:

- `dryFernSpecific`:

  Dạ nếu lá dương sỉ rụng kiểu khô giòn, mép nâu, thường là thiếu ẩm hoặc khô gió.

  Anh/chị dời bể khỏi luồng máy lạnh, phun sương nhẹ khi nền bắt đầu khô và giữ ánh sáng gián tiếp. Không nên đem cây ra nắng để “hồi”, vì dương sỉ dễ sốc nóng hơn.

- `wetFernSpecific`:

  Dạ nếu lá dương sỉ vàng mềm, đất vẫn sũng và kính đọng nước lâu, khả năng là dư ẩm.

  Lúc này mình không tưới thêm. Anh/chị mở thoáng nhẹ một thời gian ngắn, cắt lá hư và theo dõi gốc. Nếu gốc mềm/thâm thì nên gửi ảnh để shop kiểm tra.

### Case: troubleshooting_cryptanthus_color_fade

- `caseId`: `troubleshooting_cryptanthus_color_fade`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `plant_troubleshooting`
- `intent`: user hỏi dứa phụng/dứa cảnh từ hồng chuyển nhạt, mất màu, xanh lại, bạc màu.
- `trainingFlow`:
  - `subIntents`:
    - `lowLight`: màu hồng nhạt đi do thiếu sáng.
    - `tooStrongLight`: bạc/cháy màu do nắng gắt.
    - `adaptation`: đổi màu nhẹ sau vận chuyển/setup.
  - `mustAnswer`: dứa phụng cần ánh sáng gián tiếp đủ mạnh để giữ màu; thiếu sáng thường làm màu hồng nhạt/xanh hơn; không phơi nắng gắt trực tiếp.
  - `askIfNeeded`: hỏi bể đặt ở đâu, sáng mạnh hay tối, có đèn hỗ trợ không, lá nhạt đều hay cháy từng mảng.
  - `doNotSay`: không khuyên phơi nắng trực tiếp lâu; không hứa màu lên lại ngay trong vài giờ.

`keywords`:

  - dứa phụng nhạt màu
  - dua phung nhat mau
  - dứa phụng mất màu
  - dua phung mat mau
  - dứa phụng từ hồng chuyển nhạt
  - dua phung tu hong chuyen nhat
  - cây hồng bị nhạt màu
  - cay hong bi nhat mau
  - lá hồng chuyển xanh
  - la hong chuyen xanh
  - cryptanthus fading
  - cryptanthus losing color
  - bromeliad losing color
  - pink plant turning green
  - dứa cảnh nhạt màu
  - dua canh nhat mau

`response`:

Dạ nếu **dứa phụng/dứa cảnh màu hồng chuyển nhạt**, nguyên nhân thường gặp nhất là **thiếu sáng gián tiếp đủ mạnh**.

Cách hiểu cụ thể:
- Thiếu sáng: màu hồng nhạt dần, lá xanh hơn, cây vẫn chưa chắc là bệnh.
- Nắng quá gắt: lá có thể bạc màu, cháy mảng, khô mép.
- Mới đổi môi trường: cây có thể nhạt màu nhẹ trong thời gian thích nghi.

Cách xử lý:
1. Chuyển bể tới nơi sáng hơn nhưng vẫn là ánh sáng gián tiếp.
2. Có thể đặt gần cửa sổ có rèm, nơi sáng đều, tránh nắng chiếu thẳng vào kính.
3. Nếu phòng thiếu sáng, dùng đèn hỗ trợ nhẹ theo chu kỳ ổn định.
4. Không tưới thêm chỉ vì cây nhạt màu, vì vấn đề chính thường là ánh sáng chứ không phải thiếu nước.
5. Theo dõi màu lá mới trong vài tuần; màu thường cải thiện từ từ, không đổi lại ngay lập tức.

Nếu lá vừa nhạt vừa mềm nhũn/thâm gốc, đó có thể không chỉ là thiếu sáng mà cần kiểm tra thêm độ ẩm và tình trạng rễ.

`responseVariants`:

- `lowLightSpecific`:

  Dạ trường hợp dứa phụng từ hồng chuyển nhạt thường là do **thiếu sáng**.

  Mình nên tăng ánh sáng gián tiếp cho bể, ví dụ đặt gần khu vực cửa sổ có rèm hoặc dùng đèn hỗ trợ. Tránh phơi nắng trực tiếp vì bể kính dễ nóng lên và làm cây cháy lá.

- `notWaterIssue`:

  Dạ riêng dứa phụng nhạt màu thì không nên xử lý bằng cách tưới nhiều hơn.

  Màu hồng của cây phụ thuộc khá nhiều vào ánh sáng. Nếu tưới thêm trong khi nền vẫn ẩm, cây có thể bị dư nước mà màu vẫn không cải thiện.
