# 🚀 MIGRATE GUIDE — Vercel/Supabase → VPS Self-Hosted

> **Dự án**: Terrarium Shop — Next.js 14 Full-stack Monorepo  
> **Mục tiêu**: Chuyển toàn bộ từ Vercel + Supabase Hosted → VPS tự quản lý  
> **Tên miền**: tiemreudecor.com (giữ nguyên)  
> **Tính năng mới**: AI tư vấn 24/7 dùng Ollama (Llama 3.2:3b)

---

## 🏗️ Cấu Trúc VPS Sau Khi Migrate — Nhìn Từ Góc Toàn Cảnh

Toàn bộ dự án **FE + BE + DB + AI + Storage** sẽ cùng sống trên **1 VPS duy nhất** (Vietnix VPS Cheap 3, 4GB RAM / 40GB SSD / 4vCPU):

```
┌─────────────────────────────────────────────────────────────────┐
│                   VPS — Vietnix VPS Cheap 3                    │
│                   Ubuntu 22.04 LTS / 4GB RAM                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NGINX (Reverse Proxy + SSL — Cổng 80 & 443)              │  │
│  │ • Nhận toàn bộ traffic từ internet                       │  │
│  │ • Tự động redirect HTTP → HTTPS                          │  │
│  │ • Phân phối đến đúng dịch vụ bên trong                  │  │
│  └──────────┬───────────────────────────────────────────────┘  │
│             │ Cổng 3000 (nội bộ)                               │
│  ┌──────────▼───────────────────────────────────────────────┐  │
│  │ NEXT.JS APP (PM2 — 2 instances cluster mode)              │  │
│  │                                                           │  │
│  │  FE (Frontend React)         BE (API Routes)              │  │
│  │  ─────────────────────       ─────────────────────        │  │
│  │  /                           /api/products                │  │
│  │  /san-pham/[slug]            /api/orders                  │  │
│  │  /checkout                   /api/payment                 │  │
│  │  /don-hang                   /api/consult (AI)            │  │
│  │  /tiem-nho-nth24 (admin)     /api/admin/stats             │  │
│  │  ...                         /api/blog ...                │  │
│  └──────────┬────────────┬──────────────────────────────────┘  │
│             │            │                                      │
│      Cổng 5432    Cổng 11434    Cổng 9000                      │
│      (nội bộ)     (nội bộ)     (nội bộ)                       │
│  ┌───────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │POSTGRESQL │  │ OLLAMA AI   │  │ MINIO STORAGE           │  │
│  │           │  │             │  │                          │  │
│  │ products  │  │ llama3.2:3b │  │ Ảnh sản phẩm           │  │
│  │ orders    │  │ ~2GB RAM    │  │ Banner trang chủ        │  │
│  │ users     │  │ khi có chat │  │ → Serve qua:            │  │
│  │ blog      │  │             │  │ storage.tiemreudecor    │  │
│  │ settings  │  │             │  │ .com (Nginx proxy)      │  │
│  └───────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  📁 SSD 40GB (Lưu trữ vĩnh viễn)                              │
│  ├── /home/deploy/terrarium-shop/  ← Code FE+BE (~2GB)        │
│  ├── /var/lib/postgresql/          ← Dữ liệu DB (~0.5GB)     │
│  ├── /root/.ollama/models/         ← File AI llama3.2 (~2GB) │
│  ├── /data/minio/                  ← Ảnh sản phẩm (~2–5GB)  │
│  └── /swapfile                     ← RAM ảo dự phòng (4GB)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                  Internet / Khách hàng
                  https://tiemreudecor.com
```

---

## 🗂️ Dữ Liệu Phân Bổ Trên SSD (40GB) và RAM (4GB)

### Ổ cứng SSD (Lưu trữ vĩnh viễn — không mất khi reboot)

| Thành phần | Chứa gì | Ước tính |
|-----------|---------|----------|
| Hệ điều hành (Ubuntu 22.04) | Linux kernel, systemd, users | ~6 GB |
| Phần mềm cài đặt | Nginx, PM2, PostgreSQL, Ollama binary | ~1 GB |
| Mã nguồn FE+BE (Next.js) | Code React, API Routes, node_modules, .next build | ~2 GB |
| File model AI (llama3.2:3b) | Các tham số AI — cất yên trên SSD, nạp RAM khi dùng | ~2 GB |
| Cơ sở dữ liệu (PostgreSQL) | Sản phẩm, đơn hàng, users, blog, cài đặt | ~0.5 GB |
| Ảnh/File (MinIO Storage) | Ảnh sản phẩm, banner trang chủ | ~1–5 GB |
| Swap File (RAM ảo dự phòng) | Dùng SSD làm "RAM ảo" khi 4GB RAM vật lý đầy | ~4 GB |
| **Tổng sử dụng** | | **~16–20 GB / 40 GB** |
| **Còn trống** | Dùng cho logs, backup DB, tăng trưởng dữ liệu | **~20–24 GB** |

