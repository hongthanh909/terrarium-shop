import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { chatConversationInclude, serializeChatConversation } from "@/lib/product-chat";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().slice(0, 100) || "";
  const unreadOnly = searchParams.get("unread") === "true";

  const conversations = await prisma.chatConversation.findMany({
    where: {
      ...(unreadOnly ? { adminUnreadCount: { gt: 0 } } : {}),
      ...(search
        ? {
            OR: [
              { customer: { name: { contains: search, mode: "insensitive" } } },
              { customer: { email: { contains: search, mode: "insensitive" } } },
              { customer: { phone: { contains: search, mode: "insensitive" } } },
              { catalogProduct: { name: { contains: search, mode: "insensitive" } } },
              { marketplaceProduct: { title: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: chatConversationInclude,
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const totals = await prisma.chatConversation.aggregate({
    _sum: { adminUnreadCount: true },
    _count: { id: true },
  });

  return NextResponse.json({
    conversations: conversations.map(serializeChatConversation),
    unreadCount: totals._sum.adminUnreadCount || 0,
    total: totals._count.id,
  });
}
