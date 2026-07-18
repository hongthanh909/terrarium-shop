import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const application = await prisma.shopApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "Application is not pending" }, { status: 409 });
  }

  const shop = await prisma.$transaction(async (tx) => {
    const created = await tx.shop.create({
      data: {
        ownerId: application.customerId,
        name: application.shopName,
        slug: application.shopSlug,
        description: application.description,
        phone: application.phone,
        email: application.email,
        zaloUrl: application.zaloUrl,
        address: application.address,
        province: application.province,
        district: application.district,
        status: "ACTIVE",
        policyAcceptedAt: application.commitmentAccepted ? new Date() : null,
      },
    });

    await tx.customer.update({
      where: { id: application.customerId },
      data: { role: "SELLER" },
    });

    await tx.shopApplication.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    });

    return created;
  });

  await logAdminAction(admin.id, "APPROVE", "ShopApplication", id, { shopId: shop.id });
  return NextResponse.json({ shop });
}
