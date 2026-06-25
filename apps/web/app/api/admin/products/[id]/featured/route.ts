import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const { featured } = body;

    if (typeof featured !== "boolean") {
      return NextResponse.json(
        { error: "featured field must be a boolean" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: { featured },
    });

    await logAdminAction(admin.id, "UPDATE", "Product", id, {
      action: featured ? "SET_FEATURED" : "UNSET_FEATURED",
      featured,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error setting featured status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
