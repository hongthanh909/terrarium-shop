import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-helpers";
import { canAccessOrder, getPayOSClient } from "@/lib/order-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderNumber } = await req.json();

    if (!orderId) {
      return errorResponse("Missing orderId", 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shippingInfo: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    const access = await canAccessOrder(req, order, orderNumber);
    if (!access.allowed) {
      return errorResponse("Forbidden", 403);
    }

    if (order.paymentMethod !== "BANK_TRANSFER") {
      return errorResponse("Order is not a bank-transfer order", 400);
    }

    if (order.paymentStatus === "PAID") {
      return errorResponse("Order is already paid", 400);
    }

    const domain = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const orderCode = Number(
      `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`
    );

    const body = {
      orderCode,
      amount: Math.round(Number(order.total)),
      description: `Thanh toan ${order.orderNumber}`.substring(0, 25).replace(/[^\x00-\x7F]/g, ""),
      items: order.items.map((item) => ({
        name: item.productName.substring(0, 50),
        quantity: item.quantity,
        price: Math.round(Number(item.price)),
      })),
      returnUrl: `${domain}/checkout/success?orderId=${order.id}&orderNumber=${order.orderNumber}&method=BANK_TRANSFER`,
      cancelUrl: `${domain}/checkout/payment?order=${order.orderNumber}`,
      buyerName: order.shippingInfo?.name ?? undefined,
      buyerEmail: order.shippingInfo?.email ?? undefined,
      buyerPhone: order.shippingInfo?.phone ?? undefined,
      buyerAddress: order.shippingInfo?.fullAddress ?? undefined,
    };

    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `PayOS OrderCode: ${orderCode}`,
      },
    });

    const payos = await getPayOSClient();
    const paymentLinkRes = await payos.paymentRequests.create(body);

    return successResponse({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      paymentLinkId: paymentLinkRes.paymentLinkId,
      orderCode: paymentLinkRes.orderCode,
    });
  } catch (error: any) {
    console.error("[PayOS] Create Link Error:", error?.message || error);
    return errorResponse(error.message || "Lỗi tạo link thanh toán");
  }
}
