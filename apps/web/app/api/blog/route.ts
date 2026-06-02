import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

// Không dùng force-dynamic — cho phép Next.js cache và unstable_cache hoạt động đúng

// Không dùng force-dynamic — cho phép CDN cache response
// Cache phía server 5 phút, stale-while-revalidate 1 giờ phía CDN
const getCachedBlogData = unstable_cache(
  async (category: string | null) => {
    const where: any = { published: true };
    if (category) where.categoryId = category;

    const [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { category: true },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.blogCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
    return { posts, categories };
  },
  ["blog-data"],
  { revalidate: 300 } // 5 phút
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const data = await getCachedBlogData(category);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
