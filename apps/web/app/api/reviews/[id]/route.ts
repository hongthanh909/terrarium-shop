import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    const review = await prisma.review.findUnique({
      where: { id: (await params).id },
      include: {
        customer: {
          select: admin ? { name: true, email: true } : { name: true },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (!admin && !review.approved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { approved } = body;

    const review = await prisma.review.update({
      where: { id: (await params).id },
      data: {
        ...(approved !== undefined && { approved }),
      },
    });

    await logAdminAction(admin.id, "UPDATE", "Review", (await params).id, {
      approved,
      action: approved ? "APPROVE" : "REJECT",
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const review = await prisma.review.findUnique({
      where: { id: (await params).id },
      select: { productId: true, customerId: true, rating: true },
    });

    await prisma.review.delete({
      where: { id: (await params).id },
    });

    await logAdminAction(admin.id, "DELETE", "Review", (await params).id, {
      productId: review?.productId,
      customerId: review?.customerId,
      rating: review?.rating,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
