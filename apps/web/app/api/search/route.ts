import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], posts: [] });
  }

  const [products, posts] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 5,
      select: {
        id: true,
        slug: true,
        name: true,
        basePrice: true,
        images: true,
        category: { select: { name: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: {
        published: true,
        title: { contains: q, mode: "insensitive" },
      },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        publishedAt: true,
      },
    }),
  ]);

  return NextResponse.json({ products, posts });
}
