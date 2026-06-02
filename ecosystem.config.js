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

      // Số lượng instance — "max" = số CPU cores
      // Với VPS 2 CPU dùng 2, VPS 1 CPU dùng 1
      instances: 1,
      exec_mode: "fork",    // dùng "cluster" nếu instances > 1

      // Tự động restart nếu app crash
      autorestart: true,
      watch: false,         // KHÔNG watch file thay đổi (dùng CI/CD thay)
      max_memory_restart: "800M",   // Restart nếu dùng quá 800MB RAM

      // Environment variables (production)
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        // Các biến khác đặt trong file .env.local tại apps/web/
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
