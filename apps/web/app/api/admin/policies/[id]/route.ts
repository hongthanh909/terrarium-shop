import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminRequest(request as any);
    if (!admin) return unauthorizedResponse();

    const policy = await prisma.policy.findUnique({
      where: { id: (await params).id },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error: any) {
    console.error("Error fetching policy:", error);
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminRequest(request as any);
    if (!admin) return unauthorizedResponse();

    const data = await request.json();
    const { title, slug, content, type, order, isActive } = data;

    const policy = await prisma.policy.update({
      where: { id: (await params).id },
      data: {
        title,
        slug,
        content,
        type,
        order: Number(order),
        isActive,
      },
    });

    return NextResponse.json(policy);
  } catch (error: any) {
    console.error("Error updating policy:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminRequest(request as any);
    if (!admin) return unauthorizedResponse();

    await prisma.policy.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting policy:", error);
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}
