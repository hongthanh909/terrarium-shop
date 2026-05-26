import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/orders/[id]/cancel — User tự hủy đơn hàng (chỉ khi PENDING)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const orderId = params.id;

    // Lấy đơn hàng và kiểm tra quyền sở hữu
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, customerId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    // Chỉ chủ đơn mới được hủy
    if (order.customerId !== token.id) {
      return NextResponse.json({ error: "Không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    // Chỉ được hủy khi đơn đang PENDING (chờ xác nhận)
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Không thể hủy đơn hàng đã được xác nhận hoặc đang xử lý" },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái sang CANCELLED và ghi log
    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", updatedAt: new Date() },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId,
          status: "CANCELLED",
          note: "Khách hàng tự hủy đơn hàng",
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
