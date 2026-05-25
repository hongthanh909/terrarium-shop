# 🚚 Hướng dẫn Move Project sang ổ D

> Mục tiêu: Di chuyển toàn bộ dự án từ `C:\Users\ThanhHong\Documents\2026\tiemreudecor_eco setup\terrarium-shop`
> sang `D:\Projects\terrarium-shop`

---

## ✅ Checklist thực hiện

- [x] **Bước 1** — Dừng tất cả server đang chạy (dev, start)
- [x] **Bước 2** — Xóa `node_modules` gốc (root)
- [x] **Bước 3** — Xóa `apps/web/node_modules`
- [x] **Bước 4** — Xóa `packages/database/node_modules`
- [x] **Bước 5** — Xóa `apps/web/.next` (build cache)
- [x] **Bước 6** — Xóa `apps/web/.turbo` (turbo cache)
- [x] **Bước 7** — Xóa `be/venv` (Python virtual env)
- [x] **Bước 8** — Tạo thư mục đích `D:\Projects`
- [x] **Bước 9** — Copy toàn bộ project sang `D:\Projects\terrarium-shop`
- [x] **Bước 10** — Xác nhận copy thành công (kiểm tra file quan trọng)
- [x] **Bước 11** — Chạy `npm install` tại thư mục mới để cài lại node_modules
- [x] **Bước 12** — Xác nhận Git remote vẫn hoạt động ✅ `https://github.com/hongthanh909/terrarium-shop.git`
- [x] **Bước 13** — Chạy thử `npm run dev` → ✅ `Ready in 1190ms` tại `http://localhost:3000`
- [ ] **Bước 14** — ⚠️ Xóa thư mục gốc trên ổ C *(thực hiện thủ công sau khi đã xác nhận hoạt động ổn định)*

---

## 📁 Đường dẫn

| | Đường dẫn |
|---|---|
| **Nguồn (Source)** | `C:\Users\ThanhHong\Documents\2026\tiemreudecor_eco setup\terrarium-shop` *(có thể xóa)* |
| **Đích (Destination)** ✅ | `D:\Projects\terrarium-shop` *(đang hoạt động)* |

---

## 🎉 Kết quả

| Hạng mục | Trạng thái |
|---|---|
| Files & Source code | ✅ Copy thành công |
| `.env` & `.env.local` | ✅ Nguyên vẹn |
| Git remote (GitHub) | ✅ `origin → hongthanh909/terrarium-shop` |
| `node_modules` | ✅ Đã cài lại |
| Dev server | ✅ Chạy tại `http://localhost:3000` |

---

## 📌 Bước tiếp theo (thủ công)

1. **Mở lại VS Code** với thư mục mới: `File → Open Folder → D:\Projects\terrarium-shop`
2. **Sau khi dùng ổn định vài ngày**, xóa thư mục cũ để giải phóng ổ C:
   ```
   C:\Users\ThanhHong\Documents\2026\tiemreudecor_eco setup\
   ```

---

## 🗒️ Ghi chú quan trọng

- File `.env` và `.env.local` đã được copy nguyên vẹn, không cần chỉnh sửa
- Git remote (`https://github.com/hongthanh909/terrarium-shop.git`) không bị ảnh hưởng
- **KHÔNG xóa thư mục cũ ở ổ C cho đến khi đã xác nhận dự án chạy bình thường ở ổ D**
