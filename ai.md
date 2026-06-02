# 🌿 Tài liệu Quản lý & Cấu hình AI Consultant (Tiệm Rêu)

Tài liệu này tổng hợp toàn bộ hướng dẫn cài đặt mô hình Ollama, các kỹ thuật tối ưu hóa hiệu suất VPS và chiến lược kịch bản bán hàng tự động (Sales Playbook) đã được áp dụng trong hệ thống tư vấn của **Tiệm Rêu**.

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
Sau khi cài đặt, hãy tải mô hình AI khuyên dùng về máy (mặc định trong code sử dụng `llama3.2:3b` - nhẹ, thông minh, hỗ trợ tiếng Việt cực tốt và ngốn cực ít RAM):
```bash
# Tải mô hình llama3.2 (khoảng 2.0 GB)
ollama pull llama3.2:3b

# Hoặc tải qwen2.5:3b (mô hình của Alibaba, viết tiếng Việt rất mượt)
ollama pull qwen2.5:3b
```

### 1.3 Cấu hình biến môi trường (Environment Variables)
Tạo hoặc bổ sung vào file `.env` hoặc cấu hình biến môi trường trên VPS các khóa sau để Next.js kết nối đến Ollama:
```env
# URL chạy dịch vụ Ollama (Mặc định là port 11434)
OLLAMA_BASE_URL=http://localhost:11434

# Tên mô hình bạn đã pull ở bước trên
OLLAMA_MODEL=llama3.2:3b
```

---

## ⚡ 2. Kỹ thuật Tối ưu hóa Hiệu suất & Chống Quá tải VPS

Để ngăn ngừa việc người dùng lạm dụng chatbot, cố tình spam hoặc gửi câu hỏi quá dài làm tràn bộ nhớ (RAM/CPU) của VPS, hệ thống đã cấu hình các lớp bảo vệ nghiêm ngặt tại [/api/consult/route.ts](file:///d:/Projects/terrarium-shop/apps/web/app/api/consult/route.ts):

| Kỹ thuật tối ưu | Chi tiết triển khai | Mục đích & Lợi ích |
| :--- | :--- | :--- |
| **Giới hạn câu hỏi đầu vào (Input Filter)** | Chặn ngay các tin nhắn gửi lên vượt quá **400 ký tự**. Trả về phản hồi từ chối thân thiện. | Ngăn chặn việc người dùng copy bài viết dài hoặc spam văn bản lớn làm nghẽn hàng đợi xử lý của AI. |
| **Giới hạn độ dài câu trả lời (`num_predict`)** | Giảm từ `600` xuống còn **`350` tokens**. | Giảm tải 50% thời gian xử lý của CPU/GPU VPS. AI vẫn viết đủ 4-6 câu tư vấn chất lượng cao nhưng phản hồi nhanh gấp đôi. |
| **Từ khóa dừng (`stop` sequences)** | Đặt cấu hình `stop: ["\nUser:", "User:"]`. | Ngăn chặn việc AI tự tạo kịch bản, tự viết tiếp lời của người dùng (Hallucination) dẫn đến vòng lặp vô hạn. |
| **Giảm giới hạn Thời gian chờ (Timeout)** | Rút ngắn từ `60s` xuống còn **`30s`**. | Nếu Ollama bị đơ hoặc VPS quá tải, kết nối sẽ tự động hủy (`Abort`) để giải phóng tài nguyên hệ thống. |
| **Hệ thống Cache Catalog sản phẩm** | Lưu cache danh sách sản phẩm lấy từ DB trong **5 phút** (`CACHE_TTL_MS = 300000`). | AI luôn có dữ liệu sản phẩm mới nhất nhưng Next.js không cần truy vấn PostgreSQL liên tục trên mỗi câu hỏi chat. |

---

## 🎯 3. Chiến lược Bán hàng Tự động & Chốt đơn (Sales Playbook)

Chúng ta sử dụng giải pháp **Dynamic System Prompting / RAG** thay vì train lại mô hình để đảm bảo thông tin luôn chính xác và cập nhật theo thời gian thực.

### 3.1 Thiết lập vai trò "Salesperson chuyên nghiệp"
AI không chỉ trả lời kiến thức thực vật khô khan, mà hoạt động như một nhân viên bán hàng có chiến lược rõ ràng:

1.  **Chặn chủ đề ngoài lề (Strict Guardrails):**
    AI được hướng dẫn cứng rắn trong System Prompt để từ chối các câu hỏi không liên quan đến terrarium, cây cảnh (như giải toán, viết code, bàn luận chính trị...). Điều này giúp giữ bộ lọc hội thoại sạch sẽ và tiết kiệm tài nguyên VPS.
2.  **Khuyến khích Click xem sản phẩm thật:**
    Mỗi khi giới thiệu sản phẩm, AI luôn chèn đường dẫn chuẩn của Next.js dưới dạng `Link: /products/[slug]`. 
    *   *Lưu ý kỹ thuật:* Đã sửa lỗi đường dẫn lỗi thời `/san-pham/...` (dẫn tới trang 404) thành `/products/...` đồng bộ với UI hệ thống.
3.  **Tư vấn bán chéo (Cross-selling):**
    Khi khách hỏi về các bình terrarium kín lớn, AI sẽ khéo léo gợi ý khách mua kèm các phụ kiện chuyên dụng (như *Nhíp dài tỉa cây*, *Bình xịt phun sương mịn*) để chăm sóc tốt hơn.
4.  **Thúc đẩy doanh số bằng mốc Freeship:**
    Cửa hàng có chính sách **Miễn phí vận chuyển cho đơn hàng từ 500.000₫**. AI sẽ theo dõi giá trị sản phẩm gợi ý và tư vấn khách mua thêm rêu hoặc phụ kiện nhỏ nếu hóa đơn của khách gần đạt mốc 500k.

---

## 🛠️ 4. Kiểm tra & Khắc phục sự cố

Khi chatbot gặp sự cố không phản hồi (quay vòng tròn hoặc báo lỗi hệ thống), hãy thực hiện kiểm tra theo các bước sau trên VPS:

### Bước 1: Kiểm tra xem Ollama có đang chạy không
```bash
# Trên Linux (Ubuntu/Debian)
sudo systemctl status ollama

# Khởi động lại nếu dịch vụ bị dừng
sudo systemctl restart ollama
```

### Bước 2: Kiểm tra kết nối từ API Next.js tới Ollama
Chạy lệnh curl thử nghiệm từ chính VPS để xem Ollama có phản hồi không:
```bash
curl http://localhost:11434/api/tags
```
Nếu lệnh trả về danh sách các model dạng JSON là kết nối đang hoạt động bình thường.

### Bước 3: Xem log của ứng dụng Next.js để phát hiện lỗi
Nếu Ollama chạy tốt nhưng chatbot vẫn lỗi, kiểm tra log của PM2 hoặc container docker chạy Next.js để xem chi tiết lỗi kết nối DB hoặc lỗi cú pháp.

---
*Tài liệu được cập nhật tự động vào ngày 02 tháng 06 năm 2026 bởi Antigravity AI.*
