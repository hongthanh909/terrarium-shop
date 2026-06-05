import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAYMENT_TIMEOUT_MINUTES = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
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

    // Serialize items
    const serializedItems = order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));

    // Kiểm tra hết hạn thanh toán (chỉ áp dụng với BANK_TRANSFER + PENDING)
    if (
      order.paymentMethod === "BANK_TRANSFER" &&
      order.paymentStatus === "PENDING" &&
      order.status === "PENDING"
    ) {
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMinutes = diffMs / 1000 / 60;

      if (diffMinutes >= PAYMENT_TIMEOUT_MINUTES) {
        // Tự động hủy đơn hết hạn
        await prisma.order.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
        await prisma.orderStatusLog.create({
          data: {
            orderId: id,
            status: "CANCELLED",
            note: `Tự động hủy: quá ${PAYMENT_TIMEOUT_MINUTES} phút chưa thanh toán`,
          },
        });

        return NextResponse.json({
          paymentStatus: "PENDING",
          status: "CANCELLED",
          expired: true,
          orderNumber: order.orderNumber,
          items: serializedItems,
        });
      }

      // Trả về thời gian còn lại (giây)
      const remainingMs = PAYMENT_TIMEOUT_MINUTES * 60 * 1000 - diffMs;

      return NextResponse.json({
        paymentStatus: order.paymentStatus,
        status: order.status,
        expired: false,
        remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
        orderNumber: order.orderNumber,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shippingFee: Number(order.shippingFee),
        createdAt: order.createdAt,
        items: serializedItems,
      });
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      expired: false,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingFee: Number(order.shippingFee),
      isPaid: order.paymentStatus === "PAID",
      items: serializedItems,
    });
  } catch (error) {
    console.error("Error checking order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
