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

### Case: troubleshooting_mold_white

- `caseId`: `troubleshooting_mold_white`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `mold_troubleshooting`
- `intent`: user hỏi mốc trắng, mốc trên rêu/đất/gỗ/đá, mảng trắng li ti trong bể.
- `trainingFlow`:
  - `subIntents`:
    - `lightMold`: mốc trắng ít, mới xuất hiện ở gỗ/đất/rêu.
    - `spreadingMold`: mốc lan nhanh, phủ mảng lớn.
    - `humidityCause`: mốc do dư ẩm, bí khí, kính đọng nước cả ngày.
    - `organicMaterial`: mốc trên gỗ/lá mục/vụn hữu cơ.
  - `mustAnswer`: mốc trắng nhẹ có thể gặp ở bể mới/ẩm cao; xử lý bằng giảm ẩm, gắp bỏ phần mốc, tăng thông khí nhẹ; không dùng thuốc/hóa chất mạnh trong bể.
  - `askIfNeeded`: hỏi mốc ở đâu, lan nhanh không, bể kín/mở, kính có ướt cả ngày không, có mùi hôi không.
  - `doNotSay`: không khuyên xịt thuốc nấm mạnh, cồn, oxy già trực tiếp vào toàn bể.

`keywords`:

  - mốc trắng
  - moc trang
  - bể bị mốc
  - be bi moc
  - rêu bị mốc
  - reu bi moc
  - đất bị mốc
  - dat bi moc
  - gỗ bị mốc
  - go bi moc
  - mốc trên rêu
  - moc tren reu
  - mốc lan
  - moc lan
  - mốc trắng li ti
  - moc trang li ti
  - white mold
  - mold in terrarium
  - fungus in terrarium
  - fuzzy mold
  - be moc trang
  - moc trong be

`response`:

Dạ **mốc trắng** trong terrarium thường liên quan tới **dư ẩm, bí khí hoặc vật liệu hữu cơ đang phân hủy** như lá mục/gỗ/rêu quá ướt.

Phân biệt nhanh:
- Mốc ít, mới xuất hiện ở một điểm: thường xử lý được bằng cách giảm ẩm và gắp bỏ.
- Mốc lan nhanh, phủ nhiều mảng, có mùi hôi: bể đang quá ẩm/bí hoặc có phần cây/lá mục cần xử lý kỹ hơn.
- Kính ướt cả ngày + đất sũng: khả năng dư ẩm cao, không nên tưới thêm.

Cách xử lý an toàn:
1. Ngưng tưới vài ngày nếu bể đang ẩm/sũng.
2. Mở nắp thoáng ngắn nếu là bể kín, tránh nắng/gió mạnh.
3. Dùng nhíp/tăm bông lấy phần mốc và lá mục ra khỏi bể.
4. Giảm lượng nước tưới lần sau, chỉ phun sương rất nhẹ.
5. Nếu mốc lan rộng hoặc có mùi hôi, gửi ảnh/video cho shop kiểm tra.

Không nên xịt hóa chất mạnh trực tiếp vào bể vì dễ ảnh hưởng cây/rêu.

`responseVariants`:

- `lightMold`:

  Dạ nếu chỉ có một ít mốc trắng li ti, anh/chị gắp bỏ phần mốc/lá mục, mở thoáng nhẹ và ngưng tưới thêm. Đây thường là dấu hiệu bể đang ẩm hơi nhiều.

- `spreadingMold`:

  Dạ nếu mốc lan nhanh hoặc có mùi hôi, mình cần xử lý như sự cố dư ẩm. Anh/chị không tưới thêm, mở thoáng, lấy phần mục/mốc ra và gửi ảnh cho shop nếu mốc vẫn lan sau khi giảm ẩm.

### Case: troubleshooting_bad_smell

- `caseId`: `troubleshooting_bad_smell`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `environment_troubleshooting`
- `intent`: user hỏi bể có mùi hôi, mùi úng, mùi thối, mùi lạ.
- `trainingFlow`:
  - `subIntents`:
    - `normalEarthSmell`: mùi đất/rêu nhẹ sau tưới hoặc mới nhận.
    - `rottenSmell`: mùi hôi thối/úng.
    - `stagnantHumidity`: mùi bí do đọng nước, thiếu thoáng.
    - `decaySource`: lá mục, rễ thối, thức hữu cơ phân hủy.
  - `mustAnswer`: mùi đất/rêu nhẹ là bình thường; mùi hôi nặng thường do dư ẩm, lá mục, úng rễ hoặc bể bí.
  - `askIfNeeded`: hỏi mùi nhẹ hay hôi nặng, xuất hiện khi nào, bể có sũng/mốc/lá mục không.
  - `doNotSay`: không khuyên xịt nước hoa/tinh dầu/khử mùi vào bể.

`keywords`:

  - bể có mùi
  - be co mui
  - bể hôi
  - be hoi
  - mùi hôi
  - mui hoi
  - mùi úng
  - mui ung
  - mùi thối
  - mui thoi
  - mùi đất
  - mui dat
  - mùi rêu
  - mui reu
  - terrarium smells bad
  - bad smell terrarium
  - rotten smell
  - musty smell
  - be bi mui
  - be hoi qua

`response`:

Dạ nếu bể chỉ có **mùi đất/rêu nhẹ** thì thường bình thường, nhất là sau khi tưới hoặc mới nhận bể.

Nhưng nếu bể có mùi hôi, úng hoặc thối rõ thì cần kiểm tra:
- Đất/nền có đang sũng nước không.
- Kính có đọng nước cả ngày không.
- Có lá mục/cành mục nằm trong bể không.
- Có mốc trắng hoặc gốc cây mềm/thâm không.

Cách xử lý:
1. Ngưng tưới nếu bể đang ẩm nhiều.
2. Mở nắp thoáng ngắn để thoát mùi và giảm ẩm.
3. Gắp bỏ lá mục, phần cây hư, mốc nhìn thấy.
4. Đặt bể nơi sáng gián tiếp, mát, không nắng trực tiếp.
5. Nếu mùi vẫn nặng hoặc gốc cây thối, gửi ảnh/video cho shop.

Không nên xịt nước hoa, tinh dầu hoặc hóa chất khử mùi vào bể.

`responseVariants`:

- `normalEarthSmell`:

  Dạ mùi đất/rêu nhẹ, tự nhiên thì thường không sao. Mình chỉ cần giữ bể thoáng vừa, không tưới quá tay và lấy lá mục ra nếu có.

- `rottenSmell`:

  Dạ mùi thối/úng là dấu hiệu cần kiểm tra dư ẩm hoặc phần cây bị mục. Anh/chị ngưng tưới, mở thoáng và gắp bỏ phần mục trước; nếu mùi không giảm thì nên gửi ảnh/video cho shop.

### Case: troubleshooting_overwatering_root_rot

- `caseId`: `troubleshooting_overwatering_root_rot`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `watering_troubleshooting`
- `intent`: user hỏi tưới quá nhiều, đất sũng, úng rễ, cây mềm nhũn, gốc thâm.
- `trainingFlow`:
  - `subIntents`:
    - `overwatered`: lỡ tưới nhiều, nước đọng đáy.
    - `rootRotSigns`: gốc thâm, mềm nhũn, lá vàng mềm.
    - `closedTankTooWet`: bể kín đọng nước cả ngày.
    - `savePlant`: hỏi cây còn cứu được không.
  - `mustAnswer`: ngưng tưới, giảm ẩm, mở thoáng; phân biệt úng với thiếu nước; nếu gốc thối nặng cần ảnh/video.
  - `askIfNeeded`: hỏi đất sũng bao lâu, nước có đọng đáy không, lá mềm hay khô, gốc có thâm/mùi không.
  - `doNotSay`: không khuyên phơi nắng gắt để làm khô nhanh.

`keywords`:

  - tưới nhiều quá
  - tuoi nhieu qua
  - lỡ tưới nhiều
  - lo tuoi nhieu
  - đất sũng
  - dat sung
  - nền sũng
  - nen sung
  - úng rễ
  - ung re
  - thối rễ
  - thoi re
  - cây mềm nhũn
  - cay mem nhun
  - lá vàng mềm
  - la vang mem
  - gốc thâm
  - goc tham
  - root rot
  - overwatered terrarium
  - soggy soil
  - waterlogged
  - be uot qua
  - be bi ung

`response`:

Dạ nếu bể bị tưới nhiều, đất/nền sũng hoặc cây mềm nhũn thì ưu tiên là **ngưng tưới và giảm ẩm từ từ**.

Dấu hiệu dư nước/úng:
- Đất sũng, có nước đọng đáy.
- Kính ướt cả ngày.
- Lá vàng mềm, trong nước hoặc rũ nhưng nền vẫn ướt.
- Gốc cây thâm/mềm, có mùi hôi.

Cách xử lý:
1. Ngưng tưới ngay.
2. Mở nắp thoáng vài giờ nếu là bể kín.
3. Đặt bể nơi sáng gián tiếp, mát, không phơi nắng gắt.
4. Gắp bỏ lá mục/lá mềm hư.
5. Theo dõi gốc cây; nếu gốc thối nặng cần gửi ảnh/video để shop kiểm tra.

Không nên đem bể ra nắng mạnh để “hong khô” vì kính có thể hấp nhiệt làm cây sốc thêm.

`responseVariants`:

- `justOverwatered`:

  Dạ nếu vừa lỡ tưới nhiều nhưng cây chưa hư, anh/chị ngưng tưới, mở thoáng nhẹ và để bể ở nơi sáng gián tiếp. Sau đó chỉ tưới lại khi nền đã giảm ẩm rõ.

- `rootRotSigns`:

  Dạ nếu gốc đã thâm mềm, lá vàng nhũn hoặc có mùi hôi thì có thể đã bị úng/thối. Trường hợp này nên gửi ảnh/video để shop xem còn cứu phần cây nào không.

### Case: troubleshooting_underwatering_dry_moss

- `caseId`: `troubleshooting_underwatering_dry_moss`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `watering_troubleshooting`
- `intent`: user hỏi thiếu nước, rêu khô nâu/giòn, đất khô, lá khô mép.
- `trainingFlow`:
  - `subIntents`:
    - `dryMoss`: rêu khô, nâu, giòn, co lại.
    - `drySoil`: đất/nền khô trắng, bể mở mất ẩm nhanh.
    - `airconDry`: máy lạnh/gió làm khô.
    - `recoverDryTank`: hỏi có cứu được không.
  - `mustAnswer`: cấp ẩm lại từ từ bằng phun sương nhẹ; tránh đổ nước ào; dời khỏi gió/nắng.
  - `askIfNeeded`: hỏi rêu khô nhẹ hay nâu giòn, bể mở/kín, phòng máy lạnh/nắng không.
  - `doNotSay`: không hứa rêu nâu giòn sẽ xanh lại hoàn toàn.

`keywords`:

  - thiếu nước
  - thieu nuoc
  - bể khô quá
  - be kho qua
  - rêu khô
  - reu kho
  - rêu khô nâu
  - reu kho nau
  - rêu giòn
  - reu gion
  - đất khô
  - dat kho
  - lá khô mép
  - la kho mep
  - dry moss
  - moss dried out
  - dry terrarium
  - underwatered
  - be thieu am
  - reu bi kho

`response`:

Dạ nếu bể bị khô, mình nên **cấp ẩm lại từ từ**, không đổ nước nhiều một lần.

Dấu hiệu thiếu ẩm:
- Rêu nhạt màu, co lại, khô nhẹ.
- Rêu nâu/giòn là mức nặng hơn, có phần có thể khó hồi xanh hoàn toàn.
- Đất/nền khô rõ.
- Lá khô mép, rũ nhưng nền cũng đang khô.

Cách xử lý:
1. Dời bể khỏi nắng, quạt hoặc luồng máy lạnh.
2. Phun sương nhẹ nhiều nhịp, để nước thấm từ từ.
3. Không đổ nước ào vào một điểm.
4. Theo dõi 1-2 ngày; phần còn xanh/ẩm lại thường hồi tốt hơn phần đã nâu giòn.
5. Điều chỉnh lịch kiểm tra ẩm thường xuyên hơn, nhất là bể mở.

`responseVariants`:

- `dryMossRecover`:

  Dạ rêu khô nhẹ còn cơ hội hồi nếu cấp ẩm đúng cách. Anh/chị phun sương mỏng đều, đặt nơi mát sáng gián tiếp và tránh gió máy lạnh.

- `brownCrispyMoss`:

  Dạ nếu rêu đã nâu giòn nhiều thì phần đó có thể khó xanh lại hoàn toàn. Mình vẫn cấp ẩm từ từ, theo dõi phần còn xanh; nếu mảng hư rộng nên gửi ảnh để shop tư vấn thay/chỉnh rêu.

### Case: troubleshooting_yellow_leaves_general

- `caseId`: `troubleshooting_yellow_leaves_general`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `plant_troubleshooting`
- `intent`: user hỏi lá vàng nói chung, cây vàng lá, vàng vài lá hay vàng nhiều.
- `trainingFlow`:
  - `subIntents`:
    - `oldLeaves`: vàng vài lá già tự nhiên.
    - `overwatering`: vàng mềm do dư ẩm/úng.
    - `lowLight`: vàng/nhạt do thiếu sáng.
    - `heatStress`: vàng do nóng/nắng.
    - `shippingShock`: vàng nhẹ sau vận chuyển.
  - `mustAnswer`: lá vàng có nhiều nguyên nhân; hỏi vàng mềm hay khô, nền khô hay sũng, ánh sáng/nhiệt.
  - `askIfNeeded`: hỏi số lượng lá vàng, màu vàng mềm/khô, vị trí cây, độ ẩm nền.
  - `doNotSay`: không quy mọi lá vàng là thiếu nước.

`keywords`:

  - lá vàng
  - la vang
  - cây vàng lá
  - cay vang la
  - lá bị vàng
  - la bi vang
  - vàng lá
  - vang la
  - lá vàng mềm
  - la vang mem
  - lá vàng khô
  - la vang kho
  - yellow leaves
  - plant yellowing
  - yellow leaf terrarium
  - cay bi vang
  - la vang co sao khong

`response`:

Dạ **lá vàng** chưa chắc chỉ do một nguyên nhân. Mình cần nhìn lá vàng kiểu nào:

- Vàng vài lá già ở dưới gốc: có thể là thay lá tự nhiên, chỉ cần cắt bỏ lá hư.
- Vàng mềm, lá nhũn, đất sũng: thường nghiêng về dư ẩm/úng.
- Vàng khô, mép nâu, nền khô: có thể thiếu ẩm hoặc khô gió.
- Vàng/cháy ở phía hứng sáng: có thể nắng gắt/nhiệt cao.
- Nhạt màu, cây yếu/vươn dài: có thể thiếu sáng.

Cách xử lý an toàn là kiểm tra nền trước khi tưới, cắt lá vàng hư, đặt bể ở nơi sáng gián tiếp và theo dõi thêm. Nếu vàng lan nhanh hoặc kèm gốc mềm/mùi hôi, anh/chị gửi ảnh/video cho shop.

`responseVariants`:

- `fewOldLeaves`:

  Dạ nếu chỉ vàng vài lá già, cây vẫn đứng khỏe và lá non ổn thì thường không đáng lo. Anh/chị cắt bỏ lá vàng và lấy ra khỏi bể để tránh mốc.

- `yellowSoftLeaves`:

  Dạ lá vàng mềm kèm nền ướt/sũng thường nghiêng về dư ẩm. Mình khoan tưới thêm, mở thoáng nhẹ và kiểm tra gốc cây.

### Case: troubleshooting_brown_black_leaves

- `caseId`: `troubleshooting_brown_black_leaves`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `plant_troubleshooting`
- `intent`: user hỏi lá nâu, lá đen, cháy mép, thâm lá, đốm đen.
- `trainingFlow`:
  - `subIntents`:
    - `sunburn`: cháy lá do nắng/nhiệt.
    - `dryEdges`: mép nâu do khô gió/thiếu ẩm.
    - `rotBlack`: đen mềm do úng/thối.
    - `spotting`: đốm nâu/đen cần theo dõi lan.
  - `mustAnswer`: phân biệt nâu khô/cháy với đen mềm/úng; xử lý theo độ khô/ướt của nền.
  - `askIfNeeded`: hỏi lá khô giòn hay mềm nhũn, nằm phía nắng hay toàn cây, nền khô hay sũng.
  - `doNotSay`: không khuyên cắt toàn bộ cây nếu chỉ vài lá hư.

`keywords`:

  - lá nâu
  - la nau
  - lá đen
  - la den
  - cháy lá
  - chay la
  - cháy mép lá
  - chay mep la
  - lá thâm
  - la tham
  - đốm đen
  - dom den
  - đốm nâu
  - dom nau
  - brown leaves
  - black leaves
  - leaf burn
  - burnt leaves
  - leaf spots
  - la bi chay
  - la bi tham

`response`:

Dạ lá nâu/đen cần phân biệt theo cảm giác lá:

- **Nâu khô, cháy mép**: thường do nắng gắt, nhiệt cao, thiếu ẩm hoặc gió máy lạnh.
- **Đen mềm, nhũn**: thường nghiêng về dư ẩm/úng hoặc phần lá bị mục.
- **Đốm nâu/đen lan nhanh**: cần theo dõi kỹ, có thể liên quan ẩm bí hoặc nấm.

Cách xử lý:
1. Cắt bỏ lá hư bằng kéo sạch.
2. Lấy vụn lá ra khỏi bể.
3. Dời bể khỏi nắng trực tiếp/gió lạnh.
4. Kiểm tra nền: khô thì phun nhẹ, sũng thì ngưng tưới và mở thoáng.
5. Nếu đốm lan nhanh hoặc gốc cây thâm mềm, gửi ảnh/video cho shop.

`responseVariants`:

- `sunburnDry`:

  Dạ nếu lá bị nâu khô ở phía hứng nắng, khả năng là cháy lá/sốc nhiệt. Anh/chị dời bể vào nơi sáng gián tiếp và cắt phần lá cháy nặng.

- `blackSoftRot`:

  Dạ nếu lá đen mềm hoặc nhũn, mình nên nghĩ tới dư ẩm/mục lá. Khoan tưới thêm, lấy lá hư ra và mở thoáng nhẹ nếu bể đang quá ẩm.

### Case: troubleshooting_plant_death

- `caseId`: `troubleshooting_plant_death`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `plant_troubleshooting`
- `intent`: user hỏi cây chết, cây lụi, cây không cứu được không, cây hư nặng.
- `trainingFlow`:
  - `subIntents`:
    - `partlyAlive`: còn lá/gốc xanh, có thể phục hồi.
    - `fullyDead`: toàn cây khô giòn/thối mềm.
    - `fastDecline`: chết nhanh sau nhận/chăm.
    - `warrantyBoundary`: cần chuyển chính sách/bảo hành nếu liên quan thời điểm nhận.
  - `mustAnswer`: kiểm tra gốc/lá non/mùi; không kết luận nếu chưa có ảnh; hướng gửi ảnh/video khi nặng.
  - `askIfNeeded`: hỏi cây chết toàn bộ hay một phần, mới nhận bao lâu, gốc xanh hay thâm, nền khô/sũng.
  - `doNotSay`: không hứa chắc cứu được.

