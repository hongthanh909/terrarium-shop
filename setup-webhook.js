require('dotenv').config({ path: 'apps/web/.env.local' });
const PayOS = require('@payos/node');

// @ts-ignore
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

async function setupWebhook() {
  try {
    const webhookUrl = "https://tiemreudecor.com/api/payment/webhook";
    console.log("Đang cài đặt Webhook URL:", webhookUrl);
    
    // Gọi API của PayOS để cấu hình webhook
    const result = await payos.confirmWebhook(webhookUrl);
    console.log("✅ Cài đặt Webhook thành công!");
    console.log("Kết quả từ PayOS:", result);
  } catch (error) {
    console.error("❌ Lỗi khi cài đặt Webhook:", error.message);
  }
}

setupWebhook();
