import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { approved } = body;

    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(approved !== undefined && { approved }),
      },
    });

    await logAdminAction(admin.id, "UPDATE", "Review", params.id, {
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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { productId: true, customerId: true, rating: true },
    });

    await prisma.review.delete({
      where: { id: params.id },
    });

    await logAdminAction(admin.id, "DELETE", "Review", params.id, {
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