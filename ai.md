# 🌿 Tài liệu Quản lý & Cấu hình AI Consultant (Tiệm Rêu)

Tài liệu này tổng hợp toàn bộ hướng dẫn cài đặt, cấu hình, chiến lược bán hàng tự động (Sales Playbook) và khả năng hiện tại của hệ thống tư vấn AI tại **Tiệm Rêu**.

---

## 📌 1. Hướng dẫn Cài đặt & Setup

### 1.1 Chế độ hiện tại: Smart Knowledge Base (Không cần AI)

Chatbox hoạt động **100% bằng Knowledge Base + DB query**, không dùng AI model nào.
Phản hồi **instant (<100ms)**, không tốn chi phí, không tốn RAM.

```env
# File .env trên VPS — KHÔNG cần Gemini/Ollama
# AI layers đã tắt trong code (route.ts)
```

### 1.2 Gemini API (Tắt — cần nạp credit để bật)

Gemini API yêu cầu **prepay credit** (tối thiểu ₫300,000 ≈ $12).

- **Nạp credit**: https://aistudio.google.com/billing
- **API Key hiện tại**: `AIzaSyDXqMPgYWX4p5bOR2D4aA02EZPKn0AQxm8` (project: Default Gemini Project)
- **Billing account**: Google Cloud — đã upgrade Full Account (credit ₫7.9M cho GCP, riêng Gemini API cần prepay riêng)

**Để bật lại Gemini:**
1. Nạp credit tại https://aistudio.google.com/billing (₫300,000+)
2. Bỏ comment AI streaming trong `apps/web/app/api/consult/route.ts` (dòng ~570)
3. Push code → deploy tự động

```env
# Khi bật lại, thêm vào .env:
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-2.0-flash
```

### 1.3 Ollama (Tắt — VPS không đủ tài nguyên)

**Lý do tắt**: VPS 8GB RAM (6 CPU, không GPU) — Ollama `llama3:8b` chiếm ~4.7GB RAM, gây chậm toàn server.

**Để gỡ hoàn toàn Ollama trên VPS** (giải phóng ~4GB RAM):
```bash
# SSH vào VPS:
sudo systemctl stop ollama
sudo systemctl disable ollama
ollama rm llama3:8b 2>/dev/null
ollama rm llama3.2:3b 2>/dev/null
# Xác nhận RAM đã giải phóng:
free -h
```

**Để bật lại Ollama** (cần VPS có GPU hoặc ≥16GB RAM):
```bash
sudo systemctl enable ollama && sudo systemctl start ollama
ollama pull qwen2.5:1.5b  # Model nhẹ nhất (~0.9GB), phù hợp VPS CPU
```

> ⚠️ **Lưu ý**: Với VPS 8GB RAM không GPU, KHÔNG nên dùng Ollama. Model `llama3:8b` chiếm ~4.7GB RAM + CPU 100% mỗi request trong 15-30s → web chậm theo.

---

## ✅ 2. Khả năng Hiện tại của AI Chatbot (v8 — Smart Knowledge Base Only)

### 2.1 Checklist khả năng

| Khả năng | Trạng thái | Chi tiết |
| :--- | :---: | :--- |
| **Smart Knowledge Base (40+ patterns)** | ✅ | Trả lời instant (<100ms) cho 90% câu hỏi phổ biến. |
| **DB Product Query** | ✅ | Tìm sản phẩm từ DB khi hỏi "sản phẩm", "giá", "mua". |
| **Helpful Fallback** | ✅ | Gợi ý chủ đề + liên hệ trực tiếp khi không match. |
| **Gemini API** | ⏸️ | Đã tắt — cần nạp prepay ₫300,000 để bật. |
| **Ollama** | ⏸️ | Đã tắt — VPS không đủ tài nguyên. |
| **Trả lời đúng bằng data thật** | ✅ | Load catalog từ DB (cache 5 phút). |
| **Không bịa sản phẩm/giá** | ✅ | Knowledge Base dùng data cứng. |
| **Gợi ý sản phẩm + link** | ✅ | Max 3 SP kèm link `/products/[slug]`. |
| **Intent Classification** | ✅ | Phân loại qua regex patterns. |
| **Rate Limiting** | ✅ | 8 request/phút/IP. |
| **Session Limit** | ✅ | Max 30 tin nhắn/session. Cooldown 3s. |
| **Input Length Limit** | ✅ | Chặn > 400 ký tự. |
| **Cross-selling** | ✅ | Gợi ý mua kèm phụ kiện. |
| **Guardrails** | ✅ | Từ chối khéo câu hỏi ngoài lề. |

### 2.2 Kiến trúc hệ thống (v8)