### RAM (Phân bổ khi đang chạy — xóa sạch khi reboot)

| Trạng thái | Thành phần chiếm RAM | Tổng RAM dùng |
|-----------|---------------------|--------------|
| **Bình thường** (khách lướt shop) | OS ~800MB + Nginx ~50MB + Next.js ~300MB + PostgreSQL ~150MB + Ollama chờ ~100MB | **~1.4 GB / 4 GB** ✅ |
| **Có người chat AI** | Bình thường + Model AI nạp vào RAM ~2GB | **~3.4 GB / 4 GB** ⚠️ |
| **Quá tải** (nhiều người chat cùng lúc) | Vượt 4GB RAM → tự động dùng Swap từ SSD | **4GB RAM + Swap** 🔄 |

---

## ✅ Checklist Hoàn Thiện TRƯỚC KHI Mua VPS

> Đây là những việc cần làm sẵn trên máy local để khi có VPS chỉ cần SSH vào và deploy 1 lần là xong.

### Nhóm A — Kết nối Database Local (Ưu tiên #1 — Giải quyết timeout)

- [ ] **A1** — Kết nối PostgreSQL local (port 5432 đã sẵn sàng trên máy bạn)
  - Đặt `DATABASE_URL=postgresql://postgres:<password>@localhost:5432/terrarium_shop` vào `.env`
  - Chạy `npx prisma db push` để tạo schema
  - Chạy `npx prisma db seed` để có dữ liệu mẫu
  - Restart dev server và test lại toàn bộ API (không còn timeout)

### Nhóm B — Hoàn thiện tính năng (làm trước khi migrate)

- [ ] **B1** — Test AI Chat Widget (`/api/consult`) — gửi câu hỏi → nhận trả lời từ Ollama
- [ ] **B2** — Test toàn bộ flow mua hàng: xem SP → thêm giỏ → checkout → thanh toán
- [ ] **B3** — Test admin: đăng nhập → thêm SP → upload ảnh → quản lý đơn hàng
- [ ] **B4** — Đảm bảo `NEXT_PUBLIC_SITE_URL=https://tiemreudecor.com` đúng trong env production

### Nhóm C — Chuẩn bị file cấu hình VPS (làm sẵn, lưu vào repo)

- [ ] **C1** — Tạo file `.env.production.example` mẫu (không chứa password thật) làm template
- [x] **C2** — File `ecosystem.config.js` cho PM2 (xem Phase 4 bên dưới) ✅
- [x] **C3** — Thư mục `.github/workflows/deploy.yml` cho CI/CD (xem Phase 5) ✅
- [ ] **C4** — Tạo script `scripts/setup-vps.sh` — chạy 1 lần để cài toàn bộ phần mềm

### Nhóm D — Backup dữ liệu Supabase hiện tại

- [ ] **D1** — Export toàn bộ DB từ Supabase thành file `.sql`
- [ ] **D2** — Tải toàn bộ ảnh sản phẩm từ Supabase Storage về máy local
- [ ] **D3** — Giảm DNS TTL của `tiemreudecor.com` xuống 300 giây (trước khi đổi IP 24h)

---

## 📊 Kiến Trúc Hiện Tại vs. Mục Tiêu

### Hiện tại (Vercel + Supabase Hosted)
```
[User Browser]
     │
     ▼
[Vercel] ── Next.js App (FE + API Routes)
     │
     ▼
[Supabase Hosted]
  ├── PostgreSQL Database
  ├── Supabase Storage (images)
  └── Supabase Auth / Realtime
```

### Mục tiêu (VPS Self-Hosted — 1 VPS duy nhất)
```
[User Browser]
     │
     ▼
[VPS 4GB — VIETNIX VPS CHEAP 3]
  Nginx (Reverse Proxy + SSL)
  Next.js (port 3000) — FE + API Routes
  PostgreSQL (port 5432) — Database
  MinIO (port 9000) — File Storage
  Ollama + Llama3.2:3B (port 11434) — AI
  PM2 Process Manager
  GitHub Actions CI/CD
```

> **Tại sao 1 VPS?** Dự án terrarium shop nhỏ, lưu lượng thấp → 1 VPS 4GB đủ dùng.
> Khi scale lên mới tách ra. Tiết kiệm **708k/3 tháng** thay vì 2 VPS ~1.4-2M/3 tháng.

> ⚠️ **Model AI**: Dùng **Llama3.2:3B** (~2GB RAM) thay vì Llama3 8B (~6GB RAM).
> Llama3.2:3B đủ tốt cho tư vấn terrarium tiếng Việt, phù hợp VPS 4GB.

---

## 💰 Chi Phí Ước Tính

