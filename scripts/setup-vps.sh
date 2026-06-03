#!/bin/bash
# ============================================================
# TERRARIUM SHOP — VPS Setup Script
# Chạy 1 lần sau khi SSH vào VPS mới (Ubuntu 22.04 LTS)
# Cài đặt: Node.js 20, PM2, PostgreSQL 16, MinIO, Ollama, Nginx, Certbot
#
# Cách dùng:
#   chmod +x setup-vps.sh
#   sudo bash setup-vps.sh
# ============================================================

set -e  # Dừng ngay nếu có lỗi

# --- Cấu hình — Thay đổi trước khi chạy ---
DB_PASSWORD="CHANGE_THIS_STRONG_DB_PASSWORD"
MINIO_ROOT_PASSWORD="CHANGE_THIS_STRONG_MINIO_PASSWORD"
DEPLOY_USER="deploy"
APP_DOMAIN="tiemreudecor.com"
STORAGE_DOMAIN="storage.tiemreudecor.com"

# Màu sắc cho log đẹp hơn
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ============================================================
# BƯỚC 1: Cập nhật hệ thống
# ============================================================
log "Cập nhật hệ thống Ubuntu..."
apt update && apt upgrade -y
apt install -y curl wget git unzip htop ufw fail2ban unattended-upgrades

# ============================================================
# BƯỚC 2: Tạo Swap 4GB (RAM ảo dự phòng từ SSD)
# ============================================================
log "Tạo Swap 4GB..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Giảm swappiness — chỉ dùng Swap khi RAM còn 20%
    echo 'vm.swappiness=20' >> /etc/sysctl.conf
    sysctl -p
    log "Swap 4GB đã được tạo thành công"
else
    warn "Swap đã tồn tại, bỏ qua bước này"
fi

# ============================================================
# BƯỚC 3: Tạo user deploy chuyên biệt
# ============================================================
log "Tạo user '${DEPLOY_USER}'..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    mkdir -p /home/$DEPLOY_USER/logs
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/logs
fi

# ============================================================
# BƯỚC 4: Cài Node.js 20 và PM2
# ============================================================
log "Cài Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v && npm -v

log "Cài PM2..."
npm install -g pm2
pm2 --version

# ============================================================
# BƯỚC 5: Cài PostgreSQL 16
# ============================================================
log "Cài PostgreSQL 16..."
apt install -y postgresql-16 postgresql-client-16
systemctl start postgresql
systemctl enable postgresql

# Tạo database và user cho terrarium shop
log "Tạo database terrarium_db..."
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'terrarium') THEN
    CREATE USER terrarium WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
CREATE DATABASE terrarium_db OWNER terrarium;
GRANT ALL PRIVILEGES ON DATABASE terrarium_db TO terrarium;
EOF

log "PostgreSQL đã sẵn sàng. DB: terrarium_db / User: terrarium"

# ============================================================
# BƯỚC 6: Cài MinIO (Object Storage — thay Supabase Storage)
# ============================================================
log "Cài MinIO..."
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
chmod +x /usr/local/bin/minio

useradd -r minio-user -s /sbin/nologin 2>/dev/null || true
mkdir -p /data/minio
chown minio-user:minio-user /data/minio

cat > /etc/default/minio <<MINIO_ENV
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_VOLUMES="/data/minio"
MINIO_OPTS="--address :9000 --console-address :9001"
MINIO_ENV

cat > /etc/systemd/system/minio.service <<MINIO_SERVICE
[Unit]
Description=MinIO Object Storage
Wants=network-online.target
After=network-online.target

[Service]
WorkingDirectory=/usr/local
User=minio-user
Group=minio-user
EnvironmentFile=/etc/default/minio
ExecStart=/usr/local/bin/minio server \$MINIO_OPTS \$MINIO_VOLUMES
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
MINIO_SERVICE

systemctl daemon-reload
systemctl enable --now minio
log "MinIO đã chạy trên port 9000 (API) và 9001 (Console)"

# ============================================================
# BƯỚC 7: Cài Ollama AI
# ============================================================
log "Cài Ollama AI..."
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable --now ollama

log "Tải model llama3:8b (~4.7GB, mất khoảng 5-10 phút tùy tốc độ mạng)..."
ollama pull llama3:8b

log "Ollama đã sẵn sàng, model llama3:8b đã cài"