```
User → ChatWidget (client)
         ↓ POST /api/consult
         ├─ Rate Limit check (8 req/min/IP)
         ├─ Input validation (≤ 400 chars)
         ↓
    ┌─── Smart Knowledge Base (40+ patterns) ───┐
    │ MATCH? → Trả lời instant (<100ms)          │
    │ source: "knowledge"                         │
    │                                             │
    │ NO MATCH ↓                                  │
    │                                             │
    │ ┌─ [DISABLED] Gemini → Ollama ──────────┐  │
    │ │ Bỏ comment trong route.ts để bật lại  │  │
    │ └───────────────────────────────────────┘  │
    │                                             │
    │ ↓                                           │
    ├─── DB Product Query ──────────────────────┤
    │ Có sản phẩm match? → JSON response        │
    │ source: "db"                                │
    │                                             │
    │ ↓                                           │
    └─── Helpful Fallback ──────────────────────┘
         Gợi ý chủ đề + liên hệ trực tiếp
         source: "fallback"
```

### 2.3 So sánh v7 vs v8

| | v7 (trước) | v8 (hiện tại) |
|---|---|---|
| **Tốc độ** | 1-40s (chờ AI timeout) | **<100ms** (instant) |
| **RAM usage** | ~5.1/8 GB (Ollama chiếm ~4.7GB) | **~1.5/8 GB** |
| **Chi phí** | Gemini API quota + VPS | **₫0** |
| **Độ phủ** | 100% câu hỏi (AI trả lời mọi thứ) | **90%** (10% trả fallback) |
| **Uptime** | Phụ thuộc Gemini/Ollama | **100%** (không phụ thuộc dịch vụ nào) |

---

## ⚡ 3. Kỹ thuật Tối ưu hóa Hiệu suất

### 3.1 Bảo vệ Server (Backend API)

| Kỹ thuật | Chi tiết | Mục đích |
| :--- | :--- | :--- |
| **Smart KB First** | 40+ patterns trả lời instant, không gọi AI. | Giảm 90% AI requests. |
| **Rate Limiting (IP-based)** | 8 request/phút/IP. Tự cleanup mỗi 2 phút. | Ngăn spam, DDoS nhẹ. |
| **Input Filter** | Chặn > 400 ký tự. | Ngăn prompt injection. |
| **Catalog Cache** | Cache sản phẩm 5 phút. | Giảm tải PostgreSQL. |
| **AI Disabled** | Gemini/Ollama tắt → 0 timeout wait. | Server luôn phản hồi nhanh. |

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
# Test API endpoint
curl -s -X POST https://tiemreudecor.com/api/consult \
  -H "Content-Type: application/json" \
  -d '{"message": "ship bao lâu"}' | jq .

# Expected: source = "knowledge", phản hồi instant
```

### 5.2 Gỡ Ollama giải phóng RAM (nên làm)
```bash
# SSH vào VPS:
sudo systemctl stop ollama && sudo systemctl disable ollama
ollama rm llama3:8b 2>/dev/null; ollama rm llama3.2:3b 2>/dev/null
free -h  # Xác nhận RAM đã giải phóng
```

### 5.3 Bật lại Gemini (khi muốn AI thông minh)
```bash
# 1. Nạp credit: https://aistudio.google.com/billing (₫300,000+)
# 2. Bỏ comment trong route.ts (dòng ~570-580)
# 3. Push code → deploy tự động
```

### 5.4 Kiểm tra log
```bash
# Log Next.js (PM2)
pm2 logs terrarium-shop --lines 50

# Kiểm tra RAM/CPU
free -h
htop
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

### Sản phẩm (chuyển qua DB query)
| Chủ đề | Từ khóa trigger | Xử lý |
| :--- | :--- | :--- |
| Tìm/mua SP | "sản phẩm", "mua", "giá", "bao nhiêu" | → DB query |
| Giá rẻ/cao cấp | "rẻ", "tiết kiệm", "cao cấp", "premium" | → DB query |

---

## 🔄 7. Changelog

| Ngày | Version | Thay đổi |
| :--- | :--- | :--- |
| 14/06/2026 | v5 | Intent Classification, Adaptive Response, Natural Conversation |
| 15/06/2026 | v7 | Smart Knowledge Base (40+ patterns), Gemini API primary, Ollama fallback |
| 15/06/2026 | **v8** | **Tắt Gemini (cần prepay) + Tắt Ollama (VPS không đủ RAM). Chatbox chạy 100% Knowledge Base + DB query. Instant response, 0 chi phí.** |

---
*Tài liệu được cập nhật ngày 15 tháng 06 năm 2026 — AI Chatbot v8 (Smart KB Only — Instant, Free, 100% Uptime).*
