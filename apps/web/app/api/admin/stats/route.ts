import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Run in two sequential batches to stay within PgBouncer pool limits.
    // Batch 1: lightweight count queries (fast, run in parallel)
    const [totalProducts, totalOrders, totalCustomers, pendingOrders, pendingReviews] =
      await Promise.all([
        client.product.count({ where: { status: "ACTIVE" } }),
        client.order.count(),
        client.customer.count(),
        client.order.count({ where: { status: "PENDING" } }),
        client.review.count({ where: { approved: false } }),
      ]);

    // Batch 2: heavier aggregations + data fetch
    const [monthOrders, lastMonthOrders, recentOrders, topProducts] = await Promise.all([
      // This month revenue
      client.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          OR: [
            { paymentStatus: "PAID" },
            { paymentMethod: "COD", status: "DELIVERED" },
          ],
        },
        _sum: { total: true },
      }),
      // Last month revenue
      client.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          OR: [
            { paymentStatus: "PAID" },
            { paymentMethod: "COD", status: "DELIVERED" },
          ],
        },
        _sum: { total: true },
      }),
      // Recent 6 orders
      client.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      }),
      // Top 5 products by sold quantity
      client.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);


    // Fetch product names for top products
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await client.product.findUnique({
          where: { id: item.productId },
          select: { name: true, slug: true },
        });
        return {
          name: product?.name || "Sản phẩm không tìm thấy",
          slug: product?.slug || "",
          totalSold: item._sum.quantity || 0,
        };
      })
    );

    // Revenue change %
    const thisMonthRevenue = Number(monthOrders._sum.total || 0);
    const lastMonthRevenue = Number(lastMonthOrders._sum.total || 0);
    const revenueChange =
      lastMonthRevenue === 0
        ? 100
        : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        pendingOrders,
        pendingReviews,
        thisMonthRevenue,
        revenueChange,
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
      topProducts: topProductsWithNames,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Lỗi tải thống kê" }, { status: 500 });
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