# ============================================================
# BƯỚC 8: Cài Nginx + Certbot
# ============================================================
log "Cài Nginx và Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Cấu hình Nginx cho Next.js app
cat > /etc/nginx/sites-available/tiemreudecor <<NGINX_APP
server {
    listen 80;
    server_name ${APP_DOMAIN} www.${APP_DOMAIN};

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Cache file static Next.js
    location /_next/static/ {
        alias /home/${DEPLOY_USER}/terrarium-shop/apps/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy tất cả request về Next.js (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        client_max_body_size 50m;
    }
}
NGINX_APP

# Cấu hình Nginx cho MinIO Storage subdomain
cat > /etc/nginx/sites-available/storage <<NGINX_STORAGE
server {
    listen 80;
    server_name ${STORAGE_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50m;
    }
}
NGINX_STORAGE

# Xóa default Nginx site và kích hoạt các site mới
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/tiemreudecor /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/storage /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
log "Nginx đã được cấu hình"

# ============================================================
# BƯỚC 9: Bảo mật VPS
# ============================================================
log "Cấu hình Firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH (giữ nguyên hoặc đổi port)
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
# Các port nội bộ (5432, 11434, 9000, 9001) KHÔNG mở ra internet
ufw --force enable

log "Cài Fail2ban (chặn brute force SSH)..."
systemctl enable --now fail2ban

log "Bật auto-update bảo mật..."
dpkg-reconfigure -plow unattended-upgrades <<< 'yes'

# ============================================================
# BƯỚC 10: Backup tự động hàng ngày
# ============================================================
log "Cài đặt backup DB tự động..."
mkdir -p /data/backups/db

cat > /home/$DEPLOY_USER/backup-db.sh <<BACKUP_SCRIPT
#!/bin/bash
BACKUP_DIR="/data/backups/db"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR
pg_dump -U terrarium terrarium_db | gzip > "\$BACKUP_DIR/terrarium_\$DATE.sql.gz"
# Xóa backup cũ hơn 30 ngày
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo "Backup done: terrarium_\$DATE.sql.gz"
BACKUP_SCRIPT

chmod +x /home/$DEPLOY_USER/backup-db.sh
chown $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/backup-db.sh

# Thêm cronjob backup lúc 2:00 AM hàng ngày
(crontab -u $DEPLOY_USER -l 2>/dev/null; echo "0 2 * * * /home/${DEPLOY_USER}/backup-db.sh >> /home/${DEPLOY_USER}/logs/backup.log 2>&1") | crontab -u $DEPLOY_USER -

# ============================================================
# HOÀN TẤT — Thông báo kết quả
# ============================================================
PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo "============================================================"
echo -e "${GREEN}✅ SETUP VPS HOÀN TẤT!${NC}"
echo "============================================================"
echo ""
echo "📋 Thông tin cần ghi lại:"
echo "  - IP VPS:          ${PUBLIC_IP}"
echo "  - DB User:         terrarium"
echo "  - DB Password:     ${DB_PASSWORD}"
echo "  - DB Name:         terrarium_db"
echo "  - MinIO Console:   http://${PUBLIC_IP}:9001  (tạm thời - sẽ đóng sau)"
echo "  - MinIO User:      admin"
echo "  - MinIO Password:  ${MINIO_ROOT_PASSWORD}"
echo ""
echo "🚀 Bước tiếp theo:"
echo "  1. Trỏ DNS: ${APP_DOMAIN} → ${PUBLIC_IP}"
echo "  2. Trỏ DNS: ${STORAGE_DOMAIN} → ${PUBLIC_IP}"
echo "  3. Sau khi DNS cập nhật, chạy Certbot SSL:"
echo "     sudo certbot --nginx -d ${APP_DOMAIN} -d www.${APP_DOMAIN} -d ${STORAGE_DOMAIN}"
echo "  4. Clone repo và deploy app:"
echo "     su - ${DEPLOY_USER}"
echo "     git clone https://github.com/YOUR_USERNAME/terrarium-shop.git"
echo "     cd terrarium-shop && npm install"
echo "  5. Tạo file .env.local tại apps/web/ (xem .env.production.example)"
echo "  6. npx prisma migrate deploy && npm run build"
echo "  7. pm2 start apps/web/ecosystem.config.js && pm2 save && pm2 startup"
echo ""
echo "============================================================"
