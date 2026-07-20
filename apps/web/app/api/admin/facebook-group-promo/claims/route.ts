import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const status = new URL(request.url).searchParams.get("status");
  const claims = await prisma.facebookVoucherClaim.findMany({
    where: status && status !== "ALL" ? { status: status as any } : {},
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      campaign: { select: { code: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(claims);
}
