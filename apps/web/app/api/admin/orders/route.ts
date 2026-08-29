import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { maskEmail, maskPhone } from "@/lib/privacy";
import { reserveOrderInventory, restoreOrderInventory } from "@/lib/order-security";
import { dispatchOrderEmail, queueOrderEmail } from "@/lib/order-notifications";

export const dynamic = "force-dynamic";

// Helper: serialize Decimal fields
const serializeOrder = (order: any) => ({
  ...order,
  customer: order.customer
    ? {
        ...order.customer,
        email: maskEmail(order.customer.email),
        phone: maskPhone(order.customer.phone),
      }
    : order.customer,
  shippingInfo: order.shippingInfo
    ? {
        ...order.shippingInfo,
        email: maskEmail(order.shippingInfo.email),
        phone: maskPhone(order.shippingInfo.phone),
      }
    : order.shippingInfo,
  subtotal: Number(order.subtotal),
  shippingFee: Number(order.shippingFee),
  discount: Number(order.discount),
  total: Number(order.total),
  items: order.items?.map((item: any) => ({
    ...item,
    price: Number(item.price),
  })),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where = status ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: true,
          shippingInfo: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map(serializeOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Cập nhật trạng thái đơn hàng (admin → đồng bộ với customer)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { orderId, status, paymentStatus, note } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Lấy đơn hàng hiện tại trước khi cập nhật
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        paymentStatus: true,
        total: true,
        customerId: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    const statusChanged = Boolean(status && currentOrder?.status !== status);
    const paymentChanged = Boolean(paymentStatus && currentOrder?.paymentStatus !== paymentStatus);
    const paymentEventKey = paymentChanged
      ? `order:${orderId}:payment:${paymentStatus}:${crypto.randomUUID()}`
      : null;

    // Dùng transaction để đảm bảo tính toàn vẹn dữ liệu
    const result = await prisma.$transaction(async (tx) => {
      const emailEventKeys: string[] = [];
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true, shippingInfo: true, customer: { select: { id: true, name: true, email: true } } },
      });

      if (statusChanged && currentOrder) {
        if (status === "CANCELLED") {
          await restoreOrderInventory(tx, currentOrder.items);
        } else if (currentOrder.status === "CANCELLED") {
          await reserveOrderInventory(tx, currentOrder.items);
        }
      }

      // Ghi log thay đổi trạng thái
      if (statusChanged && status) {
        const statusLog = await tx.orderStatusLog.create({
          data: {
            orderId,
            status,
            note: note || `Trạng thái cập nhật thành ${status}`,
          },
        });

        const combinedPaymentConfirmation = paymentChanged && paymentStatus === "PAID" && status === "CONFIRMED";
        if (!combinedPaymentConfirmation) {
          const eventKey = `order:${orderId}:status:${statusLog.id}`;
          await queueOrderEmail(tx, {
            orderId,
            eventKey,
            eventType: "ORDER_STATUS_CHANGED",
            payload: { status },
          });
          emailEventKeys.push(eventKey);
        }
      }

      if (paymentChanged && paymentStatus && paymentEventKey) {
        await queueOrderEmail(tx, {
          orderId,
          eventKey: paymentEventKey,
          eventType: paymentStatus === "PAID" ? "PAYMENT_CONFIRMED" : "PAYMENT_STATUS_CHANGED",
          payload: { paymentStatus },
        });
        emailEventKeys.push(paymentEventKey);
      }

      // Cộng điểm thưởng khi đơn hàng chuyển sang DELIVERED
      // Quy tắc: 10.000 VNĐ = 1 Điểm, chỉ cộng 1 lần (kiểm tra status cũ ≠ DELIVERED)
      if (
        status === "DELIVERED" &&
        currentOrder?.status !== "DELIVERED" &&
        currentOrder?.customerId
      ) {
        const pointsEarned = Math.floor(Number(currentOrder.total) / 10000);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: currentOrder.customerId },
            data: {
              loyaltyPoints: { increment: pointsEarned },
            },
          });
        }
      }

      return { order: updatedOrder, emailEventKeys };
    });

    for (const eventKey of result.emailEventKeys) {
      await dispatchOrderEmail(eventKey);
    }

    return NextResponse.json(serializeOrder(result.order));
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
