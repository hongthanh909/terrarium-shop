import { NextRequest, NextResponse } from "next/server";
import { canAccessOrder } from "@/lib/order-security";
import {
  chatConversationInclude,
  getChatActor,
  serializeChatConversation,
} from "@/lib/product-chat";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getChatActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để trao đổi với shop." }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      customerId: true,
      orderNumber: true,
      shippingQuoteRequired: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  if (!order.customerId) {
    return NextResponse.json({ error: "Đơn hàng này chưa gắn với tài khoản khách hàng." }, { status: 400 });
  }

  const access = await canAccessOrder(request, order, request.nextUrl.searchParams.get("orderNumber"));
  if (!access.allowed) return NextResponse.json({ error: "Bạn không có quyền xem đơn hàng này." }, { status: 403 });

  let conversation = await prisma.chatConversation.findUnique({
    where: { orderId: order.id },
    include: chatConversationInclude,
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        customerId: order.customerId,
        productType: "ORDER",
        orderId: order.id,
        status: "OPEN",
      },
      include: chatConversationInclude,
    });
  }

  return NextResponse.json({ conversation: serializeChatConversation(conversation) });
}