`keywords`:

  - cây chết
  - cay chet
  - cây lụi
  - cay lui
  - cây hư
  - cay hu
  - cây không cứu được
  - cay khong cuu duoc
  - cây chết nhanh
  - cay chet nhanh
  - cây khô hết
  - cay kho het
  - cây thối hết
  - cay thoi het
  - dead plant
  - plant died
  - dying plant
  - can it be saved
  - cay sap chet
  - cứu cây
  - cuu cay

`response`:

Dạ để biết cây còn cứu được không, mình kiểm tra 3 điểm:

- Gốc/thân còn xanh, còn cứng: vẫn có cơ hội hồi.
- Lá non còn xanh hoặc chồi mới còn khỏe: tín hiệu tốt.
- Gốc thâm mềm, mùi hôi, toàn cây nhũn hoặc khô giòn: khả năng hư nặng hơn.

Cách xử lý tạm thời:
1. Cắt bỏ phần lá/cành đã hư.
2. Kiểm tra nền khô hay sũng trước khi tưới.
3. Đặt bể nơi sáng gián tiếp, mát.
4. Không thay đất/tháo bố cục ngay nếu chưa rõ nguyên nhân.

Nếu cây chết nhanh, hư toàn bộ hoặc mới nhận đã có vấn đề, anh/chị gửi ảnh/video và thời điểm nhận bể để shop kiểm tra theo chính sách phù hợp.

`responseVariants`:

- `partlyAlive`:

  Dạ nếu cây còn phần gốc/chồi xanh, mình vẫn có thể thử cứu bằng cách cắt phần hư, chỉnh lại độ ẩm và đặt nơi sáng gián tiếp.

- `warrantyBoundary`:

  Dạ nếu cây hư ngay khi mới nhận hoặc trong thời gian rất ngắn, anh/chị nên giữ hiện trạng, chụp ảnh/video và gửi shop kiểm tra. Phần kết luận bảo hành sẽ theo chính sách shop.

### Case: troubleshooting_pests_insects

- `caseId`: `troubleshooting_pests_insects`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `pest_troubleshooting`
- `intent`: user hỏi côn trùng nhỏ, ruồi nấm, kiến, bọ li ti, sâu trong bể.
- `trainingFlow`:
  - `subIntents`:
    - `fungusGnats`: ruồi nhỏ bay quanh bể.
    - `tinyBugs`: bọ li ti trên đất/rêu.
    - `ants`: kiến vào bể.
    - `severePest`: nhiều côn trùng hoặc cây bị ăn/hư.
  - `mustAnswer`: không dùng thuốc mạnh tùy tiện; giảm ẩm, gắp bỏ lá mục, vệ sinh quanh bể; gửi ảnh nếu nhiều.
  - `askIfNeeded`: hỏi côn trùng bay hay bò, số lượng, có lá mục/mốc/đất sũng không.
  - `doNotSay`: không khuyên xịt thuốc trừ sâu mạnh trực tiếp vào bể.

`keywords`:

  - có côn trùng
  - co con trung
  - bọ li ti
  - bo li ti
  - ruồi nấm
  - ruoi nam
  - ruồi nhỏ
  - ruoi nho
  - kiến trong bể
  - kien trong be
  - sâu trong bể
  - sau trong be
  - bug in terrarium
  - tiny bugs
  - fungus gnats
  - ants in terrarium
  - insects terrarium
  - be co bo
  - be co ruoi

`response`:

Dạ nếu trong bể có côn trùng, mình cần xem là loại bay hay bò và số lượng nhiều không.

Nguyên nhân hay gặp:
- Nền quá ẩm, lá mục/mốc thu hút ruồi nấm/bọ nhỏ.
- Bể đặt gần khu vực có kiến/côn trùng.
- Vật liệu hữu cơ trong bể đang phân hủy.

Cách xử lý nhẹ trước:
1. Gắp bỏ lá mục, phần mốc hoặc vật hữu cơ hư.
2. Giảm tưới nếu nền đang ẩm/sũng.
3. Mở thoáng ngắn nếu bể kín quá ẩm.
4. Lau sạch khu vực đặt bể, tránh đồ ngọt/thức ăn gần bể.
5. Nếu côn trùng nhiều hoặc cây bị ăn/hư, gửi ảnh/video cho shop.

Không nên xịt thuốc trừ sâu mạnh trực tiếp vào bể vì có thể làm hại cây/rêu.

`responseVariants`:

- `fungusGnats`:

  Dạ ruồi nhỏ bay quanh bể thường liên quan nền ẩm và lá mục. Anh/chị giảm tưới, lấy lá mục ra và giữ khu vực quanh bể sạch trước.

- `ants`:

  Dạ nếu có kiến, anh/chị kiểm tra khu vực đặt bể có thức ăn/đồ ngọt không và lau sạch bên ngoài. Không nên đổ thuốc kiến vào trong bể.

### Case: troubleshooting_condensation_too_much

- `caseId`: `troubleshooting_condensation_too_much`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `humidity_troubleshooting`
- `intent`: user hỏi kính đọng nước cả ngày, quá nhiều sương, bể quá ẩm.
- `trainingFlow`:
  - `subIntents`:
    - `normalMist`: sương nhẹ buổi sáng.
    - `tooWetGlass`: kính ướt đặc cả ngày.
    - `waterDrops`: giọt nước chảy xuống kính.
    - `moldRisk`: kèm mốc/mùi/lá vàng mềm.
  - `mustAnswer`: sương nhẹ bình thường; đọng nước cả ngày là dư ẩm, cần mở thoáng, giảm tưới.
  - `askIfNeeded`: hỏi kính mờ lúc nào, kéo dài bao lâu, có mốc/mùi/đất sũng không.
  - `doNotSay`: không khuyên lau kính liên tục thay cho xử lý ẩm.

`keywords`:

  - kính đọng nước
  - kinh dong nuoc
  - kính ướt cả ngày
  - kinh uot ca ngay
  - đọng sương nhiều
  - dong suong nhieu
  - quá nhiều sương
  - qua nhieu suong
  - bể quá ẩm
  - be qua am
  - kính mờ cả ngày
  - kinh mo ca ngay
  - condensation too much
  - too much condensation
  - foggy glass all day
  - water drops glass
  - be dong nuoc
  - kinh uot nhieu

`response`:

Dạ bể kín có **sương nhẹ buổi sáng** là bình thường. Nhưng nếu kính ướt/mờ cả ngày hoặc có giọt nước chảy xuống liên tục thì bể đang dư ẩm.

Cách xử lý:
1. Ngưng tưới thêm.
2. Mở nắp thoáng vài giờ ở nơi mát, tránh nắng/gió mạnh.
3. Lau nhẹ kính nếu cần quan sát, nhưng vẫn phải xử lý nguyên nhân dư ẩm.
4. Gắp lá mục nếu có.
5. Nếu kèm mốc/mùi hôi/lá vàng mềm, chuyển sang xử lý mốc hoặc úng.

Sau khi bể ổn lại, lần tưới sau chỉ phun sương rất nhẹ.

`responseVariants`:

- `normalMist`:

  Dạ sương nhẹ buổi sáng rồi giảm dần trong ngày thường là bình thường, không cần mở nắp lâu.

- `tooWetGlass`:

  Dạ kính ướt cả ngày là dấu hiệu dư ẩm. Anh/chị ngưng tưới, mở thoáng vài giờ và kiểm tra lá mục/mốc trong bể.

### Case: troubleshooting_heat_stress

- `caseId`: `troubleshooting_heat_stress`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `environment_troubleshooting`
- `intent`: user hỏi bể bị nóng, nắng chiếu, nhiệt cao, cây/rêu sốc nhiệt.
- `trainingFlow`:
  - `subIntents`:
    - `directSunHeat`: nắng chiếu vào kính.
    - `roomTooHot`: phòng trên 30°C, bí nóng.
    - `afterHeatDamage`: cây héo/rêu vàng sau khi nóng.
    - `safeTemperature`: hỏi nhiệt độ bao nhiêu ổn.
  - `mustAnswer`: 22-28°C ổn; trên 30°C dễ stress; tránh nắng trực tiếp qua kính.
  - `askIfNeeded`: hỏi nhiệt độ phòng, có nắng chiếu không, triệu chứng lá/rêu.
  - `doNotSay`: không khuyên phơi nắng để cây khỏe.

`keywords`:

  - bể bị nóng
  - be bi nong
  - nóng quá
  - nong qua
  - nắng chiếu vào bể
  - nang chieu vao be
  - sốc nhiệt
  - soc nhiet
  - nhiệt độ cao
  - nhiet do cao
  - trên 30 độ
  - tren 30 do
  - heat stress
  - terrarium too hot
  - direct sun terrarium
  - hot room
  - cay bi nong
  - reu bi nong

`response`:

Dạ terrarium rất dễ bị **sốc nhiệt** nếu nắng chiếu trực tiếp vào kính hoặc phòng quá nóng.

Mốc nhiệt tham khảo:
- 22-28°C: tương đối ổn cho đa số bể cây/rêu.
- Trên 30°C: cây/rêu dễ stress, rêu vàng, cẩm nhung héo, lá cháy.
- Nắng chiếu qua kính có thể làm nhiệt trong bể cao hơn nhiệt phòng.

Cách xử lý:
1. Dời bể khỏi nắng trực tiếp/cửa kính nóng.
2. Đặt nơi sáng gián tiếp, mát, thoáng nhẹ.
3. Không tưới ào ngay nếu nền vẫn ẩm; kiểm tra nền trước.
4. Cắt lá cháy/hư nếu có.
5. Theo dõi 1-2 ngày; nếu héo/vàng lan nhanh thì gửi ảnh/video.

`responseVariants`:

- `directSunHeat`:

  Dạ nắng chiếu vào bể kính là rủi ro lớn vì bể có thể bị hấp nhiệt. Anh/chị nên chuyển sang vị trí sáng gián tiếp thay vì phơi nắng.

- `safeTemperature`:

  Dạ nhiệt độ dễ chăm thường khoảng 22-28°C. Nếu phòng thường xuyên trên 30°C, mình cần tránh nắng, tăng thoáng nhẹ và kiểm tra ẩm thường xuyên hơn.

### Case: troubleshooting_low_light_symptoms

- `caseId`: `troubleshooting_low_light_symptoms`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `light_troubleshooting`
- `intent`: user hỏi thiếu sáng, cây vươn dài, nhạt màu, lá yếu, dứa phụng mất màu.
- `trainingFlow`:
  - `subIntents`:
    - `leggyGrowth`: cây vươn dài/ngả về phía sáng.
    - `colorFade`: cây nhạt màu, dứa phụng mất hồng.
    - `weakLeaves`: lá nhỏ/yếu/rụng do thiếu sáng.
    - `useGrowLight`: dùng đèn hỗ trợ.
  - `mustAnswer`: thiếu sáng làm cây yếu/nhạt/vươn; tăng ánh sáng gián tiếp hoặc đèn hỗ trợ, không phơi nắng gắt.
  - `askIfNeeded`: hỏi bể đặt ở đâu, có cửa sổ/đèn không, sáng mấy giờ mỗi ngày.
  - `doNotSay`: không khuyên đưa ra nắng trưa.

`keywords`:

  - thiếu sáng
  - thieu sang
  - phòng tối
  - phong toi
  - cây vươn dài
  - cay vuon dai
  - cây nhạt màu
  - cay nhat mau
  - lá yếu
  - la yeu
  - cây nghiêng về sáng
  - cay nghieng ve sang
  - low light symptoms
  - not enough light
  - leggy plant
  - plant stretching
  - color fading plant
  - can dung den khong
  - dùng đèn được không
  - dung den duoc khong

`response`:

Dạ thiếu sáng thường không làm cây chết ngay, nhưng sẽ làm cây yếu dần.

Dấu hiệu thiếu sáng:
- Cây vươn dài, nghiêng về phía có sáng.
- Lá nhạt màu, lá nhỏ/yếu hơn.
- Dứa phụng/dứa cảnh hồng chuyển nhạt.
- Rêu/cây nhìn kém xanh, phát triển chậm.

Cách xử lý:
1. Chuyển bể tới nơi sáng gián tiếp hơn.
2. Tránh nắng trực tiếp qua kính.
3. Nếu phòng tối, dùng đèn LED/grow light nhẹ theo chu kỳ ổn định.
4. Theo dõi lá mới trong vài tuần, vì màu/sức cây cải thiện từ từ.

`responseVariants`:

- `useGrowLight`:

  Dạ nếu phòng thiếu sáng, dùng đèn hỗ trợ là hợp lý. Anh/chị chọn ánh sáng vừa phải, bật đều mỗi ngày và tránh đặt đèn quá sát làm nóng bể.

- `leggyGrowth`:

  Dạ cây vươn dài/nghiêng về một phía thường là dấu hiệu đang tìm sáng. Mình tăng ánh sáng gián tiếp, không cắt quá mạnh ngay nếu cây còn yếu.

### Case: troubleshooting_after_shipping_shock

- `caseId`: `troubleshooting_after_shipping_shock`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `post_shipping_troubleshooting`
- `intent`: user hỏi cây/rêu hơi rũ, vàng nhẹ, xô nhẹ sau vận chuyển/mới nhận.
- `trainingFlow`:
  - `subIntents`:
    - `mildShock`: rũ nhẹ, vài lá vàng sau nhận.
    - `severeDamage`: vỡ/xô lệch nặng/cây bật gốc.
    - `firstDayCare`: chăm 1-2 ngày đầu.
    - `policyBoundary`: cần ảnh/video nếu vấn đề lúc nhận.
  - `mustAnswer`: sốc nhẹ có thể gặp; đặt ổn định, không tưới nhiều; hư nặng cần giữ hiện trạng và gửi ảnh/video.
  - `askIfNeeded`: hỏi mới nhận bao lâu, tình trạng nặng hay nhẹ, có ảnh/video mở hàng không.
  - `doNotSay`: không khuyên tự tháo sửa nếu hư nặng lúc nhận.

`keywords`:

  - sốc vận chuyển
  - soc van chuyen
  - mới nhận cây rũ
  - moi nhan cay ru
  - mới nhận cây héo
  - moi nhan cay heo
  - mới nhận rêu vàng
  - moi nhan reu vang
  - sau vận chuyển
  - sau van chuyen
  - shipping shock
  - transport shock
  - plant shock after shipping
  - just received plant drooping
  - moi nhan be co van de
  - vua nhan bi hu

`response`:

Dạ sau vận chuyển, cây/rêu có thể hơi rũ nhẹ hoặc xuống màu nhẹ do đổi môi trường.

Nếu tình trạng nhẹ:
- Đặt bể nơi sáng gián tiếp, mát.
- Không tưới nhiều ngay.
- Quan sát 1-2 ngày.
- Chỉ phun sương nhẹ nếu nền thật sự khô.

Nếu tình trạng nặng như bể vỡ/nứt, đất/rêu đổ nhiều, cây bật gốc nhiều, cây hư rõ ngay lúc nhận, anh/chị nên giữ hiện trạng và gửi ảnh/video cho shop kiểm tra theo chính sách.

`responseVariants`:

- `mildShock`:

  Dạ rũ nhẹ sau vận chuyển có thể hồi khi bể ổn định lại. Anh/chị đặt nơi mát sáng gián tiếp và tránh can thiệp mạnh trong 1-2 ngày đầu.

- `severeDamage`:

  Dạ nếu hư nặng ngay lúc nhận, anh/chị không nên tự chỉnh nhiều trước. Hãy giữ hiện trạng, chụp ảnh/video và gửi shop để kiểm tra.

### Case: troubleshooting_shifted_layout_after_care

- `caseId`: `troubleshooting_shifted_layout_after_care`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `layout_troubleshooting`
- `intent`: user hỏi bố cục xô lệch sau khi tưới/lau/tỉa, cây bật nhẹ, rêu bung nhẹ.
- `trainingFlow`:
  - `subIntents`:
    - `minorShift`: xô lệch nhẹ sau chăm.
    - `plantLoose`: cây bật gốc nhẹ.
    - `mossLoose`: rêu bung mảng nhỏ.
    - `severeShift`: bố cục đổ/tung nhiều.
  - `mustAnswer`: chỉnh nhẹ bằng nhíp sạch nếu nhẹ; hư nặng gửi ảnh; tránh tưới/xịt mạnh.
  - `askIfNeeded`: hỏi xô nhẹ hay nặng, cây có bật gốc không, bể mới nhận hay do tự chăm.
  - `doNotSay`: không khuyên tháo toàn bộ bố cục.

`keywords`:

  - bố cục xô lệch
  - bo cuc xo lech
  - bể bị lệch
  - be bi lech
  - cây bật gốc
  - cay bat goc
  - rêu bung
  - reu bung
  - rêu lệch
  - reu lech
  - tưới làm lệch
  - tuoi lam lech
  - lau kính bị lệch
  - lau kinh bi lech
  - shifted layout
  - terrarium layout shifted
  - plant loose
  - moss loose
  - be bi xo
  - cay bi bat

`response`:

Dạ nếu bố cục chỉ xô lệch nhẹ sau khi tưới/lau/tỉa, anh/chị có thể chỉnh rất nhẹ bằng nhíp sạch.

Cách làm:
1. Rửa/lau sạch nhíp hoặc dụng cụ nhỏ.
2. Đỡ nhẹ cây/rêu về vị trí cũ, không kéo mạnh.
3. Nếu rêu bung mảng nhỏ, đặt lại nhẹ lên nền ẩm vừa.
4. Không xịt nước mạnh sau khi chỉnh.
5. Nếu cây bật gốc nhiều hoặc bố cục tung nặng, nên gửi ảnh/video cho shop.

Lần sau nên phun sương nhẹ, tránh xịt trực diện mạnh vào cây/rêu.

`responseVariants`:

- `minorShift`:

  Dạ lệch nhẹ thì mình chỉnh bằng nhíp sạch được. Làm từ từ, giữ nền vừa ẩm để rêu/cây bám lại tốt hơn.

- `severeShift`:

  Dạ nếu bố cục đổ nhiều, cây bật gốc hoặc rêu tung mảng lớn, anh/chị gửi ảnh/video trước để shop hướng dẫn, tránh tự tháo toàn bộ.

### Case: troubleshooting_when_to_contact_shop

- `caseId`: `troubleshooting_when_to_contact_shop`
- `group`: `Xử lý Sự cố Cây/Rêu`
- `category`: `support_boundary`
- `intent`: user hỏi khi nào tự xử lý, khi nào cần gửi shop, khi nào bảo hành.
- `trainingFlow`:
  - `subIntents`:
    - `selfCareOk`: sự cố nhẹ tự xử lý được.
    - `sendPhoto`: cần gửi ảnh/video.
    - `warrantyCheck`: liên quan bảo hành/chính sách.
    - `urgentCase`: hư nặng, lan nhanh, mùi hôi, cây chết.
  - `mustAnswer`: nêu ngưỡng tự xử lý và ngưỡng liên hệ shop; không tự kết luận bảo hành trong chatbox.
  - `askIfNeeded`: hỏi thời điểm mua/nhận, triệu chứng, ảnh/video.
  - `doNotSay`: không cam kết đổi/bảo hành khi chưa kiểm tra chính sách và ảnh.

