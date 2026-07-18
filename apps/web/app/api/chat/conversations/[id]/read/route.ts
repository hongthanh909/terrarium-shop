import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedConversation } from "@/lib/product-chat";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor, conversation } = await getAuthorizedConversation(request, id);
  if (!actor) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  if (!conversation) return NextResponse.json({ error: "Không tìm thấy hội thoại." }, { status: 404 });

  const now = new Date();
  await prisma.chatConversation.update({
    where: { id },
    data: actor.isAdmin
      ? { adminUnreadCount: 0, adminLastReadAt: now }
      : { customerUnreadCount: 0, customerLastReadAt: now },
  });

  return NextResponse.json({ success: true });
}
