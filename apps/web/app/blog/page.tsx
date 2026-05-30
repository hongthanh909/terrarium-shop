import { prisma } from "@/lib/prisma";
import { BlogClient } from "./BlogClient";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getBlogData = unstable_cache(
  async () => {
    const [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
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
  { revalidate: 60 }
);

export default async function BlogPage() {
  const { posts, categories } = await getBlogData();

  const serializedPosts = posts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <BlogClient initialPosts={serializedPosts} categories={categories} />;
}
