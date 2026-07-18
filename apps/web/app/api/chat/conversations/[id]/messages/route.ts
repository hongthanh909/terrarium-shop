import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";
import {
  chatImageUrlAllowed,
  chatMessageSchema,
  getAuthorizedConversation,
} from "@/lib/product-chat";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor, conversation } = await getAuthorizedConversation(request, id);
  if (!actor) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  if (!conversation) return NextResponse.json({ error: "Không tìm thấy hội thoại." }, { status: 404 });

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true, image: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 200,
  });

  return NextResponse.json({ messages, conversation });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor, conversation } = await getAuthorizedConversation(request, id);
  if (!actor) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  if (!conversation) return NextResponse.json({ error: "Không tìm thấy hội thoại." }, { status: 404 });

  const rate = checkRateLimit(`product-chat:${actor.id}`, actor.isAdmin ? 120 : 30, 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Bạn đang gửi tin quá nhanh. Vui lòng chờ một chút." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter || 30) } },
    );
  }

  try {
    const data = chatMessageSchema.parse(await request.json());
    if (!chatImageUrlAllowed(data.imageUrl)) {
      return NextResponse.json({ error: "Ảnh chat phải được tải lên từ website." }, { status: 400 });
    }

    const now = new Date();
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          conversationId: id,
          senderId: actor.id,
          senderType: actor.isAdmin ? "ADMIN" : "CUSTOMER",
          content: data.content || null,
          imageUrl: data.imageUrl || null,
        },
        include: { sender: { select: { id: true, name: true, image: true } } },
      });

      await tx.chatConversation.update({
        where: { id },
        data: actor.isAdmin
          ? {
              status: "OPEN",
              lastMessageAt: now,
              adminLastReadAt: now,
              adminUnreadCount: 0,
              customerUnreadCount: { increment: 1 },
            }
          : {
              status: "OPEN",
              lastMessageAt: now,
              customerLastReadAt: now,
              customerUnreadCount: 0,
              adminUnreadCount: { increment: 1 },
            },
      });

      return created;
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    if (error?.issues?.[0]?.message) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Send chat message error:", error);
    return NextResponse.json({ error: "Không thể gửi tin nhắn lúc này." }, { status: 500 });
  }
}