`keywords`:

  - khi nào liên hệ shop
  - khi nao lien he shop
  - có cần gửi shop không
  - co can gui shop khong
  - có cần bảo hành không
  - co can bao hanh khong
  - tự xử lý được không
  - tu xu ly duoc khong
  - gửi ảnh cho shop
  - gui anh cho shop
  - gửi video
  - gui video
  - need support
  - contact shop
  - warranty check
  - send photo
  - can shop xem khong
  - shop kiểm tra
  - shop kiem tra

`response`:

Dạ anh/chị có thể tự xử lý nếu vấn đề nhẹ như:
- Một ít mốc trắng mới xuất hiện.
- Vài lá già vàng.
- Bể hơi khô hoặc hơi ẩm, chưa có mùi.
- Bố cục lệch nhẹ sau khi chăm.

Nên gửi ảnh/video cho shop nếu:
- Mốc lan nhanh, có mùi hôi.
- Cây mềm nhũn, gốc thâm, chết nhanh.
- Rêu vàng/nâu lan rộng.
- Bể vỡ/nứt, xô lệch nặng lúc nhận.
- Vấn đề xuất hiện ngay sau khi nhận bể hoặc liên quan bảo hành.

Trong chatbox, Rêu có thể hướng dẫn kiểm tra và xử lý bước đầu, nhưng kết luận bảo hành/đổi trả cần shop xem ảnh/video và đối chiếu chính sách.

`responseVariants`:

- `selfCareOk`:

  Dạ nếu chỉ là dấu hiệu nhẹ, mình có thể xử lý trước bằng cách chỉnh ánh sáng, giảm/tăng ẩm đúng cách, lấy lá mục/mốc nhỏ ra và theo dõi 1-2 ngày.

- `sendPhoto`:

  Dạ nếu triệu chứng lan nhanh, hư nặng hoặc anh/chị không chắc nguyên nhân, gửi ảnh/video sẽ tốt hơn để shop xem đúng tình trạng thay vì đoán mò.

## Group 8: Kiến thức Terrarium

### Phạm vi group

- Giải thích kiến thức nền về terrarium: terrarium là gì, bể kín/mở khác nhau thế nào, các lớp nền, vòng tuần hoàn nước, ánh sáng, cây/rêu/phụ kiện trong bể.
- Ưu tiên trả lời dễ hiểu, thân thiện, không quá học thuật.
- Nếu user hỏi mua mẫu cụ thể, giá, còn hàng: chuyển Group 5/DB sản phẩm.
- Nếu user hỏi chăm thực tế: chuyển Group 6.
- Nếu user hỏi triệu chứng xấu/mốc/vàng/héo/chết cây: chuyển Group 7.
- Nếu user hỏi làm theo mẫu riêng/chủ đề/size/phong thủy: chuyển Group 9.

### Case: terrarium_what_is_it

- `caseId`: `terrarium_what_is_it`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi terrarium là gì, bể cây/bể rêu/vườn trong lọ là gì.
- `trainingFlow`:
  - `subIntents`:
    - `basicDefinition`: hỏi định nghĩa terrarium.
    - `miniEcosystem`: hỏi hệ sinh thái mini trong lọ/bể kính.
    - `giftDecorContext`: hỏi terrarium dùng để làm gì.
    - `careDifficulty`: hỏi terrarium có khó chăm không.
    - `realPlants`: hỏi cây/rêu trong bể là thật hay giả.
  - `mustAnswer`: terrarium là mô hình cây/rêu trong bể kính/lọ, tạo tiểu cảnh xanh nhỏ; có loại kín/mở; dùng decor/quà tặng/thư giãn.
  - `routeToProductConsult`: nếu user hỏi nên mua bể nào, chuyển Group 5.
  - `doNotSay`: không nói terrarium hoàn toàn không cần chăm.

`keywords`:

  - terrarium là gì
  - terrarium la gi
  - bể terrarium là gì
  - be terrarium la gi
  - bể cây là gì
  - be cay la gi
  - bể rêu là gì
  - be reu la gi
  - vườn trong lọ
  - vuon trong lo
  - hệ sinh thái mini
  - he sinh thai mini
  - tiểu cảnh trong kính
  - tieu canh trong kinh
  - mini garden
  - glass garden
  - what is terrarium
  - terrarium meaning
  - terrarium la cai gi
  - terrarium dùng để làm gì
  - terrarium dung de lam gi
  - terrarium có khó chăm không
  - terrarium co kho cham khong
  - terrarium dễ chăm không
  - terrarium de cham khong
  - cây trong bể thật không
  - cay trong be that khong
  - rêu trong bể thật không
  - reu trong be that khong
  - bể cây decor
  - be cay decor
  - desk terrarium
  - terrarium for desk

`response`:

Dạ **terrarium** là một tiểu cảnh cây/rêu được sắp trong bể kính hoặc lọ kính, giống một “khu vườn mini” để decor, thư giãn hoặc làm quà tặng.

Terrarium thường có:
- Lớp nền/sỏi/đất để giữ cấu trúc và thoát ẩm.
- Rêu/cây nhỏ phù hợp với môi trường trong bể.
- Đá, gỗ, phụ kiện hoặc bố cục tiểu cảnh.

Terrarium có loại **bể kín** và **bể mở**. Bể kín giữ ẩm tốt hơn, hợp rêu/cây ưa ẩm; bể mở thoáng hơn, hợp một số cây cần khô/thoáng như sen đá hoặc xương rồng.

Terrarium vẫn cần chăm đúng cách: đặt nơi sáng gián tiếp, kiểm tra độ ẩm và tránh nắng trực tiếp.

`responseVariants`:

- `miniEcosystem`:

  Dạ có thể hiểu terrarium là một hệ sinh thái mini trong kính. Bên trong có cây/rêu, đất, độ ẩm và ánh sáng phối hợp với nhau để tạo môi trường sống nhỏ.

- `notZeroCare`:

  Dạ terrarium dễ chăm hơn nhiều chậu cây thường, nhưng không phải hoàn toàn “không cần chăm”. Mình vẫn cần đặt đúng ánh sáng, kiểm tra ẩm và xử lý khi có dấu hiệu bất thường.

- `careDifficulty`:

  Dạ terrarium thường khá dễ chăm nếu đặt đúng chỗ: sáng gián tiếp, không nắng gắt, không tưới quá tay. Phần khó nhất là giữ cân bằng ẩm: thiếu ẩm thì rêu/cây khô, dư ẩm thì dễ mốc/úng.

- `realPlantContext`:

  Dạ tùy từng sản phẩm, nhưng nếu là bể cây/rêu thật thì cây và rêu là thành phần sống. Vì vậy bể vẫn cần ánh sáng, độ ẩm phù hợp và quan sát định kỳ.

### Case: terrarium_closed_vs_open

- `caseId`: `terrarium_closed_vs_open`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi bể kín/bể mở khác nhau thế nào, nên chọn loại nào về mặt kiến thức.
- `trainingFlow`:
  - `subIntents`:
    - `closedDefinition`: hỏi bể kín/hệ kín.
    - `openDefinition`: hỏi bể mở/hệ mở.
    - `compareProsCons`: so sánh kín/mở.
    - `plantFit`: loại cây nào hợp kín/mở.
    - `maintenanceDifference`: khác nhau về tưới, mở nắp, độ ẩm.
    - `beginnerChoice`: người mới nên hiểu ưu nhược điểm trước khi chọn.
  - `mustAnswer`: bể kín giữ ẩm, ít tưới hơn, hợp cây/rêu ưa ẩm; bể mở thoáng, khô nhanh hơn, hợp cây cần thoáng.
  - `routeToCare`: nếu hỏi cách chăm/tưới từng loại, chuyển Group 6.
  - `routeToProductConsult`: nếu hỏi nên mua loại nào theo nhu cầu, chuyển Group 5.
  - `doNotSay`: không nói bể kín luôn tốt hơn hoặc bể mở luôn dễ hơn trong mọi trường hợp.

`keywords`:

  - bể kín bể mở
  - be kin be mo
  - bể kín là gì
  - be kin la gi
  - bể mở là gì
  - be mo la gi
  - hệ kín hệ mở
  - he kin he mo
  - closed terrarium
  - open terrarium
  - sealed terrarium
  - open tank
  - kín hay mở
  - kin hay mo
  - nên chọn bể kín hay mở
  - nen chon be kin hay mo
  - be co nap khac be khong nap
  - bể có nắp khác bể không nắp
  - bể có nắp
  - be co nap
  - bể không nắp
  - be khong nap
  - bể nào dễ chăm hơn
  - be nao de cham hon
  - bể nào ít tưới hơn
  - be nao it tuoi hon
  - bể kín có bí không
  - be kin co bi khong
  - bể mở có dễ khô không
  - be mo co de kho khong
  - closed vs open terrarium
  - sealed vs open terrarium

`response`:

Dạ bể kín và bể mở khác nhau chủ yếu ở **độ ẩm và độ thoáng**.

**Bể kín**:
- Giữ ẩm tốt, ít phải tưới hơn.
- Hợp rêu, dương sỉ mini, cẩm nhung và nhóm cây ưa ẩm.
- Cần tránh dư ẩm, kính đọng nước cả ngày hoặc bí khí.

**Bể mở**:
- Thoáng hơn, khô nhanh hơn.
- Cần kiểm tra ẩm thường xuyên hơn.
- Hợp cây cần thoáng hơn, đặc biệt sen đá/xương rồng nên ưu tiên bể mở.

Nếu anh/chị hỏi để chọn mẫu phù hợp nhu cầu/ngân sách/vị trí đặt, Rêu sẽ chuyển sang phần tư vấn sản phẩm để lọc theo DB.

`responseVariants`:

- `closedSimple`:

  Dạ bể kín giống một môi trường giữ ẩm nhỏ. Vì có nắp nên nước bay hơi rồi ngưng tụ lại, giúp bể ít cần tưới hơn nhưng phải tránh bị quá ẩm.

- `openSimple`:

  Dạ bể mở thoáng hơn nên khô nhanh hơn. Mình dễ can thiệp hơn, nhưng cũng cần kiểm tra ẩm thường xuyên hơn bể kín.

- `beginnerChoice`:

  Dạ với người mới, không có loại nào “luôn dễ hơn”. Bể kín ít tưới hơn nhưng phải tránh dư ẩm; bể mở dễ quan sát/can thiệp hơn nhưng khô nhanh hơn. Nếu anh/chị muốn chọn mẫu cụ thể, Rêu sẽ lọc theo nhu cầu và vị trí đặt.

- `maintenanceDifference`:

  Dạ chăm khác nhau chủ yếu ở nước: bể kín tưới rất ít và theo dõi sương/kính; bể mở kiểm tra mặt nền/rêu thường xuyên hơn vì thoát ẩm nhanh.

### Case: terrarium_layers_explained

- `caseId`: `terrarium_layers_explained`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi các lớp trong terrarium để làm gì: sỏi, than hoạt tính, đất, rêu.
- `trainingFlow`:
  - `subIntents`:
    - `drainageLayer`: lớp sỏi/đáy.
    - `charcoalLayer`: than hoạt tính.
    - `soilLayer`: đất/nền trồng.
    - `mossLayer`: rêu trang trí/giữ ẩm.
    - `layerOrder`: thứ tự các lớp.
    - `mandatoryLayer`: hỏi lớp nào bắt buộc/không bắt buộc.
    - `noDrainHole`: hỏi vì sao cần lớp thoát nước khi bể không có lỗ.
  - `mustAnswer`: giải thích từng lớp theo chức năng; không biến thành hướng dẫn DIY quá chi tiết nếu user chỉ hỏi kiến thức.
  - `routeToDiy`: nếu user hỏi tự làm chi tiết, chuyển `terrarium_diy_basic`.
  - `doNotSay`: không nói lớp nào cũng bắt buộc tuyệt đối cho mọi thiết kế.

`keywords`:

  - lớp nền terrarium
  - lop nen terrarium
  - các lớp trong bể
  - cac lop trong be
  - sỏi để làm gì
  - soi de lam gi
  - than hoạt tính
  - than hoat tinh
  - đất terrarium
  - dat terrarium
  - lớp sỏi
  - lop soi
  - lớp than
  - lop than
  - drainage layer
  - activated charcoal
  - terrarium layers
  - substrate layer
  - be co nhung lop nao
  - bể có những lớp nào
  - thứ tự lớp nền
  - thu tu lop nen
  - sỏi có bắt buộc không
  - soi co bat buoc khong
  - than có bắt buộc không
  - than co bat buoc khong
  - có cần than hoạt tính không
  - co can than hoat tinh khong
  - bể không có lỗ thoát nước
  - be khong co lo thoat nuoc
  - why charcoal in terrarium
  - why drainage layer
  - terrarium substrate

`response`:

Dạ các lớp trong terrarium thường có vai trò khác nhau:

- **Lớp sỏi/đá nhỏ dưới đáy**: tạo khoảng thoát nước, hạn chế nền bị sũng.
- **Than hoạt tính**: hỗ trợ giảm mùi, giữ môi trường sạch hơn ở mức cơ bản.
- **Lớp đất/nền trồng**: nơi cây bám rễ và lấy ẩm.
- **Rêu/lớp phủ mặt**: giữ ẩm nhẹ, tạo cảm giác xanh tự nhiên và hoàn thiện bố cục.
- **Đá/gỗ/phụ kiện**: tạo cảnh quan và điểm nhấn.

Tùy kiểu bể và loại cây, cấu trúc lớp có thể thay đổi. Bể kín ưa ẩm sẽ khác bể mở cho sen đá/xương rồng.

`responseVariants`:

- `charcoalSimple`:

  Dạ than hoạt tính không phải “thuốc thần”, nhưng có thể hỗ trợ giảm mùi và giữ nền sạch hơn trong môi trường kính nhỏ.

- `drainageSimple`:

  Dạ lớp sỏi dưới đáy giúp nước dư không nằm trực tiếp quanh rễ quá lâu. Tuy vậy mình vẫn phải tưới ít, vì terrarium không có lỗ thoát nước như chậu thường.

- `mandatoryLayer`:

  Dạ không phải thiết kế nào cũng giống nhau 100%. Nhưng với terrarium cơ bản, lớp đáy/nền phù hợp rất quan trọng vì bể thường không có lỗ thoát nước. Nếu thiếu lớp thoát ẩm mà tưới nhiều, nền dễ sũng và cây dễ úng.

- `layerOrder`:

  Dạ thứ tự phổ biến là đá/sỏi dưới đáy, than hoạt tính nếu dùng, lớp đất/nền, rồi tới cây/rêu và phụ kiện. Tùy loại bể/cây, shop hoặc người setup có thể điều chỉnh cho phù hợp.

### Case: terrarium_water_cycle_closed

- `caseId`: `terrarium_water_cycle_closed`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi bể kín tự tuần hoàn nước thế nào, vì sao ít tưới, sương/ngưng tụ là gì.
- `trainingFlow`:
  - `subIntents`:
    - `waterCycle`: vòng tuần hoàn nước trong bể kín.
    - `condensation`: hơi sương/ngưng tụ trên kính.
    - `lessWatering`: vì sao bể kín ít tưới hơn.
    - `tooMuchCondensationBoundary`: khi nào sương là quá nhiều.
    - `noCondensation`: bể kín không có sương có sao không.
    - `sealedTooLong`: hỏi bể kín đóng lâu có bí/chết không.
  - `mustAnswer`: nước bay hơi -> ngưng tụ -> rơi lại nền; sương nhẹ bình thường; đọng nước cả ngày chuyển Group 7.
  - `routeToCare`: nếu hỏi mở nắp/tưới, chuyển Group 6.
  - `routeToTroubleshooting`: nếu kính ướt cả ngày/mốc/mùi, chuyển Group 7.
  - `doNotSay`: không nói bể kín tự sống mãi không cần kiểm tra.

`keywords`:

  - bể kín tuần hoàn
  - be kin tuan hoan
  - tự tuần hoàn nước
  - tu tuan hoan nuoc
  - bể kín ít tưới
  - be kin it tuoi
  - hơi nước trong bể
  - hoi nuoc trong be
  - sương trên kính
  - suong tren kinh
  - ngưng tụ
  - ngung tu
  - condensation cycle
  - closed terrarium water cycle
  - self watering terrarium
  - water cycle terrarium
  - be kin tu song
  - bể kín tự sống
  - bể kín không có sương
  - be kin khong co suong
  - bể kín hết sương
  - be kin het suong
  - bể kín đóng lâu
  - be kin dong lau
  - bể kín có bí không
  - be kin co bi khong
  - vì sao bể kín ít tưới
  - vi sao be kin it tuoi
  - no mist closed terrarium
  - sealed jar condensation

`response`:

Dạ bể kín ít cần tưới hơn vì bên trong có một vòng tuần hoàn nước nhỏ.

Cách hiểu đơn giản:
1. Nước trong đất/rêu bay hơi.
2. Hơi nước gặp thành kính mát hơn và ngưng tụ thành sương/giọt nhỏ.
3. Nước rơi lại xuống nền, tiếp tục giữ ẩm cho cây/rêu.

Vì vậy bể kín thường không cần tưới thường xuyên như chậu cây thường. Tuy nhiên vẫn cần kiểm tra:
- Sương nhẹ buổi sáng: thường bình thường.
- Kính ướt cả ngày, giọt nước chảy liên tục: có thể dư ẩm.
- Có mốc/mùi/lá vàng mềm: chuyển sang xử lý sự cố.

`responseVariants`:

- `notForever`:

  Dạ bể kín có vòng tuần hoàn ẩm, nhưng không có nghĩa là tự sống mãi mà không cần quan sát. Mình vẫn cần kiểm tra ánh sáng, độ ẩm và tình trạng cây/rêu.

- `condensationNormal`:

  Dạ sương nhẹ trên kính là dấu hiệu bể đang có độ ẩm. Chỉ khi kính ướt đặc cả ngày hoặc kèm mốc/mùi thì mới cần xử lý dư ẩm.

- `noCondensation`:

  Dạ bể kín không có sương chưa chắc là thiếu nước ngay. Anh/chị nên kiểm tra mặt rêu/đất: nếu vẫn ẩm thì chưa cần tưới; nếu khô rõ thì phun sương rất nhẹ.

- `sealedTooLong`:

  Dạ bể kín có thể đóng nắp lâu nếu độ ẩm cân bằng. Nhưng nếu kính ướt cả ngày, có mùi, mốc hoặc lá vàng mềm thì cần mở thoáng và xử lý dư ẩm.

### Case: terrarium_no_direct_sun_reason

- `caseId`: `terrarium_no_direct_sun_reason`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi vì sao không được để terrarium dưới nắng trực tiếp.
- `trainingFlow`:
  - `subIntents`:
    - `glassHeat`: kính hấp nhiệt.
    - `plantBurn`: cháy lá/sốc nhiệt.
    - `mossYellow`: rêu vàng do nóng/nắng.
    - `safeLight`: ánh sáng phù hợp.
    - `morningSunQuestion`: hỏi nắng sáng/nắng nhẹ có được không.
    - `lightVsSun`: phân biệt sáng và nắng trực tiếp.
  - `mustAnswer`: kính làm nhiệt tăng nhanh; nắng trực tiếp gây sốc nhiệt, cháy lá, rêu vàng; dùng ánh sáng gián tiếp.
  - `routeToTroubleshooting`: nếu đã héo/cháy/rêu vàng, chuyển Group 7.
  - `doNotSay`: không khuyên phơi nắng để diệt mốc hoặc làm cây khỏe.

