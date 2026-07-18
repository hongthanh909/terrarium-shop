import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const chatConversationSchema = z.object({
  productType: z.enum(["CATALOG", "MARKETPLACE"]),
  productId: z.string().trim().min(1).max(100),
});

export const chatMessageSchema = z
  .object({
    content: z.string().trim().max(2000).optional().nullable(),
    imageUrl: z.string().trim().url().max(2048).optional().nullable(),
  })
  .refine((value) => Boolean(value.content || value.imageUrl), {
    message: "Tin nhắn cần có nội dung hoặc hình ảnh.",
  });

export type ChatActor = {
  id: string;
  isAdmin: boolean;
};

export async function getChatActor(request: NextRequest): Promise<ChatActor | null> {
  const admin = await verifyAdminRequest(request);
  if (admin) return { id: admin.id, isAdmin: true };

  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  return id ? { id, isAdmin: false } : null;
}

export async function getAuthorizedConversation(request: NextRequest, conversationId: string) {
  const actor = await getChatActor(request);
  if (!actor) return { actor: null, conversation: null };

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      ...(actor.isAdmin ? {} : { customerId: actor.id }),
    },
  });

  return { actor, conversation };
}

export function chatImageUrlAllowed(imageUrl: string | null | undefined) {
  if (!imageUrl) return true;

  const allowedPrefixes = [
    process.env.MINIO_PUBLIC_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ].filter((value): value is string => Boolean(value));

  if (allowedPrefixes.length === 0) return true;
  return allowedPrefixes.some((prefix) => imageUrl.startsWith(prefix));
}

export function serializeChatConversation(conversation: any) {
  const product = conversation.catalogProduct
    ? {
        id: conversation.catalogProduct.id,
        type: "CATALOG" as const,
        name: conversation.catalogProduct.name,
        slug: conversation.catalogProduct.slug,
        image: conversation.catalogProduct.images?.[0] || null,
        href: `/products/${conversation.catalogProduct.slug}`,
      }
    : conversation.marketplaceProduct
      ? {
          id: conversation.marketplaceProduct.id,
          type: "MARKETPLACE" as const,
          name: conversation.marketplaceProduct.title,
          slug: conversation.marketplaceProduct.slug,
          image: conversation.marketplaceProduct.images?.[0] || null,
          href: `/marketplace/products/${conversation.marketplaceProduct.slug}`,
        }
      : null;

  return {
    ...conversation,
    product,
    catalogProduct: undefined,
    marketplaceProduct: undefined,
  };
}

export const chatConversationInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true, image: true } },
  catalogProduct: { select: { id: true, name: true, slug: true, images: true } },
  marketplaceProduct: { select: { id: true, title: true, slug: true, images: true } },
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      senderType: true,
      content: true,
      imageUrl: true,
      createdAt: true,
    },
  },
};
