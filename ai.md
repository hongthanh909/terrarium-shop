# 🌿 Tài liệu Quản lý & Cấu hình AI Consultant (Tiệm Rêu)

Tài liệu này tổng hợp toàn bộ hướng dẫn cài đặt, cấu hình bảo vệ VPS, chiến lược bán hàng tự động (Sales Playbook) và khả năng hiện tại của hệ thống tư vấn AI tại **Tiệm Rêu**.

---

## 📌 1. Hướng dẫn Cài đặt & Setup

### 1.1 Gemini API (Primary — Khuyên dùng)
Hệ thống sử dụng **Google Gemini API** làm AI chính — nhanh, thông minh, hỗ trợ tiếng Việt tốt.

```env
# Gemini API Key (lấy từ https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIzaSyDXqMPgYWX4p5bOR2D4aA02EZPKn0AQxm8
GEMINI_MODEL=gemini-2.0-flash
```

> **Quota & Billing:**
> - Free tier: 15 requests/phút, 1500 requests/ngày (reset lúc 2:00 PM VN)
> - Paid tier (đã bật billing): **không giới hạn**, chi phí ~250₫/1000 requests
> - Billing account: Google Cloud Console → link billing → upgrade to full account
> - Free trial credit: ₫7,900,051 (90 ngày)

### 1.2 Ollama (Fallback — Khi Gemini offline)
**Ollama** chạy LLM mã nguồn mở trực tiếp trên VPS, không tốn phí API.

*   **Cài đặt trên Linux (VPS):**
    ```bash
    curl -fsSL https://ollama.com/install.sh | sh
    ollama pull llama3:8b    # ~4.7GB, cho VPS 8GB RAM
    ```

```env
# Ollama (fallback)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
```

### 1.3 Environment Variables tổng hợp
File `.env` trên VPS cần có:
```env
# AI — Gemini (primary)
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-2.0-flash

# AI — Ollama (fallback)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3:8b
```

> ⚠️ GitHub Secrets cần có: `GEMINI_API_KEY` — được inject tự động vào VPS qua deploy pipeline.

---

## ✅ 2. Khả năng Hiện tại của AI Chatbot (v7 — Smart Knowledge Base + Gemini + Ollama)

### 2.1 Checklist khả năng

| Khả năng | Trạng thái | Chi tiết |
| :--- | :---: | :--- |
| **Smart Knowledge Base (40+ patterns)** | ✅ | Trả lời instant (<100ms) cho 90% câu hỏi phổ biến, không cần AI. |
| **Gemini API (primary AI)** | ✅ | Google Gemini 2.0 Flash — streaming SSE, 8s timeout, retry on 429. |
| **Ollama (fallback AI)** | ✅ | CPU inference 30s timeout, dùng khi Gemini offline. |
| **Trả lời đúng bằng data thật** | ✅ | Load catalog từ DB (cache 5 phút), inject vào system prompt. |
| **Không bịa sản phẩm/giá** | ✅ | System prompt cấm bịa. Khi DB lỗi → thông báo thành thật. |
| **Gợi ý sản phẩm + link** | ✅ | Max 3 SP kèm link `/products/[slug]`. Frontend hiện thẻ clickable. |
| **Intent Classification** | ✅ | Phân loại: kiến thức/sản phẩm/chính sách/chẩn đoán/chào hỏi. |
| **Streaming (gõ từng chữ)** | ✅ | SSE stream giống ChatGPT, UX mượt mà. |
| **4-layer Fallback** | ✅ | Smart KB → Gemini → Ollama → DB query → Helpful fallback. |
| **Gemini Retry on 429** | ✅ | Tự retry 1 lần sau 2s khi bị rate limit. |
| **Rate Limiting** | ✅ | 8 request/phút/IP. Trả lời thân thiện khi bị giới hạn. |
| **Concurrency Guard** | ✅ | Max 3 AI inference đồng thời. |
| **Session Limit** | ✅ | Max 30 tin nhắn/session. Cooldown 3s. |
| **Input Length Limit** | ✅ | Chặn > 400 ký tự. Counter khi gần giới hạn. |
| **Cross-selling** | ✅ | Gợi ý mua kèm phụ kiện khi khách mua bể. |
| **Guardrails** | ✅ | Từ chối khéo toán, code, chính trị. |
| **Adaptive Response** | ✅ | 2-8 câu tùy intent, không cố định. |

### 2.2 Kiến trúc hệ thống (v7)

