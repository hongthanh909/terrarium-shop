import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentCustomerId } from "@/lib/order-security";

export const FACEBOOK_GROUP_PROMO_KEY = "facebook_group_promo";

export const facebookGroupPromoSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(300),
  ctaLabel: z.string().trim().min(1).max(50),
  groupUrl: z.string().url().refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "facebook.com" || hostname.endsWith(".facebook.com");
  }, "Đường dẫn phải thuộc Facebook"),
  campaignId: z.string().min(1).nullable(),
  delaySeconds: z.number().int().min(0).max(30),
  repeatDays: z.number().int().min(1).max(90),
});

export type FacebookGroupPromoConfig = z.infer<typeof facebookGroupPromoSchema>;

export type FacebookGroupPromoPayload = {
  enabled: boolean;
  title?: string;
  description?: string;
  ctaLabel?: string;
  groupUrl?: string;
  campaignId?: string;
  delaySeconds?: number;
  repeatDays?: number;
  version?: number;
  claim?: null | {
    status: "PENDING" | "APPROVED" | "REJECTED" | "REDEEMED";
    reviewNote: string | null;
    voucherCode: string | null;
  };
};

export const defaultFacebookGroupPromo: FacebookGroupPromoConfig = {
  enabled: true,
  title: "Tham gia cộng đồng Tiệm Rêu",
  description: "Nhận voucher giảm 100.000đ sau khi admin xác nhận bạn đã tham gia nhóm.",
  ctaLabel: "Tham gia nhóm ngay",
  groupUrl: "https://www.facebook.com/share/g/1ECmLr183E/",
  campaignId: "facebook-group-100k-2026",
  delaySeconds: 2,
  repeatDays: 7,
};

export async function getFacebookGroupPromo() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: FACEBOOK_GROUP_PROMO_KEY },
  });
  const parsed = facebookGroupPromoSchema.safeParse(setting?.value ?? defaultFacebookGroupPromo);
  return {
    config: parsed.success ? parsed.data : defaultFacebookGroupPromo,
    updatedAt: setting?.updatedAt ?? null,
  };
}

export async function getFacebookGroupPromoPayload(): Promise<FacebookGroupPromoPayload> {
  try {
    const [{ config, updatedAt }, customerId] = await Promise.all([
      getFacebookGroupPromo(),
      getCurrentCustomerId(),
    ]);
    const campaign = config.campaignId ? await prisma.discountCampaign.findFirst({
      where: { id: config.campaignId, status: "ACTIVE", requiresApproval: true },
    }) : null;
    if (!config.enabled || !campaign) return { enabled: false };
    const claim = customerId ? await prisma.facebookVoucherClaim.findUnique({
      where: { customerId_campaignId: { customerId, campaignId: campaign.id } },
    }) : null;
    return {
      enabled: true,
      title: config.title,
      description: config.description,
      ctaLabel: config.ctaLabel,
      groupUrl: config.groupUrl,
      campaignId: campaign.id,
      delaySeconds: config.delaySeconds,
      repeatDays: config.repeatDays,
      version: updatedAt?.getTime() ?? 1,
      claim: claim ? {
        status: claim.status,
        reviewNote: claim.status === "REJECTED" ? claim.reviewNote : null,
        voucherCode: claim.status === "APPROVED" ? campaign.code : null,
      } : null,
    };
  } catch (error) {
    console.error("Unable to load community reward:", error);
    return { enabled: false };
  }
}

export function isFacebookUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "facebook.com" || hostname.endsWith(".facebook.com");
  } catch {
    return false;
  }
}
