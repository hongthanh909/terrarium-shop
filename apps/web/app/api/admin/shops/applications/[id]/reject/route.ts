import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { adminShopReviewSchema } from "@/lib/marketplace";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;
  const data = adminShopReviewSchema.parse(await request.json().catch(() => ({})));

  const application = await prisma.shopApplication.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: data.note,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await logAdminAction(admin.id, "REJECT", "ShopApplication", id, { note: data.note });
  return NextResponse.json({ application });
}
