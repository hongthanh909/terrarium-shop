# Chatbox GPT-5 Mini Migration Checklist

Muc tieu: chuyen chatbox hien tai sang kien truc hybrid dung `gpt-5-mini`, trong do DB/KB la nguon su that, GPT chi dung de hieu cau hoi va dien giai cau tra loi linh hoat.

## 1. Cau Hinh Moi Truong

- [ ] Them bien moi vao `.env` cua `apps/web` tren local va VPS:
  - `OPENAI_API_KEY=...`
  - `OPENAI_MODEL=gpt-5-mini`
  - `AI_PROVIDER=openai`
  - `AI_CHAT_ENABLED=true`
- [ ] Giu lai cau hinh Ollama hien tai trong thoi gian chuyen doi:
  - `OLLAMA_URL=http://localhost:11434`
  - `OLLAMA_MODEL=llama3.2:3b`
- [ ] Dat rule uu tien:
  - Neu `AI_PROVIDER=openai` thi goi OpenAI.
  - Neu OpenAI loi va con Ollama thi fallback sang Ollama.
  - Neu ca hai loi thi tra KB/DB fallback.
- [ ] Cap nhat GitHub Actions/VPS secret neu can:
  - Them `OPENAI_API_KEY` vao server `.env`.
  - Khong commit key vao repo.

## 2. Cai SDK OpenAI

- [ ] Cai dependency trong workspace web:
  - `npm.cmd install openai --workspace apps/web`
- [ ] Kiem tra `apps/web/package.json` co dependency `openai`.
- [ ] Dam bao build VPS se chay `npm install` va co package moi.
- [ ] Sau khi cai, chay:
  - `npm.cmd run test --workspace apps/web`
  - `npm.cmd run lint --workspace apps/web`

## 3. Tao Provider Rieng Cho OpenAI

- [ ] Tao file:
  - `apps/web/lib/ai/openai.ts`
- [ ] Trong file nay tao function chinh:
  - `streamFromOpenAI(messages, options)`
- [ ] Function can nhan:
  - `systemPrompt`
  - `history`
  - `userMessage`
  - `knowledgeContext`
  - `pageContext`
- [ ] Function can tra ve stream SSE tuong thich voi ChatWidget hien tai.
- [ ] Su dung model tu env:
  - `process.env.OPENAI_MODEL || "gpt-5-mini"`
- [ ] Neu thieu `OPENAI_API_KEY`, return `null` de route fallback.
- [ ] Log loi ngan gon, khong log API key.

## 4. Giu Ollama Lam Fallback Tam Thoi

- [ ] Giu cac function hien tai trong `apps/web/app/api/consult/route.ts`:
  - `streamFromOllama`
  - `streamFromAI`
  - `buildSystemPrompt`
- [ ] Refactor de `streamFromAI` chon provider theo `AI_PROVIDER`.
- [ ] Flow moi:
  - Neu `AI_PROVIDER=openai`: thu OpenAI truoc.
  - Neu OpenAI fail: thu Ollama neu co cau hinh.
  - Neu `AI_PROVIDER=ollama`: giu flow cu.
- [ ] Them log:
  - `[AI] Trying OpenAI model: gpt-5-mini`
  - `[AI] OpenAI connected`
  - `[AI] OpenAI unavailable, fallback...`

## 5. Refactor `/api/consult` Thanh Hybrid Flow

- [ ] File can sua:
  - `apps/web/app/api/consult/route.ts`
- [ ] Flow mong muon:
  1. Check `AI_CHAT_ENABLED`.
  2. Rate limit.
  3. Validate message length.
  4. Guardrail/off-topic.
  5. Detect product/order/policy/care intent.
  6. Query DB/KB truoc.
  7. Gom context.
  8. Goi GPT neu can dien giai.
  9. Neu context du ro va cau tra loi ngan: co the tra truc tiep khong goi GPT.
  10. Fallback an toan.
- [ ] Nguyen tac:
  - San pham/gia/ton kho/link: lay tu DB.
  - Don hang: lay tu DB theo user/session.
  - Chinh sach: lay tu KB admin hoac hard-coded policy neu chua co KB.
  - Cham soc/xu ly su co: lay tu KB cham soc.
  - GPT khong duoc tu bia san pham, gia, ton kho, chinh sach.

## 6. Product Intent Va DB Query

- [ ] Kiem tra function hien tai:
  - `isProductIntent`
  - `queryProducts`
  - `getProductConsultNotes`
- [ ] Bo sung intent cho "be da setup":
  - `be nao da setup`
  - `be san`
  - `mau da lam san`
  - `nhan ve trung ngay`
  - `full set`
  - `da setup`
  - `setup san`
- [ ] Neu DB chua co field/tag setup, them mot trong hai cach:
  - Cach nhanh: dung category/tag/keyword trong ten mo ta san pham.
  - Cach tot: them field `setupStatus` hoac `readyToDisplay`.
