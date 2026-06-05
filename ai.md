# 🌿 Tài liệu Quản lý & Cấu hình AI Consultant (Tiệm Rêu)

Tài liệu này tổng hợp toàn bộ hướng dẫn cài đặt mô hình Ollama, cấu hình bảo vệ VPS, chiến lược bán hàng tự động (Sales Playbook) và khả năng hiện tại của hệ thống tư vấn AI tại **Tiệm Rêu**.

---

## 📌 1. Hướng dẫn Cài đặt & Setup Ollama

Hệ thống tư vấn AI sử dụng **Ollama** để chạy các mô hình ngôn ngữ lớn (LLM) mã nguồn mở trực tiếp trên server/VPS mà không tốn phí API bên thứ ba.

### 1.1 Cài đặt Ollama
*   **Trên Windows:** Tải và cài đặt trực tiếp từ [Ollama Official](https://ollama.com/download/windows).
*   **Trên Linux (VPS Ubuntu/Debian):** Chạy lệnh sau để cài đặt tự động:
    ```bash
    curl -fsSL https://ollama.com/install.sh | sh
    ```

### 1.2 Khởi chạy và tải mô hình
Sau khi cài đặt, tải mô hình AI khuyến dùng phù hợp với VPS 8GB RAM:
```bash
# ✅ MÔ HÌNH CHÍNH (VPS CHEAP 6 - 8GB RAM): llama3:8b (~4.7GB)
# Thông minh hơn, tiếng Việt mượt hơn, chất lượng tư vấn tốt hơn rõ rệt
ollama pull llama3:8b

# Dự phòng (VPS 4-6GB RAM thấp hơn): llama3.2:3b (~2GB, nhẹ hơn nhưng chất lượng thấp hơn)
# ollama pull llama3.2:3b
```

### 1.3 Cấu hình biến môi trường (Environment Variables)
Tạo hoặc bổ sung vào file `.env` hoặc cấu hình biến môi trường trên VPS các khóa sau để Next.js kết nối đến Ollama:
```env
# URL chạy dịch vụ Ollama (Mặc định là port 11434)
OLLAMA_BASE_URL=http://localhost:11434

# Tên mô hình đã pull ở bước trên
OLLAMA_MODEL=llama3:8b
```

---

## ✅ 2. Khả năng Hiện tại của AI Chatbot (v4)

### 2.1 Checklist khả năng

| Khả năng | Trạng thái | Chi tiết |
| :--- | :---: | :--- |
| **Trả lời đúng bằng data thật** | ✅ | Load catalog sản phẩm từ DB (cache 5 phút), inject vào system prompt. AI chỉ đề cập sản phẩm THẬT có trong hệ thống. |
| **Không bịa sản phẩm/giá** | ✅ | System prompt cấm tuyệt đối bịa. Khi DB lỗi hoặc trống → thông báo thành thật. |
| **Gợi ý sản phẩm + link** | ✅ | Gợi ý max 3 sản phẩm phù hợp, kèm link `/products/[slug]`. Frontend hiện thẻ sản phẩm clickable. |
| **Nhận biết nhu cầu khách** | ✅ | Prompt hướng dẫn hỏi: mua tự dùng/làm quà, kinh nghiệm, ngân sách → gợi ý phù hợp. |
| **Gợi ý chốt đơn** | ✅ | Hướng dẫn "bấm link → thêm giỏ hàng → thanh toán", nhắc freeship ≥ 500k. |
| **Hướng dẫn chăm sóc** | ✅ | Load careGuide (tưới, sáng, nhiệt độ, ẩm, sự cố) từ DB theo từng sản phẩm. |
| **Chẩn đoán tình trạng bể** | ✅ | System prompt có kịch bản: nấm mốc, côn trùng, héo lá, rêu nâu, sương quá nhiều. |
| **Cross-selling** | ✅ | Gợi ý mua kèm dụng cụ (nhíp, bình xịt) khi khách mua bể kín. |
| **Chỉ trả lời về terrarium** | ✅ | Guardrails cứng: từ chối khéo toán, code, chính trị, khoa học khác. |
| **Streaming (gõ từng chữ)** | ✅ | SSE stream giống ChatGPT, UX mượt mà. |
| **3-layer Fallback** | ✅ | Ollama → DB query → Knowledge base tĩnh (15+ chủ đề). |
| **Rate Limiting (chống spam)** | ✅ | 6 request/phút/IP. Trả lời thân thiện khi bị giới hạn. |
| **Concurrency Guard** | ✅ | Tối đa 2 Ollama inference đồng thời (bảo vệ VPS 8GB RAM). |
| **Session Limit** | ✅ | Max 30 tin nhắn/session. Cooldown 3 giây giữa các tin. |
| **Input Length Limit** | ✅ | Chặn tin nhắn > 400 ký tự. Hiển thị counter khi gần giới hạn. |

### 2.2 Kiến trúc hệ thống

```
User → ChatWidget (client)
         ↓ POST /api/consult
         ├─ Rate Limit check (6 req/min/IP)
         ├─ Input validation (≤ 400 chars)
         ├─ Concurrency check (≤ 2 concurrent)
         ↓
    ┌─── Ollama Online? ───┐
    │ YES                  │ NO
    ↓                      ↓
  Stream SSE         ┌─ DB Query ──┐
  (llama3:8b)        │ Có sản phẩm │ Không
                     ↓             ↓
               JSON response   Knowledge Base
```

---

## ⚡ 3. Kỹ thuật Tối ưu hóa Hiệu suất & Chống Quá tải VPS

### 3.1 Bảo vệ Server (Backend API)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Rate Limiting (IP-based)** | 6 request/phút/IP. In-memory Map, tự cleanup mỗi 2 phút. HTTP 429 khi vượt. | Ngăn spam, DDoS nhẹ. |
| **Concurrent Inference Limiter** | Tối đa 2 Ollama inference đồng thời. Vượt → fallback DB/knowledge. | VPS 8GB RAM: 2 PM2 + Ollama → chỉ đủ 2 concurrent. |
| **Input Filter** | Chặn tin nhắn > 400 ký tự. | Ngăn copy bài dài, prompt injection. |
| **Output Limiter (`num_predict`)** | 400 tokens. | Cân bằng chất lượng vs tốc độ. |
| **Stop Sequences** | `["\nUser:", "User:", "\nKhách:", "Khách:"]` | Ngăn AI tự viết tiếp hội thoại (hallucination loop). |
| **Timeout** | 60 giây. | llama3:8b cần thời gian nạp model lần đầu. |
| **Catalog Cache** | Cache sản phẩm 5 phút. | Giảm tải PostgreSQL. |
| **History Cap** | Chỉ gửi 6 tin nhắn gần nhất. | Giảm token count, tăng tốc inference. |

### 3.2 Bảo vệ Client (ChatWidget)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Send Cooldown** | 3 giây giữa các tin nhắn. Nút gửi bị disable. | Ngăn spam click. |
| **Session Limit** | Max 30 tin nhắn/session. Sau đó hướng dẫn liên hệ Zalo. | Ngăn lạm dụng AI. |
| **Character Counter** | Hiển thị `xxx/400` khi nhập > 300 ký tự. Chặn nhập vượt 400. | UX thông minh + bảo vệ. |
| **Abort Controller** | Hủy request khi đóng chat hoặc reset. | Tránh request treo. |

---

## 🎯 4. Chiến lược Bán hàng Tự động & Chốt đơn (Sales Playbook)

### 4.1 Dynamic System Prompting / RAG
Chúng ta sử dụng **Dynamic System Prompting** kết hợp **RAG** (Retrieval-Augmented Generation) thay vì train lại mô hình. Thông tin luôn chính xác và cập nhật theo thời gian thực từ DB.

### 4.2 Vai trò "Nhân viên bán hàng chuyên nghiệp"

1. **Chặn chủ đề ngoài lề (Strict Guardrails):**
   AI từ chối khéo các câu hỏi không liên quan đến terrarium. Xưng "em", gọi khách "anh/chị".

2. **Gợi ý sản phẩm thật + Link click:**
   Mỗi lần giới thiệu sản phẩm → kèm `Link: /products/[slug]`. Frontend parse → hiện thẻ sản phẩm clickable.

3. **Bán chéo (Cross-selling):**
   - Bể kín → gợi ý nhíp dài, bình xịt phun sương
   - Bể mở → gợi ý rêu, đá trang trí

4. **Thúc đẩy bằng Freeship 500k:**
   Đơn gần 500k → khuyên thêm phụ kiện nhỏ để được freeship toàn quốc.

5. **Tư vấn theo nhu cầu:**
   Hỏi mục đích (quà/tự dùng), kinh nghiệm, ngân sách → gợi ý 1-3 sản phẩm phù hợp nhất.

### 4.3 Kịch bản Chẩn đoán Tình trạng Bể

| Triệu chứng | Nguyên nhân | Xử lý |
| :--- | :--- | :--- |
| Nấm mốc trắng/xám | Quá ẩm, thiếu thông gió | Mở nắp 24-48h, lau nấm, giảm tưới, thêm than hoạt tính |
| Rêu chuyển nâu/vàng | Thiếu sáng hoặc tưới quá nhiều | Di chuyển nơi sáng gián tiếp, kiểm tra ẩm đất |
| Lá mềm rũ | Thiếu nước | Tưới nhẹ |
| Lá vàng + đất ướt | Thừa nước | Mở nắp thoáng, giảm tưới |
| Côn trùng nhỏ (ruồi giấm) | Đất quá ẩm, hữu cơ phân hủy | Để đất khô hơn, phủ cát mỏng |
| Sương mù dày đặc (bể kín) | Quá ẩm bên trong | Mở nắp 30 phút/ngày |

---

## 🛠️ 5. Kiểm tra & Khắc phục sự cố

### Bước 1: Kiểm tra Ollama đang chạy
```bash
# Trên Linux (VPS)
sudo systemctl status ollama

# Khởi động lại
sudo systemctl restart ollama
```

### Bước 2: Kiểm tra kết nối API → Ollama
```bash
curl http://localhost:11434/api/tags
```
Nếu trả về JSON danh sách model → kết nối OK.

### Bước 3: Test nhanh inference
```bash
curl -X POST http://localhost:11434/api/chat -d '{
  "model": "llama3:8b",
  "messages": [{"role": "user", "content": "Xin chào"}],
  "stream": false
}'
```
Nếu trả về response tiếng Việt → model hoạt động bình thường.

### Bước 4: Kiểm tra log Next.js
```bash
# Nếu dùng PM2
pm2 logs terrarium-shop --lines 50

# Nếu dùng Docker
docker logs -f terrarium-web --tail 50
```

### Bước 5: Kiểm tra RAM/CPU VPS
```bash
free -h          # Xem RAM
htop             # Xem CPU + process
```
> ⚠️ Nếu RAM < 1GB free → Ollama sẽ rất chậm hoặc crash. Cần kill process thừa hoặc nâng cấp VPS.

---

## 📊 6. Fallback Knowledge Base (Offline)

Khi Ollama offline, chatbot tự động chuyển sang knowledge base tĩnh hỗ trợ **15+ chủ đề**:

| Chủ đề | Từ khóa trigger |
| :--- | :--- |
| Chăm sóc terrarium | "chăm sóc" |
| Hướng dẫn tưới | "tưới nước" |
| Ánh sáng | "ánh sáng" |
| Cây phòng tối | "phòng tối" |
| Xử lý nấm mốc | "nấm" |
| Xử lý côn trùng | "côn trùng" |
| Cây héo/vàng lá | "héo" |
| Cách mua hàng | "mua" |
| Vận chuyển | "vận chuyển" |
| Bảo hành | "bảo hành" |
| Voucher giảm giá | "voucher" |
| Combo sản phẩm | "combo" |
| Terrarium kín | "terrarium kín" |
| Terrarium mở | "terrarium mở" |
| Chào hỏi | "xin chào", "hello", "hi" |
| Cảm ơn | "cảm ơn", "thank" |

---
*Tài liệu được cập nhật ngày 05 tháng 06 năm 2026 — AI Chatbot v4 (Rate Limiting + Diagnosis + Sales Playbook).*
