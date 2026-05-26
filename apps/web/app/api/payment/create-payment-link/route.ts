import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

function getPayOS() {
  // Lazy init to avoid module-scope crash when env vars are missing
  const PayOS = require("@payos/node");
  return new PayOS(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string
  );
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return errorResponse("Missing orderId", 400);
    }

    // Kiểm tra env vars
    console.log("[PayOS] CLIENT_ID:", process.env.PAYOS_CLIENT_ID ? "✅ có" : "❌ thiếu");
    console.log("[PayOS] API_KEY:", process.env.PAYOS_API_KEY ? "✅ có" : "❌ thiếu");
    console.log("[PayOS] CHECKSUM_KEY:", process.env.PAYOS_CHECKSUM_KEY ? "✅ có" : "❌ thiếu");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    if (order.paymentStatus === "PAID") {
      return errorResponse("Order is already paid", 400);
    }

    const domain = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const orderCode = Number(String(new Date().getTime()).slice(-6) + String(Math.floor(Math.random() * 100)).padStart(3, "0"));

    const body = {
      orderCode,
      amount: Math.round(Number(order.total)), // Đảm bảo là số nguyên
      description: `Thanh toan ${order.orderNumber}`.substring(0, 25).replace(/[^\x00-\x7F]/g, ""), // Chỉ ASCII
      items: order.items.map((item: any) => ({
        name: item.productName.substring(0, 50),
        quantity: item.quantity,
        price: Math.round(Number(item.price)),
      })),
      returnUrl: `${domain}/checkout/success?order=${order.orderNumber}`,
      cancelUrl: `${domain}/checkout/payment?order=${order.orderNumber}`,
    };

    console.log("[PayOS] Request body:", JSON.stringify(body, null, 2));

    // Save the orderCode to the DB so the webhook can map it back to the Order
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `PayOS OrderCode: ${orderCode}`
      }
    });

    const payos = getPayOS();
    const paymentLinkRes = await payos.createPaymentLink(body);

    console.log("[PayOS] Success:", paymentLinkRes.checkoutUrl);

    return successResponse({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      paymentLinkId: paymentLinkRes.paymentLinkId,
    });
  } catch (error: any) {
    console.error("[PayOS] Create Link Error:", error?.message || error);
    console.error("[PayOS] Error detail:", JSON.stringify(error, null, 2));
    return errorResponse(error.message || "Lỗi tạo link thanh toán");
  }
}
