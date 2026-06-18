# 🌿 Tài liệu Quản lý & Cấu hình AI Consultant (Tiệm Rêu)

Tài liệu này tổng hợp toàn bộ hướng dẫn cài đặt, cấu hình, chiến lược bán hàng tự động (Sales Playbook) và khả năng hiện tại của hệ thống tư vấn AI tại **Tiệm Rêu**.

---

## 📌 1. Hướng dẫn Cài đặt & Setup

### 1.1 Chế độ hiện tại: Smart KB + Ollama llama3.2:3b

Chatbox hoạt động theo thứ tự:
1. **Smart Knowledge Base** (instant <100ms) — xử lý 90% câu hỏi phổ biến
2. **Ollama llama3.2:3b** (~2GB RAM) — xử lý câu hỏi phức tạp, tư vấn thông minh
3. **DB Product Query** — tra cứu sản phẩm thật từ database
4. **Helpful Fallback** — khi tất cả không match

> ✅ **Gemini API đã bị xóa hoàn toàn** khỏi code — không dùng nữa.

```env
# File .env trên VPS — Chỉ cần Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### 1.2 Cài đặt Ollama trên VPS (llama3.2:3b ~2GB)

```bash
# SSH vào VPS:

# Kiểm tra Ollama đã cài chưa
ollama --version

# Kéo model llama3.2:3b (~2GB — phù hợp VPS 8GB RAM không GPU)
ollama pull llama3.2:3b

# Xóa model cũ llama3:8b (~4.7GB) nếu còn tồn tại
ollama rm llama3:8b 2>/dev/null
ollama rm llama3.2:3b-old 2>/dev/null   # nếu có bản cũ

# Khởi động Ollama service
sudo systemctl enable ollama && sudo systemctl start ollama

# Kiểm tra Ollama đang chạy
curl http://localhost:11434/api/tags

# Xác nhận RAM sau khi kéo model
free -h
```

**Lý do chọn llama3.2:3b:**
| Model | RAM usage | Tốc độ (CPU) | Chất lượng |
|---|---|---|---|
| `llama3:8b` ❌ | ~4.7GB | 15-30s/request | Tốt |
| `llama3.2:3b` ✅ | ~2GB | 5-15s/request | Khá tốt |
| `qwen2.5:1.5b` | ~0.9GB | 3-8s/request | Trung bình |

> ⚠️ **Lưu ý**: VPS 8GB RAM, không GPU. `llama3.2:3b` chiếm ~2GB, còn ~6GB cho Next.js + DB — đủ dùng.

### 1.3 Gemini API — Đã xóa hoàn toàn

Gemini API đã **bị xóa khỏi code** trong v9. Không còn bất kỳ dependency nào với Google AI.

- ~~Không cần `GEMINI_API_KEY`~~
- ~~Không cần nạp credit~~
- ~~Không có timeout chờ Gemini~~

---

## ✅ 2. Khả năng Hiện tại của AI Chatbot (v9 — Smart KB + Ollama)

### 2.1 Checklist khả năng

| Khả năng | Trạng thái | Chi tiết |
| :--- | :---: | :--- |
| **Smart Knowledge Base (40+ patterns)** | ✅ | Trả lời instant (<100ms) cho 90% câu hỏi phổ biến. |
| **Ollama llama3.2:3b** | ✅ | AI thông minh cho câu hỏi phức tạp (~5-15s). |
| **DB Product Query** | ✅ | Tìm sản phẩm từ DB khi Ollama offline. |
| **Helpful Fallback** | ✅ | Gợi ý chủ đề + liên hệ trực tiếp khi không match. |
| **Gemini API** | ❌ | Đã xóa hoàn toàn khỏi code. |
| **Trả lời đúng bằng data thật** | ✅ | Load catalog từ DB (cache 5 phút). |
| **Không bịa sản phẩm/giá** | ✅ | Knowledge Base dùng data cứng. Ollama nhận catalog từ DB. |
| **Gợi ý sản phẩm + link** | ✅ | Max 3 SP kèm link `/products/[slug]`. |
| **Intent Classification** | ✅ | Phân loại qua regex patterns. |
| **Rate Limiting** | ✅ | 8 request/phút/IP. |
| **Session Limit** | ✅ | Max 30 tin nhắn/session. Cooldown 3s. |
| **Input Length Limit** | ✅ | Chặn > 400 ký tự. |
| **Cross-selling** | ✅ | Gợi ý mua kèm phụ kiện. |
| **Guardrails** | ✅ | Từ chối khéo câu hỏi ngoài lề. |

### 2.2 Kiến trúc hệ thống (v9)

```
User → ChatWidget (client)
         ↓ POST /api/consult
         ├─ Rate Limit check (8 req/min/IP)
         ├─ Input validation (≤ 400 chars)
         ↓
    ┌─── 1. Smart Knowledge Base (40+ patterns) ───┐
    │ MATCH? → Trả lời instant (<100ms)             │
    │ source: "knowledge"                            │
    │                                               │
    │ NO MATCH ↓                                    │
    │                                               │
    │ ┌─ 2. Ollama llama3.2:3b (~2GB RAM) ────────┐ │
    │ │ Streaming response, tiếng Việt            │ │
    │ │ Timeout: 25s, Max concurrent: 2           │ │
    │ │ source: "ai" (streaming)                  │ │
    │ └───────────────────────────────────────────┘ │
    │                                               │
    │ Ollama offline? ↓                             │
    │                                               │
    ├─── 3. DB Product Query ──────────────────────┤
    │ Có sản phẩm match? → JSON response           │
    │ source: "db"                                  │
    │                                               │
    │ ↓                                             │
    └─── 4. Helpful Fallback ──────────────────────┘
         Gợi ý chủ đề + liên hệ trực tiếp
         source: "fallback"