`keywords`:

  - vì sao không để nắng
  - vi sao khong de nang
  - terrarium có cần nắng không
  - terrarium co can nang khong
  - để nắng trực tiếp
  - de nang truc tiep
  - nắng chiếu vào kính
  - nang chieu vao kinh
  - bể kính bị nóng
  - be kinh bi nong
  - direct sunlight terrarium
  - why no direct sun
  - terrarium sunlight
  - glass heat
  - phoi nang terrarium
  - phơi nắng terrarium
  - có cần phơi nắng không
  - co can phoi nang khong
  - nắng sáng được không
  - nang sang duoc khong
  - nắng nhẹ được không
  - nang nhe duoc khong
  - để gần cửa sổ nắng
  - de gan cua so nang
  - sáng khác nắng không
  - sang khac nang khong
  - indirect light vs sunlight
  - morning sun terrarium

`response`:

Dạ terrarium không nên để dưới nắng trực tiếp vì bể kính có thể **hấp nhiệt rất nhanh**.

Khi nắng chiếu vào kính:
- Nhiệt bên trong bể có thể cao hơn nhiệt phòng.
- Cây dễ héo, cháy lá hoặc sốc nhiệt.
- Rêu dễ vàng/nâu, mất xanh.
- Bể kín có thể đọng ẩm nóng, làm môi trường bí và dễ mốc.

Ánh sáng phù hợp hơn là **ánh sáng gián tiếp**: gần cửa sổ có rèm, bàn/kệ sáng nhẹ, hoặc dùng đèn hỗ trợ nếu phòng tối.

`responseVariants`:

- `sunburnBoundary`:

  Dạ nếu bể đã bị nắng làm héo/cháy lá/rêu vàng, đó là sự cố. Anh/chị dời bể ngay vào nơi sáng gián tiếp và xử lý theo triệu chứng ở Group 7.

- `morningLight`:

  Dạ nắng rất nhẹ buổi sáng có thể đỡ gắt hơn, nhưng với bể kính vẫn nên cẩn thận. An toàn nhất là ánh sáng tán xạ/gián tiếp.

- `lightVsSun`:

  Dạ terrarium cần **sáng**, nhưng không nên bị **nắng chiếu trực tiếp**. Sáng gián tiếp là phòng/kệ/bàn đủ sáng để cây quang hợp nhẹ, còn nắng trực tiếp là tia nắng hắt thẳng vào kính làm bể nóng lên.

- `windowPlacement`:

  Dạ đặt gần cửa sổ được nếu có rèm hoặc ánh sáng tán xạ. Nếu nắng chiếu thẳng vào bể, nên lùi bể vào trong hoặc đổi vị trí.

### Case: terrarium_plants_suitable

- `caseId`: `terrarium_plants_suitable`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi cây nào hợp terrarium, cây nào không nên dùng, cây ưa ẩm/ưa khô.
- `trainingFlow`:
  - `subIntents`:
    - `closedPlants`: cây hợp bể kín.
    - `openPlants`: cây hợp bể mở.
    - `avoidPlants`: cây không nên cho vào bể kín.
    - `succulentCactus`: sen đá/xương rồng trong terrarium.
    - `mixingPlants`: hỏi có trộn cây ưa ẩm và ưa khô được không.
    - `plantSize`: cây lớn/cây phát triển nhanh có hợp không.
  - `mustAnswer`: cây hợp tùy bể kín/mở; rêu/cẩm nhung/dương sỉ mini hợp ẩm; sen đá/xương rồng ưu tiên bể mở.
  - `routeToProductConsult`: nếu user hỏi chọn mẫu/cây cụ thể shop có bán, chuyển Group 5/DB.
  - `doNotSay`: không nói cây nào cũng trồng được trong bể kín.

`keywords`:

  - cây nào hợp terrarium
  - cay nao hop terrarium
  - cây trồng trong terrarium
  - cay trong trong terrarium
  - cây hợp bể kín
  - cay hop be kin
  - cây hợp bể mở
  - cay hop be mo
  - cây ưa ẩm
  - cay ua am
  - cây ưa khô
  - cay ua kho
  - plants for terrarium
  - best terrarium plants
  - closed terrarium plants
  - open terrarium plants
  - sen đá trong terrarium
  - sen da trong terrarium
  - xương rồng trong terrarium
  - xuong rong trong terrarium
  - cây nào không hợp terrarium
  - cay nao khong hop terrarium
  - trộn sen đá với rêu
  - tron sen da voi reu
  - sen đá chung với rêu
  - sen da chung voi reu
  - cây lớn trong bể
  - cay lon trong be
  - cây phát triển nhanh
  - cay phat trien nhanh
  - can mix succulents and moss
  - plants to avoid terrarium

`response`:

Dạ cây hợp terrarium phụ thuộc bể kín hay bể mở.

**Bể kín/ẩm** thường hợp:
- Rêu.
- Cẩm nhung.
- Dương sỉ mini.
- Một số cây lá nhỏ ưa ẩm, chịu sáng gián tiếp.

**Bể mở/thoáng** thường hợp:
- Sen đá.
- Xương rồng.
- Một số cây cần nền khô nhanh và ánh sáng tốt hơn.

Không nên đưa cây ưa khô vào bể kín ẩm lâu, vì dễ úng/thối gốc. Ngược lại, cây/rêu ưa ẩm đặt trong bể mở hoặc phòng máy lạnh có thể khô nhanh hơn.

Nếu anh/chị muốn chọn sản phẩm cụ thể đang có sẵn, Rêu sẽ lọc theo DB sản phẩm.

`responseVariants`:

- `closedPlants`:

  Dạ bể kín hợp nhóm cây/rêu thích ẩm, lá nhỏ, chịu ánh sáng gián tiếp. Ví dụ rêu, cẩm nhung, dương sỉ mini.

- `succulentCactus`:

  Dạ sen đá/xương rồng vẫn có thể dùng trong terrarium, nhưng nên ưu tiên bể mở vì cần thoáng và khô nhanh hơn bể rêu kín.

- `mixingPlants`:

  Dạ không nên trộn cây có nhu cầu quá khác nhau trong cùng một bể. Ví dụ rêu/cẩm nhung thích ẩm, còn sen đá/xương rồng thích thoáng và khô hơn; trộn chung sẽ khó chăm ổn định.

- `avoidPlants`:

  Dạ nên tránh cây phát triển quá nhanh, lá quá lớn hoặc cây cần nắng gắt trong bể nhỏ. Những cây này dễ phá bố cục, chạm kính hoặc không hợp độ ẩm trong terrarium.

### Case: terrarium_moss_role

- `caseId`: `terrarium_moss_role`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi rêu trong terrarium để làm gì, rêu có phải cây chính không, rêu sống thế nào.
- `trainingFlow`:
  - `subIntents`:
    - `mossFunction`: rêu làm đẹp/giữ ẩm/phủ nền.
    - `mossCareBasic`: rêu cần ẩm và sáng gián tiếp.
    - `mossNotGrass`: rêu khác cỏ/cây lá.
    - `mossTypes`: hỏi có nhiều loại rêu không.
    - `mossFakeBoundary`: hỏi rêu thật/giả trong sản phẩm cụ thể.
  - `mustAnswer`: rêu giúp phủ nền, giữ ẩm nhẹ, tạo cảm giác tự nhiên; cần ẩm vừa, tránh nắng/nóng/dư ẩm bí.
  - `routeToCare`: nếu hỏi chăm rêu, chuyển Group 6.
  - `routeToTroubleshooting`: nếu hỏi rêu vàng/mốc/khô nâu, chuyển Group 7.
  - `doNotSay`: không nói rêu chỉ là trang trí giả.

`keywords`:

  - rêu để làm gì
  - reu de lam gi
  - rêu trong terrarium
  - reu trong terrarium
  - rêu có sống không
  - reu co song khong
  - rêu thật hay giả
  - reu that hay gia
  - moss in terrarium
  - what does moss do
  - live moss
  - moss role
  - reu co can tuoi khong
  - rêu có cần tưới không
  - rêu có phải cỏ không
  - reu co phai co khong
  - rêu có rễ không
  - reu co re khong
  - rêu giữ ẩm
  - reu giu am
  - các loại rêu
  - cac loai reu
  - moss types
  - moss vs grass
  - preserved moss

`response`:

Dạ rêu trong terrarium thường có vài vai trò:

- Phủ nền, giúp bể nhìn xanh và tự nhiên hơn.
- Giữ ẩm nhẹ cho bề mặt.
- Tạo cảm giác “rừng mini” hoặc thảm xanh.
- Hỗ trợ bố cục mềm hơn giữa đá, gỗ và cây.

Nếu là rêu thật, rêu vẫn cần môi trường phù hợp: sáng gián tiếp, ẩm vừa, tránh nắng trực tiếp và tránh bị bí nóng. Rêu quá khô có thể nâu/giòn; quá ẩm bí có thể vàng/mốc.

`responseVariants`:

- `mossCareBoundary`:

  Dạ nếu anh/chị hỏi rêu vàng, rêu khô nâu hoặc rêu mốc thì đó là xử lý sự cố, Rêu sẽ chuyển sang Group 7 để phân biệt nguyên nhân.

- `liveMoss`:

  Dạ nếu bể dùng rêu thật thì rêu là thành phần sống, không chỉ là decor. Vì vậy cần ánh sáng và độ ẩm phù hợp.

- `mossNotGrass`:

  Dạ rêu khác cỏ/cây lá thông thường. Rêu thường phủ bề mặt, thích ẩm nhẹ và không cần chăm theo kiểu tưới đẫm như chậu cây.

- `mossFakeBoundary`:

  Dạ nếu anh/chị hỏi một sản phẩm cụ thể dùng rêu thật hay rêu bảo quản/giả, Rêu nên kiểm tra DB sản phẩm hoặc để shop xác nhận, không đoán theo ảnh.

### Case: terrarium_springtails_isopods

- `caseId`: `terrarium_springtails_isopods`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi springtails/isopods/bọ nhảy/cuốn chiếu nhỏ trong terrarium có tác dụng gì.
- `trainingFlow`:
  - `subIntents`:
    - `springtailsRole`: bọ nhảy/springtails giúp ăn mốc/vật hữu cơ mục.
    - `isopodsRole`: isopods/cuốn chiếu nhỏ như đội dọn nền trong bioactive setup.
    - `shopBoundary`: shop có dùng không thì cần kiểm tra theo sản phẩm cụ thể.
    - `pestBoundary`: nếu user thấy côn trùng lạ trong bể, chuyển Group 7.
    - `beneficialVsPest`: phân biệt sinh vật có lợi với côn trùng gây phiền.
    - `addCleanupCrew`: hỏi có nên tự thả thêm vào bể không.
  - `mustAnswer`: giải thích trung tính; không khẳng định mọi bể shop đều có springtails/isopods nếu DB chưa có.
  - `routeToTroubleshooting`: nếu user đang gặp bọ/côn trùng không rõ, chuyển Group 7.
  - `doNotSay`: không bảo khách tự thả sinh vật vào bể nếu chưa hiểu hệ bể.

`keywords`:

  - springtails
  - bọ nhảy
  - bo nhay
  - isopods
  - cuốn chiếu
  - cuon chieu
  - bọ dọn bể
  - bo don be
  - bioactive terrarium
  - cleanup crew
  - sinh vật trong bể
  - sinh vat trong be
  - con nhỏ trong bể
  - con nho trong be
  - terrarium bugs
  - isopod terrarium
  - springtail terrarium
  - bọ có lợi
  - bo co loi
  - bọ trong bể có sao không
  - bo trong be co sao khong
  - có nên thả bọ nhảy
  - co nen tha bo nhay
  - thả springtails
  - tha springtails
  - thả isopods
  - tha isopods
  - beneficial bugs terrarium
  - add springtails terrarium
  - cleanup crew terrarium

`response`:

Dạ trong một số terrarium kiểu bioactive, người ta có thể dùng **springtails/bọ nhảy** hoặc **isopods** như “đội dọn nền”.

Vai trò thường là:
- Ăn mốc nhẹ, lá mục hoặc chất hữu cơ phân hủy.
- Hỗ trợ nền sạch hơn.
- Giúp hệ bể cân bằng hơn nếu được setup đúng.

Tuy nhiên không phải bể nào cũng cần hoặc cũng có các sinh vật này. Với sản phẩm cụ thể của shop, Rêu không nên tự khẳng định có/không nếu DB sản phẩm chưa ghi rõ.

Nếu anh/chị đang thấy côn trùng lạ trong bể và không biết có hại không, đó là tình huống xử lý sự cố ở Group 7.

`responseVariants`:

- `doNotAddRandomly`:

  Dạ mình không nên tự thả sinh vật vào bể nếu chưa rõ loại bể, độ ẩm và cây bên trong. Thả sai có thể làm hệ bể mất cân bằng.

- `pestBoundary`:

  Dạ nếu anh/chị thấy bọ lạ xuất hiện ngoài ý muốn, Rêu cần xem đó là bọ bay/bò, số lượng nhiều không và có mốc/lá mục không để xử lý theo Group 7.

- `beneficialVsPest`:

  Dạ không phải sinh vật nhỏ nào trong bể cũng xấu. Một số setup chủ động dùng bọ nhảy/isopods để dọn mốc/lá mục. Nhưng nếu côn trùng xuất hiện ngoài ý muốn, bay nhiều, bò nhiều hoặc làm cây hư thì nên xem như sự cố.

- `shopBoundary`:

  Dạ với sản phẩm cụ thể của Tiệm Rêu, Rêu không nên tự nói bể có springtails/isopods nếu dữ liệu sản phẩm chưa ghi rõ. Trường hợp này nên kiểm tra mô tả sản phẩm hoặc hỏi shop.

### Case: terrarium_diy_basic

- `caseId`: `terrarium_diy_basic`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi tự làm terrarium cơ bản, DIY terrarium, cần chuẩn bị gì.
- `trainingFlow`:
  - `subIntents`:
    - `materials`: cần chuẩn bị bể, sỏi, than, đất, cây/rêu, dụng cụ.
    - `basicSteps`: các bước tổng quan.
    - `beginnerWarning`: lưu ý người mới.
    - `customBoundary`: nếu muốn shop làm theo mẫu, chuyển Group 9.
    - `closedDiy`: tự làm bể kín.
    - `openDiy`: tự làm bể mở.
    - `commonMistakes`: lỗi DIY hay gặp.
    - `toolsNeeded`: dụng cụ cần có.
  - `mustAnswer`: hướng dẫn tổng quan, an toàn; không thay thế tư vấn custom chi tiết; nhắc chọn cây theo bể kín/mở.
  - `routeToCustom`: nếu user muốn shop làm theo yêu cầu, chuyển Group 9.
  - `doNotSay`: không đưa hướng dẫn quá chắc cho mọi loại cây/nền.

`keywords`:

  - tự làm terrarium
  - tu lam terrarium
  - diy terrarium
  - làm terrarium
  - lam terrarium
  - cách làm bể terrarium
  - cach lam be terrarium
  - cần gì để làm terrarium
  - can gi de lam terrarium
  - nguyên liệu terrarium
  - nguyen lieu terrarium
  - terrarium kit
  - kit terrarium
  - make terrarium
  - build terrarium
  - tu setup be
  - tự setup bể
  - tự làm bể kín
  - tu lam be kin
  - tự làm bể mở
  - tu lam be mo
  - làm bể rêu
  - lam be reu
  - setup bể rêu
  - setup be reu
  - dụng cụ làm terrarium
  - dung cu lam terrarium
  - lỗi khi làm terrarium
  - loi khi lam terrarium
  - diy closed terrarium
  - diy open terrarium
  - terrarium supplies

`response`:

Dạ để tự làm terrarium cơ bản, anh/chị thường cần:

- Bể/lọ kính phù hợp.
- Sỏi/đá nhỏ cho lớp đáy.
- Than hoạt tính nếu dùng cho setup nền.
- Đất/nền phù hợp loại cây.
- Cây/rêu theo kiểu bể kín hoặc bể mở.
- Nhíp, bình phun sương, khăn lau kính.
- Đá/gỗ/phụ kiện nếu muốn tạo bố cục.

Các bước tổng quan:
1. Làm sạch bể.
2. Tạo lớp đáy và nền.
3. Đặt cây/rêu theo bố cục.
4. Phun sương nhẹ để ổn định độ ẩm.
5. Đặt nơi sáng gián tiếp và theo dõi vài ngày đầu.

Lưu ý quan trọng: bể kín hợp cây/rêu ưa ẩm; sen đá/xương rồng nên ưu tiên bể mở. Nếu anh/chị muốn shop làm theo chủ đề/size/mẫu riêng, Rêu sẽ chuyển sang Group 9 custom.

`responseVariants`:

- `beginnerWarning`:

  Dạ người mới nên bắt đầu với bố cục đơn giản, ít loại cây và cây có nhu cầu giống nhau. Trộn cây ưa ẩm với cây ưa khô trong cùng bể rất dễ khó chăm.

- `customBoundary`:

  Dạ nếu anh/chị muốn làm theo mẫu riêng nhưng không muốn tự setup, phần đó nên chuyển sang custom theo yêu cầu để shop tư vấn kích thước, cây và thời gian làm.

- `commonMistakes`:

  Dạ lỗi DIY hay gặp là chọn cây không cùng nhu cầu, tưới quá nhiều, đặt nắng trực tiếp, nền không thoát ẩm tốt hoặc dùng bể quá nhỏ cho cây phát triển nhanh.

- `closedDiy`:

  Dạ nếu tự làm bể kín, anh/chị nên ưu tiên cây/rêu ưa ẩm, ánh sáng gián tiếp và tưới rất ít sau khi setup. Bể kín dễ dư ẩm hơn thiếu ẩm nên cần quan sát sương/kính.

- `openDiy`:

  Dạ nếu tự làm bể mở, mình có thể chọn cây cần thoáng hơn, nhưng phải kiểm tra ẩm thường xuyên hơn vì bể mở khô nhanh.

### Case: terrarium_vs_potted_plant

- `caseId`: `terrarium_vs_potted_plant`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi terrarium khác chậu cây thường, hồ cá/aquarium, bonsai, tiểu cảnh thế nào.
- `trainingFlow`:
  - `subIntents`:
    - `vsPottedPlant`: khác chậu cây thường.
    - `vsAquarium`: khác hồ cá/aquarium.
    - `decorUse`: dùng decor hơn là trồng cây năng suất.
    - `vsPaludarium`: khác paludarium/bán cạn.
    - `careDifference`: khác cách tưới/chăm.
    - `giftDecor`: khác ở giá trị decor/quà tặng.
  - `mustAnswer`: terrarium là tiểu cảnh cây trong kính, giữ ẩm khác chậu cây; không phải hồ cá nếu không có nước/cá; chăm theo hệ kín/mở.
  - `doNotSay`: không đánh đồng terrarium với aquarium.

