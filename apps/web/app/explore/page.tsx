import { prisma } from "@/lib/prisma";
import { ExploreClient } from "./ExploreClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unstable_cache } from "next/cache";

// Force dynamic rendering — trang này dùng getServerSession (headers)
export const dynamic = "force-dynamic";

const getCachedExploreData = unstable_cache(
  async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const [featured, pinned, topVoted, newArrivals, weeklyFeaturedData] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE", featured: true },
        include: { category: true, _count: { select: { votes: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", pinnedUntil: { gt: now } },
        include: { category: true, _count: { select: { votes: true } } },
        orderBy: { pinnedUntil: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: {
          category: true,
          _count: { select: { votes: true } },
        },
        orderBy: { votes: { _count: "desc" } },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } },
        include: { category: true, _count: { select: { votes: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.weeklyFeatured.findFirst({
        where: { weekStart, isActive: true },
        include: { product: { include: { category: true } } },
      }).catch(() => null),
    ]);

    return { featured, pinned, topVoted, newArrivals, weeklyFeaturedData };
  },
  ["explore-data-cache"],
  { revalidate: 60 }
);

export default async function ExplorePage() {
  try {
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id;

    const [exploreData, userVotes] = await Promise.all([
      getCachedExploreData(),
      customerId ? prisma.productVote.findMany({
        where: { customerId },
        select: { productId: true },
      }) : Promise.resolve([]),
    ]);

    const { featured, pinned, topVoted, newArrivals, weeklyFeaturedData } = exploreData;

    const userVotedProductIds = new Set(userVotes.map(v => v.productId));

    const serializeProduct = (p: any) => ({
      ...JSON.parse(JSON.stringify(p)),
      voteCount: p._count?.votes || 0,
      userVoted: userVotedProductIds.has(p.id),
    });

    const weeklyFeatured = weeklyFeaturedData
      ? {
          product: serializeProduct(weeklyFeaturedData.product),
          reason: weeklyFeaturedData.reason,
        }
      : null;

    return (
      <ExploreClient
        featured={featured.map(serializeProduct)}
        pinned={pinned.map(serializeProduct)}
        topVoted={topVoted.map(serializeProduct)}
        newArrivals={newArrivals.map(serializeProduct)}
        weeklyFeatured={weeklyFeatured}
      />
    );
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return (
      <ExploreClient
        featured={[]}
        pinned={[]}
        topVoted={[]}
        newArrivals={[]}
        weeklyFeatured={null}
      />
    );
  }
}
