import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  const applications = await prisma.shopApplication.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      customer: { select: { id: true, email: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
