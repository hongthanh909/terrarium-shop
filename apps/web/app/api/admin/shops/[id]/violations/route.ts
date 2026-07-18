import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { policyViolationSchema } from "@/lib/marketplace";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const data = policyViolationSchema.parse(await request.json());
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const violation = await prisma.$transaction(async (tx) => {
    const created = await tx.shopPolicyViolation.create({
      data: {
        shopId: id,
        customerId: shop.ownerId,
        productId: data.productId,
        severity: data.severity,
        reason: data.reason,
        evidence: data.evidence,
        action: data.action,
        createdById: admin.id,
      },
    });

    const shouldSuspend =
      data.action === "TEMP_SUSPEND" ||
      data.action === "PERMANENT_BAN" ||
      data.severity === "CRITICAL";

    await tx.shop.update({
      where: { id },
      data: {
        policyViolationCount: { increment: 1 },
        lastPolicyReviewAt: new Date(),
        ...(shouldSuspend ? { status: "SUSPENDED" } : { status: "UNDER_REVIEW" }),
      },
    });

    if (shouldSuspend) {
      await tx.marketplaceProduct.updateMany({
        where: { shopId: id, status: "ACTIVE" },
        data: { status: "SUSPENDED" },
      });
    }

    return created;
  });

  await logAdminAction(admin.id, "WARNING", "Shop", id, data);
  return NextResponse.json({ violation }, { status: 201 });
}
