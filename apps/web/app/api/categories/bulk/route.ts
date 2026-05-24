import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";


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

    // Lấy thông tin các category trước khi xóa để log
    const categories = await prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    // Thực hiện xóa hàng loạt
    await prisma.category.deleteMany({
      where: { id: { in: ids } },
    });

    // Ghi log
    await logAdminAction(admin.id, "BULK_DELETE", "Category", "multiple", {
      deletedIds: ids,
      deletedNames: categories.map((c) => c.name),
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Error bulk deleting categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
