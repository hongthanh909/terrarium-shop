import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { restoreOrderInventory } from "@/lib/order-security";
import { dispatchOrderEmail, queueOrderEmail } from "@/lib/order-notifications";

export const dynamic = "force-dynamic";

// PATCH /api/orders/[id]/cancel — User tự hủy đơn hàng (chỉ khi PENDING)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const orderId = (await params).id;

    // Lấy đơn hàng + thông tin voucher đã dùng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerId: true,
        discounts: {
          select: {
            campaignId: true,
            discountCodeId: true,
          },
        },
        facebookVoucherClaim: { select: { id: true } },
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
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

    // Cập nhật trạng thái sang CANCELLED, hoàn voucher (nếu có) — trong 1 transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", updatedAt: new Date() },
      });

      const statusLog = await tx.orderStatusLog.create({
        data: {
          orderId,
          status: "CANCELLED",
          note: "Khách hàng tự hủy đơn hàng",
        },
      });

      await restoreOrderInventory(tx, order.items);

      // ✅ Hoàn lại lượt dùng voucher — chỉ decrement nếu > 0 (tránh âm)
      for (const discount of order.discounts) {
        await tx.discountCampaign.updateMany({
          where: {
            id: discount.campaignId,
            usageCount: { gt: 0 }, // Guard: không để âm
          },
          data: { usageCount: { decrement: 1 } },
        });

        if (discount.discountCodeId) {
          const code = await tx.discountCode.findUnique({
            where: { id: discount.discountCodeId },
            select: { status: true, usageCount: true },
          });

          if (code?.usageCount && code.usageCount > 0) {
            await tx.discountCode.update({
              where: { id: discount.discountCodeId },
              data: {
                usageCount: { decrement: 1 },
                ...(code.status === "USED" ? { status: "ACTIVE" } : {}),
              },
            });
          }
        }
      }

      if (order.facebookVoucherClaim) {
        await tx.facebookVoucherClaim.update({
          where: { id: order.facebookVoucherClaim.id },
          data: { status: "APPROVED", redeemedAt: null, orderId: null },
        });
      }

      const eventKey = `order:${orderId}:status:${statusLog.id}`;
      await queueOrderEmail(tx, {
        orderId,
        eventKey,
        eventType: "ORDER_STATUS_CHANGED",
        payload: { status: "CANCELLED" },
      });

      return { updatedOrder, eventKey };
    });

    await dispatchOrderEmail(result.eventKey);

    return NextResponse.json({ success: true, status: result.updatedOrder.status });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

