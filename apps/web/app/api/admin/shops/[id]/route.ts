import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "UNDER_REVIEW", "SUSPENDED", "CLOSED"]).optional(),
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true, role: true } },
      products: { orderBy: { createdAt: "desc" }, take: 100 },
      policyViolations: { orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { inquiries: true, products: true, policyViolations: true } },
    },
  });

  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  return NextResponse.json({ shop: { ...shop, platformFeeRate: Number(shop.platformFeeRate) } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const data = updateSchema.parse(await request.json());
  const shop = await prisma.shop.update({
    where: { id },
    data,
  });

  if (data.status === "SUSPENDED" || data.status === "CLOSED") {
    await prisma.marketplaceProduct.updateMany({
      where: { shopId: id, status: "ACTIVE" },
      data: { status: "SUSPENDED" },
    });
  }

  await logAdminAction(admin.id, data.status === "SUSPENDED" ? "SUSPEND" : "UPDATE", "Shop", id, data);
  return NextResponse.json({ shop: { ...shop, platformFeeRate: Number(shop.platformFeeRate) } });
}