`keywords`:

  - terrarium khác chậu cây
  - terrarium khac chau cay
  - khác chậu cây thường
  - khac chau cay thuong
  - terrarium khác aquarium
  - terrarium khac aquarium
  - terrarium và aquarium
  - terrarium va aquarium
  - terrarium có phải hồ cá không
  - terrarium co phai ho ca khong
  - terrarium vs potted plant
  - terrarium vs aquarium
  - glass plant vs pot plant
  - be cay khac chau cay
  - bể cây khác chậu cây
  - terrarium khác paludarium
  - terrarium khac paludarium
  - paludarium là gì
  - paludarium la gi
  - terrarium có nước không
  - terrarium co nuoc khong
  - khác bonsai không
  - khac bonsai khong
  - khác tiểu cảnh không
  - khac tieu canh khong
  - terrarium vs paludarium
  - terrarium vs bonsai

`response`:

Dạ terrarium khác chậu cây thường ở chỗ cây/rêu được đặt trong **không gian kính** với độ ẩm và bố cục tiểu cảnh riêng.

So sánh nhanh:
- **Chậu cây thường**: thường có lỗ thoát nước, đất thoáng hơn, tưới theo kiểu chậu.
- **Terrarium**: thường không có lỗ thoát nước, cần tưới ít và kiểm tra độ ẩm kỹ hơn.
- **Aquarium/hồ cá**: là môi trường nước cho cá/thủy sinh; terrarium thường là tiểu cảnh cây trên cạn trong kính.

Vì vậy terrarium cần chăm theo nguyên tắc riêng: ánh sáng gián tiếp, tránh nắng trực tiếp, tưới/phun sương vừa đủ.

`responseVariants`:

- `vsPottedPlant`:

  Dạ chậu cây thường thoát nước tốt hơn, còn terrarium giữ ẩm trong kính nên dễ dư nước nếu tưới như chậu cây.

- `vsAquarium`:

  Dạ terrarium không phải hồ cá. Nếu có nước/cá/thủy sinh thì đó là hướng aquarium/paludarium khác, không nên chăm giống bể rêu trên cạn.

- `vsPaludarium`:

  Dạ paludarium thường là dạng bán cạn, có cả phần nước và phần cây trên cạn. Terrarium của shop thường được hiểu là bể cây/rêu trên cạn trong kính, nên cách chăm sẽ khác bể có nước.

- `careDifference`:

  Dạ điểm khác lớn nhất là nước. Chậu cây thường có lỗ thoát nước, còn terrarium thường giữ ẩm trong kính nên cần tưới ít hơn và kiểm tra kỹ hơn.

### Case: terrarium_common_myths

- `caseId`: `terrarium_common_myths`
- `group`: `Kiến thức Terrarium`
- `category`: `terrarium_knowledge`
- `intent`: user hỏi hoặc tin các hiểu nhầm: không cần chăm, tưới mỗi ngày, phơi nắng, bể kín không bao giờ hư.
- `trainingFlow`:
  - `subIntents`:
    - `zeroCareMyth`: terrarium không cần chăm.
    - `dailyWaterMyth`: phải tưới mỗi ngày.
    - `sunMyth`: cây cần phơi nắng trực tiếp.
    - `sealedForeverMyth`: bể kín tự sống mãi.
    - `allPlantsFitMyth`: cây nào cũng cho vào bể được.
    - `moldMeansDeadMyth`: thấy mốc là bể hỏng hẳn.
    - `moreWaterBetterMyth`: tưới nhiều thì cây càng xanh.
  - `mustAnswer`: chỉnh hiểu lầm nhẹ nhàng; terrarium dễ chăm nhưng cần đúng ánh sáng/ẩm; không tưới mỗi ngày; không phơi nắng trực tiếp.
  - `routeToCare`: nếu user hỏi cách chăm cụ thể, chuyển Group 6.
  - `doNotSay`: không phản bác gay gắt.

`keywords`:

  - terrarium không cần chăm
  - terrarium khong can cham
  - bể tự sống
  - be tu song
  - bể kín không cần tưới
  - be kin khong can tuoi
  - tưới mỗi ngày
  - tuoi moi ngay
  - phơi nắng cho khỏe
  - phoi nang cho khoe
  - terrarium myths
  - zero care terrarium
  - self sustaining terrarium
  - water every day terrarium
  - be kin tu song mai
  - bể kín tự sống mãi
  - cây nào cũng trồng được
  - cay nao cung trong duoc
  - cây nào cũng bỏ vào bể được
  - cay nao cung bo vao be duoc
  - mốc là hỏng bể
  - moc la hong be
  - có mốc là bỏ luôn
  - co moc la bo luon
  - tưới nhiều cho xanh
  - tuoi nhieu cho xanh
  - càng ẩm càng tốt
  - cang am cang tot
  - terrarium misconceptions
  - terrarium mistakes

`response`:

Dạ có vài hiểu nhầm khá thường gặp về terrarium:

- **“Terrarium không cần chăm”**: chưa đúng. Bể dễ chăm hơn, nhưng vẫn cần ánh sáng và độ ẩm phù hợp.
- **“Tưới mỗi ngày cho xanh”**: thường sai, nhất là bể kín vì dễ dư ẩm/mốc/úng.
- **“Cây cần phơi nắng trực tiếp”**: với bể kính rất rủi ro vì dễ hấp nhiệt, cháy lá, rêu vàng.
- **“Bể kín tự sống mãi”**: bể kín có vòng tuần hoàn ẩm, nhưng vẫn cần quan sát và xử lý khi mất cân bằng.

Nguyên tắc an toàn là: sáng gián tiếp, tưới ít nhưng đúng lúc, kiểm tra độ ẩm thực tế và tránh can thiệp quá tay.

`responseVariants`:

- `zeroCareMyth`:

  Dạ mình có thể xem terrarium là “dễ chăm”, nhưng không phải “bỏ quên hoàn toàn”. Chỉ cần đặt sai nắng hoặc tưới quá nhiều là bể vẫn có thể gặp vấn đề.

- `dailyWaterMyth`:

  Dạ tưới mỗi ngày thường không phù hợp với terrarium, đặc biệt bể kín. Mình nên kiểm tra nền/rêu trước rồi mới phun sương nhẹ khi cần.

- `allPlantsFitMyth`:

  Dạ không phải cây nào cũng hợp terrarium. Cây ưa ẩm hợp bể kín hơn, còn sen đá/xương rồng cần thoáng và khô hơn nên ưu tiên bể mở.

- `moldMeansDeadMyth`:

  Dạ thấy một ít mốc trắng không có nghĩa là bể hỏng hoàn toàn. Nếu mốc nhẹ, mình có thể giảm ẩm, gắp bỏ phần mốc/lá mục và theo dõi. Nếu mốc lan nhanh hoặc có mùi thì chuyển xử lý sự cố.

- `moreWaterBetterMyth`:

  Dạ terrarium không phải càng ẩm càng tốt. Dư ẩm là nguyên nhân lớn gây mốc, vàng lá và úng rễ. Mình nên giữ ẩm vừa, không để nền sũng.

## Group 9: Custom Theo Yêu Cầu

### Phạm vi group

- Xử lý các câu hỏi về đặt terrarium theo yêu cầu: mẫu riêng, size riêng, chủ đề, phong thủy, quà tặng, doanh nghiệp, ngân sách, ảnh tham khảo.
- Chatbox được phép thu thập nhu cầu, gợi ý thông tin cần gửi, giải thích quy trình ở mức tổng quan.
- Chatbox không tự chốt báo giá, không tự nhận cọc, không tự cam kết ngày giao chính xác nếu chưa có xác nhận từ shop.
- Nếu user hỏi giá/tồn kho sản phẩm có sẵn: chuyển DB/Group 5.
- Nếu user hỏi chăm sau khi nhận bể custom: chuyển Group 6.
- Nếu user báo lỗi/hư sau khi nhận: chuyển Group 7 hoặc Group 2 tùy chính sách.

### Tổng quan case Group 9

Group 9 nên có **14 case chính**:

1. `custom_general_request`: hỏi shop có nhận custom/làm theo yêu cầu không.
2. `custom_process_flow`: quy trình đặt custom từ trao đổi đến nhận bể.
3. `custom_required_info`: khách cần cung cấp thông tin gì.
4. `custom_budget_quote`: ngân sách, khoảng giá, báo giá.
5. `custom_size_shape`: size, hình dáng bể, vị trí đặt.
6. `custom_theme_concept`: chủ đề/concept/mood/style.
7. `custom_reference_image`: gửi ảnh mẫu, làm giống ảnh, ảnh Pinterest/Instagram.
8. `custom_phong_thuy_meaning`: phong thủy, tài lộc, mệnh, ý nghĩa quà tặng.
9. `custom_plant_material_selection`: chọn cây/rêu/phụ kiện, độ dễ chăm.
10. `custom_timeline_complexity`: thời gian làm, đặt trước, gấp.
11. `custom_deposit_payment_boundary`: đặt cọc/thanh toán custom.
12. `custom_change_cancel_after_confirm`: đổi ý, sửa mẫu, hủy sau khi chốt.
13. `custom_bulk_corporate_gifts`: đặt số lượng nhiều, quà doanh nghiệp/sự kiện.
14. `custom_delivery_care_boundary`: giao bể custom và chăm sau khi nhận.

### Case: custom_general_request

- `caseId`: `custom_general_request`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi shop có nhận custom, thiết kế theo yêu cầu, làm mẫu riêng không.
- `trainingFlow`:
  - `subIntents`:
    - `askCustomAvailable`: hỏi có nhận custom không.
    - `customOwnIdea`: muốn làm theo ý tưởng riêng.
    - `customGift`: muốn làm quà riêng cho người nhận.
    - `customInsteadAvailable`: không chọn mẫu có sẵn, muốn mẫu riêng.
    - `unclearCustom`: user chỉ nhắn "custom được không", "làm riêng được không".
    - `hardRequestBoundary`: yêu cầu quá đặc biệt cần shop xem khả thi.
  - `mustAnswer`: shop có thể tư vấn custom theo nhu cầu; cần shop xác nhận chi tiết về mẫu, thời gian, giá; hỏi tiếp nhu cầu cơ bản.
  - `askIfNeeded`: hỏi mục đích, size, ngân sách, chủ đề, vị trí đặt, thời gian cần nhận.
  - `doNotSay`: không tự cam kết nhận mọi yêu cầu hoặc báo giá ngay.

`keywords`:

  - custom
  - đặt custom
  - dat custom
  - làm theo yêu cầu
  - lam theo yeu cau
  - thiết kế theo yêu cầu
  - thiet ke theo yeu cau
  - đặt mẫu riêng
  - dat mau rieng
  - làm mẫu riêng
  - lam mau rieng
  - làm theo ý tưởng
  - lam theo y tuong
  - shop có nhận custom không
  - shop co nhan custom khong
  - custom terrarium
  - custom order
  - custom design
  - personalized terrarium
  - bespoke terrarium
  - be theo yeu cau
  - bể theo yêu cầu
  - custom được không
  - custom duoc khong
  - custom dc k
  - custom dc ko
  - làm riêng được không
  - lam rieng duoc khong
  - làm riêng dc k
  - lam rieng dc ko
  - đặt theo ý mình
  - dat theo y minh
  - làm bể riêng
  - lam be rieng
  - custom ntn
  - custom sao
  - can i customize
  - made to order terrarium

`response`:

Dạ có thể tư vấn làm terrarium theo yêu cầu ạ. Với mẫu custom, Rêu nên lấy nhu cầu trước rồi shop sẽ xác nhận chi tiết về khả năng làm, thời gian và báo giá.

Anh/chị cho Rêu xin vài thông tin:
- Mục đích: dùng cá nhân, decor, quà tặng hay sự kiện.
- Kích thước/vị trí đặt mong muốn.
- Chủ đề hoặc phong cách thích.
- Ngân sách dự kiến.
- Thời gian cần nhận.
- Có ảnh mẫu/tham khảo không.

Sau khi có thông tin, shop sẽ tư vấn mẫu phù hợp hơn thay vì Rêu tự chốt giá hoặc lịch làm trong chatbox.

`responseVariants`:

- `quickCustomIntro`:

  Dạ được ạ. Anh/chị gửi giúp Rêu size mong muốn, ngân sách, chủ đề và thời gian cần nhận; shop sẽ xem khả năng làm và báo lại phương án phù hợp.

- `notAllRequestsGuaranteed`:

  Dạ mẫu custom cần kiểm tra độ khả thi theo cây/rêu, vật liệu, kích thước và thời gian. Rêu có thể nhận nhu cầu trước, còn phần chốt mẫu/báo giá sẽ để shop xác nhận.

- `unclearCustom`:

  Dạ được ạ, anh/chị đang muốn custom theo hướng nào: size riêng, chủ đề riêng, làm quà tặng hay làm giống ảnh mẫu? Nếu chưa rõ, cứ gửi ngân sách và vị trí đặt trước, Rêu sẽ hỏi tiếp từng phần.

- `hardRequestBoundary`:

  Dạ với yêu cầu đặc biệt như size lớn, nhiều phụ kiện, cây hiếm hoặc concept rất chi tiết, shop cần xem khả thi trước. Rêu không nên hứa nhận ngay khi chưa kiểm tra vật liệu và lịch làm.

### Case: custom_process_flow

- `caseId`: `custom_process_flow`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi quy trình đặt custom diễn ra như thế nào.
- `trainingFlow`:
  - `subIntents`:
    - `stepByStep`: hỏi từng bước đặt custom.
    - `fromIdeaToDelivery`: từ ý tưởng đến giao hàng.
    - `approvalFlow`: có duyệt mẫu/báo giá trước không.
    - `chatToHuman`: khi nào cần shop tư vấn trực tiếp.
    - `revisionFlow`: có chỉnh phương án trước khi làm không.
  - `mustAnswer`: quy trình tổng quan: nhận nhu cầu -> tư vấn phương án -> báo giá/lịch -> xác nhận -> làm mẫu -> giao/nhận.
  - `doNotSay`: không nói quy trình cố định tuyệt đối cho mọi đơn.

`keywords`:

  - quy trình custom
  - quy trinh custom
  - đặt custom như thế nào
  - dat custom nhu the nao
  - đặt theo yêu cầu sao
  - dat theo yeu cau sao
  - custom flow
  - custom process
  - quy trình đặt mẫu riêng
  - quy trinh dat mau rieng
  - làm custom mất mấy bước
  - lam custom mat may buoc
  - từ ý tưởng đến sản phẩm
  - tu y tuong den san pham
  - custom làm sao
  - custom lam sao
  - custom ntn
  - các bước custom
  - cac buoc custom
  - duyệt mẫu trước không
  - duyet mau truoc khong
  - có xem mẫu trước không
  - co xem mau truoc khong
  - quy trinh lam rieng
  - custom step by step

`response`:

Dạ quy trình custom thường đi theo các bước:

1. Anh/chị gửi nhu cầu: size, chủ đề, ngân sách, thời gian cần nhận, ảnh tham khảo nếu có.
2. Shop tư vấn phương án phù hợp với cây/rêu/vật liệu.
3. Shop xác nhận khoảng giá và thời gian làm.
4. Nếu hai bên thống nhất, shop tiến hành làm theo phương án đã chốt.
5. Khi hoàn thiện, shop giao/khách nhận theo lịch đã xác nhận.

Với đơn phức tạp, shop có thể cần trao đổi thêm để tránh mẫu đẹp trên ảnh nhưng khó chăm hoặc không bền trong terrarium thật.

`responseVariants`:

- `approvalFlow`:

  Dạ trước khi làm, shop nên xác nhận lại concept, size, ngân sách và thời gian. Chatbox không tự chốt thay shop, nhưng có thể giúp anh/chị chuẩn bị thông tin đầy đủ.

- `revisionFlow`:

  Dạ trước khi shop bắt đầu làm, anh/chị có thể trao đổi để chỉnh hướng concept/ngân sách/size. Sau khi đã chốt và chuẩn bị vật liệu, việc đổi có thể cần shop xác nhận lại thời gian hoặc chi phí.

- `chatToHuman`:

  Dạ nếu đơn custom có nhiều chi tiết, ảnh mẫu phức tạp hoặc cần chốt cọc/lịch làm, Rêu nên chuyển thông tin cho shop xác nhận trực tiếp thay vì tự trả lời thay.

### Case: custom_required_info

- `caseId`: `custom_required_info`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi cần gửi thông tin gì để shop tư vấn custom.
- `trainingFlow`:
  - `subIntents`:
    - `infoChecklist`: checklist thông tin cần gửi.
    - `missingInfo`: user chỉ nói muốn custom nhưng chưa rõ.
    - `recipientInfo`: thông tin người nhận nếu làm quà.
    - `referenceAndConstraints`: ảnh mẫu + điều kiện đặt bể.
    - `carePreference`: ưu tiên dễ chăm hay đẹp nổi bật.
  - `mustAnswer`: cần mục đích, size/vị trí, ngân sách, chủ đề, thời gian, ảnh mẫu, yêu cầu chăm sóc.
  - `doNotSay`: không bắt khách cung cấp thông tin nhạy cảm không cần thiết.

`keywords`:

  - cần gửi gì để custom
  - can gui gi de custom
  - custom cần thông tin gì
  - custom can thong tin gi
  - thông tin đặt mẫu riêng
  - thong tin dat mau rieng
  - gửi yêu cầu custom
  - gui yeu cau custom
  - custom checklist
  - info for custom order
  - cần chuẩn bị gì
  - can chuan bi gi
  - đặt theo yêu cầu cần gì
  - dat theo yeu cau can gi
  - gửi gì cho shop
  - gui gi cho shop
  - cần thông tin gì
  - can thong tin gi
  - muốn custom cần gì
  - muon custom can gi
  - custom gửi ảnh gì
  - custom gui anh gi
  - yêu cầu custom gồm gì
  - yeu cau custom gom gi
  - custom form
  - custom brief
  - custom requirements

`response`:

Dạ để shop tư vấn custom nhanh và đúng hơn, anh/chị gửi giúp Rêu các thông tin này:

- Mục đích: decor, quà tặng, sinh nhật, tân gia, văn phòng...
- Vị trí đặt: bàn làm việc, phòng khách, phòng ngủ, văn phòng máy lạnh...
- Kích thước hoặc khoảng không gian đặt.
- Chủ đề/phong cách: rừng xanh, tối giản, cute, sang, tài lộc...
- Ngân sách dự kiến.
- Thời gian cần nhận.
- Ảnh mẫu/tham khảo nếu có.
- Muốn dễ chăm hay ưu tiên bố cục nổi bật.

Nếu chưa rõ hết, anh/chị chỉ cần gửi mục đích + ngân sách + vị trí đặt trước, shop sẽ hỏi tiếp phần còn thiếu.

`responseVariants`:

- `minimalInfo`:

  Dạ nếu chưa biết bắt đầu từ đâu, anh/chị gửi trước 3 ý: dùng để làm gì, ngân sách khoảng bao nhiêu, đặt ở đâu. Từ đó shop sẽ tư vấn tiếp.

- `giftRecipientInfo`:

  Dạ nếu làm quà, anh/chị gửi thêm dịp tặng, người nhận là ai, gu màu/phong cách của người nhận và có cần thiệp/lời nhắn không.

- `carePreference`:

  Dạ anh/chị nên nói rõ ưu tiên: dễ chăm, xanh nhiều, rêu nhiều, sang tối giản hay thật nổi bật. Ưu tiên này ảnh hưởng cách shop chọn cây/rêu và bố cục.

