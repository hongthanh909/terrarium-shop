import { NextRequest } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAuthorizedConversation } from "@/lib/product-chat";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function eventPayload(data: unknown) {
  return `event: update\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const conversationId = searchParams.get("conversationId");
  const admin = scope === "admin" ? await verifyAdminRequest(request) : null;

  if (scope === "admin" && !admin) return new Response("Unauthorized", { status: 401 });
  if (!scope && !conversationId) return new Response("Missing stream scope", { status: 400 });

  if (conversationId) {
    const authorized = await getAuthorizedConversation(request, conversationId);
    if (!authorized.actor) return new Response("Unauthorized", { status: 401 });
    if (!authorized.conversation) return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let busy = false;
  let fingerprint = "";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearInterval(timer);
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      };

      const poll = async () => {
        if (closed || busy) return;
        busy = true;
        try {
          if (scope === "admin") {
            const [summary, latestMessage] = await Promise.all([
              prisma.chatConversation.aggregate({ _sum: { adminUnreadCount: true } }),
              prisma.chatMessage.findFirst({
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                select: {
                  id: true,
                  conversationId: true,
                  senderType: true,
                  content: true,
                  imageUrl: true,
                  createdAt: true,
                  conversation: {
                    select: {
                      customer: { select: { name: true, email: true } },
                      catalogProduct: { select: { name: true } },
                      marketplaceProduct: { select: { title: true } },
                    },
                  },
                },
              }),
            ]);
            const payload = {
              unreadCount: summary._sum.adminUnreadCount || 0,
              latestMessage: latestMessage
                ? {
                    ...latestMessage,
                    customerName: latestMessage.conversation.customer.name || latestMessage.conversation.customer.email,
                    productName:
                      latestMessage.conversation.catalogProduct?.name ||
                      latestMessage.conversation.marketplaceProduct?.title ||
                      "Sản phẩm",
                    conversation: undefined,
                  }
                : null,
            };
            const nextFingerprint = `${payload.unreadCount}:${payload.latestMessage?.id || "none"}`;
            if (nextFingerprint !== fingerprint) {
              fingerprint = nextFingerprint;
              controller.enqueue(encoder.encode(eventPayload(payload)));
            }
          } else if (conversationId) {
            const conversation = await prisma.chatConversation.findUnique({
              where: { id: conversationId },
              select: {
                status: true,
                lastMessageAt: true,
                customerUnreadCount: true,
                adminUnreadCount: true,
                messages: { take: 1, orderBy: { createdAt: "desc" }, select: { id: true } },
              },
            });
            if (!conversation) return close();
            const payload = {
              status: conversation.status,
              lastMessageAt: conversation.lastMessageAt,
              customerUnreadCount: conversation.customerUnreadCount,
              adminUnreadCount: conversation.adminUnreadCount,
              latestMessageId: conversation.messages[0]?.id || null,
            };
            const nextFingerprint = JSON.stringify(payload);
            if (nextFingerprint !== fingerprint) {
              fingerprint = nextFingerprint;
              controller.enqueue(encoder.encode(eventPayload(payload)));
            }
          }
        } catch (error) {
          console.error("Chat event stream error:", error);
        } finally {
          busy = false;
        }
      };

      controller.enqueue(encoder.encode("retry: 3000\n\n"));
      void poll();
      timer = setInterval(() => void poll(), 2500);
      heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);
      request.signal.addEventListener("abort", close, { once: true });
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
