import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> }
) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { id, codeId } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body.status;

    if (status !== "ACTIVE" && status !== "DISABLED") {
      return NextResponse.json({ error: "Trạng thái mã không hợp lệ" }, { status: 400 });
    }

    const code = await prisma.discountCode.findFirst({
      where: { id: codeId, campaignId: id, campaign: { deletedAt: null } },
      select: { id: true, code: true, status: true, usageCount: true, usageLimit: true },
    });

    if (!code) {
      return NextResponse.json({ error: "Không tìm thấy mã riêng" }, { status: 404 });
    }

    if (code.status === "USED" || (code.usageLimit != null && code.usageCount >= code.usageLimit)) {
      return NextResponse.json({ error: "Mã đã dùng hết lượt và không thể kích hoạt lại" }, { status: 409 });
    }

    const updated = await prisma.discountCode.update({
      where: { id: codeId },
      data: { status },
      select: {
        id: true,
        code: true,
        status: true,
        usageLimit: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "DiscountCode", codeId, {
      code: code.code,
      status,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating discount code:", error);
    return NextResponse.json({ error: "Không thể cập nhật mã riêng" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> }
) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { id, codeId } = await params;
    const code = await prisma.discountCode.findFirst({
      where: { id: codeId, campaignId: id, campaign: { deletedAt: null } },
      select: { id: true, code: true, status: true, usageCount: true },
    });

    if (!code) {
      return NextResponse.json({ error: "Không tìm thấy mã riêng" }, { status: 404 });
    }

    if (code.usageCount > 0 || code.status === "USED") {
      return NextResponse.json(
        { error: "Không thể xóa mã đã được sử dụng; hãy khóa mã thay thế" },
        { status: 409 }
      );
    }

    await prisma.discountCode.delete({ where: { id: codeId } });
    await logAdminAction(admin.id, "DELETE", "DiscountCode", codeId, { code: code.code });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json({ error: "Không thể xóa mã riêng" }, { status: 500 });
  }
}
