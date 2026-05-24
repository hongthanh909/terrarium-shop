import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    // Map status to approved boolean
    let approvedFilter: boolean | undefined = true; // default: show approved reviews
    if (status === "all") {
      approvedFilter = undefined; // Show all reviews for admin
    } else if (status === "PENDING") {
      approvedFilter = false;
    } else if (status === "REJECTED") {
      approvedFilter = false;
    } else if (status === "APPROVED") {
      approvedFilter = true;
    }
    // If no status or unknown, default to approved only

    const reviews = await prisma.review.findMany({
      where: {
        ...(productId && { productId }),
        ...(approvedFilter !== undefined && { approved: approvedFilter }),
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerId, rating, title, content, images, verified } = body;

    // Validate required fields
    if (!productId || !customerId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: productId, customerId, rating" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if customer already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        customerId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerId,
        rating,
        title,
        content,
        images: images || [],
        verified: verified || false,
        approved: false, // Pending admin approval
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}