### Case: custom_budget_quote

- `caseId`: `custom_budget_quote`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi giá custom, ngân sách bao nhiêu, có báo giá trước không.
- `trainingFlow`:
  - `subIntents`:
    - `askPrice`: hỏi giá custom.
    - `budgetRange`: user đưa ngân sách.
    - `quoteBeforeMaking`: hỏi có báo giá trước không.
    - `cheapCustom`: muốn custom giá rẻ.
    - `fixedBudget`: user có ngân sách cố định.
    - `highExpectationLowBudget`: muốn nhiều yêu cầu nhưng ngân sách thấp.
    - `compareReadyMade`: so custom với mẫu có sẵn trong tầm giá.
  - `mustAnswer`: giá phụ thuộc size, vật liệu, cây/rêu, độ phức tạp; shop cần xác nhận báo giá; chatbox không tự chốt giá.
  - `routeToDb`: nếu hỏi sản phẩm có sẵn theo giá, chuyển Group 5/DB.
  - `doNotSay`: không tự bịa khoảng giá nếu chưa được shop chốt.

`keywords`:

  - custom bao nhiêu tiền
  - custom bao nhieu tien
  - giá custom
  - gia custom
  - báo giá custom
  - bao gia custom
  - custom tầm giá
  - custom tam gia
  - ngân sách custom
  - ngan sach custom
  - custom giá rẻ
  - custom gia re
  - quote custom terrarium
  - custom price
  - custom cost
  - làm theo yêu cầu bao nhiêu
  - lam theo yeu cau bao nhieu
  - custom bn
  - custom bao nhiu
  - custom dưới 1tr
  - custom duoi 1tr
  - custom dưới 500k
  - custom duoi 500k
  - custom 1tr được không
  - custom 1tr duoc khong
  - custom 2tr
  - custom 500k
  - báo giá trước
  - bao gia truoc
  - có báo giá trước không
  - co bao gia truoc khong
  - custom expensive
  - cheap custom terrarium

`response`:

Dạ giá custom sẽ phụ thuộc vào kích thước bể, loại cây/rêu, vật liệu, phụ kiện và độ phức tạp của bố cục.

Rêu có thể ghi nhận ngân sách dự kiến của anh/chị để shop tư vấn phương án phù hợp. Tuy nhiên chatbox không nên tự chốt giá custom; phần báo giá cuối cùng cần shop xác nhận sau khi có đủ yêu cầu.

Anh/chị cho Rêu xin:
- Ngân sách khoảng bao nhiêu.
- Size/vị trí đặt.
- Chủ đề mong muốn.
- Có ảnh mẫu không.

`responseVariants`:

- `budgetGiven`:

  Dạ với ngân sách anh/chị đưa, Rêu sẽ dùng làm mốc để shop tư vấn bố cục phù hợp hơn. Nếu muốn xem sản phẩm có sẵn trong tầm giá, Rêu có thể chuyển sang lọc DB sản phẩm.

- `quoteBeforeMaking`:

  Dạ nên có bước shop xác nhận phương án và báo giá trước khi làm, nhất là với đơn custom có size/chủ đề riêng.

- `fixedBudget`:

  Dạ nếu anh/chị có ngân sách cố định, Rêu sẽ ghi nhận làm mốc để shop tư vấn size/bố cục phù hợp. Nếu ngân sách chưa đủ cho concept mong muốn, shop có thể đề xuất phương án giản lược hơn.

- `highExpectationLowBudget`:

  Dạ nếu muốn size lớn, nhiều phụ kiện, nhiều cây/rêu hoặc làm giống ảnh phức tạp thì chi phí có thể cao hơn. Với ngân sách thấp, mình nên ưu tiên concept gọn, dễ chăm và ít chi tiết hơn.

- `readyMadeAlternative`:

  Dạ nếu anh/chị ưu tiên giá tốt và nhận nhanh, sản phẩm có sẵn trong DB có thể phù hợp hơn custom. Custom hợp khi anh/chị cần size/chủ đề/ý nghĩa riêng.

### Case: custom_size_shape

- `caseId`: `custom_size_shape`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi làm size riêng, bể to/nhỏ, hình dáng bể theo vị trí đặt.
- `trainingFlow`:
  - `subIntents`:
    - `sizeCustom`: size riêng.
    - `shapeCustom`: hình dáng bể/lọ.
    - `placementFit`: fit bàn/kệ/quầy/văn phòng.
    - `largeTankBoundary`: bể lớn cần shop xác nhận độ khả thi.
    - `dimensionUnknown`: user chưa biết size, chỉ biết vị trí.
    - `deskSmall`: bể nhỏ để bàn.
    - `counterLarge`: bể lớn đặt quầy/phòng khách.
  - `mustAnswer`: cần kích thước vị trí đặt, mong muốn kín/mở, mục đích; size ảnh hưởng giá/thời gian/chăm sóc.
  - `doNotSay`: không tự cam kết làm mọi size/hình dáng.

`keywords`:

  - size riêng
  - size rieng
  - kích thước riêng
  - kich thuoc rieng
  - làm bể to
  - lam be to
  - làm bể mini
  - lam be mini
  - bể để bàn
  - be de ban
  - bể đặt kệ
  - be dat ke
  - bể tròn
  - be tron
  - bể vuông
  - be vuong
  - custom size
  - custom shape
  - large terrarium
  - mini terrarium custom
  - be theo kich thuoc
  - làm theo size
  - lam theo size
  - size theo bàn
  - size theo ban
  - vừa bàn làm việc
  - vua ban lam viec
  - đặt quầy lễ tân
  - dat quay le tan
  - bể dài
  - be dai
  - bể cao
  - be cao
  - bể thấp
  - be thap
  - custom for desk
  - custom for counter

`response`:

Dạ với size/hình dáng riêng, shop cần xem kích thước thực tế và mục đích đặt bể.

Anh/chị gửi giúp:
- Vị trí đặt: bàn, kệ, quầy, phòng khách, văn phòng...
- Kích thước tối đa hoặc khoảng không gian đặt.
- Muốn bể kín, bể mở hay chưa rõ.
- Chủ đề/phong cách mong muốn.
- Thời gian cần nhận.

Size càng lớn hoặc hình dáng càng đặc biệt thì thời gian, chi phí và cách chăm có thể khác mẫu có sẵn. Shop sẽ xác nhận độ khả thi trước khi chốt.

`responseVariants`:

- `placementFit`:

  Dạ nếu đặt trên bàn làm việc/kệ nhỏ, mình nên ưu tiên size gọn, dễ quan sát và dễ chăm. Nếu đặt quầy/phòng khách, có thể chọn bố cục nổi bật hơn nhưng cần shop xem không gian.

- `dimensionUnknown`:

  Dạ nếu chưa biết size, anh/chị có thể chụp vị trí đặt hoặc gửi kích thước khoảng trống: ngang, sâu, cao. Shop sẽ tư vấn size bể hợp hơn.

- `largeTankBoundary`:

  Dạ bể lớn/custom hình dáng đặc biệt cần shop xem độ ổn định bố cục, khả năng đóng gói và vận chuyển. Rêu chỉ nên ghi nhận nhu cầu trước, không tự chốt nhận ngay.

### Case: custom_theme_concept

- `caseId`: `custom_theme_concept`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user muốn custom theo chủ đề/concept/phong cách/mood.
- `trainingFlow`:
  - `subIntents`:
    - `forestTheme`: rừng xanh/rêu tự nhiên.
    - `minimalTheme`: tối giản/sang.
    - `cuteTheme`: cute/mini nhân vật.
    - `seasonalTheme`: lễ/tết/sinh nhật/tân gia.
    - `brandTheme`: màu thương hiệu/doanh nghiệp.
    - `tooManyThemes`: user muốn nhồi quá nhiều concept.
    - `colorPalette`: hỏi theo tông màu.
    - `recipientStyle`: theo gu người nhận.
  - `mustAnswer`: nhận chủ đề, hỏi thêm màu sắc, người nhận, vị trí, ngân sách, ảnh mẫu; shop xác nhận khả thi.
  - `doNotSay`: không hứa làm giống tuyệt đối concept phức tạp.

`keywords`:

  - custom theo chủ đề
  - custom theo chu de
  - làm theo concept
  - lam theo concept
  - concept rừng
  - concept rung
  - rừng xanh
  - rung xanh
  - tối giản
  - toi gian
  - cute
  - phong cách sang
  - phong cach sang
  - chủ đề sinh nhật
  - chu de sinh nhat
  - chủ đề tân gia
  - chu de tan gia
  - theme terrarium
  - concept terrarium
  - custom theme
  - moodboard
  - làm theo màu
  - lam theo mau
  - tone xanh
  - tông xanh
  - tong xanh
  - tone trắng
  - tone trang
  - tone đen
  - tone den
  - tối giản sang
  - toi gian sang
  - kiểu rừng mưa
  - kieu rung mua
  - fairy garden
  - japanese garden
  - zen garden
  - natural forest

`response`:

Dạ làm theo chủ đề/concept được tư vấn theo hướng đó ạ. Để shop lên phương án sát hơn, anh/chị gửi thêm:

- Chủ đề mong muốn: rừng xanh, tối giản, cute, sang, tài lộc, sinh nhật...
- Tông màu hoặc cảm giác muốn có.
- Người nhận hoặc không gian đặt.
- Ngân sách dự kiến.
- Ảnh mẫu/moodboard nếu có.

Shop sẽ xem concept nào hợp với cây/rêu thật và môi trường terrarium, vì có mẫu nhìn đẹp trên ảnh nhưng khó giữ ổn định lâu dài.

`responseVariants`:

- `notExactCopy`:

  Dạ shop có thể lấy cảm hứng từ concept/ảnh mẫu, nhưng không nên hứa giống 100% vì vật liệu, cây/rêu và kích thước bể thực tế có thể khác.

- `colorPalette`:

  Dạ nếu muốn làm theo tông màu, anh/chị gửi tông chính và tông cần tránh. Shop sẽ xem màu đó thể hiện qua cây/rêu, đá, gỗ, phụ kiện hay nền bể.

- `tooManyThemes`:

  Dạ nếu đưa quá nhiều chủ đề trong một bể nhỏ, bố cục có thể bị rối và khó chăm. Shop có thể giúp chọn 1-2 ý chính để bể nhìn rõ concept hơn.

### Case: custom_reference_image

- `caseId`: `custom_reference_image`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user muốn gửi ảnh mẫu, làm giống ảnh, copy mẫu Pinterest/Instagram.
- `trainingFlow`:
  - `subIntents`:
    - `sendReference`: hỏi có gửi ảnh được không.
    - `copyExact`: muốn làm y hệt ảnh.
    - `multipleReferences`: nhiều ảnh tham khảo.
    - `photoBoundary`: chatbox không phân tích ảnh sâu nếu chưa có mô tả.
    - `copyrightExactCopy`: không cam kết copy y hệt thiết kế của bên khác.
    - `realisticAdaptation`: chuyển ảnh mẫu thành phiên bản khả thi.
  - `mustAnswer`: có thể gửi ảnh tham khảo; shop dùng để hiểu style, không cam kết giống tuyệt đối; cần thêm size/ngân sách/thời gian.
  - `doNotSay`: không khẳng định làm giống y ảnh.

`keywords`:

  - gửi ảnh mẫu
  - gui anh mau
  - làm giống ảnh
  - lam giong anh
  - copy mẫu này
  - copy mau nay
  - mẫu pinterest
  - mau pinterest
  - mẫu instagram
  - mau instagram
  - ảnh tham khảo
  - anh tham khao
  - reference image
  - inspo
  - pinterest terrarium
  - instagram terrarium
  - làm theo hình
  - lam theo hinh
  - làm y chang ảnh
  - lam y chang anh
  - làm giống 100%
  - lam giong 100%
  - copy y hình
  - copy y hinh
  - ảnh trên mạng
  - anh tren mang
  - mẫu nước ngoài
  - mau nuoc ngoai
  - làm giống pinterest
  - lam giong pinterest
  - exact copy terrarium
  - copy this design

`response`:

Dạ anh/chị có thể gửi ảnh mẫu/tham khảo. Ảnh giúp shop hiểu phong cách, bố cục, tông màu và cảm giác anh/chị muốn.

Tuy nhiên với terrarium thật, shop cần xem lại:
- Size bể thực tế.
- Loại cây/rêu phù hợp.
- Vật liệu/phụ kiện có sẵn.
- Độ bền và độ dễ chăm.
- Ngân sách và thời gian làm.

Shop có thể làm theo tinh thần/ý tưởng của ảnh, nhưng không nên cam kết giống 100% từng chi tiết nếu vật liệu hoặc cây không giống mẫu.

`responseVariants`:

- `multipleReferences`:

  Dạ nếu có nhiều ảnh, anh/chị gửi 2-3 ảnh rõ nhất và nói giúp Rêu thích điểm nào ở từng ảnh: bố cục, màu sắc, cây/rêu hay phụ kiện.

- `exactCopyBoundary`:

  Dạ shop có thể làm theo tinh thần/ý tưởng của ảnh, nhưng không nên hứa copy y hệt 100%. Cây/rêu là vật liệu sống, mỗi bể sẽ có khác biệt tự nhiên.

- `realisticAdaptation`:

  Dạ nếu ảnh mẫu dùng vật liệu/cây không phù hợp khí hậu hoặc khó chăm, shop có thể đề xuất phiên bản gần vibe hơn nhưng ổn định hơn khi dùng thật.

### Case: custom_phong_thuy_meaning

- `caseId`: `custom_phong_thuy_meaning`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user muốn custom theo phong thủy, tài lộc, mệnh, ý nghĩa quà tặng.
- `trainingFlow`:
  - `subIntents`:
    - `fengShuiGeneral`: phong thủy/tài lộc.
    - `byElement`: theo mệnh/tuổi/màu.
    - `giftMeaning`: ý nghĩa khi tặng.
    - `boundary`: tư vấn phong thủy ở mức tham khảo, không cam kết kết quả.
    - `avoidOverclaim`: tránh khẳng định đổi vận/tài lộc chắc chắn.
    - `symbolicDesign`: thiết kế theo biểu tượng/màu sắc.
  - `mustAnswer`: có thể tư vấn định hướng màu/chủ đề/ý nghĩa; không cam kết tài lộc/vận mệnh; hỏi người nhận, màu thích, mục đích, ngân sách.
  - `doNotSay`: không hứa mang lại tài lộc chắc chắn.

`keywords`:

  - phong thủy
  - phong thuy
  - tài lộc
  - tai loc
  - theo mệnh
  - theo menh
  - mệnh mộc
  - menh moc
  - mệnh thủy
  - menh thuy
  - mệnh hỏa
  - menh hoa
  - mệnh kim
  - menh kim
  - mệnh thổ
  - menh tho
  - quà ý nghĩa
  - qua y nghia
  - feng shui terrarium
  - lucky terrarium
  - prosperity gift
  - custom tài lộc
  - custom tai loc
  - hợp mệnh
  - hop menh
  - theo tuổi
  - theo tuoi
  - mệnh gì hợp màu gì
  - menh gi hop mau gi
  - may mắn
  - may man
  - bình an
  - binh an
  - khai trương
  - khai truong
  - tân gia phong thủy
  - tan gia phong thuy
  - fengshui
  - lucky gift

`response`:

Dạ có thể tư vấn custom theo hướng phong thủy/ý nghĩa quà tặng ở mức tham khảo.

Rêu có thể ghi nhận:
- Người nhận là ai, dịp gì.
- Mệnh/tuổi nếu anh/chị muốn tham khảo.
- Tông màu thích hoặc cần tránh.
- Chủ đề: tài lộc, bình an, xanh mát, tối giản, sang...
- Ngân sách và thời gian cần nhận.

Lưu ý nhỏ: Rêu không nên cam kết chắc chắn về tài lộc/vận mệnh. Shop có thể thiết kế theo ý nghĩa biểu tượng, màu sắc và cảm giác phù hợp để làm quà/decor.

`responseVariants`:

- `giftMeaning`:

  Dạ nếu làm quà, mình có thể đi theo ý nghĩa xanh mát, bình an, may mắn hoặc khởi đầu mới. Anh/chị cho Rêu biết dịp tặng và người nhận để shop tư vấn concept phù hợp.

- `symbolicDesign`:

  Dạ phong thủy trong custom nên hiểu theo hướng biểu tượng, màu sắc và cảm giác của món quà. Ví dụ xanh mát cho sự bình an, bố cục vươn lên cho khởi đầu mới, đá/gỗ tạo cảm giác vững chãi.

- `avoidOverclaim`:

  Dạ Rêu không nên khẳng định mẫu bể sẽ đem lại tài lộc hay thay đổi vận mệnh chắc chắn. Shop có thể thiết kế theo ý nghĩa tốt đẹp để làm quà/decor.

### Case: custom_plant_material_selection

- `caseId`: `custom_plant_material_selection`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user muốn chọn cây/rêu/phụ kiện/vật liệu trong mẫu custom.
- `trainingFlow`:
  - `subIntents`:
    - `choosePlants`: chọn cây/rêu.
    - `easyCare`: muốn dễ chăm.
    - `materials`: đá, gỗ, phụ kiện, đèn.
    - `compatibility`: cây có hợp chung không.
    - `rarePlantBoundary`: cây hiếm/cây khách yêu cầu riêng.
    - `petChildSafety`: nhà có trẻ nhỏ/thú cưng.
    - `maintenanceTradeoff`: càng nhiều chi tiết càng cần chăm kỹ hơn.
  - `mustAnswer`: chọn cây/vật liệu cần theo môi trường bể kín/mở, ánh sáng, độ ẩm; shop xác nhận vật liệu có sẵn.
  - `routeToKnowledge`: nếu hỏi kiến thức cây hợp bể, Group 8.
  - `doNotSay`: không hứa mọi cây/phụ kiện đều dùng được.

`keywords`:

  - chọn cây custom
  - chon cay custom
  - chọn rêu custom
  - chon reu custom
  - thêm phụ kiện
  - them phu kien
  - thêm đèn
  - them den
  - chọn đá gỗ
  - chon da go
  - custom dễ chăm
  - custom de cham
  - cây dễ chăm
  - cay de cham
  - plant selection custom
  - terrarium materials
  - custom accessories
  - choose plants
  - be custom de cham
  - chọn phụ kiện custom
  - chon phu kien custom
  - thêm mô hình
  - them mo hinh
  - thêm tượng
  - them tuong
  - thêm led
  - them led
  - cây hiếm
  - cay hiem
  - cây theo yêu cầu
  - cay theo yeu cau
  - nhà có mèo
  - nha co meo
  - nhà có trẻ nhỏ
  - nha co tre nho
  - low maintenance custom
  - rare plants custom

`response`:

Dạ với mẫu custom, cây/rêu và vật liệu cần chọn theo môi trường bể để bể đẹp mà vẫn dễ chăm.

Shop sẽ cân nhắc:
- Bể kín hay mở.
- Vị trí đặt có sáng/máy lạnh/nóng không.
- Anh/chị muốn dễ chăm hay nổi bật.
- Cây/rêu có cùng nhu cầu độ ẩm không.
- Phụ kiện/đá/gỗ có phù hợp size bể không.

