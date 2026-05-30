import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;
    const body = await request.json();
    
    // pinnedUntil có thể là ISO string hoặc null để unpin
    const { pinnedUntil } = body;

    const product = await client.product.update({
      where: { id },
      data: {
        pinnedUntil: pinnedUntil ? new Date(pinnedUntil) : null,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "Product", id, {
      action: pinnedUntil ? "PIN" : "UNPIN",
      pinnedUntil: pinnedUntil || null,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error pinning product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
