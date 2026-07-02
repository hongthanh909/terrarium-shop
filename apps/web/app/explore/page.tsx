import { prisma } from "@/lib/prisma";
import { ExploreClient } from "./ExploreClient";

export const revalidate = 60; // ISR: cache 60s at CDN edge

const serializeProduct = (p: any) => ({
  ...JSON.parse(JSON.stringify(p)),
  voteCount: p._count?.votes || 0,
  userVoted: false,
});

export default async function ExplorePage() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let [featured, pinned, topVoted, newArrivals, weeklyFeaturedList, heroBgSetting] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE", featured: true },
        include: { category: true, reviews: { where: { approved: true }, select: { rating: true } }, _count: { select: { votes: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", pinnedUntil: { gt: now } },
        include: { category: true, reviews: { where: { approved: true }, select: { rating: true } }, _count: { select: { votes: true } } },
        orderBy: { pinnedUntil: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: { category: true, reviews: { where: { approved: true }, select: { rating: true } }, _count: { select: { votes: true } } },
        orderBy: [
          { votes: { _count: "desc" } },
          { createdAt: "desc" }
        ],
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } },
        include: { category: true, reviews: { where: { approved: true }, select: { rating: true } }, _count: { select: { votes: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      // Fetch ALL active weekly featured (up to 5 shown in hero)
      prisma.weeklyFeatured.findMany({
        where: { isActive: true },
        include: { product: { include: { category: true, reviews: { where: { approved: true }, select: { rating: true } } } } },
        orderBy: { weekStart: "desc" },
        take: 5,
      }).catch(() => [] as any[]),
      // Hero background setting
      prisma.siteSetting.findUnique({
        where: { key: "explore_hero_bg" },
      }).catch(() => null),
    ]);

    // Fallback if no new products in the last 30 days
    if (newArrivals.length === 0) {
      newArrivals = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: { category: true, reviews: { where: { approved: true }, select: { rating: true } }, _count: { select: { votes: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      });
    }

    // Serialize all weekly featured items
    const weeklyFeaturedItems = (weeklyFeaturedList || []).map((wf: any) => ({
      product: serializeProduct(wf.product),
      reason: wf.reason,
    }));

    // Hero background
    const heroBg = heroBgSetting
      ? (heroBgSetting.value as any)
      : { imageUrl: "", blur: 12, opacity: 50 };
    // backfill opacity if missing
    if (heroBg.opacity === undefined) heroBg.opacity = 50;

    return (
      <ExploreClient
        featured={featured.map(serializeProduct)}
        pinned={pinned.map(serializeProduct)}
        topVoted={topVoted.map(serializeProduct)}
        newArrivals={newArrivals.map(serializeProduct)}
        weeklyFeaturedItems={weeklyFeaturedItems}
        heroBg={heroBg}
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
        weeklyFeaturedItems={[]}
        heroBg={{ imageUrl: "", blur: 12, opacity: 50 }}
      />
    );
  }
}
