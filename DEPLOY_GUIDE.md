# 🚀 Deploy Guide — tiemreudecor.com

> Cập nhật: 2026-05-27
> Domain: tiemreudecor.com | Hosting: AZDIGI (cPanel)

---

## ❌ Tại sao KHÔNG deploy lên AZDIGI cPanel Shared Hosting?

cPanel **Shared Hosting** dùng Apache/PHP — **không hỗ trợ Node.js server liên tục**.
Next.js cần 1 process Node.js chạy 24/7 để xử lý requests.

| Yêu cầu | cPanel Shared | Vercel (Free) |
|---------|:---:|:---:|
| Node.js runtime | ❌ | ✅ |
| HTTPS tự động | ⚠️ cần cấu hình | ✅ |
| PayOS webhook | ❌ (không serve) | ✅ |
| Custom domain | ✅ | ✅ |
| Chi phí | đã mua | Miễn phí |

**→ Giải pháp: Deploy Next.js lên Vercel (FREE), trỏ domain tiemreudecor.com về Vercel qua DNS.**

---

## ✅ Quy trình Deploy (Vercel + tiemreudecor.com)

### Bước 1 — Tạo tài khoản Vercel

1. Vào [vercel.com](https://vercel.com) → **Sign Up** bằng GitHub account
2. Click **"New Project"** → **"Import Git Repository"**
3. Chọn repo `terrarium-shop`

### Bước 2 — Cấu hình dự án

Vercel hỏi Root Directory → nhập: `apps/web`

### Bước 3 — Thêm Environment Variables

Vào **Settings → Environment Variables**, thêm TỪNG biến sau:

```env
# Database (giữ nguyên từ .env.local)
DATABASE_URL=postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xgblmwclsluvekiwvyxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_BUCKET_NAME=product-images

# NextAuth — ĐỔI thành domain thật!
NEXTAUTH_URL=https://tiemreudecor.com
NEXTAUTH_SECRET=f9cc1efca68d2d543a749ca0de9a3ce1d47f06f67416b22091d37f148ebdae72

# Admin
ADMIN_EMAIL=hongthanh181221@gmail.com

# Bank
NEXT_PUBLIC_BANK_NAME=TPBank
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=07898110079
NEXT_PUBLIC_BANK_ACCOUNT_NAME=NGUYEN THANH HONG
NEXT_PUBLIC_BANK_BRANCH=CN Thu Duc
NEXT_PUBLIC_BANK_BIN=970423

# PayOS — Giữ nguyên
PAYOS_CLIENT_ID=4d655d58-f4bd-4366-8bc4-e1a3f7ad7db0
PAYOS_API_KEY=4dc37107-25ed-45cf-9af7-df3072a053af
PAYOS_CHECKSUM_KEY=ef6ba5ee3e08cfa7214d0924cfaa43accedbcf7c4e7d1cc375248b28d2f44faf

# Site URL — ĐỔI thành domain thật!
NEXT_PUBLIC_SITE_URL=https://tiemreudecor.com

# Resend (nếu có)
RESEND_API_KEY=
```

> ⚠️ **QUAN TRỌNG:** `NEXTAUTH_URL` và `NEXT_PUBLIC_SITE_URL` phải là `https://tiemreudecor.com` — KHÔNG phải localhost!

### Bước 4 — Deploy

Click **Deploy** → Vercel sẽ tự build và deploy (~3-5 phút)

Sau deploy bạn sẽ có URL dạng: `https://terrarium-shop-xxx.vercel.app`

### Bước 5 — Trỏ domain tiemreudecor.com về Vercel

#### 5.1 Thêm domain vào Vercel
Vào **Vercel → Settings → Domains** → Thêm `tiemreudecor.com`

Vercel sẽ cung cấp thông tin DNS record:
```
Type: A
Name: @
Value: 76.76.21.21
```
hoặc
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 5.2 Cập nhật DNS trên AZDIGI

1. Đăng nhập AZDIGI → **cPanel** → **Zone Editor** (hoặc DNS Manager)
2. Tìm bản ghi `A` của `tiemreudecor.com`
3. **Đổi IP** từ IP AZDIGI → `76.76.21.21` (Vercel IP)
4. Thêm CNAME: `www` → `cname.vercel-dns.com`
5. Đợi 15-30 phút để DNS propagate

### Bước 6 — Cập nhật PayOS Webhook

Sau khi domain đã trỏ về Vercel:

1. Đăng nhập [PayOS Dashboard](https://business.payos.vn)
2. Vào **Cài đặt → Webhook**
3. Điền URL: `https://tiemreudecor.com/api/payment/webhook`
4. Test webhook để xác nhận

> ✅ **Lưu ý:** Từ v2 của code, `webhookUrl` đã được gửi kèm mỗi payment link — nên PayOS sẽ tự biết gọi về đâu ngay cả khi dashboard chưa set.

---

## 🔄 Quy trình Deploy lại (Khi có code mới)

```bash
# Trên máy local, sau khi sửa code:
git add -A
git commit -m "fix: mô tả thay đổi"
git push origin main

# Vercel tự động build và deploy khi bạn push lên GitHub!
# Không cần làm gì thêm.
```

---

## 🧪 Test sau Deploy

### Test PayOS Payment Flow:
1. Vào `https://tiemreudecor.com/products` → thêm sản phẩm vào giỏ
2. Checkout → chọn **Chuyển khoản ngân hàng**
3. Sẽ redirect sang PayOS → QR code hiện ra
4. Quét QR bằng app ngân hàng → thanh toán
5. Sau ~5-10 giây, đơn hàng tự đổi sang **PAID / CONFIRMED** ✅

### Test Admin:
- Vào `https://tiemreudecor.com/admin` → login bằng `hongthanh181221@gmail.com`
- Kiểm tra đơn hàng có hiện đúng trạng thái không

---

## ❓ Câu hỏi thường gặp

**Q: AZDIGI tôi đã mua thì bỏ phí à?**
A: Không! Bạn vẫn có thể dùng AZDIGI để host email, hoặc dùng VPS của AZDIGI để deploy sau này. Vercel free plan là đủ cho shop nhỏ.

**Q: Vercel free có giới hạn gì không?**
A: Free plan có:
- 100GB bandwidth/tháng (đủ dùng cho shop nhỏ)
- Unlimited deployments
- Auto HTTPS
- Custom domain

**Q: Mỗi lần sửa code có phải deploy lại thủ công không?**
A: KHÔNG! Vercel auto-deploy mỗi khi bạn `git push`. Cực kỳ tiện.