| Dịch vụ | Chi phí | Ghi chú |
|---------|---------|---------|
| VPS CHEAP 3 (Vietnix) | **708.000₫/3 tháng** | 4vCPU, 4GB RAM, 40GB SSD |
| Tên miền tiemreudecor.com | Đã có | Giữ nguyên |
| SSL (Let's Encrypt) | **Miễn phí** | Tự gia hạn |
| Email (Resend) | **Miễn phí** | 3000 email/tháng |
| AI (Ollama self-hosted) | **Miễn phí** | Chạy trên VPS |
| **TỔNG/THÁNG** | **~236.000₫** | ~10 USD |



---

## 🖥️ Yêu Cầu VPS (1 VPS Duy Nhất)

| Thông số | Tối thiểu | Khuyến nghị (Vietnix CHEAP 3) | Ghi chú |
|----------|-----------|--------------------------------|---------|
| **CPU** | 2 vCPU | 4 vCPU | Để chạy Next.js build + AI suy luận |
| **RAM** | 4 GB | 4 GB | Llama3.2:3B cần ~2GB RAM, hệ điều hành + DB + Next.js cần ~1.5GB RAM |
| **SSD** | 30 GB | 40 GB | Đủ cho hệ điều hành, DB, code và lưu trữ ảnh trên MinIO |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | Bản HĐH phổ biến, độ ổn định cao |
| **Network**| 100 Mbps | 150 Mbps+ | Đảm bảo tốc độ load trang và kết nối nhanh |

**Stack cài đặt trên VPS**: Node.js 20, PM2, PostgreSQL 16, MinIO, Ollama (Llama 3.2:3B), Nginx, Certbot (SSL)

---

## 📋 TỔNG QUAN CÁC BƯỚC

| Phase | Mô tả | Ước tính thời gian |
|-------|-------|-------------------|
| **Phase 0** | Hoàn thiện code + test local (làm TRƯỚC khi mua VPS) | 1–2 ngày |
| **Phase 1** | Chuẩn bị — hoàn thiện code + tích hợp Ollama AI local | Đã xong ✅ |
| **Phase 2** | Setup VPS (PostgreSQL + MinIO + Ollama) | 1 ngày |
| **Phase 3** | Migrate dữ liệu từ Supabase sang VPS | 2–4 giờ |
| **Phase 4** | Deploy ứng dụng Next.js lên VPS | 4–6 giờ |
| **Phase 5** | Setup CI/CD tự động hóa với GitHub Actions | 2 giờ |
| **Phase 6** | Cấu hình Nginx + Trỏ tên miền + SSL + Go-live | 2 giờ |
| **Phase 7** | Gỡ bỏ Vercel + Supabase (sau 1 tuần chạy ổn định) | 1 giờ |

---

## PHASE 1: Chuẩn Bị Code

### 1.1 Hoàn thiện tính năng còn thiếu (từ CHECKLIST.md)

#### Ưu tiên trước khi migrate:
- [ ] Admin Explore Pin/Unpin WeeklyFeatured (`/admin/explore` page)
- [ ] CustomerCareItem tự động tạo khi đặt hàng thành công
- [ ] Pagination cho Orders, Products (tránh crash khi data lớn)

#### Tính năng AI tư vấn (Ollama):
- [ ] Tạo API Route: `apps/web/app/api/ai/consult/route.ts`
- [ ] Chat widget component: `apps/web/components/AIChatWidget.tsx`
- [ ] Lưu lịch sử chat vào DB (tùy chọn)

### 1.2 Thêm AI Consult với Ollama

#### Cài đặt dependency
```bash
cd apps/web
npm install ollama
```

#### Tạo API Route `/api/ai/consult`
```typescript
// apps/web/app/api/ai/consult/route.ts
import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn của cửa hàng Tiệm Rêu - chuyên về terrarium, 
cây cảnh tiểu cảnh, và thiên nhiên thu nhỏ. Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.
Tư vấn về: chăm sóc cây, chọn sản phẩm phù hợp, giá cả, giao hàng.
Nếu hỏi về đặt hàng/thanh toán, hướng dẫn khách liên hệ hoặc đặt trực tiếp trên website.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 512,
        }
      }),
    });

    if (!response.ok) throw new Error('Ollama unavailable');
    
    const data = await response.json();
    return NextResponse.json({ 
      reply: data.message.content,
      model: data.model
    });
  } catch (error) {
    // Fallback nếu Ollama không khả dụng
    return NextResponse.json({ 
      reply: 'Xin lỗi, hệ thống tư vấn đang bận. Vui lòng liên hệ Zalo: 0123456789 để được hỗ trợ.',
      fallback: true
    });
  }
}
```

#### Biến môi trường cần thêm vào `.env`
```env
# AI — Ollama (self-hosted)
OLLAMA_BASE_URL="http://VPS2_INTERNAL_IP:11434"
# Nếu gọi internal (VPS #1 → VPS #2 qua private network):
# OLLAMA_BASE_URL="http://10.0.0.2:11434"
```

### 1.3 Thay thế Supabase Storage bằng MinIO

MinIO là open-source alternative của S3/Supabase Storage, chạy tự host trên VPS.

#### Thay đổi upload logic
```typescript
// apps/web/lib/storage.ts — Abstract storage layer
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,  // http://VPS2_IP:9000
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET_NAME || 'terrarium-shop',
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  
  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${key}`;
}
```

#### Thêm biến môi trường
```env
# MinIO (thay Supabase Storage)
MINIO_ENDPOINT="http://VPS2_IP:9000"
MINIO_PUBLIC_URL="https://storage.tiemreudecor.com"
MINIO_ACCESS_KEY="your_access_key"
MINIO_SECRET_KEY="your_secret_key"
MINIO_BUCKET_NAME="terrarium-shop"
```

#### Cài package AWS SDK
```bash
cd apps/web
npm install @aws-sdk/client-s3
```

---

## PHASE 2: Setup VPS (Database + Storage + AI)

> SSH vào VPS và chạy tuần tự các lệnh sau để cài đặt và cấu hình DB, Storage, và AI.

### 2.1 Cài đặt PostgreSQL 16

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Khởi động và enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo database và user
sudo -u postgres psql <<EOF
CREATE USER terrarium WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE terrarium_db OWNER terrarium;
GRANT ALL PRIVILEGES ON DATABASE terrarium_db TO terrarium;
EOF

# Vì DB và Next.js chạy trên cùng 1 VPS, PostgreSQL KHÔNG cần mở cổng ra internet.
# Mặc định PostgreSQL chỉ lắng nghe trên localhost (127.0.0.1) -> Cực kỳ bảo mật!
```

