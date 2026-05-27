import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

async function getPayOS() {
  // @payos/node uses NAMED export { PayOS }, not default export!
  const { PayOS } = await import("@payos/node");
  // Cast to any: @payos/node type definitions are wrong (claims 0-1 args, actually needs 3)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PayOSClass = PayOS as any;
  return new PayOSClass(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // PayOS sends a confirmation/test ping when registering the webhook URL.
    // It may be an empty object or have no orderCode — just acknowledge it.
    if (!body || Object.keys(body).length === 0) {
      return successResponse({ received: true });
    }

    const payos = await getPayOS();

    let webhookData: any;
    try {
      // Verify webhook data with PayOS checksum
      webhookData = payos.verifyPaymentWebhookData(body);
    } catch {
      // PayOS test ping has an invalid/empty signature — respond 200 to confirm URL
      return successResponse({ received: true });
    }

    if (webhookData?.code === "00") {
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
