import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { marketplaceCategorySchema } from "@/lib/marketplace";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const data = marketplaceCategorySchema.partial().parse(await request.json());
  const category = await prisma.marketplaceCategory.update({ where: { id }, data });
  await logAdminAction(admin.id, "UPDATE", "MarketplaceCategory", id, data);
  return NextResponse.json({ category });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  const category = await prisma.marketplaceCategory.update({
    where: { id },
    data: { isActive: false },
  });
  await logAdminAction(admin.id, "DELETE", "MarketplaceCategory", id, {});
  return NextResponse.json({ category });
}
