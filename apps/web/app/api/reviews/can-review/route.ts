import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/reviews/can-review?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id as string | undefined;

    if (!productId || !customerId) {
      return NextResponse.json({ canReview: false, alreadyReviewed: false });
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId,
          status: "DELIVERED",
        },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json({ canReview: false, alreadyReviewed: false });
    }

    const existingReview = await prisma.review.findFirst({
      where: { productId, customerId },
    });

    return NextResponse.json({
      canReview: !existingReview,
      alreadyReviewed: !!existingReview,
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json({ canReview: false, alreadyReviewed: false });
  }
}