- [ ] De xuat field:
  - `readyToDisplay Boolean @default(false)`
  - hoac `setupType String?` voi gia tri `READY`, `DIY`, `CUSTOM`.
- [ ] Cap nhat admin product form de quan ly field nay.
- [ ] Cap nhat queryProducts:
  - Neu intent la "da setup" thi filter san pham `readyToDisplay=true`.
  - Neu khong co san pham phu hop thi hoi lai hoac goi y custom.

## 7. Knowledge Base Admin

- [ ] Man admin hien tai:
  - `/tiem-nho-nth24/ai-knowledge`
- [ ] API hien tai:
  - `apps/web/app/api/admin/ai-knowledge/route.ts`
  - `apps/web/app/api/admin/ai-knowledge/seed/route.ts`
- [ ] Seed hien tai:
  - `apps/web/lib/ai-knowledge-defaults.ts`
  - `apps/web/lib/ai-knowledge-additional.ts`
- [ ] Chuan hoa KB theo nhom:
  - `product`
  - `policy`
  - `care`
  - `troubleshooting`
  - `order`
  - `system`
- [ ] Moi entry KB nen ngan, 1 y ro rang:
  - `keyword`: cac cach user hay noi.
  - `category`: nhom noi dung.
  - `priority`: muc uu tien.
  - `response`: cau tra loi chuan.
  - `isActive`: bat/tat.
- [ ] Khong nen viet KB qua dai gom nhieu chu de, vi retrieval de match sai.

## 8. KB Can Them Cho Tiem Reu

- [ ] Nhom san pham da setup:
  - Keyword: `be da setup, be san, setup san, mau lam san, nhan ve trung ngay, full set`
  - Noi dung: giai thich day la cac be da hoan thien, co the trung bay ngay, chatbot phai lay san pham tu DB.
- [ ] Nhom nguoi moi:
  - Keyword: `nguoi moi, lan dau choi, de cham, it cham`
  - Noi dung: uu tien be kin/de cham, hoi them vi tri dat va ngan sach.
- [ ] Nhom tu van theo ngan sach:
  - Keyword: `duoi 500k, tam 1tr, ngan sach, gia re, binh dan`
  - Noi dung: bat buoc query DB theo gia.
- [ ] Nhom bao hanh:
  - Keyword: `bao hanh 7 ngay, sau 7 ngay, cay hu, be hong`
  - Noi dung: neu do van chuyen/shop thi bao hanh 7 ngay; cham sai cach khong ap dung.
- [ ] Nhom doi tra:
  - Keyword: `doi tra, vo be, loi van chuyen, mo hang`
  - Noi dung: doi tra 3 ngay neu loi van chuyen, can anh/video.
- [ ] Nhom tuoi nuoc:
  - Keyword: `tuoi nuoc, phun suong, bao lau tuoi, tuoi nhieu`
  - Noi dung: be kin/be mo/sen da xac dinh tan suat khac nhau.
- [ ] Nhom moc/nam:
  - Keyword: `moc, nam, reu moc, be bi moc`
  - Noi dung: mo nap, giam am, gap bo la muc, dat noi sang gian tiep.
- [ ] Nhom cay heo/vang:
  - Keyword: `cay heo, la vang, reu vang, thoi re`
  - Noi dung: phan biet thieu nuoc, du nuoc, thieu sang, soc moi truong.

## 9. Prompt He Thong Cho GPT

- [ ] Tao prompt moi trong:
  - `apps/web/lib/ai/prompt.ts`
  - hoac giu trong `buildSystemPrompt` neu chua refactor.
- [ ] Prompt can co quy tac:
  - Ban la tro ly cua Tiem Reu Decor.
  - Tra loi tieng Viet, than thien, ngan gon.
  - Chi tra loi thong tin shop dua tren DB/KB context.
  - Khong tu bia gia, ton kho, link, chinh sach, don hang.
  - Neu context thieu, hoi lai 1 cau ngan gon.
  - Neu cau hoi ve cham soc co KB, dung KB lam nguon chinh.
  - Neu user hoi san pham, uu tien tra ve san pham tu DB.
- [ ] Prompt nen co output style:
  - 1-2 cau mo dau.
  - Bullet ngan neu can.
  - Ket thuc bang cau hoi tiep theo neu thieu thong tin.
- [ ] Khong nhan manh "AI" voi user.

## 10. Context Dua Vao GPT

- [ ] Context toi da nen gom:
  - 4-6 tin gan nhat trong history.
  - 3-5 KB hit lien quan nhat.
  - 3-6 san pham lien quan nhat tu DB.
  - Page context hien tai neu user dang o product/page.
- [ ] Khong gui toan bo KB vao GPT.
- [ ] Khong gui toan bo catalog san pham.
- [ ] San pham context nen co:
  - ten
  - slug/link
  - gia
  - salePrice
  - ton kho
  - category
  - tag setup/ready neu co
- [ ] Policy context nen lay tu KB/admin, khong de GPT tu suy luan.

