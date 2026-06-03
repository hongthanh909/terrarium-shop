# 🚀 Deploy Guide — tiemreudecor.com (VPS)

> Cập nhật: 2026-06-03  
> Domain: tiemreudecor.com | Hosting: **VPS tự quản lý (14.225.210.118)**  
> Stack: Ubuntu 22.04 + Nginx + PM2 + PostgreSQL + MinIO + Ollama

---

## 🏗️ Kiến Trúc Hệ Thống

```
[Internet / Khách hàng]
        │
        ▼ :80 / :443
[Nginx — Reverse Proxy + SSL]
        │ :3000 (nội bộ)
        ▼
[Next.js — PM2 Cluster (2 instances)]
    ├── FE: /, /products, /checkout, /profile...
    ├── BE: /api/products, /api/orders, /api/payment...
    └── Admin: /tiem-nho-nth24/*
        │              │               │
    :5432           :11434          :9000
  (local)          (local)         (local)
[PostgreSQL]   [Ollama AI]     [MinIO Storage]
```

---

## ✅ Checklist Deploy Lần Đầu Lên VPS

### Bước 1 — Setup VPS (chạy 1 lần)

```bash
# SSH vào VPS với quyền root
ssh root@14.225.210.118

# Upload và chạy setup script
scp scripts/setup-vps.sh root@14.225.210.118:~/
ssh root@14.225.210.118 "bash ~/setup-vps.sh"
```

Script sẽ cài đặt tự động: **Node.js 20, PM2, PostgreSQL 16, MinIO, Ollama, Nginx, Certbot, UFW Firewall**.

---

### Bước 2 — Clone code lên VPS

```bash
# SSH với user deploy
ssh deploy@14.225.210.118

# Tạo SSH deploy key nếu chưa có
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy_key -N ""

# Thêm public key vào GitHub repo
cat ~/.ssh/github_deploy_key.pub
# → Copy và thêm vào: GitHub Repo → Settings → Deploy keys → Add deploy key

# Cấu hình SSH config
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy_key
  IdentitiesOnly yes
EOF

# Clone repo
git clone git@github.com:YOUR_USERNAME/terrarium-shop.git
cd terrarium-shop
```

---

### Bước 3 — Cấu hình môi trường

```bash
# Tạo file env từ template VPS
cp .env.vps.example apps/web/.env.local
nano apps/web/.env.local

# Điền các giá trị cần thiết:
# DATABASE_URL=postgresql://terrarium:STRONG_PASSWORD@127.0.0.1:5432/terrarium_db
# NEXTAUTH_SECRET=$(openssl rand -hex 32)   ← tạo key mới!
# NEXTAUTH_URL=https://tiemreudecor.com
# ... (xem file .env.vps.example để biết đầy đủ)
```

---

### Bước 4 — Migrate data từ Supabase (nếu có)

```bash
# Trên máy local — export từ Supabase
pg_dump "postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl --schema=public \
  -f terrarium_backup.sql

# Upload lên VPS
scp terrarium_backup.sql deploy@14.225.210.118:~/

# Import vào PostgreSQL trên VPS
ssh deploy@14.225.210.118
psql -U terrarium -d terrarium_db -f ~/terrarium_backup.sql
```

---

### Bước 5 — Build và Deploy

```bash
# Trên VPS, trong thư mục /home/deploy/terrarium-shop
npm install --legacy-peer-deps

cd apps/web
npx prisma generate
npx prisma migrate deploy

cd /home/deploy/terrarium-shop
npm run build

# Chạy với PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
# Copy lệnh sudo pm2 startup... và chạy dưới quyền root
```

---

### Bước 6 — Cấu hình Nginx + SSL

```bash
# Kiểm tra Nginx config (đã được script setup tạo sẵn)
sudo nginx -t

# Cấp SSL bằng Certbot
sudo certbot --nginx -d tiemreudecor.com -d www.tiemreudecor.com

# Nếu có MinIO storage subdomain
sudo certbot --nginx -d storage.tiemreudecor.com

sudo systemctl reload nginx
```

---

### Bước 7 — Trỏ DNS

Tại nhà cung cấp tên miền, thêm/sửa các bản ghi DNS:

| Record | Type | Value | TTL |
|--------|------|-------|-----|
| `@` (root) | A | `14.225.210.118` | 300 |
| `www` | A | `14.225.210.118` | 300 |
| `storage` | A | `14.225.210.118` | 300 |

