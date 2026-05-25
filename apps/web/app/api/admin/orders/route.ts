import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper: serialize Decimal fields
const serializeOrder = (order: any) => ({
  ...order,
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
    const body = await request.json();
    const { orderId, status, paymentStatus, note } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, shippingInfo: true, customer: { select: { id: true, name: true, email: true } } },
    });

    // Ghi log thay đổi trạng thái
    if (status) {
      await prisma.orderStatusLog.create({
        data: {
          orderId,
          status,
          note: note || `Trạng thái cập nhật thành ${status}`,
        },
      });
    }

    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
