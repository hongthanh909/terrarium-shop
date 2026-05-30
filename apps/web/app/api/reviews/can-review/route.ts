import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/reviews/can-review?productId=xxx&customerId=yyy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const customerId = searchParams.get("customerId");

    if (!productId || !customerId) {
      return NextResponse.json({ canReview: false, alreadyReviewed: false });
    }

    // Check if customer has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId,
          status: { in: ["DELIVERED", "CONFIRMED", "PROCESSING", "SHIPPING"] },
        },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json({ canReview: false, alreadyReviewed: false });
    }

    // Check if already reviewed
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
