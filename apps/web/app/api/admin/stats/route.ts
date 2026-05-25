import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      pendingReviews,
      monthOrders,
      lastMonthOrders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Total products (ACTIVE)
      prisma.product.count({ where: { status: "ACTIVE" } }),

      // Total orders
      prisma.order.count(),

      // Total customers
      prisma.customer.count(),

      // Pending orders
      prisma.order.count({ where: { status: "PENDING" } }),

      // Pending reviews
      prisma.review.count({ where: { approved: false } }),

      // This month revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { notIn: ["CANCELLED"] },
        },
        _sum: { total: true },
      }),

      // Last month revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { notIn: ["CANCELLED"] },
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
          customer: {
            select: { name: true, email: true },
          },
        },
      }),

      // Top 5 products by order items
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // Fetch product names for top products
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
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
  }
}
