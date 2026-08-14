import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { FACEBOOK_GROUP_PROMO_KEY, facebookGroupPromoSchema, getFacebookGroupPromo } from "@/lib/facebook-group-promo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const [{ config }, campaigns, grouped] = await Promise.all([
    getFacebookGroupPromo(),
    prisma.discountCampaign.findMany({
      where: { deletedAt: null, type: "FIXED", value: 100000, minOrderAmount: { gte: 1500000 } },
      select: { id: true, code: true, status: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facebookVoucherClaim.groupBy({ by: ["status"], _count: true }),
  ]);
  return NextResponse.json({ config, campaigns, counts: Object.fromEntries(grouped.map((row) => [row.status, row._count])) });
}

export async function PUT(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const parsed = facebookGroupPromoSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Cấu hình không hợp lệ" }, { status: 400 });

  const campaign = parsed.data.campaignId ? await prisma.discountCampaign.findFirst({ where: { id: parsed.data.campaignId, deletedAt: null } }) : null;
  if (parsed.data.enabled && (!campaign || campaign.type !== "FIXED" || Number(campaign.value) !== 100000 || Number(campaign.minOrderAmount) < 1500000)) {
    return NextResponse.json({ error: "Hãy chọn voucher cố định 100.000đ, đơn tối thiểu từ 1.500.000đ" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (campaign) await tx.discountCampaign.update({ where: { id: campaign.id }, data: { requiresApproval: true } });
    await tx.siteSetting.upsert({
      where: { key: FACEBOOK_GROUP_PROMO_KEY },
      create: { key: FACEBOOK_GROUP_PROMO_KEY, value: parsed.data, description: "Cấu hình popup mời tham gia nhóm Facebook" },
      update: { value: parsed.data },
    });
  });
  await logAdminAction(admin.id, "UPDATE", "SiteSetting", FACEBOOK_GROUP_PROMO_KEY, parsed.data);
  return NextResponse.json({ config: parsed.data });
}