## 11. Streaming Tu OpenAI Sang ChatWidget

- [ ] ChatWidget hien tai da nhan SSE dang `data: {"token":"..."}`
- [ ] OpenAI provider can convert stream ve format cu:
  - moi token: `data: {"token":"text"}\n\n`
  - ket thuc: `data: [DONE]\n\n`
- [ ] Neu OpenAI tra ve loi:
  - return `null`
  - route fallback sang KB/Ollama.
- [ ] Dam bao frontend khong can sua nhieu.

## 12. Logging Va Chi Phi

- [ ] Them log token/cost co ban:
  - provider
  - model
  - source: `db`, `knowledge`, `rag`, `openai`, `fallback`
  - response time
  - estimated input/output tokens neu co
- [ ] Khong log full thong tin ca nhan user.
- [ ] Tao bang log neu can:
  - `AiChatLog`
  - fields: `id`, `message`, `source`, `model`, `latencyMs`, `createdAt`, `userId?`
- [ ] Them co che xem "cau hoi sai" trong admin sau nay.
- [ ] Gioi han chi phi:
  - rate limit hien tai giu 8 request/phut/IP.
  - max message 400 ky tu.
  - max history 4-6 messages.
  - max KB hits 5.
  - max products context 6.

## 13. Fallback Khi OpenAI Loi

- [ ] Neu product intent va DB co san pham:
  - tra DB truc tiep.
- [ ] Neu policy/care KB match:
  - tra KB truc tiep.
- [ ] Neu OpenAI loi va Ollama hoat dong:
  - fallback Ollama.
- [ ] Neu ca OpenAI/Ollama deu loi:
  - tra cau an toan:
    - "Dạ Rêu chưa trả lời chính xác được câu này, anh/chị cho Rêu thêm ảnh/mô tả hoặc liên hệ shop nhé."
- [ ] Khong de user nhan loi ky thuat raw.

## 14. Test Case Bat Buoc

- [ ] San pham setup:
  - `bể nào đã setup`
  - `có mẫu nào nhận về trưng luôn không`
  - `bể full set giá bao nhiêu`
- [ ] Gia/ngan sach:
  - `có mẫu dưới 500k không`
  - `tầm 1tr có bể nào đẹp`
  - `sản phẩm giá rẻ`
- [ ] Ton kho:
  - `mẫu này còn hàng không`
  - `còn mẫu nào khác không`
- [ ] Chinh sach:
  - `sau 7 ngày có bảo hành không`
  - `bể bị vỡ khi giao thì sao`
  - `ship tỉnh mất bao lâu`
- [ ] Cham soc:
  - `bể bị mốc xử lý sao`
  - `bao lâu tưới nước`
  - `cây bị vàng lá`
  - `lỡ tưới nhiều quá`
- [ ] Cau hoi mo ho:
  - `để phòng ngủ được không`
  - `người mới nên chọn bể nào`
  - `làm quà tặng nên mua mẫu nào`
- [ ] Off-topic:
  - `viết code python`
  - `giải bài toán`
  - `bitcoin hôm nay`

## 15. Kiem Thu UI Chatbox

- [ ] Mo chatbox desktop.
- [ ] Mo chatbox mobile width 390-430px.
- [ ] Gui cau hoi dai va cau tra loi dai.
- [ ] Kiem tra:
  - cau hoi user con hien trong khung.
  - cau tra loi nam ngay duoi cau hoi.
  - product cards nam trong vung scroll.
  - input khong che noi dung.
  - resize tren/duoi/trai/phai van on.
- [ ] Kiem tra streaming khong lam scroll nhay xuong mat cau hoi.

## 16. Deploy

- [ ] Commit code.
- [ ] Push len `main`.
- [ ] GitHub Actions se chay workflow deploy VPS.
- [ ] Xac nhan Actions success.
- [ ] Vao site that test:
  - `https://tiemreudecor.com`
- [ ] Test 5-10 cau hoi that tren production.
- [ ] Neu loi OpenAI key/env:
  - SSH vao VPS kiem tra `.env`.
  - Restart PM2.

## 17. Sau Khi Deploy

- [ ] Theo doi log 3-7 ngay.
- [ ] Gom cac cau hoi chatbot tra loi sai.
- [ ] Phan loai loi:
  - intent sai
  - KB thieu
  - DB thieu field/tag
  - prompt chua chat
  - model can context khac
- [ ] Moi ngay bo sung KB/keyword cho cau hoi thuc te.
- [ ] Sau khi on dinh, co the tat Ollama neu khong can fallback.

## 18. Thu Tu Lam Khuyen Nghi

1. Them env va cai SDK OpenAI.
2. Tao OpenAI provider rieng.
3. Refactor `streamFromAI` de chon OpenAI/Ollama.
4. Giu flow DB/KB truoc GPT.
5. Them KB/intent cho "be da setup".
6. Test local.
7. Commit va deploy.
8. Theo doi log va bo sung KB thuc te.
