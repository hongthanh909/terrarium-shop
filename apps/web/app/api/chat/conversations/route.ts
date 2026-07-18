import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  chatConversationInclude,
  chatConversationSchema,
  getChatActor,
  serializeChatConversation,
} from "@/lib/product-chat";

export async function GET(request: NextRequest) {
  const actor = await getChatActor(request);
  if (!actor || actor.isAdmin) {
    return NextResponse.json({ error: "Vui lòng đăng nhập bằng tài khoản khách hàng." }, { status: 401 });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: { customerId: actor.id },
    include: chatConversationInclude,
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ conversations: conversations.map(serializeChatConversation) });
}

export async function POST(request: NextRequest) {
  const actor = await getChatActor(request);
  if (!actor || actor.isAdmin) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để chat với admin." }, { status: 401 });
  }

  try {
    const data = chatConversationSchema.parse(await request.json());
    const product =
      data.productType === "CATALOG"
        ? await prisma.product.findFirst({ where: { id: data.productId, status: "ACTIVE" }, select: { id: true } })
        : await prisma.marketplaceProduct.findFirst({
            where: { id: data.productId, status: "ACTIVE", shop: { status: "ACTIVE" } },
            select: { id: true },
          });

    if (!product) {
      return NextResponse.json({ error: "Sản phẩm không còn khả dụng." }, { status: 404 });
    }

    const productWhere =
      data.productType === "CATALOG"
        ? { catalogProductId: product.id }
        : { marketplaceProductId: product.id };

    let conversation = await prisma.chatConversation.findFirst({
      where: { customerId: actor.id, ...productWhere },
      include: chatConversationInclude,
    });

    if (!conversation) {
      try {
        conversation = await prisma.chatConversation.create({
          data: {
            customerId: actor.id,
            productType: data.productType,
            ...productWhere,
          },
          include: chatConversationInclude,
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        conversation = await prisma.chatConversation.findFirst({
          where: { customerId: actor.id, ...productWhere },
          include: chatConversationInclude,
        });
      }
    }

    if (!conversation) throw new Error("Không thể tạo hội thoại.");
    return NextResponse.json({ conversation: serializeChatConversation(conversation) });
  } catch (error: any) {
    if (error?.issues?.[0]?.message) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create chat conversation error:", error);
    return NextResponse.json({ error: "Không thể mở hội thoại lúc này." }, { status: 500 });
  }
}
