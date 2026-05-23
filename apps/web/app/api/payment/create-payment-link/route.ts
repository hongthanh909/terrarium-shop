import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-helpers";
import { PrismaClient } from "@prisma/client";
const PayOS = require("@payos/node");

const prisma = new PrismaClient();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID as string,
  process.env.PAYOS_API_KEY as string,
  process.env.PAYOS_CHECKSUM_KEY as string
);

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return errorResponse("Missing orderId", 400);
    }

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
    
    // PayOS requires orderCode to be a Number, so we will generate a short timestamp-based one 
    // or parse from the existing orderNumber if it's numeric.
    // Assuming orderNumber is a string like "ORD-12345", we can extract numbers or just generate a new one.
    // For simplicity and to avoid collisions, we use a custom generated number.
    const orderCode = Number(String(new Date().getTime()).slice(-6) + Math.floor(Math.random() * 1000));

    const body = {
      orderCode,
      amount: Number(order.total),
      description: `Thanh toan DH ${order.orderNumber}`.substring(0, 25), // PayOS description max length is 25
      items: order.items.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        price: Number(item.price)
      })),
      returnUrl: `${domain}/checkout/success?order=${order.orderNumber}`,
      cancelUrl: `${domain}/checkout/payment?order=${order.orderNumber}`,
    };

    // Save the orderCode to the DB so the webhook can map it back to the Order
    // (We'll save it to a note field in OrderStatusLog temporarily or we could add it to Order schema. 
    // Since we don't want to change Prisma schema, we'll store it in a new OrderStatusLog)
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `PayOS OrderCode: ${orderCode}`
      }
    });

    const paymentLinkRes = await payos.createPaymentLink(body);

    return successResponse({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      paymentLinkId: paymentLinkRes.paymentLinkId,
    });
  } catch (error: any) {
    console.error("PayOS Create Link Error:", error);
    return errorResponse(error.message || "Lỗi tạo link thanh toán");
  }
}
