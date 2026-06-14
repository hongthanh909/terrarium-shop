// PM2 Ecosystem Config — chạy Next.js trên VPS
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/
// Cách dùng:
//   pm2 start ecosystem.config.js --env production
//   pm2 reload ecosystem.config.js --env production  (zero-downtime reload)
//   pm2 save && pm2 startup                           (auto-start khi VPS reboot)

module.exports = {
  apps: [
    {
      name: "terrarium-shop",
      cwd: "/home/deploy/terrarium-shop/apps/web",

      // Chạy Next.js production server
      script: "node_modules/.bin/next",
      args: "start",

      // Số lượng instance — tận dụng 6 vCPU của VPS CHEAP 6
      // 2 instances = hiệu suất tốt nhất khi có AI Ollama cũng chạy song song trên VPS
      instances: 2,
      exec_mode: "cluster",    // cluster mode: cân bằng tải giữa 2 instance

      // Tự động restart nếu app crash
      autorestart: true,
      watch: false,         // KHÔNG watch file thay đổi (dùng CI/CD thay)
      max_memory_restart: "1200M",   // VPS 8GB RAM: mỗi instance Next.js giới hạn 1.2GB

      // Environment variables (production)
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        // Ollama AI — chạy cùng VPS
        OLLAMA_BASE_URL: "http://127.0.0.1:11434",
        OLLAMA_MODEL: "llama3:8b",
        // Các biến khác (DB, secrets) đặt trong file .env.local tại apps/web/
        // KHÔNG hardcode secrets ở đây
      },

      // Logging
      out_file: "/home/deploy/logs/terrarium-out.log",
      error_file: "/home/deploy/logs/terrarium-err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // Health check — tự restart nếu không phản hồi
      // PM2 module: pm2 install pm2-health
    },
  ],
};
