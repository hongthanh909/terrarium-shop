import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    // Build where clause based on status filter
    type WhereClause = {
      productId?: string;
      approved?: boolean;
      status?: string;
    };
    const where: WhereClause = {};

    if (productId) where.productId = productId;

    if (!status || status === "APPROVED") {
      // Default: only approved reviews (for public product pages)
      where.approved = true;
    } else if (status === "PENDING") {
      // Pending = not yet approved, not rejected
      where.approved = false;
      where.status = "PENDING";
    } else if (status === "REJECTED") {
      where.approved = false;
      where.status = "REJECTED";
    }
    // status === "all" → no filter, show everything

    const reviews = await prisma.review.findMany({
      where,
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

import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().min(1, "Missing product ID"),
  customerId: z.string().min(1, "Missing customer ID"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().optional().nullable(),
  content: z.string().min(3, "Review content is too short"),
  images: z.array(z.string()).optional().default([]),
  verified: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validated = createReviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, customerId, rating, title, content, images } = validated.data;

    // Kiểm tra user đã mua sản phẩm này chưa
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
      return NextResponse.json(
        { error: "Bạn cần mua và nhận sản phẩm này trước khi đánh giá" },
        { status: 403 }
      );
    }

    // Check if customer already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: { productId, customerId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Bạn đã đánh giá sản phẩm này rồi" },
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
        verified: true, // Đã xác minh mua hàng
        approved: false, // Chờ admin duyệt
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Lỗi khi gửi đánh giá" },
      { status: 500 }
    );
  }
}
