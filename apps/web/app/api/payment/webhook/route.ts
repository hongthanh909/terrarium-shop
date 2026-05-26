import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-helpers";

function getPayOS() {
  // @payos/node is an ESM package — require() returns the module object,
  // the actual class is at .default
  const PayOSModule = require("@payos/node");
  const PayOS = PayOSModule.default || PayOSModule;
  return new PayOS(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payos = getPayOS();
    // Verify webhook data with PayOS checksum
    const webhookData = payos.verifyPaymentWebhookData(body);

    if (webhookData.code === "00") {
      // Payment successful
      const orderCode = webhookData.orderCode;

      // Find the order that has this orderCode in its logs
      const logEntry = await prisma.orderStatusLog.findFirst({
        where: { note: { contains: `PayOS OrderCode: ${orderCode}` } }
      });

      if (logEntry) {
        // Update the order status to PAID
        await prisma.order.update({
          where: { id: logEntry.orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED" // Usually after payment, we confirm the order
          }
        });

        // Add a log for payment success
        await prisma.orderStatusLog.create({
          data: {
            orderId: logEntry.orderId,
            status: "CONFIRMED",
            note: "Thanh toán thành công qua PayOS"
          }
        });
      }
    }

    return successResponse({ received: true });
  } catch (error: any) {
    console.error("PayOS Webhook Error:", error);
    return errorResponse("Lỗi xử lý webhook");
  }
}