### 2.2 Cài đặt MinIO (Object Storage)

```bash
# Tải MinIO server
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Tạo user và thư mục dữ liệu
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /data/minio
sudo chown minio-user:minio-user /data/minio

# Tạo file cấu hình
sudo nano /etc/default/minio
```

```env
# /etc/default/minio
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=STRONG_MINIO_PASSWORD
MINIO_VOLUMES="/data/minio"
MINIO_OPTS="--address :9000 --console-address :9001"
```

```bash
# Tạo systemd service
sudo nano /etc/systemd/system/minio.service
```

```ini
[Unit]
Description=MinIO
Documentation=https://min.io/docs/minio/linux/index.html
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/usr/local
User=minio-user
Group=minio-user
EnvironmentFile=/etc/default/minio
ExecStartPre=/bin/bash -c "if [ -z \"${MINIO_VOLUMES}\" ]; then echo \"Variable MINIO_VOLUMES not set in /etc/default/minio\"; exit 1; fi"
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio

# Truy cập MinIO Console: http://YOUR_VPS_IP:9001
# Tạo bucket: terrarium-shop và chuyển Access Policy sang "Public"
```

### 2.3 Cài đặt Ollama + Llama 3.2 (3B)

```bash
# Cài Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Khởi động Ollama service
sudo systemctl enable --now ollama

# Tải model Llama 3.2 (3B - ~2GB, siêu nhẹ, phản hồi nhanh và chạy mượt trên VPS 4GB RAM)
ollama pull llama3.2:3b

# Kiểm tra hoạt động
ollama run llama3.2:3b "Xin chào, bạn là ai?"

# Vì Next.js và Ollama cùng chạy trên 1 VPS, Ollama KHÔNG cần nghe trên 0.0.0.0
# Nó sẽ lắng nghe an toàn trên localhost (127.0.0.1:11434). KHÔNG cần đổi file systemd.
```

### 2.4 Setup Nginx cho MinIO Public URL (storage subdomain)