Nếu anh/chị ưu tiên dễ chăm, nên nói rõ ngay từ đầu để shop chọn cây/rêu ổn định hơn, tránh bố cục đẹp nhưng khó giữ lâu.

`responseVariants`:

- `easyCare`:

  Dạ nếu muốn custom dễ chăm, shop nên ưu tiên cây/rêu có nhu cầu tương đồng, bố cục thoáng vừa và không quá nhiều chi tiết khó vệ sinh.

- `rarePlantBoundary`:

  Dạ nếu anh/chị muốn dùng cây hiếm hoặc cây chỉ định riêng, shop cần kiểm tra cây đó có hợp môi trường terrarium không và có sẵn nguồn vật liệu không.

- `maintenanceTradeoff`:

  Dạ mẫu càng nhiều chi tiết/phụ kiện/cây khác nhau thì càng nổi bật, nhưng cũng có thể khó vệ sinh và khó giữ ổn định hơn. Nếu ưu tiên bền/dễ chăm, nên giữ bố cục gọn hơn.

- `petChildSafety`:

  Dạ nếu nhà có trẻ nhỏ hoặc thú cưng, anh/chị nên báo trước để shop tư vấn vị trí đặt, kiểu bể và phụ kiện an toàn hơn.

### Case: custom_timeline_complexity

- `caseId`: `custom_timeline_complexity`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi thời gian làm custom, đặt trước bao lâu, cần gấp có được không.
- `trainingFlow`:
  - `subIntents`:
    - `normalTimeline`: thời gian làm thông thường.
    - `complexTimeline`: mẫu phức tạp.
    - `urgentOrder`: cần gấp/hỏa tốc.
    - `preorder`: đặt trước cho dịp cụ thể.
    - `sameDayBoundary`: hỏi làm trong ngày/giao ngay.
    - `holidayPeak`: dịp lễ/tết/sự kiện có thể cần đặt sớm.
  - `mustAnswer`: thời gian tùy độ phức tạp; HCM sản phẩm đặt trước/custom thường 3-5 ngày hoặc tùy yêu cầu đã chốt; cần shop xác nhận.
  - `doNotSay`: không cam kết chắc chắn ngày nếu chưa shop xác nhận.

`keywords`:

  - custom mất bao lâu
  - custom mat bao lau
  - làm custom bao lâu
  - lam custom bao lau
  - đặt trước bao lâu
  - dat truoc bao lau
  - cần gấp custom
  - can gap custom
  - custom gấp
  - custom gap
  - thời gian làm custom
  - thoi gian lam custom
  - custom timeline
  - rush custom order
  - preorder custom
  - 3-5 ngày custom
  - 3-5 ngay custom
  - làm trong ngày
  - lam trong ngay
  - giao ngay hôm nay
  - giao ngay hom nay
  - custom hôm nay được không
  - custom hom nay duoc khong
  - kịp sinh nhật không
  - kip sinh nhat khong
  - kịp tân gia không
  - kip tan gia khong
  - cần trước cuối tuần
  - can truoc cuoi tuan
  - same day custom
  - custom today
  - urgent terrarium

`response`:

Dạ thời gian làm custom phụ thuộc vào độ phức tạp, size, vật liệu và lịch hiện tại của shop.

Mốc tham khảo đã chốt cho sản phẩm đặt trước/custom tại HCM là khoảng **3-5 ngày**, tùy mức độ phức tạp của yêu cầu. Nếu cần gấp, shop cần kiểm tra khả năng làm và phương án giao.

Anh/chị cho Rêu biết:
- Ngày cần nhận.
- Khu vực nhận hàng.
- Mẫu đơn giản hay phức tạp.
- Có ảnh mẫu không.

Chatbox không nên tự cam kết ngày giao chính xác trước khi shop xác nhận.

`responseVariants`:

- `urgentOrder`:

  Dạ nếu cần gấp, anh/chị nói rõ ngày/giờ cần nhận và khu vực giao. Shop sẽ xem có làm kịp không; nếu cần giao hỏa tốc có thể dùng đơn vị thứ ba như Grab/Lalamove khi phù hợp.

- `sameDayBoundary`:

  Dạ custom trong ngày thường cần shop kiểm tra rất kỹ vì còn vật liệu, cây/rêu, thời gian setup và giao hàng. Nếu không kịp custom, shop có thể gợi ý mẫu có sẵn phù hợp hơn.

- `holidayPeak`:

  Dạ với dịp sinh nhật, tân gia, khai trương, lễ/tết hoặc đơn số lượng nhiều, anh/chị nên đặt sớm hơn để shop có thời gian chuẩn bị và giảm rủi ro giao trễ.

### Case: custom_deposit_payment_boundary

- `caseId`: `custom_deposit_payment_boundary`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi đặt cọc, thanh toán custom, chuyển khoản, giữ lịch làm.
- `trainingFlow`:
  - `subIntents`:
    - `depositRequired`: có cần đặt cọc không.
    - `paymentMethod`: thanh toán bằng gì.
    - `paymentLinkBoundary`: xin tài khoản/QR/link.
    - `holdSlot`: giữ lịch làm custom.
    - `refundBoundary`: hỏi hoàn cọc/hủy cọc.
    - `codBoundary`: hỏi COD cho custom.
  - `mustAnswer`: phần đặt cọc/thanh toán custom cần shop xác nhận riêng; chatbox không gửi số tài khoản/QR/link thanh toán.
  - `routeToPayment`: nếu hỏi thanh toán đơn có sẵn, Group 4.
  - `doNotSay`: không tự gửi thông tin thanh toán.

`keywords`:

  - custom có cần cọc không
  - custom co can coc khong
  - đặt cọc custom
  - dat coc custom
  - cọc bao nhiêu
  - coc bao nhieu
  - thanh toán custom
  - thanh toan custom
  - chuyển khoản custom
  - chuyen khoan custom
  - giữ lịch custom
  - giu lich custom
  - deposit custom
  - custom payment
  - payment for custom order
  - gửi qr custom
  - gui qr custom
  - qr custom
  - stk custom
  - số tài khoản custom
  - so tai khoan custom
  - hoàn cọc
  - hoan coc
  - mất cọc không
  - mat coc khong
  - cod custom
  - custom cod
  - nhận hàng trả tiền custom
  - nhan hang tra tien custom
  - refund deposit
  - custom deposit refund

`response`:

Dạ với đơn custom, phần đặt cọc/thanh toán cần shop xác nhận riêng theo mẫu, thời gian và mức độ phức tạp.

Rêu có thể ghi nhận nhu cầu của anh/chị, nhưng chatbox không tự gửi số tài khoản, QR hoặc link thanh toán để tránh nhầm thông tin.

Anh/chị nên chờ shop xác nhận:
- Phương án custom.
- Báo giá.
- Thời gian làm.
- Có cần cọc không và cách thanh toán nếu có.

`responseVariants`:

- `paymentSafety`:

  Dạ để an toàn, mọi thông tin chuyển khoản/đặt cọc custom nên do shop xác nhận trực tiếp, không lấy từ câu trả lời tự động của chatbox.

- `refundBoundary`:

  Dạ phần hoàn cọc/mất cọc khi hủy hoặc đổi đơn custom cần shop xác nhận theo tình trạng đơn đã chuẩn bị tới đâu. Rêu không tự kết luận trong chatbox.

- `codBoundary`:

  Dạ với đơn custom, phương thức thanh toán/COD hay đặt cọc cần shop xác nhận riêng. Nếu là sản phẩm có sẵn, Rêu sẽ chuyển về Group 4 để xem quy trình thanh toán hiện tại.

### Case: custom_change_cancel_after_confirm

- `caseId`: `custom_change_cancel_after_confirm`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi đổi ý, sửa mẫu, đổi size/chủ đề, hủy sau khi đã chốt custom.
- `trainingFlow`:
  - `subIntents`:
    - `changeBeforeConfirm`: đổi trước khi shop làm.
    - `changeAfterConfirm`: đổi sau khi đã chốt/làm.
    - `cancelCustom`: hủy đơn custom.
    - `extraCost`: thay đổi có thể phát sinh phí/thời gian.
    - `changeAfterMaterials`: đã mua/chọn vật liệu.
    - `changeDeliveryDate`: đổi ngày nhận/giao.
  - `mustAnswer`: thay đổi càng sớm càng dễ; sau khi chốt/làm cần shop xác nhận khả năng, phí, thời gian.
  - `doNotSay`: không tự đồng ý hủy/sửa mọi đơn.

`keywords`:

  - đổi mẫu custom
  - doi mau custom
  - sửa mẫu custom
  - sua mau custom
  - đổi size custom
  - doi size custom
  - hủy custom
  - huy custom
  - đổi ý custom
  - doi y custom
  - sửa concept
  - sua concept
  - change custom order
  - cancel custom order
  - modify custom order
  - đổi sau khi chốt
  - doi sau khi chot
  - đổi ngày nhận
  - doi ngay nhan
  - đổi ngày giao
  - doi ngay giao
  - đổi concept sau khi cọc
  - doi concept sau khi coc
  - hủy sau khi cọc
  - huy sau khi coc
  - sửa sau khi làm
  - sua sau khi lam
  - đổi cây custom
  - doi cay custom
  - cancel after deposit
  - change after deposit

`response`:

Dạ nếu muốn đổi/sửa đơn custom, anh/chị nên báo càng sớm càng tốt.

- Trước khi shop chốt/làm: thường dễ điều chỉnh hơn.
- Sau khi đã chốt concept, chuẩn bị vật liệu hoặc bắt đầu làm: cần shop xác nhận có đổi được không, có phát sinh chi phí/thời gian không.
- Nếu muốn hủy: shop cần kiểm tra tình trạng đơn custom trước khi trả lời.

Rêu không nên tự đồng ý hủy/sửa thay shop, nhưng có thể ghi nhận nội dung anh/chị muốn thay đổi để shop kiểm tra.

`responseVariants`:

- `changeEarly`:

  Dạ nếu shop chưa bắt đầu làm, anh/chị gửi ngay phần muốn đổi: size, màu, chủ đề, cây/rêu hoặc thời gian nhận. Shop sẽ xác nhận lại.

- `changeAfterMaterials`:

  Dạ nếu shop đã chuẩn bị cây/rêu/vật liệu hoặc bắt đầu setup, việc đổi concept/size có thể phát sinh thêm thời gian hoặc chi phí. Phần này cần shop xác nhận.

- `changeDeliveryDate`:

  Dạ nếu chỉ đổi ngày nhận/giao, anh/chị báo càng sớm càng tốt để shop xem lịch chăm giữ bể và lịch giao. Rêu không tự cam kết đổi lịch thay shop.

### Case: custom_bulk_corporate_gifts

- `caseId`: `custom_bulk_corporate_gifts`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi đặt custom số lượng nhiều, quà doanh nghiệp, sự kiện, workshop.
- `trainingFlow`:
  - `subIntents`:
    - `bulkOrder`: đặt nhiều bể.
    - `corporateGift`: quà công ty/khách hàng/đối tác.
    - `eventTheme`: sự kiện/workshop.
    - `logoBranding`: logo, màu thương hiệu, thiệp.
    - `quantityTier`: số lượng ảnh hưởng thời gian/giá.
    - `packagingCards`: bao bì, thiệp, tag tên.
    - `deliveryMultipleAddresses`: giao nhiều địa chỉ.
  - `mustAnswer`: cần số lượng, ngân sách/bộ, thời gian, branding, địa điểm giao; shop xác nhận khả năng.
  - `doNotSay`: không tự chiết khấu/báo giá số lượng lớn.

`keywords`:

  - đặt số lượng nhiều
  - dat so luong nhieu
  - quà doanh nghiệp
  - qua doanh nghiep
  - quà công ty
  - qua cong ty
  - quà khách hàng
  - qua khach hang
  - quà đối tác
  - qua doi tac
  - custom số lượng lớn
  - custom so luong lon
  - workshop terrarium
  - corporate gift
  - bulk order
  - event gift
  - branding terrarium
  - logo công ty
  - logo cong ty
  - đặt 10 bể
  - dat 10 be
  - đặt 20 bể
  - dat 20 be
  - đặt 50 bể
  - dat 50 be
  - quà sự kiện
  - qua su kien
  - quà khai trương
  - qua khai truong
  - thiệp cảm ơn
  - thiep cam on
  - tag tên
  - tag ten
  - giao nhiều địa chỉ
  - giao nhieu dia chi
  - bulk terrarium gifts
  - corporate terrarium gifts

`response`:

Dạ với đơn custom số lượng nhiều/quà doanh nghiệp, shop cần thêm thông tin để kiểm tra khả năng làm và thời gian.

Anh/chị gửi giúp:
- Số lượng dự kiến.
- Ngân sách mỗi phần quà.
- Dịp/sự kiện sử dụng.
- Có cần logo, thiệp, màu thương hiệu không.
- Thời gian cần nhận.
- Địa điểm giao.

Rêu không tự báo giá/chiết khấu số lượng lớn trong chatbox; shop sẽ xác nhận sau khi có đủ thông tin.

`responseVariants`:

- `branding`:

  Dạ nếu cần logo/màu thương hiệu/thiệp, anh/chị gửi file hoặc mô tả nhận diện thương hiệu để shop xem cách tích hợp phù hợp với bể.

- `quantityTier`:

  Dạ số lượng càng nhiều thì shop càng cần biết sớm để chuẩn bị cây/rêu, bể, phụ kiện và lịch làm. Rêu không tự chốt chiết khấu, nhưng sẽ ghi nhận số lượng để shop báo lại.

- `packagingCards`:

  Dạ nếu cần thiệp, tag tên, lời chúc hoặc bao bì riêng, anh/chị gửi nội dung và phong cách mong muốn để shop xem khả năng chuẩn bị.

- `multipleAddresses`:

  Dạ nếu giao nhiều địa chỉ, anh/chị cần gửi danh sách khu vực/địa chỉ sau khi shop xác nhận nhận đơn. Chatbox không hiển thị hay xử lý chi tiết thông tin nhạy cảm công khai.

### Case: custom_delivery_care_boundary

- `caseId`: `custom_delivery_care_boundary`
- `group`: `Custom Theo Yêu Cầu`
- `category`: `custom_order`
- `intent`: user hỏi giao bể custom, chăm sau khi nhận, custom có dễ hư khi ship không.
- `trainingFlow`:
  - `subIntents`:
    - `customShipping`: giao custom.
    - `careAfterCustom`: chăm sau khi nhận.
    - `shippingRisk`: xô lệch/vỡ/cây ảnh hưởng khi ship.
    - `afterReceiveBoundary`: lỗi sau khi nhận chuyển chính sách/sự cố.
    - `provinceCustom`: giao tỉnh cho bể custom.
    - `openingVideo`: quay video mở hàng.
    - `aftercareFirstWeek`: chăm 7 ngày đầu cho custom.
  - `mustAnswer`: bể custom vẫn theo nguyên tắc đóng gói/giao terrarium; chăm sau nhận chuyển Group 6; hư/xô lệch chuyển Group 2/3/7 tùy tình huống.
  - `doNotSay`: không cam kết không có rủi ro tuyệt đối khi vận chuyển.

`keywords`:

  - giao bể custom
  - giao be custom
  - ship custom
  - vận chuyển custom
  - van chuyen custom
  - custom có dễ vỡ không
  - custom co de vo khong
  - custom bị xô lệch
  - custom bi xo lech
  - chăm bể custom
  - cham be custom
  - sau khi nhận custom
  - sau khi nhan custom
  - custom shipping
  - custom care
  - delivery custom terrarium
  - custom aftercare
  - custom giao tỉnh
  - custom giao tinh
  - custom đi tỉnh
  - custom di tinh
  - custom ship tỉnh
  - custom ship tinh
  - quay video custom
  - quay video mo hang custom
  - chăm 7 ngày custom
  - cham 7 ngay custom
  - custom bị vỡ
  - custom bi vo
  - custom bị hư khi nhận
  - custom bi hu khi nhan
  - custom province shipping
  - custom opening video

`response`:

Dạ bể custom vẫn là terrarium có kính, cây/rêu và bố cục bên trong nên khi giao cần đóng gói kỹ và khách nên kiểm tra khi nhận.

Lưu ý:
- Thời gian giao/custom cần shop xác nhận theo mẫu.
- Khi nhận nên quay video mở hàng và kiểm tra bể.
- Nếu hỏi chăm sau khi nhận, Rêu sẽ chuyển sang Group 6.
- Nếu bể vỡ/xô lệch nặng lúc nhận, chuyển theo chính sách/vận chuyển Group 2/3.
- Nếu sau vài ngày cây/rêu có dấu hiệu héo/vàng/mốc, chuyển Group 7 để xử lý theo triệu chứng.

`responseVariants`:

- `aftercare`:

  Dạ sau khi nhận bể custom, anh/chị vẫn chăm theo nguyên tắc chung: đặt nơi sáng gián tiếp, không tưới nhiều ngay, tránh nắng trực tiếp và quan sát 7 ngày đầu.

- `provinceCustom`:

  Dạ bể custom giao tỉnh cần shop kiểm tra kích thước, bố cục và khả năng đóng gói. Với terrarium, luôn nên quay video mở hàng để có cơ sở hỗ trợ nếu có vấn đề vận chuyển.

- `openingVideo`:

  Dạ khi nhận bể custom, anh/chị nên quay video mở hàng và kiểm tra kính, bố cục, cây/rêu ngay lúc nhận. Nếu có vỡ/xô lệch nặng, giữ hiện trạng và gửi shop kiểm tra.

## Group 10: Quy tắc An toàn Cho Chatbox

### Phạm vi group

- Đây là nhóm rule nội bộ cho chatbox, dùng để điều hướng giữa DB, KB và GPT.
- Không nên hiển thị nguyên văn các rule kỹ thuật như “GPT/DB/KB/Ollama” cho khách nếu không cần.
- Mục tiêu: trả lời đúng nguồn dữ liệu, không bịa thông tin, bảo mật đơn hàng, không tư vấn vượt phạm vi, và biết khi nào cần chuyển shop/người thật.

### Tổng quan case Group 10

Group 10 có **12 case rule chính**:

1. `safety_source_routing_db_kb_gpt`: DB/KB/GPT dùng khi nào theo flow mới.
2. `safety_product_price_stock_db_only`: giá, tồn kho, sản phẩm phải lấy DB.
3. `safety_order_privacy_lookup`: tra đơn bằng SĐT nhưng ẩn thông tin nhạy cảm.
4. `safety_no_tracking_total_address`: không trả tracking, tổng tiền, địa chỉ, SĐT đầy đủ.
5. `safety_no_external_web_search`: không search web ngoài; dồn vào DB/KB/GPT.
6. `safety_unclear_question_handling`: câu mơ hồ thì hỏi lại hoặc lấy KB gần nhất cho GPT diễn giải.
7. `safety_no_medical_chemical_strong_advice`: không hướng dẫn hóa chất/thuốc mạnh trong bể.
8. `safety_no_warranty_overpromise`: không cam kết bảo hành/đổi trả ngoài chính sách.
9. `safety_no_custom_payment_commitment`: không tự chốt cọc/QR/STK/báo giá custom.
10. `safety_image_video_boundary`: thiếu ảnh thì không chẩn đoán chắc.
11. `safety_sensitive_personal_data`: hạn chế yêu cầu/lặp lại dữ liệu cá nhân.
12. `safety_handoff_to_shop`: khi nào chuyển shop/người thật.