```
User → ChatWidget (client)
         ↓ POST /api/consult
         ├─ Rate Limit check (8 req/min/IP)
         ├─ Input validation (≤ 400 chars)
         ↓
    ┌─── Smart Knowledge Base (40+ patterns) ───┐
    │ MATCH? → Trả lời instant (<100ms)          │
    │ NO MATCH ↓                                  │
    ├─── Concurrency check (≤ 3 concurrent)      │
    │    ↓                                        │
    │ ┌─ Gemini API ──┐                           │
    │ │ OK → Stream SSE│  429 → Retry 1x         │
    │ │ FAIL ↓         │                           │
    │ ├─ Ollama ───────┤                           │
    │ │ OK → Stream SSE│  FAIL ↓                  │
    │ ├─ DB Query ─────┤                           │
    │ │ Có SP → JSON   │  Không ↓                 │
    │ └─ Helpful Fallback (hướng dẫn hỏi lại) ───┘
```

---

## ⚡ 3. Kỹ thuật Tối ưu hóa Hiệu suất & Chống Quá tải VPS

### 3.1 Bảo vệ Server (Backend API)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Smart KB First** | 40+ patterns trả lời instant, không gọi AI. | Giảm 90% AI requests. |
| **Rate Limiting (IP-based)** | 8 request/phút/IP. Tự cleanup mỗi 2 phút. | Ngăn spam, DDoS nhẹ. |
| **Concurrent Limiter** | Max 3 AI inference đồng thời. | Bảo vệ VPS + Gemini quota. |
| **Gemini Timeout** | 8 giây + retry 1 lần khi 429. | Nhanh, không treo. |
| **Ollama Timeout** | 30 giây (CPU inference cần thời gian). | Đủ cho llama3:8b. |
| **Input Filter** | Chặn > 400 ký tự. | Ngăn prompt injection. |
| **Catalog Cache** | Cache sản phẩm 5 phút. | Giảm tải PostgreSQL. |
| **History Cap** | Chỉ gửi 4 tin nhắn gần nhất cho Gemini. | Giảm token, tăng tốc. |

### 3.2 Bảo vệ Client (ChatWidget)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Send Cooldown** | 3 giây giữa các tin nhắn. | Ngăn spam click. |
| **Session Limit** | Max 30 tin nhắn/session. | Ngăn lạm dụng AI. |
| **Character Counter** | Hiển thị `xxx/400` khi nhập > 300 ký tự. | UX thông minh. |
| **Abort Controller** | Hủy request khi đóng chat/reset. | Tránh request treo. |
| **Source Badge** | Hiển thị "AI" (xanh) hoặc "Cơ bản" (vàng). | Minh bạch cho user. |

---

## 🎯 4. Chiến lược Bán hàng Tự động & Chốt đơn (Sales Playbook)

### 4.1 Dynamic System Prompting / RAG
Sử dụng **Dynamic System Prompting** kết hợp **RAG** — thông tin luôn chính xác từ DB realtime.

### 4.2 Vai trò "Nhân viên bán hàng chuyên nghiệp"

1. **Guardrails cứng:** Từ chối khéo câu hỏi ngoài lề. Xưng "em", gọi "anh/chị".
2. **Gợi ý sản phẩm thật + Link:** Kèm `Link: /products/[slug]` → Frontend parse thẻ clickable.
3. **Cross-selling:** Bể kín → nhíp, bình xịt. Bể mở → rêu, đá trang trí.
4. **Freeship 500k:** Đơn gần 500k → khuyên thêm phụ kiện nhỏ.
5. **Tư vấn theo nhu cầu:** Hỏi mục đích, kinh nghiệm, ngân sách → gợi ý 1-3 SP.

### 4.3 Kịch bản Chẩn đoán Tình trạng Bể

| Triệu chứng | Nguyên nhân | Xử lý |
| :--- | :--- | :--- |
| Nấm mốc trắng/xám | Quá ẩm, thiếu thông gió | Mở nắp 24-48h, lau nấm, rắc bột quế |
| Rêu chuyển nâu/vàng | Thiếu sáng hoặc tưới quá nhiều | Di chuyển nơi sáng gián tiếp |
| Lá mềm rũ | Thiếu nước | Tưới nhẹ, phun sương |
| Lá vàng + đất ướt | Thừa nước | Mở nắp thoáng, giảm tưới |
| Côn trùng nhỏ | Đất quá ẩm | Để đất khô hơn, phủ cát mỏng |
| Sương mù dày đặc | Quá ẩm bên trong | Mở nắp 30 phút/ngày |

---

