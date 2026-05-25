import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        shippingInfo: true,
        customer: true,
      },
    });

    // Ghi log trạng thái đơn hàng
    if (status) {
      await prisma.orderStatusLog.create({
        data: {
          orderId: id,
          status,
        },
      });
    }

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