Để Next.js và client có thể truy cập trực tiếp các ảnh upload lên MinIO thông qua HTTPS (`https://storage.tiemreudecor.com`), ta cấu hình Nginx làm Reverse Proxy cho MinIO.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Cấu hình nginx cho storage subdomain
sudo nano /etc/nginx/sites-available/storage
```

```nginx
server {
    listen 80;
    server_name storage.tiemreudecor.com;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/storage /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Cấu hình SSL với Certbot
sudo certbot --nginx -d storage.tiemreudecor.com
```

---

## PHASE 3: Migrate Dữ Liệu từ Supabase

### 3.1 Export Database từ Supabase

```bash
# Trên máy local (Windows PowerShell)
# Cài pg_dump nếu chưa có (theo PostgreSQL installer)

# Export từ Supabase
pg_dump "postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-acl \
  --schema=public \
  -f terrarium_backup.sql

# Upload lên VPS (thay YOUR_VPS_IP)
scp terrarium_backup.sql user@YOUR_VPS_IP:~/
```

### 3.2 Import vào PostgreSQL trên VPS

```bash
# SSH vào VPS
ssh user@YOUR_VPS_IP

# Restore database
psql -U terrarium -d terrarium_db -f ~/terrarium_backup.sql

# Kiểm tra bảng đã có đủ chưa
psql -U terrarium -d terrarium_db -c "\dt"
```

### 3.3 Migrate Images từ Supabase Storage sang MinIO

```bash
# Trên máy local — dùng rclone để đồng bộ trực tiếp hai bộ lưu trữ đám mây
# Cài rclone trên máy local (Windows/Mac/Linux)
# Với Windows: tải từ https://rclone.org/downloads/

# Cấu hình rclone remote cho Supabase Storage (S3 compatible)
rclone config
# > Name: supabase
# > Type: s3
# > Provider: Other
# > Access Key: [Supabase Access Key]
# > Secret Key: [Supabase Secret Key]
# > Endpoint: https://xgblmwclsluvekiwvyxs.supabase.co/storage/v1/s3

# Cấu hình rclone remote cho MinIO
rclone config
# > Name: minio
# > Type: s3
# > Provider: Minio
# > Access Key: admin
# > Secret Key: STRONG_MINIO_PASSWORD
# > Endpoint: http://127.0.0.1:9000

# Đồng bộ toàn bộ files hình ảnh sản phẩm và banner
rclone copy supabase:product-images minio:terrarium-shop --progress
rclone copy supabase:banners minio:terrarium-shop/banners --progress
```

---

## PHASE 4: Setup Deploy Next.js App

### 4.1 Cài đặt môi trường Node.js và PM2

```bash
# SSH vào VPS (nếu chưa kết nối)
ssh user@YOUR_VPS_IP

# Cập nhật hệ thống (nếu cần)
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20 (dùng NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài PM2 (Process Manager để quản lý chạy ngầm và tự khởi động Next.js)
sudo npm install -g pm2

# Cài Git
sudo apt install -y git

# Tạo user deploy chuyên dùng để kéo code và chạy app (tăng độ bảo mật)
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 4.2 Clone và Build dự án

```bash
# Chuyển sang user deploy
su - deploy

# Clone repo
git clone https://github.com/YOUR_USERNAME/terrarium-shop.git
cd terrarium-shop

# Tạo file .env.local cho production
nano apps/web/.env.local
```

```env
# ===== PRODUCTION ENV — SINGLE VPS =====
# Database (PostgreSQL chạy cục bộ trên cùng VPS)
DATABASE_URL="postgresql://terrarium:PASSWORD@127.0.0.1:5432/terrarium_db"
DIRECT_URL="postgresql://terrarium:PASSWORD@127.0.0.1:5432/terrarium_db"

# Auth
NEXTAUTH_URL="https://tiemreudecor.com"
NEXTAUTH_SECRET="GENERATE_WITH: openssl rand -hex 32"
JWT_SECRET="GENERATE_WITH: openssl rand -hex 48"

# Admin whitelist
ADMIN_EMAIL="hongthanh181221@gmail.com"
ADMIN_SECRET_PATH="/tiem-nho-nth24"

# Storage — MinIO (chạy cục bộ trên cùng VPS)
STORAGE_PROVIDER="minio"
MINIO_ENDPOINT="http://127.0.0.1:9000"
MINIO_PUBLIC_URL="https://storage.tiemreudecor.com"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="STRONG_MINIO_PASSWORD"
MINIO_BUCKET_NAME="terrarium-shop"

# AI — Ollama (chạy cục bộ trên cùng VPS)
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.2:3b"

# Payment (giữ nguyên thông tin TPBank)
BANK_NAME="TPBank"
BANK_ACCOUNT_NUMBER="07898110079"
BANK_ACCOUNT_NAME="NGUYEN THANH HONG"
NEXT_PUBLIC_BANK_NAME="TPBank"
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER="07898110079"
NEXT_PUBLIC_BANK_ACCOUNT_NAME="NGUYEN THANH HONG"
NEXT_PUBLIC_BANK_BIN="970423"
SEPAY_WEBHOOK_SECRET="whsec_lBYkDqSw4F7mxEsUhpaM7GjWVNN2Psrq"

# Email
RESEND_API_KEY="re_b6RHzioH_3fcDFYG8K7XLUzCeEX8zsCKj"

# Site
NEXT_PUBLIC_SITE_URL="https://tiemreudecor.com"
```

```bash
# Cài đặt dependencies toàn bộ monorepo
npm install

# Chạy Prisma Client và migrations để khởi tạo cấu trúc DB trên VPS
cd apps/web
npx prisma generate
npx prisma migrate deploy   # Run migrations vào database cục bộ

# Quay về root và build ứng dụng Next.js
cd ../..
npm run build

# Chạy thử Next.js production trên cổng 3000
cd apps/web
npm start
# Nhấn Ctrl+C để dừng sau khi kiểm tra
```

### 4.3 Chạy và Quản lý ứng dụng với PM2

```bash
# Tạo ecosystem.config.js tại thư mục apps/web
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'terrarium-shop',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/deploy/terrarium-shop/apps/web',
      instances: 2,           // Chạy 2 instance (cluster mode tận dụng đa nhân CPU)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      error_file: '/home/deploy/logs/pm2-error.log',
      out_file: '/home/deploy/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
};
```

```bash
# Tạo thư mục logs
mkdir -p ~/logs

# Khởi chạy ứng dụng bằng PM2
cd ~/terrarium-shop
pm2 start apps/web/ecosystem.config.js

# Lưu cấu hình PM2 và setup tự khởi chạy ứng dụng khi VPS reboot
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
# copy dòng lệnh sudo pm2 startup... hiển thị trên terminal và chạy dưới quyền root
```

### 4.4 Cấu hình Nginx làm Reverse Proxy cho Next.js App

```bash
sudo nano /etc/nginx/sites-available/tiemreudecor
```

```nginx
# Redirect HTTP → HTTPS cho tên miền chính
server {
    listen 80;
    server_name tiemreudecor.com www.tiemreudecor.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS — Next.js Application
server {
    listen 443 ssl http2;
    server_name tiemreudecor.com www.tiemreudecor.com;

    # SSL (Certbot sẽ tự động điền đường dẫn sau khi chạy certbot)
    ssl_certificate /etc/letsencrypt/live/tiemreudecor.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tiemreudecor.com/privkey.pem;

    # Bảo mật và Gzip
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Cache cho các file static của Next.js
    location /_next/static/ {
        alias /home/deploy/terrarium-shop/apps/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache cho thư mục public
    location /public/ {
        alias /home/deploy/terrarium-shop/apps/web/public/;
        expires 7d;
    }

    # Proxy các request còn lại vào Next.js (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        client_max_body_size 50m;
    }
}
```

```bash
# Kích hoạt site và reload Nginx
sudo ln -s /etc/nginx/sites-available/tiemreudecor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Cấp chứng chỉ SSL miễn phí cho tên miền chính và sub-domain www
sudo certbot --nginx -d tiemreudecor.com -d www.tiemreudecor.com
```

---

## PHASE 5: CI/CD với GitHub Actions

### 5.1 Setup SSH key để tự động deploy

```bash
# Trên VPS — tạo SSH key riêng cho việc deploy từ GitHub
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""

# Đưa public key vào danh sách authorized_keys
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Xem nội dung private key để đưa vào GitHub Secrets
cat ~/.ssh/deploy_key
```

### 5.2 Cấu hình GitHub Secrets

Vào **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret** để thêm các biến bảo mật:

| Secret Name | Mô tả |
|-------------|-------|
| `VPS_HOST` | Địa chỉ IP của VPS duy nhất |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Nội dung của private key (`deploy_key`) |
| `VPS_PORT` | `22` (hoặc port SSH của VPS nếu đã đổi) |

### 5.3 Tạo GitHub Actions Workflow

```bash
# Tạo thư mục và file cấu hình trong dự án cục bộ
mkdir -p .github/workflows
```

```yaml
# .github/workflows/deploy.yml
name: 🚀 Deploy to VPS

on:
  push:
    branches: [main]
  workflow_dispatch:   # Cho phép kích hoạt deploy thủ công từ GitHub UI

env:
  APP_DIR: /home/deploy/terrarium-shop

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🔑 Setup SSH Connection
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.VPS_SSH_KEY }}

      - name: 🚀 Deploy App via SSH
        run: |
          ssh -o StrictHostKeyChecking=no \
              -p ${{ secrets.VPS_PORT }} \
              ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} << 'ENDSSH'
            set -e
            echo "📁 Di chuyển vào thư mục dự án..."
            cd ${{ env.APP_DIR }}

            echo "📥 Kéo code mới nhất từ GitHub..."
            git pull origin main

            echo "📦 Cài đặt dependencies..."
            npm install --frozen-lockfile

            echo "🔧 Tạo Prisma client và migrate database..."
            cd apps/web
            npx prisma generate
            npx prisma migrate deploy

            echo "🏗️ Build Next.js App..."
            cd ../..
            npm run build

            echo "♻️ Reload Next.js PM2 process không có downtime..."
            pm2 reload terrarium-shop --update-env

            echo "✅ Deploy thành công!"
          ENDSSH

      - name: 📣 Notify deploy status
        if: always()
        run: |
          if [ "${{ job.status }}" = "success" ]; then
            echo "✅ Deploy thành công!"
          else
            echo "❌ Deploy thất bại!"
          fi
```

## PHASE 6: Trỏ Tên Miền + Go-Live

### 6.1 Cập nhật DNS tại nhà cung cấp tên miền

Truy cập trang quản trị tên miền tiemreudecor.com và cấu hình trỏ cả 3 record quan trọng về cùng **1 IP của VPS duy nhất**:

| Record | Type | Value (Địa chỉ IP) | TTL | Mô tả |
|--------|------|--------------------|-----|-------|
| `@` (root) | A | YOUR_VPS_IP | 300 | Tên miền chính `tiemreudecor.com` |
| `www` | A | YOUR_VPS_IP | 300 | `www.tiemreudecor.com` |
| `storage` | A | YOUR_VPS_IP | 300 | Nơi lưu ảnh `storage.tiemreudecor.com` |

> **Khuyến nghị**: Hãy giảm TTL xuống **300 giây (5 phút)** trước khi đổi IP 1 ngày, giúp DNS cập nhật nhanh hơn trên toàn cầu khi trỏ sang VPS mới.

### 6.2 Kiểm tra dịch vụ trên VPS trước khi chạy thật

```bash
# Kiểm tra Next.js app cục bộ phản hồi tốt
curl -I http://localhost:3000

# Xem trạng thái PM2 và log xem có lỗi gì không
pm2 status
pm2 logs terrarium-shop --lines 50

# Test cấu hình Nginx và xem Nginx có chạy tốt không
sudo nginx -t
sudo systemctl status nginx

# Test kết nối database cục bộ bằng Prisma
cd ~/terrarium-shop/apps/web
npx prisma db execute --stdin <<< "SELECT 1"

# Test Ollama API cục bộ phản hồi đúng model đã cài
curl http://localhost:11434/api/tags
```

### 6.3 Cập nhật Webhook URLs

Sau khi domain trỏ về VPS, cập nhật URL webhook tại:
- **SePay Dashboard**: `https://tiemreudecor.com/api/payment/webhook`
- **PayOS Dashboard**: `https://tiemreudecor.com/api/payment/payos-webhook`

### 6.4 Test toàn bộ flow

- [ ] Đăng ký / đăng nhập user
- [ ] Xem sản phẩm, thêm vào giỏ
- [ ] Đặt hàng COD
- [ ] Đặt hàng chuyển khoản (QR)
- [ ] Admin đăng nhập vào `/tiem-nho-nth24`
- [ ] Admin thêm sản phẩm (test upload ảnh vào MinIO)
- [ ] AI chat widget hoạt động
- [ ] Email reset password hoạt động

---

## PHASE 7: Gỡ Vercel + Supabase (Sau 1 tuần ổn định)

> ⚠️ **Chỉ gỡ sau khi VPS đã chạy ổn định ít nhất 7 ngày và đã backup đầy đủ dữ liệu!**

### 7.1 Backup lần cuối trước khi gỡ

```bash
# Backup DB từ VPS
pg_dump -U terrarium terrarium_db | gzip > terrarium_final_backup_$(date +%Y%m%d).sql.gz

# Download về máy local để lưu trữ an toàn
scp user@YOUR_VPS_IP:~/terrarium_final_backup_*.sql.gz ./
```

### 7.2 Gỡ Vercel

1. Vào Vercel Dashboard → Project → Settings → Scroll xuống → **Delete Project**

### 7.3 Gỡ Supabase

1. Vào Supabase Dashboard → Project → Settings → **Delete Project**
2. Xác nhận bằng tên project

---

## 🔒 Bảo Mật VPS (Quan trọng!)

```bash
# Chạy các lệnh này ngay sau khi setup VPS thành công

# 1. Thay đổi SSH port (tránh brute force bot quét cổng 22)
sudo nano /etc/ssh/sshd_config
# Tìm và sửa thành:
# Port 2222   (hoặc port bất kỳ bạn chọn)
# PermitRootLogin no (cấm login bằng root trực tiếp)
# PasswordAuthentication no (nếu muốn bắt buộc dùng SSH Key)
sudo systemctl restart sshd

# 2. Thiết lập UFW Firewall (chỉ cho phép các cổng cần thiết)
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 2222/tcp   # SSH port mới của bạn
sudo ufw allow 80/tcp     # Nginx HTTP
sudo ufw allow 443/tcp    # Nginx HTTPS
# Các dịch vụ khác (Postgres 5432, Ollama 11434, MinIO 9000/9001) được khóa hoàn toàn bên ngoài, chỉ gọi nội bộ từ Next.js

sudo ufw enable

# 3. Tự động cập nhật bản vá bảo mật
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 4. Cài Fail2ban để chặn brute force SSH tự động
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

---

## 📦 Backup Tự Động Hàng Ngày

```bash
# Tạo script backup DB tự động trên VPS
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/data/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U terrarium terrarium_db | gzip > "$BACKUP_DIR/terrarium_$DATE.sql.gz"

# Xóa backup cũ hơn 30 ngày để tiết kiệm dung lượng đĩa
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup done: terrarium_$DATE.sql.gz"
```

```bash
chmod +x ~/backup-db.sh

# Thêm vào crontab để chạy lúc 2:00 AM mỗi ngày
crontab -e
# Thêm dòng dưới cùng:
# 0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/logs/backup.log 2>&1
```

---

## 📊 Giám Sát Server (Khuyến nghị)

```bash
# Cài đặt PM2 Logrotate để xoay vòng log Next.js tự động (tránh đầy SSD)
pm2 install pm2-logrotate

# Giám sát tài nguyên trực tiếp bằng lệnh htop trên VPS
htop
```

---

## ⚡ Quick Reference — Lệnh Thường Dùng

```bash
# === Quản lý Ứng dụng Next.js (PM2) ===
pm2 status                    # Xem trạng thái app
pm2 logs terrarium-shop       # Xem log thời gian thực
pm2 restart terrarium-shop    # Khởi động lại ứng dụng
pm2 reload terrarium-shop     # Tải lại code không gây gián đoạn (no downtime)
pm2 stop terrarium-shop       # Dừng ứng dụng

# Deploy thủ công khi cần
cd ~/terrarium-shop && git pull && npm run build && pm2 reload terrarium-shop

# === Quản lý Dịch vụ trên VPS ===
sudo systemctl status postgresql   # Trạng thái Database
sudo systemctl status minio        # Trạng thái MinIO Storage
sudo systemctl status ollama       # Trạng thái Ollama AI
sudo systemctl restart ollama      # Khởi động lại AI

# === Xem Log của AI Ollama ===
journalctl -u ollama -f

# === Kiểm tra các AI model đã cài ===
ollama list

# === Tải model AI mới ===
ollama pull llama3.2:3b

# === Quản lý Web Server Nginx ===
sudo nginx -t                     # Kiểm tra cú pháp config
sudo systemctl reload nginx       # Tải lại cấu hình Nginx
sudo tail -f /var/log/nginx/error.log   # Xem lỗi Nginx nếu có

# === Tự động gia hạn SSL Let's Encrypt ===
sudo certbot renew --dry-run      # Test chạy thử tự động gia hạn
```

---

## 🚨 Xử Lý Sự Cố Thường Gặp

| Triệu chứng | Nguyên nhân | Giải pháp |
|-------------|-------------|-----------|
| Lỗi 502 Bad Gateway | Next.js app chưa chạy hoặc bị crash | `pm2 status` → `pm2 restart terrarium-shop` |
| Lỗi kết nối DB | PostgreSQL bị dừng | `sudo systemctl status postgresql` → Khởi động lại |
| Upload ảnh thất bại | MinIO storage bị dừng | `sudo systemctl status minio` → Khởi động lại |
| AI không phản hồi | Ollama bị dừng hoặc đầy RAM | `sudo systemctl restart ollama`, dùng `htop` check RAM |
| SSL hết hạn đột ngột | Cronjob gia hạn SSL gặp lỗi | `sudo certbot renew --force-renewal` |
| Web trắng trang sau deploy | Build bị lỗi hoặc file env thiếu | `pm2 logs terrarium-shop` để xem chi tiết log lỗi |

---

## 📅 Timeline Thực Hiện (1 VPS Duy Nhất)

```
Tuần 1: Chuẩn bị & Cài đặt
├── Ngày 1: Hoàn thiện code Phase 1 (Đã hoàn thành ✅)
├── Ngày 2: Mua VPS & Setup các dịch vụ Database, Storage, Ollama AI (Phase 2)
└── Ngày 3: Export dữ liệu từ Supabase & Import lên VPS (Phase 3)

Tuần 2: Triển khai & Go-Live
├── Ngày 4: Deploy Next.js App lên VPS & Chạy với PM2 (Phase 4)
├── Ngày 5: Cài đặt CI/CD GitHub Actions deploy tự động (Phase 5)
├── Ngày 6: Cấu hình Nginx SSL, Trỏ DNS tên miền chính thức (Phase 6)
└── Ngày 7: Kiểm thử toàn bộ tính năng mua hàng, thanh toán và AI tư vấn

Tuần 3: Dọn dẹp
└── Ngày 8+: Gỡ bỏ hoàn toàn Vercel và Supabase cũ sau 7 ngày ổn định (Phase 7)
```

---

*Cập nhật: 2026-06-02 | Phiên bản: 1.1 (Cấu hình 1 VPS tối ưu)*  
*Dự án: tiemreudecor.com | Liên hệ: hongthanh181221@gmail.com*
