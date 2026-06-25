import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const admin = await verifyAdminRequest(request);

    if (status && status !== "APPROVED" && !admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = {};
    if (productId) where.productId = productId;

    if (!status || status === "APPROVED") {
      where.approved = true;
    } else if (status === "PENDING") {
      where.approved = false;
    } else if (status === "REJECTED") {
      where.approved = false;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: admin
            ? { name: true, email: true }
            : { name: true },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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

const createReviewSchema = z.object({
  productId: z.string().min(1, "Missing product ID"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().trim().max(120).optional().nullable(),
  content: z.string().trim().min(3, "Review content is too short").max(3000),
  images: z.array(z.string().url()).max(6).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id as string | undefined;

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createReviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, rating, title, content, images } = validated.data;

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
      return NextResponse.json(
        { error: "Bạn cần mua và nhận sản phẩm này trước khi đánh giá" },
        { status: 403 }
      );
    }

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
        images,
        verified: true,
        approved: false,
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
