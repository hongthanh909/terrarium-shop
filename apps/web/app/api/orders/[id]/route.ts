import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { canAccessOrder, reserveOrderInventory, restoreOrderInventory } from "@/lib/order-security";
import { z } from "zod";
import { dispatchOrderEmail, queueOrderEmail } from "@/lib/order-notifications";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderNumberProof = request.nextUrl.searchParams.get("orderNumber");

    const order = await prisma.order.findUnique({
      where: { id: (await params).id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: true,
        shippingInfo: true,
        statusLogs: { orderBy: { createdAt: "desc" } },
        discounts: {
          include: { campaign: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const access = await canAccessOrder(request, order, orderNumberProof);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discount: Number(order.discount),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const validated = updateOrderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }
    const { status, paymentStatus } = validated.data;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        paymentStatus: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    const statusChanged = Boolean(status && currentOrder?.status !== status);
    const paymentChanged = Boolean(paymentStatus && currentOrder?.paymentStatus !== paymentStatus);
    const paymentEventKey = paymentChanged
      ? `order:${id}:payment:${paymentStatus}:${crypto.randomUUID()}`
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const emailEventKeys: string[] = [];
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
          shippingInfo: true,
          customer: true,
        },
      });

      if (statusChanged && currentOrder) {
        if (status === "CANCELLED") {
          await restoreOrderInventory(tx, currentOrder.items);
        } else if (currentOrder.status === "CANCELLED") {
          await reserveOrderInventory(tx, currentOrder.items);
        }
      }

      if (statusChanged && status) {
        const statusLog = await tx.orderStatusLog.create({
          data: {
            orderId: id,
            status,
            note: status === "CANCELLED" ? "Admin đã huỷ đơn hàng" : undefined,
          },
        });

        const combinedPaymentConfirmation = paymentChanged && paymentStatus === "PAID" && status === "CONFIRMED";
        if (!combinedPaymentConfirmation) {
          const eventKey = `order:${id}:status:${statusLog.id}`;
          await queueOrderEmail(tx, {
            orderId: id,
            eventKey,
            eventType: "ORDER_STATUS_CHANGED",
            payload: { status },
          });
          emailEventKeys.push(eventKey);
        }
      }

      if (paymentChanged && paymentStatus && paymentEventKey) {
        await queueOrderEmail(tx, {
          orderId: id,
          eventKey: paymentEventKey,
          eventType: paymentStatus === "PAID" ? "PAYMENT_CONFIRMED" : "PAYMENT_STATUS_CHANGED",
          payload: { paymentStatus },
        });
        emailEventKeys.push(paymentEventKey);
      }

      return { order: updatedOrder, emailEventKeys };
    });
    for (const eventKey of result.emailEventKeys) {
      await dispatchOrderEmail(eventKey);
    }
    const order = result.order;
    await logAdminAction(admin.id, "UPDATE", "Order", id, {
      orderNumber: order.orderNumber,
      ...(status && { newStatus: status }),
      ...(paymentStatus && { newPaymentStatus: paymentStatus }),
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
