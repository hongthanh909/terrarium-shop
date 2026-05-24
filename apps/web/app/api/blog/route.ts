import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = { published: true };

    if (category) {
      where.categoryId = category;
    }

    const [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
      }),
      prisma.blogCategory.findMany({
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return NextResponse.json({ posts, categories });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}