## 🛠️ 5. Kiểm tra & Khắc phục sự cố

### 5.1 Test Gemini API
```bash
# Test key hoạt động
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"xin chào"}]}]}' | jq .

# Nếu 429 → kiểm tra quota tại https://ai.dev/rate-limit
# Quota free tier reset lúc 2:00 PM VN (midnight Pacific)
```

### 5.2 Test Ollama
```bash
# Kiểm tra Ollama chạy
sudo systemctl status ollama

# Khởi động lại
sudo systemctl restart ollama

# Test inference
curl -X POST http://localhost:11434/api/chat -d '{
  "model": "llama3:8b",
  "messages": [{"role": "user", "content": "Xin chào"}],
  "stream": false
}'
```

### 5.3 Kiểm tra log
```bash
# Log Next.js (PM2)
pm2 logs terrarium-shop --lines 50

# Tìm log AI cụ thể
pm2 logs terrarium-shop --lines 100 | grep "\[AI\]"
```

### 5.4 Kiểm tra RAM/CPU
```bash
free -h          # Xem RAM
htop             # Xem CPU + process
```
> ⚠️ Nếu RAM < 1GB free → Ollama sẽ rất chậm. Cần kill process thừa hoặc nâng VPS.

---

## 📊 6. Smart Knowledge Base (Instant — 40+ patterns)

Khi AI offline HOẶC câu hỏi phổ biến, chatbot trả lời **ngay lập tức** (<100ms):

### Chăm sóc (trả lời chi tiết, có hướng dẫn cụ thể)
| Chủ đề | Từ khóa trigger |
| :--- | :--- |
| Hướng dẫn tổng quát | "chăm sóc", "cách chăm", "dễ chăm" |
| Tưới nước | "tưới", "bao lâu tưới", "cách tưới" |
| Ánh sáng | "ánh sáng", "nắng", "để ở đâu", "phòng tối" |
| Rêu vàng | "rêu vàng", "rêu héo" |
| Nấm mốc | "nấm", "mốc", "mọc nấm" |
| Cây héo | "héo", "lá rũ", "lá mềm" |
| Lá vàng | "lá vàng", "vàng lá" |
| Côn trùng | "côn trùng", "sâu", "bọ", "ruồi" |
| Bể kín vs mở | "bể kín", "kín hay mở" |
| Người mới | "người mới", "lần đầu", "newbie" |
| Sen đá/xương rồng | "sen đá", "xương rồng", "cactus" |
| Bàn làm việc | "phòng tối", "văn phòng", "bàn học" |

### Chính sách (trả lời đầy đủ)
| Chủ đề | Từ khóa trigger |
| :--- | :--- |
| Vận chuyển | "ship", "giao hàng", "freeship", "phí ship" |
| Đổi trả & bảo hành | "đổi trả", "bảo hành", "hỏng", "vỡ" |
| Thanh toán | "thanh toán", "chuyển khoản", "cod" |
| Khuyến mãi | "giảm giá", "voucher", "khuyến mãi" |
| Liên hệ | "liên hệ", "zalo", "facebook", "hotline" |
| Cách đặt hàng | "cách mua", "cách đặt", "order" |

### Tư vấn
| Chủ đề | Từ khóa trigger |
| :--- | :--- |
| Tư vấn chọn SP | "phù hợp", "nên mua", "tư vấn" |
| Chào hỏi | "xin chào", "hello", "hi", "chào" |
| Cảm ơn | "cảm ơn", "thank" |
| Tạm biệt | "tạm biệt", "bye" |

### Sản phẩm (chuyển qua AI hoặc DB)
| Chủ đề | Từ khóa trigger | Xử lý |
| :--- | :--- | :--- |
| Tìm/mua SP | "sản phẩm", "mua", "giá", "bao nhiêu" | → AI → DB query |
| Giá rẻ/cao cấp | "rẻ", "tiết kiệm", "cao cấp", "premium" | → AI → DB query |

---

## 🔄 7. Changelog

| Ngày | Version | Thay đổi |
| :--- | :--- | :--- |
| 14/06/2026 | v5 | Intent Classification, Adaptive Response, Natural Conversation |
| 15/06/2026 | v7 | **Smart Knowledge Base (40+ patterns)**, Gemini API primary, Ollama fallback, Retry on 429, 4-layer fallback, Pattern order fix, Source badge frontend |

---
*Tài liệu được cập nhật ngày 15 tháng 06 năm 2026 — AI Chatbot v7 (Smart KB + Gemini + Ollama + 4-layer Fallback).*