### Case: safety_source_routing_db_kb_gpt

- `caseId`: `safety_source_routing_db_kb_gpt`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule xác định DB, KB, GPT dùng khi nào theo flow mới: care đi GPT, facts đi DB/KB.
- `trainingFlow`:
  - `dbUse`: dùng DB cho sản phẩm, giá, salePrice, tồn kho, danh mục, trạng thái đơn hàng.
  - `kbUse`: dùng KB cho chính sách, vận chuyển, thanh toán, custom, rule an toàn và facts đã chốt.
  - `gptUse`: GPT trả lời chính cho chăm sóc cây/rêu/terrarium, tưới nước, ánh sáng, nhiệt độ, độ ẩm, sự cố cây/rêu; KB chỉ làm nền/guardrail nếu có.
  - `saleAdvice`: tư vấn sale về chăm sóc dùng DB sản phẩm thật + GPT diễn giải cách chăm, không bịa giá/tồn kho.
  - `mustAnswer`: luôn ưu tiên nguồn có thẩm quyền: DB cho dữ liệu động, KB cho facts/chính sách, GPT cho care advice linh hoạt.
  - `doNotSay`: không giải thích kỹ thuật nội bộ cho khách trừ khi khách hỏi cách chatbox hoạt động.

`keywords`:

  - flow chatbox
  - luồng chatbox
  - luong chatbox
  - db kb gpt
  - kb trước hay gpt trước
  - kb truoc hay gpt truoc
  - gpt trả lời gì
  - gpt tra loi gi
  - ai trả lời
  - ai tra loi
  - nguồn trả lời
  - nguon tra loi
  - knowledge base dùng khi nào
  - chatbot flow
  - source routing

`response`:

Rule nội bộ:

- DB trả dữ liệu động: sản phẩm, giá, sale, tồn kho, danh mục, đơn hàng.
- KB trả facts đã chốt: chính sách, vận chuyển, thanh toán, custom, rule an toàn.
- GPT trả lời chính cho chăm sóc cây/rêu/terrarium: tưới nước, ánh sáng, nhiệt độ, độ ẩm, xử lý héo/vàng/mốc/rụng lá.
- Sale advice dùng DB sản phẩm thật + GPT diễn giải cách chăm/phù hợp nhu cầu.
- Nếu DB/KB không có dữ liệu chắc chắn, không bịa; hỏi thêm hoặc chuyển shop.

`responseVariants`:

- `customerFriendly`:

  Dạ Rêu sẽ kiểm tra thông tin shop/hệ thống cho các phần như giá, sản phẩm, đơn hàng và chính sách. Riêng câu hỏi chăm sóc cây/rêu, Rêu sẽ tư vấn linh hoạt hơn nhưng vẫn giữ các nguyên tắc an toàn và hỏi thêm khi chưa đủ rõ.

### Case: safety_product_price_stock_db_only

- `caseId`: `safety_product_price_stock_db_only`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule không bịa giá/tồn kho/sản phẩm; phải lấy từ DB.
- `trainingFlow`:
  - `mustAnswer`: mọi câu hỏi về giá, sale, còn hàng, số lượng, sản phẩm nổi bật, danh mục phải truy vấn DB trước.
  - `fallback`: nếu DB không có hoặc lỗi, nói chưa kiểm tra được và đề nghị xem trang sản phẩm/liên hệ shop.
  - `doNotSay`: không tự tạo sản phẩm, giá, tồn kho, bestseller.

`keywords`:

  - giá sản phẩm
  - gia san pham
  - còn hàng
  - con hang
  - hết hàng
  - het hang
  - tồn kho
  - ton kho
  - sale price
  - product price
  - stock
  - inventory
  - bestseller
  - sản phẩm nổi bật
  - san pham noi bat
  - db only

`response`:

Rule nội bộ:

- Không trả giá/tồn kho từ trí nhớ hoặc KB.
- Luôn lấy từ DB sản phẩm hiện tại.
- Nếu user hỏi theo ngân sách, lọc DB theo giá/salePrice/tồn kho.
- Nếu DB không trả được dữ liệu, nói chưa kiểm tra được thông tin hiện tại, không bịa.

`responseVariants`:

- `customerFriendly`:

  Dạ phần giá/còn hàng Rêu sẽ kiểm tra theo dữ liệu sản phẩm hiện tại để tránh báo sai. Nếu chưa kiểm tra được, anh/chị xem trực tiếp ở trang sản phẩm hoặc để shop xác nhận giúp mình.

### Case: safety_order_privacy_lookup

- `caseId`: `safety_order_privacy_lookup`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule tra cứu đơn hàng bằng SĐT và trả trạng thái tiếng Việt nhưng bảo mật.
- `trainingFlow`:
  - `mustAnswer`: cho phép tra đơn bằng SĐT đã đặt hàng; chỉ hiển thị trạng thái đơn tiếng Việt và mã/trạng thái cần thiết nếu được phép.
  - `hide`: địa chỉ, SĐT đầy đủ, email, tổng tiền, tracking link, mã vận đơn.
  - `doNotSay`: không đọc lại toàn bộ thông tin đơn hàng.

`keywords`:

  - tra đơn
  - tra don
  - kiểm tra đơn
  - kiem tra don
  - tra cứu đơn
  - tra cuu don
  - tìm đơn bằng sđt
  - tim don bang sdt
  - order lookup
  - phone lookup
  - order privacy
  - trạng thái đơn
  - trang thai don
  - lookup by phone

`response`:

Rule nội bộ:

- Có thể yêu cầu SĐT đã dùng khi đặt hàng để tra trạng thái.
- Trạng thái đơn phải hiển thị bằng tiếng Việt, dễ hiểu.
- Không hiển thị địa chỉ, SĐT đầy đủ, email, tổng tiền, tracking link hoặc mã vận đơn.
- Nếu không tìm thấy đơn, hướng dẫn kiểm tra lại SĐT hoặc liên hệ shop.

`responseVariants`:

- `customerFriendly`:

  Dạ anh/chị gửi SĐT đã dùng khi đặt hàng, Rêu sẽ kiểm tra trạng thái đơn. Để bảo mật, Rêu chỉ báo trạng thái cần thiết và không hiển thị địa chỉ, tổng tiền hay tracking link trong chatbox.

### Case: safety_no_tracking_total_address

- `caseId`: `safety_no_tracking_total_address`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule không trả tracking link, tổng tiền, địa chỉ, mã vận đơn trong chatbox.
- `trainingFlow`:
  - `mustAnswer`: từ chối nhẹ và giải thích vì bảo mật; có thể báo trạng thái đơn ở mức cần thiết.
  - `doNotSay`: không hiển thị tracking link, mã vận đơn, địa chỉ, SĐT đầy đủ, email, tổng tiền.

`keywords`:

  - tracking link
  - mã vận đơn
  - ma van don
  - tổng tiền đơn
  - tong tien don
  - địa chỉ giao hàng
  - dia chi giao hang
  - số điện thoại đầy đủ
  - so dien thoai day du
  - cho xin tracking
  - cho xin ma van don
  - order total
  - shipping address
  - tracking boundary

`response`:

Dạ để bảo mật thông tin đơn hàng, Rêu không hiển thị tracking link, mã vận đơn, địa chỉ, SĐT đầy đủ, email hoặc tổng tiền trong chatbox.

Nếu anh/chị muốn kiểm tra đơn đang ở trạng thái nào, anh/chị gửi SĐT đã đặt hàng. Rêu sẽ tra cứu và chỉ báo trạng thái tiếng Việt ở mức cần thiết.

### Case: safety_no_external_web_search

- `caseId`: `safety_no_external_web_search`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule không dùng web search bên ngoài cho chatbox; dồn vào DB/KB/GPT.
- `trainingFlow`:
  - `mustAnswer`: chatbox không search web ngoài để trả lời khách; kiến thức lấy từ DB/KB, GPT diễn giải.
  - `fallback`: nếu ngoài phạm vi KB/DB, từ chối nhẹ hoặc chuyển shop.
  - `doNotSay`: không viện dẫn nguồn web không kiểm chứng.

`keywords`:

  - search web
  - tìm trên mạng
  - tim tren mang
  - google giúp
  - google giup
  - tra internet
  - external search
  - web search
  - internet answer
  - kiến thức ngoài
  - kien thuc ngoai
  - không search web
  - khong search web

`response`:

Rule nội bộ:

- Chatbox không dùng web search ngoài để trả lời khách.
- DB xử lý dữ liệu shop/đơn/sản phẩm.
- KB xử lý chính sách, chăm sóc, sự cố, kiến thức, custom.
- GPT chỉ diễn giải từ DB/KB.
- Nếu câu hỏi ngoài phạm vi terrarium/shop, từ chối nhẹ và kéo về nội dung Rêu hỗ trợ được.

`responseVariants`:

- `customerFriendly`:

  Dạ phần này nằm ngoài phạm vi thông tin Rêu được shop cung cấp. Rêu có thể hỗ trợ tốt nhất các nội dung về sản phẩm, đơn hàng, chính sách và chăm sóc terrarium của Tiệm Rêu.

### Case: safety_unclear_question_handling

- `caseId`: `safety_unclear_question_handling`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule xử lý câu mơ hồ, thiếu ngữ cảnh, viết tắt khó hiểu.
- `trainingFlow`:
  - `mustAnswer`: nếu nhận diện được nhóm gần nhất thì trả lời theo KB liên quan và hỏi thêm; nếu quá mơ hồ thì hỏi lại 1-2 câu ngắn.
  - `doNotSay`: không đoán chắc khi câu có thể thuộc nhiều intent quan trọng.

`keywords`:

  - câu mơ hồ
  - cau mo ho
  - không hiểu câu hỏi
  - khong hieu cau hoi
  - hỏi không rõ
  - hoi khong ro
  - ambiguous
  - unclear question
  - vague question
  - user intent unclear
  - ntn
  - sao vậy
  - sao vay

`response`:

Rule nội bộ:

- Nếu câu mơ hồ nhưng có keyword gần đúng, chọn KB gần nhất và hỏi thêm thông tin còn thiếu.
- Nếu câu có thể dẫn tới nhiều hướng khác nhau, hỏi lại ngắn gọn thay vì đoán.
- Với chăm sóc/sự cố: hỏi loại bể, triệu chứng, độ ẩm, ánh sáng, thời gian xảy ra.
- Với đơn hàng: hỏi SĐT đã đặt hàng.
- Với custom: hỏi mục đích, ngân sách, size/chủ đề.

`responseVariants`:

- `customerFriendly`:

  Dạ Rêu cần thêm một chút thông tin để trả lời đúng hơn. Anh/chị đang hỏi về sản phẩm, đơn hàng, chăm sóc bể hay muốn custom theo yêu cầu ạ?

### Case: safety_no_medical_chemical_strong_advice

- `caseId`: `safety_no_medical_chemical_strong_advice`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule không hướng dẫn thuốc/hóa chất mạnh trong bể.
- `trainingFlow`:
  - `mustAnswer`: ưu tiên xử lý nhẹ: giảm/tăng ẩm, mở thoáng, gắp lá mục/mốc, đổi vị trí; không khuyên thuốc/hóa chất mạnh.
  - `routeToShop`: nếu sự cố nặng, gửi ảnh/video cho shop.
  - `doNotSay`: không khuyên xịt thuốc trừ sâu, thuốc nấm mạnh, cồn, nước lau kính, oxy già trực tiếp vào toàn bể.

`keywords`:

  - thuốc trị nấm
  - thuoc tri nam
  - thuốc sâu
  - thuoc sau
  - xịt thuốc
  - xit thuoc
  - hóa chất
  - hoa chat
  - cồn
  - con
  - oxy già
  - oxy gia
  - pesticide
  - fungicide
  - chemical treatment
  - strong chemical
  - thuốc mạnh
  - thuoc manh

`response`:

Dạ với terrarium, mình không nên tự xịt thuốc/hóa chất mạnh vào bể vì dễ ảnh hưởng cây, rêu và môi trường bên trong.

Rêu sẽ ưu tiên hướng xử lý an toàn hơn:
- Gắp bỏ lá mục/mốc nhìn thấy.
- Điều chỉnh độ ẩm.
- Mở thoáng nhẹ nếu bể quá ẩm.
- Đổi vị trí nếu quá nóng/nắng/gió máy lạnh.
- Gửi ảnh/video cho shop nếu tình trạng nặng hoặc lan nhanh.

### Case: safety_no_warranty_overpromise

- `caseId`: `safety_no_warranty_overpromise`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule không cam kết bảo hành/đổi trả ngoài chính sách.
- `trainingFlow`:
  - `mustAnswer`: giải thích cần shop kiểm tra theo chính sách; yêu cầu ảnh/video/thời điểm nhận nếu cần.
  - `doNotSay`: không hứa đổi mới, hoàn tiền, bảo hành chắc chắn khi chưa đủ điều kiện.

`keywords`:

  - có bảo hành không
  - co bao hanh khong
  - đổi mới được không
  - doi moi duoc khong
  - hoàn tiền
  - hoan tien
  - shop đền không
  - shop den khong
  - warranty promise
  - refund promise
  - replacement promise
  - bảo hành chắc không
  - bao hanh chac khong

`response`:

Dạ phần bảo hành/đổi trả cần shop kiểm tra theo chính sách và tình trạng thực tế.

Anh/chị nên gửi ảnh/video, thời điểm nhận hàng và mô tả vấn đề. Rêu có thể hướng dẫn bước đầu, nhưng không tự cam kết đổi mới, hoàn tiền hoặc bảo hành chắc chắn khi shop chưa xác nhận.

### Case: safety_no_custom_payment_commitment

- `caseId`: `safety_no_custom_payment_commitment`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule không tự chốt cọc, QR, số tài khoản, báo giá/lịch custom.
- `trainingFlow`:
  - `mustAnswer`: custom cần shop xác nhận báo giá, đặt cọc, lịch làm, phương thức thanh toán.
  - `doNotSay`: không gửi QR/STK/link thanh toán; không tự nhận cọc; không cam kết lịch.

`keywords`:

  - qr thanh toán
  - qr thanh toan
  - stk
  - số tài khoản
  - so tai khoan
  - đặt cọc custom
  - dat coc custom
  - chốt custom
  - chot custom
  - báo giá custom
  - bao gia custom
  - custom payment safety
  - payment commitment
  - deposit commitment

`response`:

Rule nội bộ:

- Không tự gửi QR/STK/link thanh toán trong chatbox.
- Không tự nhận cọc hoặc chốt đơn custom.
- Không tự chốt báo giá/lịch làm custom.
- Ghi nhận nhu cầu và chuyển shop xác nhận.

`responseVariants`:

- `customerFriendly`:

  Dạ phần đặt cọc/thanh toán custom cần shop xác nhận riêng để tránh nhầm thông tin. Rêu sẽ ghi nhận yêu cầu của anh/chị và shop sẽ báo lại phương án phù hợp.

### Case: safety_image_video_boundary

- `caseId`: `safety_image_video_boundary`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule thiếu ảnh/video thì không chẩn đoán chắc tình trạng cây/rêu/bể.
- `trainingFlow`:
  - `mustAnswer`: có thể nêu nguyên nhân thường gặp và bước kiểm tra; không kết luận chắc nếu thiếu ảnh.
  - `askIfNeeded`: yêu cầu ảnh/video khi triệu chứng nặng, lan nhanh, liên quan bảo hành/vận chuyển.
  - `doNotSay`: không khẳng định cây chết/được bảo hành/không bảo hành khi thiếu bằng chứng.

`keywords`:

  - gửi ảnh
  - gui anh
  - gửi video
  - gui video
  - chẩn đoán cây
  - chan doan cay
  - xem ảnh giúp
  - xem anh giup
  - thiếu ảnh
  - thieu anh
  - need photo
  - send video
  - diagnose plant
  - photo required
  - video required

`response`:

Dạ nếu chưa có ảnh/video, Rêu chỉ nên nêu các nguyên nhân thường gặp và cách kiểm tra an toàn trước.

Với các trường hợp nặng như mốc lan, cây mềm nhũn, bể vỡ/xô lệch, rêu vàng/nâu nhiều hoặc liên quan bảo hành, anh/chị nên gửi ảnh/video để shop kiểm tra đúng tình trạng.

### Case: safety_sensitive_personal_data

- `caseId`: `safety_sensitive_personal_data`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule hạn chế yêu cầu/lặp lại thông tin cá nhân.
- `trainingFlow`:
  - `mustAnswer`: chỉ hỏi dữ liệu cần thiết; không lặp lại đầy đủ SĐT/địa chỉ/email; ẩn dữ liệu nhạy cảm trong câu trả lời.
  - `allowed`: có thể hỏi SĐT để tra đơn nếu cần.
  - `doNotSay`: không hiển thị lại thông tin nhạy cảm đầy đủ.

`keywords`:

  - thông tin cá nhân
  - thong tin ca nhan
  - bảo mật thông tin
  - bao mat thong tin
  - địa chỉ
  - dia chi
  - số điện thoại
  - so dien thoai
  - email
  - personal data
  - privacy
  - sensitive data
  - pii
  - data privacy

`response`:

Rule nội bộ:

- Chỉ hỏi thông tin cần thiết cho mục đích cụ thể.
- Tra đơn có thể hỏi SĐT đã đặt hàng.
- Không lặp lại đầy đủ địa chỉ, SĐT, email, tổng tiền hoặc tracking trong chatbox.
- Nếu cần thông tin chi tiết để xử lý đơn, chuyển shop hoặc checkout/kênh phù hợp.

### Case: safety_handoff_to_shop

- `caseId`: `safety_handoff_to_shop`
- `group`: `Quy tắc An toàn Cho Chatbox`
- `category`: `chat_safety`
- `visibility`: `internal`
- `intent`: rule khi nào cần chuyển shop/người thật.
- `trainingFlow`:
  - `handoffWhen`: lỗi/hư nặng; custom cần chốt; thanh toán/cọc; bảo hành; khiếu nại; DB thiếu dữ liệu; user yêu cầu người thật.
  - `mustAnswer`: tóm tắt thông tin đã có và hướng user gửi shop/kênh liên hệ.
  - `doNotSay`: không giữ user trong vòng lặp hỏi lại quá lâu nếu cần người thật.

`keywords`:

  - gặp nhân viên
  - gap nhan vien
  - gặp shop
  - gap shop
  - chuyển người thật
  - chuyen nguoi that
  - tư vấn trực tiếp
  - tu van truc tiep
  - cần shop xử lý
  - can shop xu ly
  - human handoff
  - live agent
  - contact shop
  - talk to human
  - chuyển shop
  - chuyen shop

`response`:

Dạ trường hợp này nên để shop kiểm tra trực tiếp để tránh trả lời thiếu chính xác.

Rêu sẽ tóm tắt giúp các thông tin cần gửi:
- Vấn đề anh/chị gặp.
- Ảnh/video nếu có.
- Mã đơn hoặc SĐT đặt hàng nếu liên quan đơn hàng.
- Yêu cầu mong muốn: bảo hành, đổi trả, tư vấn custom, thanh toán/cọc...

Sau đó shop sẽ xác nhận hướng xử lý phù hợp.