```

### 2.3 So sánh v8 vs v9

| | v8 (trước) | v9 (hiện tại) |
|---|---|---|
| **AI** | Không có (KB Only) | **Ollama llama3.2:3b** |
| **Tốc độ KB** | <100ms | <100ms |
| **Tốc độ AI** | N/A | 5-15s (streaming) |
| **RAM usage** | ~1.5/8 GB | **~3.5/8 GB** (với Ollama) |
| **Chi phí** | ₫0 | **₫0** |
| **Độ phủ** | 90% (10% fallback) | **~98%** (KB + AI + DB) |
| **Gemini** | Tắt | **Xóa hoàn toàn** |

---

## ⚡ 3. Kỹ thuật Tối ưu hóa Hiệu suất

### 3.1 Bảo vệ Server (Backend API)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Smart KB First** | 40+ patterns trả lời instant, không gọi AI. | Giảm 90% AI requests. |
| **Rate Limiting (IP-based)** | 8 request/phút/IP. Tự cleanup mỗi 2 phút. | Ngăn spam, DDoS nhẹ. |
| **Input Filter** | Chặn > 400 ký tự. | Ngăn prompt injection. |
| **Catalog Cache** | Cache sản phẩm 5 phút. | Giảm tải PostgreSQL. |
| **Concurrency Limit** | Max 2 request Ollama đồng thời. | Tránh RAM spike. |
| **Ollama Timeout** | 25s cho CPU inference. | Tránh request treo. |

### 3.2 Bảo vệ Client (ChatWidget)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Send Cooldown** | 3 giây giữa các tin nhắn. | Ngăn spam click. |
| **Session Limit** | Max 30 tin nhắn/session. | Ngăn lạm dụng. |
| **Character Counter** | Hiển thị `xxx/400` khi nhập > 300 ký tự. | UX thông minh. |
| **Abort Controller** | Hủy request khi đóng chat/reset. | Tránh request treo. |
| **Source Badge** | Hiển thị nguồn phản hồi (Knowledge/DB/Fallback). | Minh bạch. |

---

## 🎯 4. Chiến lược Bán hàng Tự động & Chốt đơn (Sales Playbook)

### 4.1 Dynamic Knowledge Base
Sử dụng **40+ regex patterns** cho trả lời instant — thông tin luôn chính xác, không bịa.

### 4.2 Vai trò "Nhân viên bán hàng chuyên nghiệp"

1. **Guardrails cứng:** Từ chối khéo câu hỏi ngoài lề. Xưng "em", gọi "anh/chị".
2. **Gợi ý sản phẩm thật + Link:** Kèm `Link: /products/[slug]` → Frontend parse thẻ clickable.
3. **Cross-selling:** Bể kín → nhíp, bình xịt. Bể mở → rêu, đá trang trí.
4. **Freeship 500k:** Đơn gần 500k → khuyên thêm phụ kiện nhỏ.
5. **Tư vấn theo nhu cầu:** Gợi ý 1-3 SP theo mục đích, kinh nghiệm, ngân sách.

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

### 5.1 Kiểm tra chatbox hoạt động
```bash
# Test Smart KB (instant)
curl -s -X POST https://tiemreudecor.com/api/consult \
  -H "Content-Type: application/json" \
  -d '{"message": "ship bao lâu"}' | jq .