> ⚠️ Giảm TTL xuống 300 trước khi đổi DNS 24h để propagate nhanh hơn.

---

### Bước 8 — Cập nhật GitHub Secrets (CI/CD)

Vào **GitHub Repo → Settings → Secrets and variables → Actions**:

| Secret | Giá trị |
|--------|---------|
| `VPS_HOST` | `14.225.210.118` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Nội dung file `/home/deploy/.ssh/github_deploy_key` |
| `VPS_PORT` | `22` |

Sau khi set secrets, mỗi lần `git push origin main` → GitHub Actions tự động deploy!

---

## 🔄 Quy Trình Deploy Cập Nhật Code (Hàng Ngày)

```bash
# Trên máy local, sau khi sửa code:
git add -A
git commit -m "fix: mô tả thay đổi"
git push origin main

# → GitHub Actions tự động chạy deploy.yml:
#   1. git pull trên VPS
#   2. npm install
#   3. prisma generate + migrate
#   4. npm run build
#   5. pm2 reload (zero downtime)
```

### Deploy thủ công (không cần push)

```bash
ssh deploy@14.225.210.118
cd /home/deploy/terrarium-shop
git pull origin main
npm install --legacy-peer-deps
cd apps/web && npx prisma generate && npx prisma migrate deploy && cd ../..
npm run build
pm2 reload ecosystem.config.js --env production
```

---

## 🧪 Test Sau Deploy

```bash
# Kiểm tra app đang chạy
pm2 status
curl -I http://localhost:3000

# Kiểm tra HTTPS
curl -I https://tiemreudecor.com

# Xem log realtime
pm2 logs terrarium-shop --lines 50
```

### Test Checklist:
- [ ] Trang chủ load thành công
- [ ] Đăng ký / đăng nhập user  
- [ ] Xem sản phẩm, **thêm vào giỏ (cần đăng nhập)**
- [ ] Đặt hàng COD
- [ ] Đặt hàng chuyển khoản (QR)
- [ ] Admin đăng nhập `/tiem-nho-nth24/login`
- [ ] Admin thêm/sửa sản phẩm + upload ảnh
- [ ] Webhook thanh toán hoạt động

---

## ⚡ Lệnh Thường Dùng

```bash
# === PM2 ===
pm2 status                          # Xem trạng thái
pm2 logs terrarium-shop             # Xem log realtime
pm2 reload terrarium-shop           # Reload không downtime
pm2 restart terrarium-shop          # Restart hoàn toàn
pm2 monit                           # Dashboard monitor

# === Dịch vụ ===
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status minio
sudo systemctl status ollama

# === Database ===
psql -U terrarium -d terrarium_db   # Truy cập DB

# === Nginx ===
sudo nginx -t                       # Kiểm tra config
sudo systemctl reload nginx         # Tải lại config

# === SSL ===
sudo certbot renew --dry-run        # Test gia hạn SSL
```

---

## 🚨 Xử Lý Sự Cố

| Triệu chứng | Nguyên nhân | Giải pháp |
|-------------|-------------|-----------|
| 502 Bad Gateway | Next.js chưa chạy | `pm2 restart terrarium-shop` |
| Trang trắng sau deploy | Build lỗi hoặc thiếu env | `pm2 logs terrarium-shop` |
| Lỗi DB kết nối | PostgreSQL tắt | `sudo systemctl restart postgresql` |
| Upload ảnh thất bại | MinIO tắt | `sudo systemctl restart minio` |
| SSL hết hạn | Certbot không tự gia hạn | `sudo certbot renew --force-renewal` |
| AI không phản hồi | Ollama tắt hoặc RAM đầy | `sudo systemctl restart ollama` |
| Login chuyển về trang sai | Env `NEXTAUTH_URL` sai | Kiểm tra `apps/web/.env.local` |

---

## 📦 Backup

```bash
# Backup DB thủ công
pg_dump -U terrarium terrarium_db | gzip > ~/backup_$(date +%Y%m%d).sql.gz

# Tự động lúc 2AM hàng ngày (đã setup trong crontab)
# Xem log backup
tail -f ~/logs/backup.log
```

---

*Cập nhật: 2026-06-03 | VPS: 14.225.210.118 | Domain: tiemreudecor.com*
