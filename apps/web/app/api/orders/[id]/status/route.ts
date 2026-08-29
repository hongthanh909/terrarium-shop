import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canAccessOrder,
  isExpiredBankTransfer,
  remainingPaymentSeconds,
  restoreOrderInventory,
} from "@/lib/order-security";
import { dispatchOrderEmail, queueOrderEmail } from "@/lib/order-notifications";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderNumberProof = req.nextUrl.searchParams.get("orderNumber");

    const order = await prisma.order.findUnique({
      where: { id: (await params).id },
      select: {
        id: true,
        customerId: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        shippingQuoteRequired: true,
        total: true,
        subtotal: true,
        discount: true,
        shippingFee: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            productId: true,
            quantity: true,
            price: true,
            variants: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const access = await canAccessOrder(req, order, orderNumberProof);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expired = isExpiredBankTransfer(order);
    if (expired) {
      const eventKey = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: "BANK_TRANSFER",
          },
          data: { status: "CANCELLED", updatedAt: new Date() },
        });

        if (updated.count === 1) {
          await restoreOrderInventory(tx, order.items);
          const statusLog = await tx.orderStatusLog.create({
            data: {
              orderId: order.id,
              status: "CANCELLED",
              note: "Đơn chuyển khoản tự hủy do quá hạn thanh toán",
            },
          });

          const queuedEventKey = `order:${order.id}:status:${statusLog.id}`;
          await queueOrderEmail(tx, {
            orderId: order.id,
            eventKey: queuedEventKey,
            eventType: "ORDER_STATUS_CHANGED",
            payload: { status: "CANCELLED" },
          });
          return queuedEventKey;
        }

        return null;
      });

      if (eventKey) await dispatchOrderEmail(eventKey);
    }
    const serializedItems = order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      shippingQuoteRequired: order.shippingQuoteRequired,
      status: expired ? "CANCELLED" : order.status,
      expired,
      remainingSeconds:
        order.paymentMethod === "BANK_TRANSFER" &&
        order.paymentStatus === "PENDING" &&
        order.status === "PENDING"
          ? remainingPaymentSeconds(order.createdAt)
          : undefined,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingFee: Number(order.shippingFee),
      createdAt: order.createdAt,
      isPaid: order.paymentStatus === "PAID",
      items: serializedItems,
    });
  } catch (error) {
    console.error("Error checking order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