# Expected: source = "knowledge", phản hồi instant

# Test Ollama (AI)
curl -s -X POST https://tiemreudecor.com/api/consult \
  -H "Content-Type: application/json" \
  -d '{"message": "bể nào phù hợp cho người thích du lịch"}' | jq .

# Expected: streaming response từ Ollama (hoặc fallback nếu Ollama chưa bật)
```

### 5.2 Cài đặt Ollama lần đầu trên VPS
```bash
# SSH vào VPS:

# Cài Ollama (nếu chưa có)
curl -fsSL https://ollama.ai/install.sh | sh

# Kéo model nhẹ (~2GB)
ollama pull llama3.2:3b

# Xóa model cũ 4.7GB nếu còn
ollama rm llama3:8b 2>/dev/null

# Bật service
sudo systemctl enable ollama && sudo systemctl start ollama

# Kiểm tra
ollama list
free -h
```

### 5.3 Kiểm tra Ollama trên VPS
```bash
# Kiểm tra service
sudo systemctl status ollama

# Test trực tiếp Ollama API
curl http://localhost:11434/api/chat \
  -d '{"model":"llama3.2:3b","messages":[{"role":"user","content":"xin chào"}],"stream":false}'

# Xem model đang có
ollama list
```

### 5.4 Kiểm tra log
```bash
# Log Next.js (PM2)
pm2 logs terrarium-shop --lines 50

# Kiểm tra RAM/CPU (quan trọng khi Ollama chạy)
free -h
htop

# Log Ollama
journalctl -u ollama -f
```

### 5.5 Tắt Ollama nếu VPS thiếu RAM
```bash
# Tắt Ollama (chatbox sẽ dùng KB + DB, không có AI)
sudo systemctl stop ollama
sudo systemctl disable ollama

# Chatbox vẫn hoạt động tốt với KB + DB (v8 mode)
```

---

## 📊 6. Smart Knowledge Base (Instant — 40+ patterns)

Chatbot trả lời **ngay lập tức** (<100ms) cho các chủ đề sau:

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

### Sản phẩm (Ollama → DB query)
| Chủ đề | Từ khóa trigger | Xử lý |
| :--- | :--- | :--- |
| Tìm/mua SP | "sản phẩm", "mua", "giá", "bao nhiêu" | → Ollama hoặc DB query |
| Giá rẻ/cao cấp | "rẻ", "tiết kiệm", "cao cấp", "premium" | → Ollama hoặc DB query |

---

## 🔄 7. Changelog

| Ngày | Version | Thay đổi |
| :--- | :--- | :--- |
| 14/06/2026 | v5 | Intent Classification, Adaptive Response, Natural Conversation |
| 15/06/2026 | v7 | Smart Knowledge Base (40+ patterns), Gemini API primary, Ollama fallback |
| 15/06/2026 | v8 | Tắt Gemini (cần prepay) + Tắt Ollama (VPS không đủ RAM). Chatbox chạy 100% Knowledge Base + DB query. |
| 18/06/2026 | **v9** | **Xóa Gemini hoàn toàn. Bật Ollama llama3.2:3b (~2GB, thay thế llama3:8b 4.7GB). Flow mới: KB → Ollama → DB → Fallback.** |

---
*Tài liệu được cập nhật ngày 18 tháng 06 năm 2026 — AI Chatbot v9 (Smart KB + Ollama llama3.2:3b).*
