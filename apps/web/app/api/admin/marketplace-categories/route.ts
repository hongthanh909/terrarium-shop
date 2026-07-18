import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { marketplaceCategorySchema } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const categories = await prisma.marketplaceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const data = marketplaceCategorySchema.parse(await request.json());
  const category = await prisma.marketplaceCategory.create({ data });
  await logAdminAction(admin.id, "CREATE", "MarketplaceCategory", category.id, data);
  return NextResponse.json({ category }, { status: 201 });
}
