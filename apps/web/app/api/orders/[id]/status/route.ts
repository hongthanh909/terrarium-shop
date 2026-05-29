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
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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
        createdAt: order.createdAt,
      });
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      expired: false,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      // Frontend dùng để detect PAID sau khi webhook cập nhật
      isPaid: order.paymentStatus === "PAID",
    });
  } catch (error) {
    console.error("Error checking order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
