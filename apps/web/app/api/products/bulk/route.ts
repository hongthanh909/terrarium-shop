import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request, no ids provided" },
        { status: 400 }
      );
    }

    // Get info before deletion
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    // Delete products (cascade will handle relations)
    await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    // Log action
    await logAdminAction(admin.id, "BULK_DELETE", "Product", "multiple", {
      deletedIds: ids,
      deletedNames: products.map((p) => p.name),
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
