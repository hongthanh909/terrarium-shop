import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerId } from "@/lib/order-security";
import { getFacebookGroupPromo, getFacebookGroupPromoPayload, isFacebookUrl } from "@/lib/facebook-group-promo";

export const dynamic = "force-dynamic";

const claimSchema = z.object({
  facebookName: z.string().trim().min(2).max(100),
  facebookProfileUrl: z.string().trim().max(300).optional().or(z.literal("")),
});

async function getActiveCampaign(campaignId: string | null) {
  if (!campaignId) return null;
  return prisma.discountCampaign.findFirst({
    where: { id: campaignId, status: "ACTIVE", requiresApproval: true },
  });
}

export async function GET() {
  return NextResponse.json(await getFacebookGroupPromoPayload());
}

export async function POST(request: NextRequest) {
  const customerId = await getCurrentCustomerId();
  if (!customerId) return NextResponse.json({ error: "Vui lòng đăng nhập để nhận voucher" }, { status: 401 });

  const parsed = claimSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Thông tin Facebook chưa hợp lệ" }, { status: 400 });
  const profileUrl = parsed.data.facebookProfileUrl || null;
  if (profileUrl && !isFacebookUrl(profileUrl)) {
    return NextResponse.json({ error: "Link trang cá nhân phải thuộc Facebook" }, { status: 400 });
  }

  const { config } = await getFacebookGroupPromo();
  const campaign = config.enabled ? await getActiveCampaign(config.campaignId) : null;
  if (!campaign) return NextResponse.json({ error: "Chương trình hiện không khả dụng" }, { status: 409 });

  const existing = await prisma.facebookVoucherClaim.findUnique({
    where: { customerId_campaignId: { customerId, campaignId: campaign.id } },
  });
  if (existing && existing.status !== "REJECTED") {
    return NextResponse.json({ status: existing.status });
  }

  const claim = await prisma.facebookVoucherClaim.upsert({
    where: { customerId_campaignId: { customerId, campaignId: campaign.id } },
    create: { customerId, campaignId: campaign.id, facebookName: parsed.data.facebookName, facebookProfileUrl: profileUrl },
    update: {
      facebookName: parsed.data.facebookName,
      facebookProfileUrl: profileUrl,
      status: "PENDING",
      reviewNote: null,
      reviewedAt: null,
    },
  });
  return NextResponse.json({ status: claim.status }, { status: existing ? 200 : 201 });
}
