import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Run in two sequential batches to stay within PgBouncer pool limits.
    // Batch 1: lightweight count queries (fast, run in parallel)
    const [totalProducts, totalOrders, totalCustomers, pendingOrders, pendingReviews] =
      await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.review.count({ where: { approved: false } }),
      ]);

    // Batch 2: heavier aggregations + data fetch
    const [monthOrders, lastMonthOrders, recentOrders, topProductsRaw] = await Promise.all([
      // This month revenue
      prisma.order.aggregate({
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
      prisma.order.aggregate({
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
      prisma.order.findMany({
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
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);


    // Fix N+1: fetch all top product names in ONE query instead of N queries
    const productIds = topProductsRaw.map((item) => item.productId);
    const productMap = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    }).then((products) =>
      Object.fromEntries(products.map((p) => [p.id, p]))
    );

    const topProductsWithNames = topProductsRaw.map((item) => ({
      name: productMap[item.productId]?.name || "Sản phẩm không tìm thấy",
      slug: productMap[item.productId]?.slug || "",
      totalSold: item._sum.quantity || 0,
    }));

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
  }
}
