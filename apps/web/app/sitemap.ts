import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { AI_CHAT_ENABLED } from "@/lib/features";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tiemreudecor.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...(AI_CHAT_ENABLED
      ? [{ url: `${BASE_URL}/consult`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 }]
      : []),
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/policies`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", inventory: { gt: 0 } },
      select: { slug: true, updatedAt: true },
    });
    productRoutes = products.map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap: error fetching products", error);
  }

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Sitemap: error fetching blog posts", error);
  }

  let policyRoutes: MetadataRoute.Sitemap = [];
  try {
    const policies = await prisma.policy.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true, type: true },
      orderBy: { order: "asc" },
    });
    policyRoutes = policies.map((policy) => ({
      url: `${BASE_URL}/policies/${policy.slug}`,
      lastModified: policy.updatedAt,
      changeFrequency: "monthly" as const,
      priority: policy.type === "faq" ? 0.5 : 0.4,
    }));
  } catch (error) {
    console.error("Sitemap: error fetching policies", error);
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes, ...policyRoutes];
}
