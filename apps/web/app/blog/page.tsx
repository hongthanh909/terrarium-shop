import { prisma } from "@/lib/prisma";
import { BlogClient } from "./BlogClient";

export const revalidate = 60; // Cache for 60 seconds

export default async function BlogPage() {
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

  // Serialize dates for client component
  const serializedPosts = posts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <BlogClient initialPosts={serializedPosts} categories={categories} />;
}