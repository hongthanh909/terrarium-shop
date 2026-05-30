import { prisma } from "@/lib/prisma";
import { BlogClient } from "./BlogClient";

export const revalidate = 60; // ISR: cache 60s at CDN edge

export default async function BlogPage() {
  let posts: any[] = [];
  let categories: any[] = [];

  try {
    [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        include: { category: true },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.blogCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (error) {
    console.error("BlogPage: failed to load blog data", error);
  }

  const serializedPosts = posts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <BlogClient initialPosts={serializedPosts} categories={categories} />;
}
