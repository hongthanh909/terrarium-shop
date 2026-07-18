import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { id } = await params;

  try {
    const data = statusSchema.parse(await request.json());
    const result = await prisma.chatConversation.updateMany({
      where: { id },
      data: { status: data.status },
    });
    if (!result.count) return NextResponse.json({ error: "Không tìm thấy hội thoại." }, { status: 404 });
    return NextResponse.json({ success: true, status: data.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Trạng thái không hợp lệ." }, { status: 400 });
  }
}
