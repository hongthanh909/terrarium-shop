import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(300).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu duyệt không hợp lệ" }, { status: 400 });
  const id = (await params).id;
  const existing = await prisma.facebookVoucherClaim.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  if (existing.status === "REDEEMED") return NextResponse.json({ error: "Voucher đã được sử dụng" }, { status: 409 });

  const claim = await prisma.facebookVoucherClaim.update({
    where: { id },
    data: { status: parsed.data.status, reviewNote: parsed.data.reviewNote || null, reviewedAt: new Date() },
  });
  await logAdminAction(admin.id, parsed.data.status === "APPROVED" ? "APPROVE" : "REJECT", "FacebookVoucherClaim", id, { reviewNote: claim.reviewNote });
  return NextResponse.json(claim);
}
